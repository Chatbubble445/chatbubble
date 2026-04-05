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

let users = [];
let messages = [];

const upload = multer({ dest: "public/uploads/" });

// Upload API
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const newPath = file.path + ".jpg";

    // image compress
    await sharp(file.path)
      .resize({ width: 400 })
      .jpeg({ quality: 60 })
      .toFile(newPath);

    fs.unlinkSync(file.path);

    res.json({ file: "/" + newPath.replace("public/", "") });

  } catch (e) {
    res.json({ error: "Upload failed" });
  }
});

// SOCKET
io.on("connection", (socket) => {

  socket.on("join", (name) => {
    socket.username = name;
    users.push(name);

    io.emit("users", users);

    messages.push({ system: true, text: name + " joined" });
    if (messages.length > 20) messages.shift();

    io.emit("messages", messages);
  });

  socket.on("send", (msg) => {
    messages.push({ user: socket.username, text: msg });
    if (messages.length > 20) messages.shift();

    io.emit("messages", messages);
  });

  socket.on("file", (url) => {
    messages.push({ user: socket.username, file: url });
    if (messages.length > 20) messages.shift();

    io.emit("messages", messages);
  });

  socket.on("disconnect", () => {
    users = users.filter(u => u !== socket.username);
    io.emit("users", users);
  });

});

server.listen(process.env.PORT || 3000);
