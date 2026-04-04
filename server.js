const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*"
    }
});

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

    console.log("User connected:", socket.id);

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

    // 🔗 Join room
    socket.on("join", ({name, room}) => {

        if(name) users[socket.id].name = name;
        if(room) users[socket.id].room = room;

        socket.join(room);

        io.emit("users", users);
    });

    // 💬 Text message
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

    // 🖼️ Image / GIF
    socket.on("image", (img) => {
        const user = users[socket.id];
        if(!user) return;

        io.to(user.room).emit("image", {
            user: user.name,
            src: img
        });
    });

    // ❌ Disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

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
