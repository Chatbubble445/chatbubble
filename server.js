const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

let users = [];
let messages = []; // last 20 only

// ===== Upload Setup =====
const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// ===== Upload API =====
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: "/uploads/" + req.file.filename });
});

// ===== Socket =====
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

// ===== PORT FIX =====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running " + PORT));
