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

// ===== Multer setup =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ===== Upload API =====
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ url: "/uploads/" + req.file.filename });
});

// ===== Chat logic =====
let users = {};
let messages = [];

io.on("connection", (socket) => {
  socket.on("join", (name) => {
    users[socket.id] = name;

    io.emit("system", `${name} joined`);
    io.emit("users", Object.values(users));
    socket.emit("oldMessages", messages);
  });

  socket.on("sendMessage", (data) => {
    const msg = {
      user: users[socket.id],
      ...data,
    };

    messages.push(msg);

    // only last 20 messages
    if (messages.length > 20) messages.shift();

    io.emit("message", msg);
  });

  socket.on("disconnect", () => {
    const name = users[socket.id];
    delete users[socket.id];

    io.emit("system", `${name} left`);
    io.emit("users", Object.values(users));
  });
});

server.listen(3000, () => console.log("Server running on 3000"));
