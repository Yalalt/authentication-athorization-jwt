const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Users = require("./models/Users.js");
const cors = require("cors");
const auth = require("./middleware/auth.js");

const PORT = 8080;
const MONGO_CONNECTION_URI =
  "mongodb+srv://aqua2022yalaltgandush:t7Zg4gQrdwhd75BG@cluster0.uqiga9k.mongodb.net/test";

mongoose
  .connect(MONGO_CONNECTION_URI)
  .then(() => console.log("Database connected successfully"))
  .catch((error) => console.log(error));

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (request, response) => {
  response.json({
    data: [],
  });
});

// register endpoint here
app.post("/register", async (req, res) => {
  const data = req.body;
  if (data) {
    const oldUser = await Users.findOne({ email: data.email });

    if (oldUser) {
      return res.status(400).json({
        success: false,
        status: "Хэрэглэгч аль хэдийн үүссэн байна. Нэвтэрч орно уу.",
      });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    data.password = hashedPassword;

    Users.create(data)
      .then((data) => {
        res.status(201).json({
          message: "Хэрэглэгч амжилттай үүслээ",
          data,
        });
        return;
      })
      .catch((error) => {
        res.status(500).json({
          success: false,
          error: error,
        });
      });
  } else {
    return res.json({
      error: "Нууц үгээ оруулаагүй байна.",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res.status(400).res.json({
        success: false,
        status: "Утгуудаа бүрэн оруулна уу.",
        updated: 1,
        email: email,
        password: password,
      });
      return;
    }
    const user = await Users.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { user_id: user._id, email },
        "MySuperDuperPrivateKey",
        {
          expiresIn: "2h",
        }
      );

      res.status(200).json({
        success: true,
        status: "Амжилттай нэвтэрлээ",
        data: user,
        token: token,
      });
      return;
    }

    res.status(400).json({
      success: false,
      status: "Нууц үг нэр хоорондоо таарахгүй байна.",
    });
    return;
  } catch (err) {
    console.log(err);
  }
});

app.post("/protected", auth, (req, res, next) => {
  res.status(200).json({
    data: "successful got the protected route",
  });
});

app.post("/unprotected", (req, res, next) => {
  res.status(200).json({
    data: "successful got the unprotected route",
  });
});

app.listen(PORT, () => {
  mongoose
    .connect(MONGO_CONNECTION_URI)
    .then(() => console.log("database MongoDB connected successfully"))
    .catch((error) => console.error(error));

  console.log(`Express Application is running on http://localhost:${PORT}`);
});
