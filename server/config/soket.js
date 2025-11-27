// utils/socket.ts
import { io, Socket } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket && typeof window !== "undefined") {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080", {
      // optional: pass auth token for server-side verification
      // auth: { token: localStorage.getItem('token') }
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socket;
};
