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

    // JOIN
    socket.on("join", ({name}) => {
        users[socket.id].name = name || "Guest";
        socket.join("global");

        // send old messages
        messages.forEach(m => socket.emit("message", m));

        io.emit("users", users);

        io.emit("system", {
            text: "🟢 " + name + " joined"
        });
    });

    // GLOBAL MESSAGE
    socket.on("message", (msg) => {
        const user = users[socket.id];

        const data = {
            user: user.name,
            text: msg
        };

        messages.push(data);
        io.emit("message", data);
    });

    // 🔥 PRIVATE MESSAGE
    socket.on("dm", ({to, msg}) => {
        const fromUser = users[socket.id];

        io.to(to).emit("dm", {
            from: fromUser.name,
            text: msg
        });

        socket.emit("dm", {
            from: "You",
            text: msg
        });
    });

    socket.on("disconnect", () => {
        const user = users[socket.id];

        if(user){
            io.emit("system", {
                text: "🔴 " + user.name + " left"
            });
        }

        delete users[socket.id];
        io.emit("users", users);
    });

});

server.listen(process.env.PORT || 3000);
