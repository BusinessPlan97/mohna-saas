// Couche de stockage : PostgreSQL si DATABASE_URL est défini (durable, ex. Neon),
// sinon repli sur le fichier JSON local (db.js). API asynchrone unifiée.
//
// Modèle Postgres : une table `records(id, collection, data jsonb, created_at)`.
// Schéma souple identique au store JSON — aucune migration par entité.

import { read, write, COLLECTIONS, uid } from "./db.js";

const HAS_PG = Boolean(process.env.DATABASE_URL);

/* ============ Backend PostgreSQL ============ */
async function makePgStore() {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
    max: 5,
  });
  const q = (text, params) => pool.query(text, params);
  const toObj = (r) => ({ id: r.id, createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at, ...r.data });

  await q(`CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    collection TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);
  await q(`CREATE INDEX IF NOT EXISTS records_collection_idx ON records(collection)`);

  const strip = (body) => { const { id, createdAt, ...rest } = body || {}; return rest; };

  return {
    backend: "postgres",
    async list(collection) {
      const { rows } = await q(`SELECT id, data, created_at FROM records WHERE collection=$1 ORDER BY created_at DESC`, [collection]);
      return rows.map(toObj);
    },
    async get(collection, id) {
      const { rows } = await q(`SELECT id, data, created_at FROM records WHERE collection=$1 AND id=$2`, [collection, id]);
      return rows[0] ? toObj(rows[0]) : null;
    },
    async create(collection, body) {
      const id = body.id || uid();
      const created = body.createdAt ? new Date(body.createdAt) : new Date();
      const { rows } = await q(
        `INSERT INTO records (id, collection, data, created_at) VALUES ($1,$2,$3::jsonb,$4) RETURNING id, data, created_at`,
        [id, collection, JSON.stringify(strip(body)), created]
      );
      return toObj(rows[0]);
    },
    async update(collection, id, patch) {
      const { rows } = await q(
        `UPDATE records SET data = data || $3::jsonb WHERE collection=$1 AND id=$2 RETURNING id, data, created_at`,
        [collection, id, JSON.stringify(strip(patch))]
      );
      return rows[0] ? toObj(rows[0]) : null;
    },
    async remove(collection, id) {
      const { rowCount } = await q(`DELETE FROM records WHERE collection=$1 AND id=$2`, [collection, id]);
      return rowCount > 0;
    },
    async isEmpty() {
      const { rows } = await q(`SELECT 1 FROM records LIMIT 1`);
      return rows.length === 0;
    },
    async bulkInsert(db) {
      for (const collection of COLLECTIONS) {
        for (const row of db[collection] || []) {
          await this.create(collection, row);
        }
      }
    },
  };
}

/* ============ Backend fichier JSON (repli local) ============ */
function makeFileStore() {
  const sortDesc = (rows) => [...rows].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  return {
    backend: "fichier",
    async list(c) { return sortDesc(read()[c] || []); },
    async get(c, id) { return (read()[c] || []).find((x) => x.id === id) || null; },
    async create(c, body) {
      const db = read();
      const item = { id: body.id || uid(), createdAt: body.createdAt || new Date().toISOString(), ...body };
      db[c].unshift(item); write(db); return item;
    },
    async update(c, id, patch) {
      const db = read();
      const i = (db[c] || []).findIndex((x) => x.id === id);
      if (i === -1) return null;
      db[c][i] = { ...db[c][i], ...patch, id }; write(db); return db[c][i];
    },
    async remove(c, id) {
      const db = read();
      const before = (db[c] || []).length;
      db[c] = (db[c] || []).filter((x) => x.id !== id);
      write(db); return db[c].length < before;
    },
    async isEmpty() { const db = read(); return COLLECTIONS.every((c) => (db[c] || []).length === 0); },
    async bulkInsert(db) { write(db); },
  };
}

let _store = null;
export async function getStore() {
  if (_store) return _store;
  _store = HAS_PG ? await makePgStore() : makeFileStore();
  return _store;
}
export { COLLECTIONS };
