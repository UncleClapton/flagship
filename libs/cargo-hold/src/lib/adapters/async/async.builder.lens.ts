import type { IPathLens } from '@brandingbrand/standard-lens';
import { createLensCreator } from '@brandingbrand/standard-lens';

import type { WithLensInstance, WithPayloadTypes } from './async.builder.types';
import type { AsyncState } from './async.types';

export function buildPayloadLens<SuccessType, FailureType, IdleType>(
  builder: Partial<WithPayloadTypes<SuccessType, FailureType, IdleType>>
): IPathLens<AsyncState<SuccessType, FailureType, IdleType>, IdleType | SuccessType>;
export function buildPayloadLens<SuccessType, FailureType, IdleType, OuterStructureType>(
  builder: Partial<WithPayloadTypes<SuccessType, FailureType, IdleType>> &
    WithLensInstance<SuccessType, FailureType, IdleType, OuterStructureType>
): IPathLens<OuterStructureType, IdleType | SuccessType>;
/**
 *
 * @param builder
 */
export function buildPayloadLens<SuccessType, FailureType, IdleType, OuterStructureType>(
  builder: Partial<
    WithLensInstance<IdleType, SuccessType, FailureType, OuterStructureType> &
      WithPayloadTypes<SuccessType, FailureType, IdleType>
  >
) {
  const innerPayloadLens =
    createLensCreator<AsyncState<SuccessType, FailureType, IdleType>>().fromPath('payload');
  if (builder.lens) {
    return innerPayloadLens.withOuterLens(builder.lens);
  }
  return innerPayloadLens;
}