const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// ===== Upload config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// ===== Upload API =====
app.post("/upload", (req, res) => {
  upload.single("file")(req, res, function (err) {
    if (err || !req.file) {
      return res.status(400).json({ error: "Upload failed" });
    }
    res.json({ url: "/uploads/" + req.file.filename });
  });
});

// ===== Chat =====
let users = {};
let messages = [];

io.on("connection", (socket) => {

  socket.on("join", (name) => {
    users[socket.id] = name;

    socket.emit("oldMessages", messages);
    io.emit("users", Object.values(users));
    io.emit("system", `${name} joined`);
  });

  socket.on("sendMessage", (data) => {
    const msg = {
      user: users[socket.id],
      ...data
    };

    messages.push(msg);

    // only last 20 messages
    if (messages.length > 20) messages.shift();

    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    const name = users[socket.id];
    delete users[socket.id];

    io.emit("users", Object.values(users));
    io.emit("system", `${name} left`);
  });

});

server.listen(3000, () => console.log("Server running"));
