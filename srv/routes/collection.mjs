import express from "express";
import db from "../db/conn.mjs";
import MUUID from "uuid-mongodb";

const mUUID = MUUID.mode("relaxed"); // use relaxed mode
const router = express.Router();
const collectionName = "collection";
import { verifyAdmin } from "../services/verifyAdmin.mjs";

// Get a list of 50 posts
router.get("/", async (req, res) => {
  
  try {
    let collection = await db.collection(collectionName);
    let results = await collection.find({}).limit(50).toArray();

    res.send(results);
  } catch (err) {
    console.log(err);
  }
});

// Fetches the latest posts
router.get("/latest", async (req, res) => {
  let collection = await db.collection(collectionName);
  let results = await collection.aggregate([{ $project: { author: 1, title: 1, tags: 1, date: 1 } }, { $sort: { date: -1 } }, { $limit: 3 }]).toArray();
  res.send(results);
});

// Add a new document to the collection
router.post("/", async (req, res) => {
  verifyAdmin(req, res);
  try {
    let collection = await db.collection(collectionName);
    let newDocument = req.body;

    // Ensure we don't have an id field. If we do, remove it.
    delete newDocument.id;

    newDocument._id = MUUID.v4();
    newDocument.date = new Date();
    let result = await collection.insertOne(newDocument);

    // const insertedId = MUUID.from(result.insertedId).toString();
    // console.log(`insertOne with id ${insertedId} succeeded`);
    // result.humanId = insertedId;

    res.status(204).send({
      id: result.insertedId,
    });
  } catch (err) {
    console.log(err);
  }
});

// Get a single post
router.get("/:id", async (req, res) => {
  let collection = await db.collection(collectionName);

  let query = { _id: MUUID.from(req.params.id) };
  //   let query = { _id: ObjectId(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.status(404).send("Not found");
  else res.send(result);
});

// Index a Collection
// Indexes can improve your application's performance. The following function creates an index on the a field in the documents collection.

// const indexName = await collection.createIndex({ a: 1 });
// console.log('index name =', indexName);

// Add a new document to the collection
router.put("/:id", async (req, res) => {
  verifyAdmin(req, res);
  try {
    let collection = await db.collection(collectionName);

    let query = { _id: MUUID.from(req.params.id) };
    let result = await collection.findOne(query);

    console.log("Searching for: ", req.params.id);

    if (!result) res.status(404).send("Not found");

    let updateDocument = req.body;

    // Ensure we don't have an id field. If we do, remove it.
    delete updateDocument.id;

    // Ensure that users can't provide different ID in URL and within payload:
    updateDocument._id = MUUID.from(req.params.id);

    updateDocument.date = new Date();

    const updateResult = await collection.updateOne(query, { $set: updateDocument });
    console.log("Updated documents =>", updateResult);

    res.send({
      result: updateResult,
      item: updateDocument,
    });
  } catch (err) {
    console.log(err);
  }
});

// Update the post with a new comment
router.patch("/item/:id", async (req, res) => {
  verifyAdmin(req, res);
  const query = { _id: MUUID.from(req.params.id) };
  //   const query = { _id: ObjectId(req.params.id) };

  const updates = {
    $push: { comments: req.body },
  };

  let collection = await db.collection(collectionName);
  let result = await collection.updateOne(query, updates);

  res.send(result);
});

// Delete an entry
router.delete("/:id", async (req, res) => {
  verifyAdmin(req, res);
  const query = { _id: MUUID.from(req.params.id) };
  //   const query = { _id: ObjectId(req.params.id) };

  const collection = db.collection(collectionName);
  let result = await collection.deleteOne(query);

  res.send(result);
});

export default router;
