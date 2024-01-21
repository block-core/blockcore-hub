import jwt from "jsonwebtoken";
const KEY = process.env["JWT_KEY"];
const APIKEY = process.env["API_KEY"];

export function verifyUser(req, res) {
  try {

    if (APIKEY && req.query.apikey) {
      if (APIKEY === req.query.apikey) {
        return {
          admin: true,
        };
      }
    }

    const { cookies } = req;
    const token = cookies.token;

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
