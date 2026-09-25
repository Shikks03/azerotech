import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let _prodClientPromise: Promise<MongoClient> | undefined;

function connect(uri: string, onFail: () => void): Promise<MongoClient> {
  const p = new MongoClient(uri, {
    tls: true,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  }).connect();
  // Don't cache a failed connection — otherwise one transient DNS/network
  // error makes every later request fail until the process restarts.
  p.catch(onFail);
  return p;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not defined");

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = connect(uri, () => { global._mongoClientPromise = undefined; });
    }
    return global._mongoClientPromise;
  }

  if (!_prodClientPromise) {
    _prodClientPromise = connect(uri, () => { _prodClientPromise = undefined; });
  }
  return _prodClientPromise;
}

// Lazy thenable — defers MongoClient creation until first `await`,
// so the module can be imported at build time without MONGODB_URI being set.
const clientPromise: Promise<MongoClient> = {
  then: (onfulfilled?, onrejected?) =>
    getClientPromise().then(onfulfilled, onrejected),
  catch: (onrejected?) => getClientPromise().catch(onrejected),
  finally: (onfinally?) => getClientPromise().finally(onfinally),
  [Symbol.toStringTag]: "Promise",
} as Promise<MongoClient>;

export default clientPromise;
