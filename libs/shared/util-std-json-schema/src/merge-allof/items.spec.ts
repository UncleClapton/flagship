import { mergeAllOf } from '.';

describe('items', () => {
  it('merges additionalItems', () => {
    const result = mergeAllOf({
      items: {
        type: 'object',
      },
      allOf: [
        {
          items: [true],
          additionalItems: {
            properties: {
              name: {
                type: 'string',
                pattern: 'bar',
              },
            },
          },
        },
        {
          items: [true],
          additionalItems: {
            properties: {
              name: {
                type: 'string',
                pattern: 'foo',
              },
            },
          },
        },
      ],
    });

    expect(result).toStrictEqual({
      items: [
        {
          type: 'object',
        },
      ],
      additionalItems: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            pattern: '(?=bar)(?=foo)',
          },
        },
      },
    });
  });

  describe('when single schema', () => {
    it('merges them', () => {
      const result = mergeAllOf({
        items: {
          type: 'string',
          allOf: [
            {
              minLength: 5,
            },
          ],
        },
        allOf: [
          {
            items: {
              type: 'string',
              pattern: 'abc.*',
              allOf: [
                {
                  maxLength: 7,
                },
              ],
            },
          },
        ],
      });

      expect(result).toStrictEqual({
        items: {
          type: 'string',
          pattern: 'abc.*',
          minLength: 5,
          maxLength: 7,
        },
      });
    });
  });

  describe('when array', () => {
    it('merges them in when additionalItems are all undefined', () => {
      const result = mergeAllOf({
        items: [
          {
            type: 'string',
            allOf: [
              {
                minLength: 5,
              },
            ],
          },
        ],
        allOf: [
          {
            items: [
              {
                type: 'string',
                allOf: [
                  {
                    minLength: 5,
                  },
                ],
              },
              {
                type: 'integer',
              },
            ],
          },
        ],
      });

      expect(result).toStrictEqual({
        items: [
          {
            type: 'string',
            minLength: 5,
          },
          {
            type: 'integer',
          },
        ],
      });
    });

    it('merges in additionalItems from one if present', () => {
      const result = mergeAllOf({
        allOf: [
          {
            items: [
              {
                type: 'string',
                minLength: 10,
                allOf: [
                  {
                    minLength: 5,
                  },
                ],
              },
              {
                type: 'integer',
              },
            ],
          },
          {
            additionalItems: false,
            items: [
              {
                type: 'string',
                allOf: [
                  {
                    minLength: 7,
                  },
                ],
              },
            ],
          },
        ],
      });

      expect(result).toStrictEqual({
        additionalItems: false,
        items: [
          {
            type: 'string',
            minLength: 10,
          },
        ],
      });
    });

    it('merges in additionalItems from one if present', () => {
      const result = mergeAllOf({
        allOf: [
          {
            items: [
              {
                type: 'string',
                minLength: 10,
                allOf: [
                  {
                    minLength: 5,
                  },
                ],
              },
              {
                type: 'integer',
              },
            ],
            additionalItems: false,
          },
          {
            additionalItems: false,
            items: [
              {
                type: 'string',
                allOf: [
                  {
                    minLength: 7,
                  },
                ],
              },
            ],
          },
        ],
      });

      expect(result).toStrictEqual({
        additionalItems: false,
        items: [
          {
            type: 'string',
            minLength: 10,
          },
        ],
      });
    });

    it('merges in additionalItems schema', () => {
      const result = mergeAllOf({
        allOf: [
          {
            items: [
              {
                type: 'string',
                minLength: 10,
                allOf: [
                  {
                    minLength: 5,
                  },
                ],
              },
              {
                type: 'integer',
              },
            ],
            additionalItems: {
              type: 'integer',
              minimum: 15,
            },
          },
          {
            additionalItems: {
              type: 'integer',
              minimum: 10,
            },
            items: [
              {
                type: 'string',
                allOf: [
                  {
                    minLength: 7,
                  },
                ],
              },
            ],
          },
        ],
      });

      expect(result).toStrictEqual({
        additionalItems: {
          type: 'integer',
          minimum: 15,
        },
        items: [
          {
            type: 'string',
            minLength: 10,
          },
          {
            type: 'integer',
            minimum: 10,
          },
        ],
      });
    });
  });

  describe('when mixed array and object', () => {
    it('merges in additionalItems schema', () => {
      const result = mergeAllOf({
        // This should be ignored according to spec when items absent
        additionalItems: {
          type: 'integer',
          minimum: 50,
        },
        allOf: [
          {
            items: {
              type: 'integer',
              minimum: 5,
              maximum: 30,
              allOf: [
                {
                  minimum: 9,
                },
              ],
            },
            // This should be ignored according to spec when items is object
            additionalItems: {
              type: 'integer',
              minimum: 15,
            },
          },
          {
            // this will be merged with first allOf items schema
            additionalItems: {
              type: 'integer',
              minimum: 10,
            },
            // this will be merged with first allOf items schema
            items: [
              {
                type: 'integer',
                allOf: [
                  {
                    minimum: 7,
                    maximum: 20,
                  },
                ],
              },
            ],
          },
        ],
      });

      expect(result).toStrictEqual({
        additionalItems: {
          type: 'integer',
          minimum: 10,
          maximum: 30,
        },
        items: [
          {
            type: 'integer',
            minimum: 9,
            maximum: 20,
          },
        ],
      });
    });

    it.todo('considers additionalItems');
  });
});
