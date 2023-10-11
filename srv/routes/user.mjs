import express from "express";
import { ObjectId } from "mongodb";
import db from "../db/conn.mjs";
import MUUID from "uuid-mongodb";
import { verifyAdmin } from "../services/verifyAdmin.mjs";
import { verifyUser } from "../services/verifyUser.mjs";

const mUUID = MUUID.mode("relaxed"); // use relaxed mode
const router = express.Router();
const collectionName = "user";

router.get("/", async (req, res) => {
  if (!verifyAdmin(req, res)) {
    return;
  }

  try {
    let limit = req.query.limit || 50;
    let offset = req.query.offset || 0;

    if (limit > 51) {
      limit = 50;
    }

    limit = Number(limit);
    offset = Number(offset);

    let collection = await db.collection(collectionName);

    const totalCount = await collection.countDocuments();

    //   Post.count({},function(err,count){
    //     console.log(count)     // total number of records
    //     Post.find({}, function(err, posts){
    //         if (err) res.send(err);
    //         res.json({total:count,posts:posts});
    //     }).skip(req.query.offset).limit(req.query.limit);
    // });

    //   Post.find({}, function(err, posts){
    //     if (err) res.send(err);
    //     res.json({total:count,posts:posts});
    // }).skip(req.query.offset).limit(req.query.limit);

    // let results = await collection.aggregate([{ $project: { author: 1, title: 1, tags: 1, date: 1 } }, { $sort: { date: -1 } }, { $limit: limit }]).toArray();
    let results = await collection.find({}).skip(offset).limit(limit).toArray();

    res.send({ total: totalCount, items: results });
    // res.send(results);
  } catch (err) {
    console.log(err);
  }
});

// Fetches the root categories
router.get("/root", async (req, res) => {
  if (!verifyAdmin(req, res)) {
    return;
  }

  let collection = await db.collection(collectionName);
  let results = await collection.aggregate([{ $project: { name: 1, icon: 1, slug: 1, parent: 1, sort: 1 } }, { $sort: { sort: 1 } }, { $limit: 50 }]).toArray();
  res.send(results);
});

// Fetches the latest posts
router.get("/latest", async (req, res) => {
  if (!verifyAdmin(req, res)) {
    return;
  }

  let collection = await db.collection(collectionName);
  let results = await collection.aggregate([{ $project: { author: 1, title: 1, tags: 1, date: 1 } }, { $sort: { date: -1 } }, { $limit: 3 }]).toArray();
  res.send(results);
});

// Get a single post
router.get("/:id", async (req, res) => {
  if (!verifyAdmin(req, res)) {
    return;
  }

  let collection = await db.collection(collectionName);

  let query = { _id: MUUID.from(req.params.id) };
  //   let query = { _id: ObjectId(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.status(404).send("Not found");
  else res.send(result);
});

// Add a new document to the collection
router.post("/", async (req, res) => {
  if (!verifyAdmin(req, res)) {
    return;
  }

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

    res.send({ result: result, item: newDocument });
  } catch (err) {
    console.log(err);
  }
});

router.put("/:id", async (req, res) => {
  const user = verifyAdmin(req, res);

  if (!user) {
    return;
  }

  try {
    let collection = await db.collection(collectionName);

    let query = { did: req.params.id };
    //let query = { _id: MUUID.from(req.params.id) };
    let result = await collection.findOne(query);

    console.log("Searching for: ", req.params.id);

    // if (!result) res.status(404).send("Not found");

    let updateDocument = req.body;

    // Ensure we read the DID from the cookie.
    updateDocument.did = user.did;

    // Users are only allowed to edit themselves.
    // Ensure that users can't provide different ID in URL and within payload:
    if (req.params.id != user.did) {
      res
        .status(401)
        .send({
          status: "error",
          error: "Unauthorized",
        })
        .end();
      return;
    }

    console.log("REQUEST BODY:");
    console.log(updateDocument);

    // Ensure we don't have an id field. If we do, remove it.
    delete updateDocument.id;

    let updateResult = null;

    if (!result) {
      updateDocument._id = MUUID.v4();
      updateDocument.date = new Date();

      updateResult = await collection.insertOne(updateDocument);
    } else {
      updateDocument._id = result._id; // MUUID.from(req.params.id);
      updateDocument.date = new Date();

      updateResult = await collection.updateOne(query, { $set: updateDocument });
      console.log("Updated documents =>", updateResult);
    }

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
  if (!verifyAdmin(req, res)) {
    return;
  }

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
  if (!verifyAdmin(req, res)) {
    return;
  }

  try {
    if (req.params.id.length > 32) {
      const query = { _id: MUUID.from(req.params.id) };
      //   const query = { _id: ObjectId(req.params.id) };

      const collection = db.collection(collectionName);
      let result = await collection.deleteOne(query);

      res.send(result);
    } else {
      const query = { _id: ObjectId(req.params.id) };

      const collection = db.collection(collectionName);
      let result = await collection.deleteOne(query);

      res.send(result);
    }
  } catch (err) {
    console.error(err);
  }
});

export default router;
