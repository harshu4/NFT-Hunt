const jwt = require("jsonwebtoken");

const config = process.env;
require("dotenv").config(); 

const verifyToken = (req, res, next) => {
    console.log(req.headers)
  let token =
    req.body.token || req.query.token || req.headers["authorization"];
    token = token.split(" ")[1]
  if (!token) {
    return res.status(403).send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;