import { createLens } from '@brandingbrand/standard-lens';

import * as FastCheck from 'fast-check';

import type { EntityState } from '../entity.types';

import { defaultIdSelector } from './entity.adaptor';
import { makeReducers } from './entity.reducer';

interface SampleItem {
  id: number;
  value: unknown;
}

const entityStateLens = createLens<EntityState<SampleItem>>().fromPath();

const sampleItemArbitrary: FastCheck.Arbitrary<SampleItem> = FastCheck.record({
  id: FastCheck.integer(),
  value: FastCheck.anything(),
});
const sampleItemEntityArbitrary: FastCheck.Arbitrary<EntityState<SampleItem>> = FastCheck.set(
  sampleItemArbitrary,
  { compare: { selector: defaultIdSelector } }
).map((items) => ({
  entities: Object.fromEntries(items.map((item) => [defaultIdSelector(item), item])),
  ids: [...new Set(items.map(defaultIdSelector))],
}));

describe('makeReducers', () => {
  const reducers = makeReducers({
    lens: entityStateLens,
    idSelector: defaultIdSelector,
    isSorted: false,
  });

  describe('addMany', () => {
    it('adds multiple items, ignoring duplicates', () => {
      FastCheck.assert(
        FastCheck.property(
          sampleItemEntityArbitrary,
          FastCheck.set(sampleItemArbitrary, { compare: { selector: defaultIdSelector } }),
          (entityState, newItems) => {
            const result = reducers.addMany(newItems)(entityState);

            const deduplicatedLength = new Set([
              ...new Set(newItems.map((item) => item.id)),
              ...entityState.ids,
            ]).size;

            expect(result.ids).toHaveLength(deduplicatedLength);
            expect(Object.values(result.entities)).toHaveLength(deduplicatedLength);

            for (const item of newItems) {
              expect(result.ids).toContain(item.id);
            }
            for (const item of newItems.filter((item) => !entityState.ids.includes(item.id))) {
              expect(Object.values(result.entities)).toContain(item);
            }
            for (const id of entityState.ids) {
              expect(result.ids).toContain(id);
            }
            for (const item of entityState.ids.map((id) => entityState.entities[id])) {
              expect(Object.values(result.entities)).toContain(item);
            }
          }
        )
      );
    });
  });

  describe('addOne', () => {
    it('adds an item, ignoring duplicates', () => {
      FastCheck.assert(
        FastCheck.property(
          sampleItemEntityArbitrary,
          sampleItemArbitrary,
          (entityState, newItem) => {
            const result = reducers.addOne(newItem)(entityState);
            const newItemIdIsInEntityState = entityState.ids.includes(newItem.id);
            const deduplicatedLength = newItemIdIsInEntityState
              ? entityState.ids.length
              : entityState.ids.length + 1;

            expect(result.ids).toHaveLength(deduplicatedLength);
            expect(Object.values(result.entities)).toHaveLength(deduplicatedLength);
            expect(result.ids).toContain(newItem.id);

            if (newItemIdIsInEntityState) {
              expect(result).toEqual(entityState);
              expect(Object.values(result.entities)).not.toContain(newItem);
            } else {
              expect(result).not.toEqual(entityState);
              expect(Object.values(result.entities)).toContain(newItem);
            }
          }
        )
      );
    });
  });

  describe('setMany', () => {
    it('sets multiple items, overwriting duplicates', () => {
      FastCheck.assert(
        FastCheck.property(
          sampleItemEntityArbitrary,
          FastCheck.set(sampleItemArbitrary, { compare: { selector: defaultIdSelector } }),
          (entityState, newItems) => {
            const result = reducers.setMany(newItems)(entityState);

            const deduplicatedLength = new Set([
              ...new Set(newItems.map((item) => item.id)),
              ...entityState.ids,
            ]).size;

            expect(result.ids).toHaveLength(deduplicatedLength);
            expect(Object.values(result.entities)).toHaveLength(deduplicatedLength);

            for (const item of newItems) {
              expect(result.ids).toContain(item.id);
            }
            for (const item of newItems) {
              expect(Object.values(result.entities)).toContain(item);
            }
            for (const id of entityState.ids) {
              expect(result.ids).toContain(id);
            }
            for (const item of entityState.ids
              .filter((id) => !newItems.map(defaultIdSelector).includes(id))
              .map((id) => entityState.entities[id])) {
              expect(Object.values(result.entities)).toContain(item);
            }
          }
        )
      );
    });
  });

  describe('setOne', () => {
    it('sets an item, existing or not, overwriting existing items', () => {
      FastCheck.assert(
        FastCheck.property(
          sampleItemEntityArbitrary,
          sampleItemArbitrary,
          (entityState, newItem) => {
            const result = reducers.setOne(newItem)(entityState);
            const newItemIdIsInEntityState = entityState.ids.includes(newItem.id);
            const deduplicatedLength = newItemIdIsInEntityState
              ? entityState.ids.length
              : entityState.ids.length + 1;

            expect(result.ids).toHaveLength(deduplicatedLength);
            expect(Object.values(result.entities)).toHaveLength(deduplicatedLength);
            expect(result.ids).toContain(newItem.id);
            expect(Object.values(result.entities)).toContain(newItem);
          }
        )
      );
    });
  });

  describe('setAll', () => {
    it('replaces all items', () => {
      FastCheck.assert(
        FastCheck.property(
          sampleItemEntityArbitrary,
          FastCheck.set(sampleItemArbitrary, { compare: { selector: defaultIdSelector } }),
          (entityState, newItems) => {
            const result = reducers.setAll(newItems)(entityState);

            expect(result.ids).toHaveLength(newItems.length);
            expect(Object.values(result.entities)).toHaveLength(newItems.length);

            // new items are all in there
            for (const item of newItems) {
              expect(result.ids).toContain(item.id);
            }
            for (const item of newItems) {
              expect(Object.values(result.entities)).toContain(item);
            }

            // old items whose ids don't happen to be in newItems aren't there
            for (const id of entityState.ids.filter(
              (id) => !newItems.map(defaultIdSelector).includes(id)
            )) {
              expect(result.ids).not.toContain(id);
            }
            for (const item of entityState.ids
              .filter((id) => !newItems.map(defaultIdSelector).includes(id))
              .map((id) => entityState.entities[id])) {
              expect(Object.values(result.entities)).not.toContain(item);
            }

            expect(result).toStrictEqual({
              ids: newItems.map(defaultIdSelector),
              entities: Object.fromEntries(newItems.map((item) => [defaultIdSelector(item), item])),
            });
          }
        )
      );
    });
  });

  describe('removeAll', () => {
    it('removes all items, leaving an empty state', () => {
      FastCheck.assert(
        FastCheck.property(sampleItemEntityArbitrary, (entityState) => {
          const result = reducers.removeAll()(entityState);

          expect(result).toEqual({
            ids: [],
            entities: {},
          });
        })
      );
    });
  });

  describe('removeMany', () => {
    it('removes the specified ids, leaving any other ids unaffected', () => {
      FastCheck.assert(
        FastCheck.property(
          sampleItemEntityArbitrary,
          FastCheck.set(FastCheck.integer()),
          (entityState, idsToRemove) => {
            const result = reducers.removeMany(idsToRemove)(entityState);
            const overlappingIds = idsToRemove.filter((id) => entityState.ids.includes(id));
            const newLength = entityState.ids.length - overlappingIds.length;

            for (const id of idsToRemove) {
              expect(result.ids).not.toContain(id);
            }
            for (const id of idsToRemove) {
              expect(result.entities).not.toHaveProperty(`${id}`);
            }
            if (overlappingIds.length > 0) {
              expect(result.ids).toHaveLength(newLength);
              expect(Object.values(result.entities)).toHaveLength(newLength);
            } else {
              expect(result).toEqual(entityState);
            }
          }
        )
      );
    });
  });

  describe('removeOne', () => {
    it('removes the specified id, leaving any other ids unaffected', () => {
      FastCheck.assert(
        FastCheck.property(
          sampleItemEntityArbitrary,
          FastCheck.integer(),
          (entityState, idToRemove) => {
            const result = reducers.removeOne(idToRemove)(entityState);
            const isOverlapping = entityState.ids.includes(idToRemove);
            const newLength = entityState.ids.length - (isOverlapping ? 1 : 0);

            expect(result.ids).not.toContain(idToRemove);
            expect(result.entities).not.toHaveProperty(`${idToRemove}`);

            if (isOverlapping) {
              expect(result.ids).toHaveLength(newLength);
              expect(Object.values(result.entities)).toHaveLength(newLength);
            } else {
              expect(result).toEqual(entityState);
            }
          }
        )
      );
    });
  });
});
