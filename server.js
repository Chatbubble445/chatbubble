const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let users = {};
let messages = [];

io.on("connection", (socket) => {
  users[socket.id] = {
    name: "Guest",
    room: "global"
  };

  socket.on("join", ({ name }) => {
    users[socket.id].name = name || "Guest";
    socket.join("global");

    messages.forEach((m) => {
      if (m.type === "image") {
        socket.emit("image", m);
      } else {
        socket.emit("message", m);
      }
    });

    io.emit("users", users);
    io.emit("system", {
      text: users[socket.id].name + " joined"
    });
  });

  socket.on("message", (msg) => {
    const user = users[socket.id];
    if (!msg || !user) return;

    const data = {
      user: user.name,
      text: msg
    };

    messages.push(data);
    io.emit("message", data);
  });

  socket.on("image", (img) => {
    const user = users[socket.id];
    if (!img || !user) return;

    const data = {
      type: "image",
      user: user.name,
      src: img
    };

    messages.push(data);
    io.emit("image", data);
  });

  socket.on("typing", (name) => {
    socket.broadcast.emit("typing", name);
  });

  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user) {
      io.emit("system", {
        text: user.name + " left"
      });
    }
    delete users[socket.id];
    io.emit("users", users);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
