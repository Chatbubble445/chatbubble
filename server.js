const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let users = {};
let lastMessages = {};

function getRank(time){
    if(time > 20000) return "💎 Diamond";
    if(time > 10000) return "🥇 Gold";
    if(time > 5000) return "🥈 Silver";
    return "🥉 Bronze";
}

io.on("connection", (socket) => {

    users[socket.id] = {
        name: "User" + Math.floor(Math.random()*10000),
        time: 0,
        room: "global"
    };

    // time tracking
    setInterval(() => {
        if(users[socket.id]){
            users[socket.id].time += 60;
        }
    }, 60000);

    socket.on("join", ({name, room}) => {
        users[socket.id].name = name || users[socket.id].name;
        users[socket.id].room = room;

        socket.join(room);

        io.emit("users", users);
    });

    socket.on("message", (msg) => {
        const user = users[socket.id];

        // spam control
        if(!msg || msg === lastMessages[socket.id]) return;
        lastMessages[socket.id] = msg;

        io.to(user.room).emit("message", {
            user: user.name,
            rank: getRank(user.time),
            text: msg
        });
    });

    socket.on("disconnect", () => {
        delete users[socket.id];
        io.emit("users", users);
    });

});

const PORT = process.env.PORT || 3000;
server.listen(PORT);
