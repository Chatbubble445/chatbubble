import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// MongoDB connection (Yahan apna Atlas link daalein)
mongoose.connect("YOUR_MONGODB_URI_HERE")
  .then(() => console.log("Database Connected ✅"))
  .catch(err => console.log(err));

io.on('connection', (socket) => {
  socket.on('send_message', (data) => {
    io.emit('receive_message', data); // Sabko message dikhao
  });
});

server.listen(3001, () => console.log("Server running on port 3001"));
