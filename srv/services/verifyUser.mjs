const ADMINS = process.env["ADMIN"]?.split(",").filter((i) => i.trim());

export function verifyUser(req, res) {
  try {
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
        const isAdmin = ADMINS?.includes(decoded.did);

        if (!isAdmin) {
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
}
