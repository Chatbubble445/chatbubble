const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));

let users = {};
let lastMessage = {};
let messages = [];

// 🏆 Rank
function getRank(time){
    if(time > 20000) return "💎 Diamond";
    if(time > 10000) return "🥇 Gold";
    if(time > 5000) return "🥈 Silver";
    return "🥉 Bronze";
}

io.on("connection", (socket) => {

    users[socket.id] = {
        name: "Guest" + Math.floor(Math.random()*10000),
        time: 0,
        room: "global"
    };

    const interval = setInterval(() => {
        if(users[socket.id]){
            users[socket.id].time += 60;
        }
    }, 60000);

    // JOIN
    socket.on("join", ({name, room}) => {

        if(name) users[socket.id].name = name;
        if(room) users[socket.id].room = room;

        socket.join(room);

        // 🔥 SEND OLD MESSAGES
        messages.forEach(msg => {
            if(msg.type === "image"){
                socket.emit("image", msg);
            } else {
                socket.emit("message", msg);
            }
        });

        // JOIN MSG
        io.to(room).emit("system", {
            text: "🟢 " + users[socket.id].name + " joined the room"
        });

        io.emit("users", users);
    });

    // MESSAGE
    socket.on("message", (msg) => {
        const user = users[socket.id];
        if(!msg || msg === lastMessage[socket.id]) return;

        lastMessage[socket.id] = msg;

        const data = {
            user: user.name,
            rank: getRank(user.time),
            text: msg
        };

        messages.push(data);

        io.to(user.room).emit("message", data);
    });

    // IMAGE
    socket.on("image", (img) => {
        const user = users[socket.id];

        const data = {
            type:"image",
            user: user.name,
            src: img
        };

        messages.push(data);

        io.to(user.room).emit("image", data);
    });

    // DISCONNECT
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
server.listen(PORT);
