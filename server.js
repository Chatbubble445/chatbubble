const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let users = {};

io.on("connection", (socket) => {
    socket.on("join", (username) => {
        users[socket.id] = username;
        io.emit("users", Object.values(users));
    });

    socket.on("message", (msg) => {
        io.emit("message", {
            user: users[socket.id],
            text: msg
        });
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("users", Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
