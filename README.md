<p>
<h1 align="center">
<img width="100" src="https://rawgit.com/lukechilds/keyv/master/media/logo.svg" alt="keyv"><span style="font-size: 5rem">+</span>
<img src="https://upload.wikimedia.org/wikipedia/commons/c/c6/PouchDB_logo.png" alt="PouchDB logo" width="100"><br />
keyv-pouchdb
</h1>
<p align="center">
Third party PouchDB storage adapter for Keyv.
</p>
</p>

[![Build Status](https://travis-ci.com/wmik/keyv-pouchdb.svg?branch=master)](https://travis-ci.com/wmik/keyv-pouchdb) 
![npm](https://img.shields.io/npm/v/keyv-pouchdb.svg)


## Motivation
Leveraging [pouchdb-lru-cache](https://github.com/squarespace/pouchdb-lru-cache) as a [keyv-storage-adapter](https://github.com/topics/keyv-storage-adapter) that complies with the [api specs](https://github.com/lukechilds/keyv-test-suite).

## Installation
```sh
$ npm install --save keyv-pouchdb

# Then add a pouchdb adapter
$ npm install pouchdb-adapter-memory --save
$ npm install pouchdb-adapter-http --save
$ npm install pouchdb-adapter-node-websql --save
```

## Usage
```javascript
const KeyvPouchDB = require("keyv-pouchdb");
const Keyv = require("keyv");

const store = new KeyvPouchDB({
  // default options
  maxCacheSize: 5000000, // maximum cache size in bytes. 0 for limitless [memory only]
  overwriteExisting: false, // replace existing entries
  pouchDB: {
    // pouchDB configuration options
    adapter: "memory", // pouchdb adapter
    database: "keyv-pouchdb-cache", // database (string | uri)
    remoteConfig: {} // configuration options for remote database
  }
});

/*
 * or connect to a remote instance
 * 
 * npx pouchdb-server --port 3000 --in-memory
 * 
 */
new KeyvPouchDB("http://localhost:3000/keyv-pouchdb-cache"); // loads `pouchdb-adapter-http`

/*
 * 
 * or maybe even sqlite3
 * 
*/
new KeyvPouchDB("database.db"); // loads `pouchdb-adapter-node-websql`

/****************************/

const keyv = new Keyv({ store });

```

### License
MIT © wmik
