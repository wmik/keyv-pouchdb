import test from "ava";
import Keyv from "keyv";
import KeyvPouchDB from "this";
import { keyvValueTests } from "@keyv/test-suite";

const store = (
  opts = {
    overwriteExisting: true
  }
) => new KeyvPouchDB(opts);

const customizedkeyvApiTests = (test, Keyv, store) => {
  test.beforeEach(async () => {
    const keyv = new Keyv({ store: store() });
    await keyv.clear();
  });

  test.serial(".set(key, value) resolves to true", async t => {
    const keyv = new Keyv({ store: store() });
    t.is(await keyv.set("foo", "bar"), true);
  });

  test.serial(".set(key, value) sets a value", async t => {
    const keyv = new Keyv({ store: store() });
    await keyv.set("foo", "bar");
    t.is(await keyv.get("foo"), "bar");
  });

  test.serial(".get(key) resolves to value", async t => {
    const keyv = new Keyv({ store: store() });
    await keyv.set("foo", "bar");
    t.is(await keyv.get("foo"), "bar");
  });

  test.serial(
    ".get(key) with nonexistent key resolves to undefined",
    async t => {
      const keyv = new Keyv({ store: store() });
      t.is(await keyv.get("foo"), undefined);
    }
  );

  test.serial(".delete(key) resolves to true", async t => {
    const keyv = new Keyv({ store: store() });
    await keyv.set("foo", "bar");
    t.is(await keyv.delete("foo"), true);
  });

  test.serial(
    ".delete(key) with nonexistent key resolves to false",
    async t => {
      const keyv = new Keyv({ store: store() });
      t.is(await keyv.delete("foo"), false);
    }
  );

  test.serial(".delete(key) deletes a key", async t => {
    const keyv = new Keyv({ store: store() });
    await keyv.set("foo", "bar");
    t.is(await keyv.delete("foo"), true);
    t.is(await keyv.get("foo"), undefined);
  });

  test.serial(".clear() resolves to undefined", async t => {
    const keyv = new Keyv({ store: store() });
    t.is(await keyv.clear(), undefined);
    await keyv.set("foo", "bar");
    t.is(await keyv.clear(), undefined);
  });

  test.serial(".clear() deletes all key/value pairs", async t => {
    const keyv = new Keyv({ store: store() });
    await keyv.set("foo", "bar");
    await keyv.set("fizz", "buzz");
    await keyv.clear();
    t.is(await keyv.get("foo"), undefined);
    t.is(await keyv.get("fizz"), undefined);
  });

  /*
   * These tests cause ava to throw:
   *  `Promise returned by test never resolved`
   * If they run before any other test
  */

  test.serial(".set(key, value) returns a Promise", t => {
    const keyv = new Keyv({ store: store() });
    t.true(keyv.set("foo", "bar") instanceof Promise);
  });

  test.serial(".get(key) returns a Promise", t => {
    const keyv = new Keyv({ store: store() });
    t.true(keyv.get("foo") instanceof Promise);
  });

  test.serial(".delete(key) returns a Promise", t => {
    const keyv = new Keyv({ store: store() });
    t.true(keyv.delete("foo") instanceof Promise);
  });

  test.serial(".clear() returns a Promise", async t => {
    const keyv = new Keyv({ store: store() });
    const returnValue = keyv.clear();
    t.true(returnValue instanceof Promise);
    await returnValue;
  });
  /* **** */

  test.after.always(async () => {
    const keyv = new Keyv({ store: store() });
    await keyv.clear();
  });
};

const customTests = (test, Keyv, store) => {
  test.beforeEach(async () => {
    const keyv = new Keyv({ store: store() });
    await keyv.clear();
  });

  test.serial(
    ".set(key, value) should not overwrite existing keys",
    async t => {
      const keyv = new KeyvPouchDB({ overwriteExisting: true });
      await keyv.set("foo", "bar");
      await keyv.set("foo", "foo");
      t.is(await keyv.get("foo"), "foo");
    }
  );

  test.serial("should use the correct pouchdb adapter", t => {
    let keyv = new KeyvPouchDB("http://localhost:3000");
    t.is(keyv._opts.pouchDB.adapter, "http");
    keyv = new KeyvPouchDB("database.db");
    t.is(keyv._opts.pouchDB.adapter, "websql");
  });

  test.serial("should throw if pouchdb adapter is not supported", t => {
    const error = t.throws(
      () => new KeyvPouchDB({ pouchDB: { adapter: "none" } }),
      Error
    );
    t.is(error.message, "Unsupported pouchdb adapter none");
  });

  test.after.always(async () => {
    const keyv = new Keyv({ store: store() });
    await keyv.clear();
  });
};

keyvValueTests(test, Keyv, store);
customTests(test, Keyv, store);
customizedkeyvApiTests(test, Keyv, store); // always run last
