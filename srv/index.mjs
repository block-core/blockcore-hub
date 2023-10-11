import express from "express";
import cors from "cors";
import compression from "cors";
import "./loadEnvironment.mjs";
import "express-async-errors";
import posts from "./routes/posts.mjs";
import collection from "./routes/collection.mjs";
import category from "./routes/category.mjs";
import authenticate from "./routes/authenticate.mjs";
import user from "./routes/user.mjs";
import profile from "./routes/profile.mjs";
import permission from "./routes/permission.mjs";
import project from "./routes/project.mjs";
import path from "path";
import { fileURLToPath } from "url";
import cookie from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
// console.log(__filename);
const __dirname = path.dirname(__filename);
// console.log(__dirname);

const PORT = process.env.PORT || 5050;
const ADMINS = process.env["ADMIN"]?.split(",").filter((i) => i.trim());
const PRODUCTION = process.env["NODE_ENV"] === "production";
const KEY = process.env["JWT_KEY"];
const app = express();

// console.log('ADMINS:', ADMINS);
// console.log('KEY:', KEY);

// app.use(cors({origin: ['http://localhost:5050', 'http://localhost:4200', 'https://hub.freeplatform.city']}));
// app.use(cors({origin: '*'}));
app.use(express.json());

app.use(function (req, res, next) {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
//   res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  res.setHeader("Access-Control-Allow-Credentials", true);

  next();
});

app.use(cookie());
app.use(
  compression({
    threshold: 512,
  })
);

app.disable("x-powered-by");

app.use("/api/authenticate", authenticate);
app.use("/api/permission", permission);
app.use("/api/project", project);
app.use("/api/posts", posts);
app.use("/api/collection", collection);
app.use("/api/category", category);
app.use("/api/user", user);
app.use("/api/profile", profile);

app.use("/", express.static(path.join(__dirname, "dist")));
// app.get("/*", (req, res) => res.sendFile(path.join(__dirname)));

app.use((err, _req, res, next) => {
  res.status(500).send("Uh oh! An unexpected error occured.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
