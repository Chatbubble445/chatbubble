const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");
const compression = require("compression");

const app = express();
app.use(compression());

const server = http.createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  cors: { origin: "*" }
});

/* STATIC */
app.use(express.static("public"));

/* USERS */
let users = {};

/* FILE UPLOAD SETUP */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.random();
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* UPLOAD ROUTE */
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    const fileUrl = "/uploads/" + req.file.filename;

    io.emit("image", {
      user: req.body.user,
      src: fileUrl
    });

    res.sendStatus(200);
  } catch (e) {
    console.log("Upload error:", e);
    res.sendStatus(500);
  }
});

/* SOCKET */
io.on("connection", (socket) => {

  socket.on("join", (data) => {
    users[socket.id] = { name: data.name };

    io.emit("system", {
      text: data.name + " joined the room"
    });

    io.emit("users", users);
  });

  socket.on("message", (msg) => {
    if (!users[socket.id]) return;

    io.emit("message", {
      user: users[socket.id].name,
      text: msg
    });
  });

  socket.on("disconnect", () => {
    if (!users[socket.id]) return;

    io.emit("system", {
      text: users[socket.id].name + " left"
    });

    delete users[socket.id];
    io.emit("users", users);
  });

});

/* PORT (IMPORTANT) */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
