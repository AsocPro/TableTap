// THIS FILE IS AUTOMATICALLY GENERATED BY SPACETIMEDB. EDITS TO THIS FILE
// WILL NOT BE SAVED. MODIFY TABLES IN YOUR MODULE SOURCE CODE INSTEAD.

/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
import {
  AlgebraicType,
  AlgebraicValue,
  BinaryReader,
  BinaryWriter,
  ConnectionId,
  DbConnectionBuilder,
  DbConnectionImpl,
  Identity,
  ProductType,
  ProductTypeElement,
  SubscriptionBuilderImpl,
  SumType,
  SumTypeVariant,
  TableCache,
  TimeDuration,
  Timestamp,
  deepEqual,
} from "@clockworklabs/spacetimedb-sdk";

import type {
  CallReducerFlags,
  DbContext,
  ErrorContextInterface,
  Event,
  EventContextInterface,
  ReducerEventContextInterface,
  SubscriptionEventContextInterface,
} from "@clockworklabs/spacetimedb-sdk";

export type Unit = {
  id: bigint,
  x: number,
  y: number,
  size: number,
  color: string,
};

/**
 * A namespace for generated helper functions.
 */
export namespace Unit {
  /**
  * A function which returns this type represented as an AlgebraicType.
  * This function is derived from the AlgebraicType used to generate this type.
  */
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement("id", AlgebraicType.createU64Type()),
      new ProductTypeElement("x", AlgebraicType.createI32Type()),
      new ProductTypeElement("y", AlgebraicType.createI32Type()),
      new ProductTypeElement("size", AlgebraicType.createI32Type()),
      new ProductTypeElement("color", AlgebraicType.createStringType()),
    ]);
  }

  export function serialize(writer: BinaryWriter, value: Unit): void {
    Unit.getTypeScriptAlgebraicType().serialize(writer, value);
  }

  export function deserialize(reader: BinaryReader): Unit {
    return Unit.getTypeScriptAlgebraicType().deserialize(reader);
  }

}


