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
const { MongoClient, ServerApiVersion } = require("mongodb");

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

async function run() {
  try {
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

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
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// testing purpose get request
app.get("/", (req, res) => {
  res.send("server ok");
});

// listen for the app
app.listen(port, () => {
  console.log(port);
});
