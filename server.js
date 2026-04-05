const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer");
const fs = require("fs");
const sharp = require("sharp");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

let users = [];
let messages = [];

const storage = multer.diskStorage({
  destination: "public/uploads/",
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, Date.now() + "." + ext);
  }
});

const upload = multer({ storage });

// 🔥 FILE UPLOAD
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    let file = req.file;
    let ext = file.filename.split(".").pop().toLowerCase();

    // GIF no compression
    if (ext === "gif") {
      return res.json({ file: "/uploads/" + file.filename });
    }

    // Image compress
    const newPath = "public/uploads/compress-" + file.filename + ".jpg";

    await sharp(file.path)
      .resize({ width: 400 })
      .jpeg({ quality: 60 })
      .toFile(newPath);

    fs.unlinkSync(file.path);

    res.json({
      file: "/" + newPath.replace("public/", "")
    });

  } catch {
    res.status(500).send("Upload error");
  }
});

// 🔥 SOCKET
io.on("connection", (socket) => {

  socket.on("join", (name) => {
    socket.username = name;

    if (!users.includes(name)) users.push(name);

    io.emit("users", users);

    // send old messages
    socket.emit("messages", messages);

    // join msg
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
