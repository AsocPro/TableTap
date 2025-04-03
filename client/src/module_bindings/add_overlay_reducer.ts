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

import { ShapeType as __ShapeType } from "./shape_type_type";
import { Vec2 as __Vec2 } from "./vec_2_type";

export type AddOverlay = {
  overlayId: bigint,
  shapeType: __ShapeType,
  size: number,
  color: string,
  position: __Vec2[],
};

/**
 * A namespace for generated helper functions.
 */
export namespace AddOverlay {
  /**
  * A function which returns this type represented as an AlgebraicType.
  * This function is derived from the AlgebraicType used to generate this type.
  */
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement("overlayId", AlgebraicType.createU64Type()),
      new ProductTypeElement("shapeType", __ShapeType.getTypeScriptAlgebraicType()),
      new ProductTypeElement("size", AlgebraicType.createU32Type()),
      new ProductTypeElement("color", AlgebraicType.createStringType()),
      new ProductTypeElement("position", AlgebraicType.createArrayType(__Vec2.getTypeScriptAlgebraicType())),
    ]);
  }

  export function serialize(writer: BinaryWriter, value: AddOverlay): void {
    AddOverlay.getTypeScriptAlgebraicType().serialize(writer, value);
  }

  export function deserialize(reader: BinaryReader): AddOverlay {
    return AddOverlay.getTypeScriptAlgebraicType().deserialize(reader);
  }

}

