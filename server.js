const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

let users = {};

/* JOIN */
io.on("connection", (socket) => {

  socket.on("join", (data) => {
    users[socket.id] = { name: data.name };

    io.emit("system", { text: data.name + " joined" });
    io.emit("users", users);
  });

  /* TEXT */
  socket.on("message", (msg) => {
    io.emit("message", {
      user: users[socket.id]?.name,
      text: msg
    });
  });

  /* TYPING */
  socket.on("typing", (name) => {
    socket.broadcast.emit("typing", name);
  });

  /* DISCONNECT */
  socket.on("disconnect", () => {
    if(users[socket.id]){
      io.emit("system", { text: users[socket.id].name + " left" });
      delete users[socket.id];
      io.emit("users", users);
    }
  });

});

/* 🔥 FILE UPLOAD */
app.post("/upload", upload.single("file"), (req, res) => {

  const file = fs.readFileSync(req.file.path);

  const base64 = `data:${req.file.mimetype};base64,${file.toString("base64")}`;

  io.emit("image", {
    user: req.body.user,
    src: base64
  });
