import { Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _indexesEnsured: Promise<void> | undefined;
}

let _prodIndexesEnsured: Promise<void> | undefined;

async function _createIndexes(db: Db): Promise<void> {
  await Promise.all([
    // appointments
    db.collection("appointments").createIndex({ appointmentId: 1 }, { unique: true }),
    db.collection("appointments").createIndex(
      { date: 1, time: 1 },
      {
        unique: true,
        partialFilterExpression: { status: { $in: ["Pending", "Confirmed"] } },
        name: "unique_active_slot",
      }
    ),
    // customers
    db.collection("customers").createIndex({ phone: 1 }, { unique: true }),
    // revoked sessions
    db.collection("revoked_sessions").createIndex({ jti: 1 }, { unique: true }),
    db.collection("revoked_sessions").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    ),
    // products + lcd_stock
    db.collection("products").createIndex({ id: 1 }, { unique: true }),
    db.collection("lcd_stock").createIndex({ id: 1 }, { unique: true }),
  ]);
}

export function ensureIndexes(db: Db): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    if (!global._indexesEnsured) {
      global._indexesEnsured = _createIndexes(db);
    }
    return global._indexesEnsured;
  }
  if (!_prodIndexesEnsured) {
    _prodIndexesEnsured = _createIndexes(db);
  }
  return _prodIndexesEnsured;
}
