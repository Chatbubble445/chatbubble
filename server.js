const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

let users = {};
let messages = [];
let dmMessages = {};

const upload = multer({ dest: "public/uploads/" });

// 🔥 UPLOAD FIXED
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    let file = req.file;
    let ext = file.originalname.split(".").pop().toLowerCase();

    // GIF direct
    if (ext === "gif") {
      return res.json({ url: "/" + file.path.replace("public/", "") });
    }

    // IMAGE COMPRESS
    let newPath = file.path + ".jpg";

    await sharp(file.path)
      .resize({ width: 400 })
      .jpeg({ quality: 60 })
      .toFile(newPath);

    fs.unlinkSync(file.path);

    res.json({ url: "/" + newPath.replace("public/", "") });

  } catch {
    res.status(500).send("upload error");
  }
});

// 🔥 SOCKET FIXED
io.on("connection", (socket) => {

  socket.on("join", (name) => {
    socket.username = name;
    users[socket.id] = name;

    io.emit("users", Object.values(users));
    socket.emit("messages", messages);
  });

  socket.on("message", (msg) => {
    if (!msg) return;

    messages.push({ user: socket.username, text: msg });
    if (messages.length > 20) messages.shift();

    io.emit("messages", messages);
  });

  socket.on("file", (url) => {
    messages.push({ user: socket.username, file: url });
    if (messages.length > 20) messages.shift();

    io.emit("messages", messages);
  });

  // DM FIXED
  socket.on("dm", ({ to, text }) => {
    if (!text) return;

    let room = [socket.username, to].sort().join("-");
    if (!dmMessages[room]) dmMessages[room] = [];

    let msg = { from: socket.username, text };

    dmMessages[room].push(msg);

    io.emit("dm", { room, msg });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("users", Object.values(users));
  });

});

server.listen(process.env.PORT || 3000);
