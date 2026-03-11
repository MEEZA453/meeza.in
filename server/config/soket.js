// config/socket.ts
import { Server } from "socket.io";



let io;
export function initSocket(server) {
  io = new Server(server, { cors: { origin: process.env.CLIENT_URL } });
  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    socket.on("joinUserRoom", ({ userId }) => {
      if (!userId) return;
      const room = `user:${userId}`;
      socket.join(room);
    });

    socket.on("joinPostRoom", ({ postId }) => {
      if (!postId) return;
      socket.join(`post:${postId}`);
      console.log('secket oined ', postId)
    });

    socket.on("disconnect", () => {});
  });

  return io;
}

export { io };
