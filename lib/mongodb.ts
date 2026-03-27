import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let _prodClientPromise: Promise<MongoClient> | undefined;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not defined");

  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(uri, {
        tls: true,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10,
      }).connect();
    }
    return global._mongoClientPromise;
  }

  if (!_prodClientPromise) {
    _prodClientPromise = new MongoClient(uri, {
      tls: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    }).connect();
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
