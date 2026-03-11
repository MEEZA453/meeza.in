import { Server } from "socket.io";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL }
  });

  io.on("connection", (socket) => {
    console.log("🔌 socket connected:", socket.id);

    socket.on("joinUserRoom", ({ userId }) => {
      const room = `user:${userId}`;
      socket.join(room);
      console.log("👤 joined", room);
    });

    socket.on("joinPostRoom", ({ postId }) => {
      const room = `post:${postId}`;
      socket.join(room);
      console.log("📦 joined", room);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}