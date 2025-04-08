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
import { GameState as __GameState } from "./game_state_type";

import type {
  CallReducerFlags,
  DbContext,
  ErrorContextInterface,
  Event,
  EventContextInterface,
  ReducerEventContextInterface,
  SubscriptionEventContextInterface,
} from "@clockworklabs/spacetimedb-sdk";
export type Action = {
  timestamp: Timestamp,
  actionType: string,
  description: string,
  gameState: __GameState | undefined,
};

/**
 * A namespace for generated helper functions.
 */
export namespace Action {
  /**
  * A function which returns this type represented as an AlgebraicType.
  * This function is derived from the AlgebraicType used to generate this type.
  */
  export function getTypeScriptAlgebraicType(): AlgebraicType {
    return AlgebraicType.createProductType([
      new ProductTypeElement("timestamp", AlgebraicType.createTimestampType()),
      new ProductTypeElement("actionType", AlgebraicType.createStringType()),
      new ProductTypeElement("description", AlgebraicType.createStringType()),
      new ProductTypeElement("gameState", AlgebraicType.createOptionType(__GameState.getTypeScriptAlgebraicType())),
    ]);
  }

  export function serialize(writer: BinaryWriter, value: Action): void {
    Action.getTypeScriptAlgebraicType().serialize(writer, value);
  }

  export function deserialize(reader: BinaryReader): Action {
    return Action.getTypeScriptAlgebraicType().deserialize(reader);
  }

}


