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
const APIKEY = process.env["API_KEY"];
const router = express.Router();

export function verifyUser(req, res) {
  try {
    const { cookies } = req;
    const token = cookies.token;

    console.log("Verifying user... token:", token);
    console.log("Verifying user... cookies:", cookies);

    if (!token) {
      res
        .status(401)
        .send({
          status: "error",
          error: "Unauthorized",
        })
        .end();
    } else {
      try {
        // First let us verify the token.
        const decoded = jwt.verify(token, KEY);

        if (decoded) {
          return true;
        } else {
          res
            .status(401)
            .send({
              status: "error",
              error: "Unauthorized",
            })
            .end();
        }
      } catch (err) {
        console.log(err);
        // If the JWT has expired, the user is logged out.
        res
          .status(401)
          .send({
            status: "error",
            error: "Unauthorized, JWT expired",
          })
          .end();
      }
    }
  } catch (err) {
    console.log(err);
    res
      .status(401)
      .send({
        status: "error",
        error: "Unauthorized",
      })
      .end();
  }

  return false;
}
