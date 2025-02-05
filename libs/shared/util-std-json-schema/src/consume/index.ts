import { toArray } from '@brandingbrand/standard-array';

import type { JSONSchemaCreateDefinition } from '../types';

// eslint-disable-next-line complexity, max-statements
export const consumeSchema = (
  schema?: JSONSchemaCreateDefinition,
  editorSchema?: JSONSchemaCreateDefinition
  // eslint-disable-next-line sonarjs/cognitive-complexity
): JSONSchemaCreateDefinition | undefined => {
  if (editorSchema === undefined || schema === undefined) {
    return schema;
  }

  if (typeof editorSchema === 'boolean') {
    if (typeof schema !== 'boolean') {
      return schema;
    }

    return false;
  }

  if (typeof schema === 'boolean') {
    return schema;
  }

  if ('anyOf' in editorSchema) {
    for (let i = 0; i < (editorSchema.anyOf?.length ?? 0); i++) {
      const anyOfSchema = editorSchema.anyOf?.[i];
      consumeSchema(schema, anyOfSchema);
    }
  }

  if ('anyOf' in schema) {
    for (let i = 0; i < (schema.anyOf?.length ?? 0); i++) {
      const anyOfSchema = schema.anyOf?.[i];
      const updatedSchema = consumeSchema(anyOfSchema, editorSchema);
      if (typeof updatedSchema === 'object' && Object.keys(updatedSchema).length === 0) {
        delete schema.anyOf?.[i];
      }
    }

    schema.anyOf = schema.anyOf?.filter(Boolean);
    if (schema.anyOf?.length === 0) {
      delete schema.anyOf;
      delete schema.title;
    }
  }

  if ('allOf' in editorSchema) {
    for (let i = 0; i < (editorSchema.allOf?.length ?? 0); i++) {
      const allOfSchema = editorSchema.allOf?.[i];
      consumeSchema(schema, allOfSchema);
    }
  }

  if ('allOf' in schema) {
    for (let i = 0; i < (schema.allOf?.length ?? 0); i++) {
      const allOfSchema = schema.anyOf?.[i];
      const updatedSchema = consumeSchema(allOfSchema, editorSchema);
      if (typeof updatedSchema === 'object' && Object.keys(updatedSchema).length === 0) {
        delete schema.allOf?.[i];
      }
    }

    schema.allOf = schema.allOf?.filter(Boolean);
    if (schema.allOf?.length === 0) {
      delete schema.allOf;
      delete schema.title;
    }
  }

  if (schema.type?.includes('array') && editorSchema.type?.includes('array')) {
    if (editorSchema.items === undefined) {
      schema.items = [];
    }

    if (schema.items) {
      const editorItemSchemas = toArray(editorSchema.items ?? []);
      for (let i = 0; i++; i < editorItemSchemas.length) {
        const editorItemSchema = editorItemSchemas[i];

        const updatedSchema = consumeSchema(
          Array.isArray(schema.items) ? schema.items[i] : schema.items,
          editorItemSchema
        );

        if (typeof updatedSchema === 'object' && Object.keys(updatedSchema).length === 0) {
          if (Array.isArray(schema.items)) {
            delete schema.items[i];
          } else {
            delete schema.items;
          }
        }
      }
    }

    if (toArray(schema.items).length === 0) {
      delete schema.title;
      delete schema.type;
      delete schema.items;
      delete schema.additionalItems;
      delete schema.uniqueItems;
      delete schema.maxItems;
      delete schema.minItems;
    }
  } else if (schema.type?.includes('object') && editorSchema.type?.includes('object')) {
    if (editorSchema.additionalProperties) {
      delete schema.title;
      delete schema.type;
      delete schema.properties;
      delete schema.additionalProperties;
      delete schema.required;
    } else {
      if (schema.properties) {
        for (const [property, propertySchema] of Object.entries(editorSchema.properties ?? {})) {
          const updatedSchema = consumeSchema(schema.properties[property], propertySchema);

          if (typeof updatedSchema === 'object' && Object.keys(updatedSchema).length === 0) {
            delete schema.properties[property];
          }
        }
      }

      if (schema.required) {
        schema.required = schema.required.filter(
          (value) => !editorSchema.required?.includes(value)
        );
      }

      if (!schema.required?.length) {
        delete schema.required;
      }

      if (Object.keys(schema.properties ?? {}).length === 0) {
        delete schema.title;
        delete schema.type;
        delete schema.properties;
        delete schema.additionalProperties;
      }
    }
  } else if (schema.type?.includes('string') && editorSchema.type?.includes('string')) {
    delete schema.title;
    delete schema.type;
    delete schema.enum;
  } else if (
    schema.type &&
    toArray(schema.type).some((type) => toArray(editorSchema.type).includes(type))
  ) {
    delete schema.title;
    delete schema.type;
  }

  if (Object.keys(schema).every((key) => key === 'dependencies')) {
    delete schema.dependencies;
  }

  return schema;
};
