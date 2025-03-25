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
  EventContext,
  EventContextInterface,
  Reducer,
  ReducerEventContextInterface,
  SubscriptionEventContextInterface,
} from "@clockworklabs/spacetimedb-sdk";

import { Unit } from "./unit_type";
import {  RemoteReducers, RemoteTables } from ".";

/**
 * Table handle for the table `unit`.
 *
 * Obtain a handle from the [`unit`] property on [`RemoteTables`],
 * like `ctx.db.unit`.
 *
 * Users are encouraged not to explicitly reference this type,
 * but to directly chain method calls,
 * like `ctx.db.unit.on_insert(...)`.
 */
export class UnitTableHandle {
  tableCache: TableCache<Unit>;

  constructor(tableCache: TableCache<Unit>) {
    this.tableCache = tableCache;
  }

  count(): number {
    return this.tableCache.count();
  }

  iter(): Iterable<Unit> {
    return this.tableCache.iter();
  }
  /**
   * Access to the `id` unique index on the table `unit`,
   * which allows point queries on the field of the same name
   * via the [`UnitIdUnique.find`] method.
   *
   * Users are encouraged not to explicitly reference this type,
   * but to directly chain method calls,
   * like `ctx.db.unit.id().find(...)`.
   *
   * Get a handle on the `id` unique index on the table `unit`.
   */
  id = {
    // Find the subscribed row whose `id` column value is equal to `col_val`,
    // if such a row is present in the client cache.
    find: (col_val: bigint): Unit | undefined => {
      for (let row of this.tableCache.iter()) {
        if (deepEqual(row.id, col_val)) {
          return row;
        }
      }
    },
  };

  onInsert = (cb: (ctx: EventContext, row: Unit) => void) => {
    return this.tableCache.onInsert(cb);
  }

  removeOnInsert = (cb: (ctx: EventContext, row: Unit) => void) => {
    return this.tableCache.removeOnInsert(cb);
  }

  onDelete = (cb: (ctx: EventContext, row: Unit) => void) => {
    return this.tableCache.onDelete(cb);
  }

  removeOnDelete = (cb: (ctx: EventContext, row: Unit) => void) => {
    return this.tableCache.removeOnDelete(cb);
  }

  // Updates are only defined for tables with primary keys.
  onUpdate = (cb: (ctx: EventContext, oldRow: Unit, newRow: Unit) => void) => {
    return this.tableCache.onUpdate(cb);
  }

  removeOnUpdate = (cb: (ctx: EventContext, onRow: Unit, newRow: Unit) => void) => {
    return this.tableCache.removeOnUpdate(cb);
  }}
