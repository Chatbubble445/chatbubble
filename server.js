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
        io.emit("users", users);
    });

    socket.on("message", (msg) => {
        io.emit("message", {
            user: users[socket.id],
            text: msg
        });
    });

    // 🔥 PRIVATE CHAT
    socket.on("privateMessage", ({to, message}) => {
        io.to(to).emit("privateMessage", {
            user: users[socket.id],
            text: message
        });
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("users", users);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
