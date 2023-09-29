import { MongoClient } from "mongodb";

const connectionString = process.env.HUB_DATABASE || "";
const client = new MongoClient(connectionString);

let conn;
try {
  conn = await client.connect();
} catch (e) {
  console.error(e);
}

let db = conn.db("free-city-hub");

export default db;
