//  step 1 require all the necessary things
//  express js
const express = require("express");

// cors
const cors = require("cors");

// cookie parser
const cookieParser = require("cookie-parser");

// jwt
const jwt = require("jsonwebtoken");

// dotenv
require("dotenv").config();

// mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// step 2 create express app and port
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// mongo db setup code
const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.ejmezk0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middleware for verify token
const verifyToken = (req, res, next) => {
  const token = req.cookies.webToken;

  if (!token) {
    res.status(401).send({ noToken: true });
    return;
  }

  // verify the token
  jwt.verify(token, process.env.JWT_secret, function (err, decoded) {
    if (err) {
      res.status(401).send({ badToken: true });
      return;
    }

    req.decodedUser = decoded;
    next();
  });
};

async function run() {
  try {
    // collection
    const assignmentsCollection = client
      .db("assignment11")
      .collection("assignments");

    // api for creating a jwt token when user has logged in
    app.post("/jwt", async (req, res) => {
      // step 1: get user email from request body
      const userInformation = req.body;

      // create jwt token with secret
      const token = jwt.sign(userInformation, process.env.JWT_secret, {
        expiresIn: "1hr",
      });

      // set the cookie
      res.cookie("webToken", token, {
        httpOnly: true,
        secure: false,
      });

      res.send({ message: "cookie set" });
    });

    // api for deleting the cookie which has the token
    app.get("/logout", async (req, res) => {
      res.clearCookie("webToken", { maxAge: 0 });
      res.send({ message: "Cookie deleted" });
    });

    // // test api
    // app.get("/assignments", verifyToken, async (req, res) => {
    //   res.send(req.decodedUser.email);
    // });

    // api for creating assignment in database
    app.post("/assignments/create", verifyToken, async (req, res) => {
      const data = req.body;
      console.log(data);

      const result = await assignmentsCollection.insertOne(data);
      res.send(result);
    });

    // api for retreiving assignments data
    app.post("/assignments", async (req, res) => {
      const filter = req.body;

      // if difficulty is all then send all the assignments
      if (filter.difficulty === "all") {
        const cursor = assignmentsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
        return;
      }

      // if difficulty is not all then send selected assignments
      const cursor = assignmentsCollection.find(filter);
      const result = await cursor.toArray();
      res.send(result);
      return;
    });
  } finally {
    // nothing
  }
}
run().catch(console.dir);

// testing purpose get request
app.get("/", (req, res) => {
  res.send("zarif says server ok");
});

// listen for the app
app.listen(port);
