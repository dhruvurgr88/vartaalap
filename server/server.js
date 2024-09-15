const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const socketIo = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 5000;

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// CORS middleware setup
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
let waitingUser = null;
// Socket connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  const userIp = socket.handshake.address;
  console.log(`user ip is ${userIp}`);

  if (waitingUser) {
    // Connect waitingUser with new user
    socket.emit("match", waitingUser.id);
    waitingUser.emit("match", socket.id);
    waitingUser = null;
  } else {
    // Set the new user as waiting
    waitingUser = socket;
  }

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Reset waitingUser if they disconnect
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });

  // Handle messages sent between users
  socket.on("sendMessage", ({ message, to }) => {
    io.to(to).emit("receiveMessage", { message, from: socket.id });
  });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
