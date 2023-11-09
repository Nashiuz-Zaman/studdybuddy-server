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
    // collections
    const assignmentsCollection = client
      .db("assignment11")
      .collection("assignments");

    const submittedAssignmentsCollection = client
      .db("assignment11")
      .collection("submittedAssignments");

    // api for creating a jwt token when user has logged in
    app.post("/jwt", async (req, res) => {
      // step 1: get user email from request body
      const userInformation = req.body;

      // create jwt token with secret
      const token = jwt.sign(userInformation, process.env.JWT_secret, {
        expiresIn: "2hr",
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

    // api for getting only one assignment's data
    app.get("/assignments/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const result = await assignmentsCollection.findOne(filter);
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

    // api for checking if one user is requesting to update other user's assignment
    app.post("/assignments/can-update", verifyToken, async (req, res) => {
      // step 1 find out who is requesting
      const requestingUser = req.decodedUser.email;
      // step 2 extract email for the document
      const email = req.body.email;
      // step 3 check if the emails are same
      if (requestingUser !== email) {
        res.status(403).send({ wrongUser: true });
        return;
      }

      // if emails match give permission to proceed to the update page
      res.send({ canProceed: true });
    });

    // api for checking if one user is requesting to deleted other user's assignment

    app.post("/assignments/can-delete", verifyToken, async (req, res) => {
      // step 1 find out who is requesting
      const requestingUser = req.decodedUser.email;
      // step 2 extract email for the document
      const email = req.body.email;
      // step 3 check if the emails are same
      if (requestingUser !== email) {
        res.status(403).send({ wrongUser: true });
        return;
      }

      // if emails match give permission to proceed to the update page
      res.send({ canProceed: true });
    });

    // api for updating assignment
    app.put("/assignments/:id/update", async (req, res) => {
      const id = req.params.id;
      const dataToUpdateWith = req.body;
      const filter = { _id: new ObjectId(id) };
      const updatedAssignment = { $set: { ...dataToUpdateWith } };
      const result = await assignmentsCollection.updateOne(
        filter,
        updatedAssignment
      );
      res.send(result);
    });

    // api for deleting assignment
    app.delete("/assignments/:id/delete", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };

      const result = await assignmentsCollection.deleteOne(query);
      res.send(result);
    });

    // api for creating submittedAssignments
    app.post("/assignments/:id/submit", async (req, res) => {
      const submittedAssignment = req.body;
      const result = await submittedAssignmentsCollection.insertOne(
        submittedAssignment
      );

      res.send(result);
    });

    // api for getting one user's own submitted assignments (submitted ones)
    app.post("/submitted-assignments/self", async (req, res) => {
      const userEmail = req.body.email;
      const filter = { examineeEmail: userEmail };
      const cursor = submittedAssignmentsCollection.find(filter);
      const result = await cursor.toArray();
      console.log(result);
      res.send(result);
    });

    // api for getting all submitted assignments (pending)
    app.get("/submitted-assignments/pending", async (req, res) => {
      const filter = { status: "pending" };
      const cursor = submittedAssignmentsCollection.find(filter);
      const result = await cursor.toArray();
      res.send(result);
    });

    // // api for giving marks to the submitted assignment
    // app.put()
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
