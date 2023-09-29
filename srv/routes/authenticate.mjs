import express from "express";
import db from "../db/conn.mjs";
import MUUID from "uuid-mongodb";
import cache from "memory-cache";
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import { Resolver } from "did-resolver";
import is from "@blockcore/did-resolver";
import { verifyJWS } from "did-jwt";

const mUUID = MUUID.mode("relaxed"); // use relaxed mode
const ADMINS = process.env["ADMIN"]?.split(",").filter((i) => i.trim());
const PRODUCTION = process.env["NODE_ENV"] === "production";
const KEY = process.env["JWT_KEY"];
const router = express.Router();

const isResolver = is.getResolver();
let resolver = new Resolver(isResolver);

router.get("/", async (req, res) => {
  const challenge = MUUID.v4();

  // Put the challenge in cache for 5 minute.
  cache.put(`challenge:${challenge}`, true, 60 * 1000);

  res.send({ challenge: challenge });
});

async function verifyToken(jwt, did) {
  const didResolution = await resolver.resolve(did);

  if (!didResolution.didDocument) {
    return null;
  }

  // TODO: Create some utility that resolves the authentication keys. Right now we'll simply use .verificationMethod, but this
  // MUST be changed later on to only use authentication keys.
  const verificationMethods = didResolution.didDocument.verificationMethod;

  // We could DecodeJws (not exposed from did-jwt) ourself, get the kid and only send that to verifyJWS. Need to look more into
  // the implementation of verifyJWS later.
  // this.getAuthenticationMethod();
  const verificationMethod = verifyJWS(jwt, verificationMethods);

  return verificationMethod;
}

router.post("/", async (req, res) => {
  try {
    if (!req.body.proof) {
      return res.status(404);
    }

    await verifyToken(req.body.proof, req.body.did);

    const payload = {
      did: req.body.did,
    };

    // if (!ADMINS?.includes(payload.did)) {
    //   return res
    //     .send({
    //       status: "error",
    //       error: "Unauthorized",
    //     })
    //     .status(401);
    // }

    const isAdmin = ADMINS?.includes(payload.did);

    let collection = await db.collection("user");
    let query = { did: payload.did };
    let result = await collection.findOne(query);
    const isApproved = result ? false : true;

    const token = jwt.sign(payload, KEY, { expiresIn: "1h" });

    let serialized;

    if (PRODUCTION) {
      // If the verification failed, it should have thrown an exception by now. We can generate an JWT and make a cookie for it.
      serialized = serialize("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 1, // 1 day, should this cookie be used to issue session cookies and be long-lived? The JWT itself is only valid 1h.
        path: "/",
      });
    } else {
      // If the verification failed, it should have thrown an exception by now. We can generate an JWT and make a cookie for it.
      serialized = serialize("token", token, {
        maxAge: 60 * 60 * 24 * 1, // 1 day, should this cookie be used to issue session cookies and be long-lived? The JWT itself is only valid 1h.
        path: "/",
      });
    }

    res.setHeader("Set-Cookie", serialized);

    return res.send({
      success: true,
      user: {
        did: payload.did,
        admin: isAdmin,
        approved: isApproved,
      },
    });
  } catch (err) {
    console.log(err);
  }
});

router.get("/logout", async (req, res) => {
  const { cookies } = req;
  const jwt = cookies.token;

  if (!jwt) {
    return res.status(401).send({
      status: "error",
      error: "Unauthorized",
    });
  }

  const serialized = serialize("token", null, {
    httpOnly: true,
    secure: PRODUCTION,
    sameSite: "strict",
    maxAge: -1,
    path: "/",
  });

  res.setHeader("Set-Cookie", serialized);

  return res.send({
    status: "success",
    message: "Logged out",
  });
});

router.get("/protected", async (req, res) => {
  try {
    const { cookies } = req;
    const token = cookies.token;

    if (!token) {
      return res.status(401).send({
        status: "error",
        error: "Unauthorized",
      });
    } else {
      try {
        // First let us verify the token.
        const decoded = jwt.verify(token, KEY);
        const isAdmin = ADMINS?.includes(decoded.did);

        let collection = await db.collection("user");
        let query = { did: decoded.did };
        let result = await collection.findOne(query);
        const isApproved = result ? false : true;

        return res.send({
          user: {
            did: decoded.did,
            admin: isAdmin,
            approved: isApproved,
          },
        });
      } catch (err) {
        console.log(err);
        // If the JWT has expired, the user is logged out.
        return res.status(401).send({
          status: "error",
          error: "Unauthorized, JWT expired",
        });
      }
    }
  } catch (err) {
    console.log(err);
  }
});

// Fetches the root categories
router.get("/root", async (req, res) => {
  let collection = await db.collection("category");
  let results = await collection.aggregate([{ $project: { name: 1, icon: 1, slug: 1, parent: 1, sort: 1 } }, { $sort: { sort: 1 } }, { $limit: 50 }]).toArray();
  res.send(results);
});

// Fetches the latest posts
router.get("/latest", async (req, res) => {
  let collection = await db.collection("category");
  let results = await collection.aggregate([{ $project: { author: 1, title: 1, tags: 1, date: 1 } }, { $sort: { date: -1 } }, { $limit: 3 }]).toArray();
  res.send(results);
});

// Get a single post
router.get("/:id", async (req, res) => {
  let collection = await db.collection("category");

  let query = { _id: MUUID.from(req.params.id) };
  //   let query = { _id: ObjectId(req.params.id) };
  let result = await collection.findOne(query);

  if (!result) res.status(404).send("Not found");
  else res.send(result);
});

// Update the post with a new comment
router.patch("/item/:id", async (req, res) => {
  const query = { _id: MUUID.from(req.params.id) };
  //   const query = { _id: ObjectId(req.params.id) };

  const updates = {
    $push: { comments: req.body },
  };

  let collection = await db.collection("category");
  let result = await collection.updateOne(query, updates);

  res.send(result);
});

// Delete an entry
router.delete("/:id", async (req, res) => {
  const query = { _id: MUUID.from(req.params.id) };
  //   const query = { _id: ObjectId(req.params.id) };

  const collection = db.collection("category");
  let result = await collection.deleteOne(query);

  res.send(result);
});

export default router;
