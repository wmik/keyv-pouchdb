"use strict";

const EventEmitter = require("events");
const PouchDB = require("pouchdb-browser");
const merge = require("lodash.merge");

PouchDB.plugin(require("pouchdb-lru-cache"));

const loadPlugins = plugins => {
	plugins.forEach(plug => PouchDB.plugin(require(plug)));
};

function dbFactory(opts) {
	const adapters = {
		http: "pouchdb-adapter-http",
		memory: "pouchdb-adapter-memory",
		websql: "pouchdb-adapter-node-websql"
	};
	const adapter = [adapters[opts.pouchDB.adapter]];

	loadPlugins(adapter.concat(opts.pouchDB.plugins));

	const db = new PouchDB(opts.pouchDB.database, {
		[opts.pouchDB.adapter !== "http" && "adapter"]: opts.pouchDB.adapter
	});
	db.initLru(opts.maxCacheSize);

	return db.lru;
}

class KeyvPouchdb extends EventEmitter {
	constructor(opts) {
		super();
		if (typeof opts === "string") {
			if (opts.indexOf(".db") > -1) {
				opts = { pouchDB: { database: opts, adapter: "websql" } };
			} else {
				opts = { pouchDB: { database: opts, adapter: "http" } };
			}
		}
		this._opts = merge(
			{
				pouchDB: {
					adapter: "memory",
					database: "keyv-pouchdb-cache",
					plugins: []
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
			adapter: this._opts.pouchDB.adapter
		});
		return pouchdb.destroy().then(() => {
			this.pouchdb = dbFactory(this._opts);
		});
	}
}

module.exports = KeyvPouchdb;
