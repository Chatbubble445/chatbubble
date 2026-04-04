const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let users = {};

io.on("connection", (socket) => {

  socket.on("join", ({ name }) => {
    users[socket.id] = { name };

    io.emit("system", { text: name + " joined" });
    io.emit("users", users);
  });

  socket.on("message", (msg) => {
    const user = users[socket.id];
    if (!user) return;

    io.emit("message", {
      user: user.name,
      text: msg
    });
  });

  socket.on("image", (img) => {
    const user = users[socket.id];
    if (!user) return;

    io.emit("image", {
      user: user.name,
      src: img
    });
  });

  socket.on("disconnect", () => {
    if (users[socket.id]) {
      io.emit("system", {
        text: users[socket.id].name + " left"
      });
    }
    delete users[socket.id];
    io.emit("users", users);
  });

});

server.listen(process.env.PORT || 3000);
