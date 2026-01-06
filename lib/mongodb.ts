import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'gps_tracking';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

interface MongoClientCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  var _mongoClientPromise: MongoClientCache | undefined;
}

let cached: MongoClientCache = global._mongoClientPromise || {
  client: null,
  promise: null,
};

if (!global._mongoClientPromise) {
  global._mongoClientPromise = cached;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached.client) {
    return { client: cached.client, db: cached.client.db(MONGODB_DB) };
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts);
  }

  cached.client = await cached.promise;
  return { client: cached.client, db: cached.client.db(MONGODB_DB) };
}

export async function getCollection(collectionName: string) {
  const { db } = await connectToDatabase();
  return db.collection(collectionName);
}

// Collection names
export const COLLECTIONS = {
  GPS_POINTS: 'gps_points',
  VEHICLES: 'vehicles',
  ROUTES: 'routes',
  ALERTS: 'alerts',
  USERS: 'users',
  MAP_MATCH_CACHE: 'map_match_cache',
} as const;
