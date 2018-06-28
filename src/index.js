"use strict";

const EventEmitter = require("events");
const PouchDB = require("pouchdb-browser");
const merge = require("lodash.merge");

PouchDB.plugin(require("pouchdb-lru-cache"));

function dbFactory(opts) {
  const adapters = {
    http: "pouchdb-adapter-http",
    memory: "pouchdb-adapter-memory",
    websql: "pouchdb-adapter-node-websql"
  };

  if (!Object.prototype.hasOwnProperty.call(adapters, opts.pouchDB.adapter)) {
    throw new Error(`Unsupported pouchdb adapter ${opts.pouchDB.adapter}`);
  }

  PouchDB.plugin(require(adapters[opts.pouchDB.adapter]));

  const db = new PouchDB(
    opts.pouchDB.database,
    Object.assign(
      {},
      opts.pouchDB.adapter === "http"
        ? opts.pouchDB.remoteConfig
        : { adapter: opts.pouchDB.adapter }
    )
  );
  db.initLru(opts.maxCacheSize);

  return db.lru;
}

class KeyvPouchdb extends EventEmitter {
  constructor(opts, config = {}) {
    super();
    if (typeof opts === "string") {
      if (opts.endsWith(".db")) {
        opts = { pouchDB: { database: opts, adapter: "websql" } };
      } else {
        opts = {
          pouchDB: {
            database: opts,
            adapter: "http",
            remoteConfig: Object.assign({}, config)
          }
        };
      }
    }
    this._opts = merge(
      {
        pouchDB: {
          adapter: "memory",
          database: "keyv-pouchdb-cache",
          remoteConfig: {}
        },
        maxCacheSize: 5000000, // 5MB
        overwriteExisting: false
      },
      opts
    );
    this.ttlSupport = false;
    this.pouchdb = dbFactory(this._opts);
  }

  get(key) {
    return this.pouchdb
      .get(key)
      .then(value => Buffer.from(value).toString("binary"))
      .catch(err => (err.status === 404 ? undefined : err)); // for api compliance: resolve undefined with nonexistent keys
  }

  set(key, value, ttl, type = "text/plain") {
    return this.pouchdb
      .has(key)
      .then(hasIt => {
        // pouchdb-lru-cache doesn't overwrite existing keys
        if (hasIt && this._opts.overwriteExisting) {
          return this.pouchdb.del(key);
        }
        return { ok: !hasIt };
      })
      .then(
        write => write.ok && this.pouchdb.put(key, Buffer.from(value), type)
      )
      .then(response => (response ? response.ok : undefined));
  }

  delete(key) {
    return this.pouchdb
      .has(key)
      .then(hasIt => (hasIt ? this.pouchdb.del(key) : { ok: false }))
      .then(deleted => deleted.ok);
  }

  clear() {
    const pouchdb = new PouchDB(this._opts.pouchDB.database, {
      [this._opts.pouchDB.adapter !== "http" && "adapter"]: this._opts.pouchDB
        .adapter
    });
    return pouchdb.destroy().then(() => {
      this.pouchdb = dbFactory(this._opts);
    });
  }
}

module.exports = KeyvPouchdb;
