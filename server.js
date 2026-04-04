const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let users = {};
let lastMessage = {};

// 🏆 Rank system
function getRank(time){
    if(time > 20000) return "💎 Diamond";
    if(time > 10000) return "🥇 Gold";
    if(time > 5000) return "🥈 Silver";
    return "🥉 Bronze";
}

io.on("connection", (socket) => {

    // Default user
    users[socket.id] = {
        name: "Guest" + Math.floor(Math.random()*10000),
        time: 0,
        room: "global"
    };

    // ⏱️ Time tracking
    const interval = setInterval(() => {
        if(users[socket.id]){
            users[socket.id].time += 60;
        }
    }, 60000);

    // 🔗 JOIN ROOM
    socket.on("join", ({name, room}) => {

        if(name) users[socket.id].name = name;
        if(room) users[socket.id].room = room;

        socket.join(room);

        // 🔥 JOIN MESSAGE
        io.to(room).emit("system", {
            text: "🟢 " + users[socket.id].name + " joined the room"
        });

        io.emit("users", users);
    });

    // 💬 TEXT MESSAGE
    socket.on("message", (msg) => {
        const user = users[socket.id];
        if(!user) return;

        // 🚫 Spam protection
        if(!msg || msg === lastMessage[socket.id]) return;
        lastMessage[socket.id] = msg;

        io.to(user.room).emit("message", {
            user: user.name,
            rank: getRank(user.time),
            text: msg
        });
    });

    // 🖼️ IMAGE / GIF
    socket.on("image", (img) => {
        const user = users[socket.id];
        if(!user) return;

        io.to(user.room).emit("image", {
            user: user.name,
            src: img
        });
    });

    // ❌ DISCONNECT
    socket.on("disconnect", () => {
        const user = users[socket.id];

        if(user){
            io.to(user.room).emit("system", {
                text: "🔴 " + user.name + " left the room"
            });
        }

        clearInterval(interval);
        delete users[socket.id];
        delete lastMessage[socket.id];

        io.emit("users", users);
    });

});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
