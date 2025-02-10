import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertMessageSchema } from "@shared/schema";

type WSMessage = {
  type: "message" | "online_status";
  payload: any;
};

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/messages/:roomId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessagesByRoom(req.params.roomId);
    res.json(messages);
  });

  app.get("/api/users/online", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const users = await storage.getOnlineUsers();
    res.json(users);
  });

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws, req) => {
    const session = (req as any).session;
    if (!session?.passport?.user) {
      ws.close();
      return;
    }

    const userId = session.passport.user;
    clients.set(userId, ws);

    ws.on("message", async (data) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        if (message.type === "message") {
          const parsed = insertMessageSchema.safeParse(message.payload);
          if (!parsed.success) return;

          const savedMessage = await storage.createMessage({
            ...parsed.data,
            senderId: userId,
          });

          const broadcast = JSON.stringify({
            type: "message",
            payload: savedMessage,
          });

          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcast);
            }
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", async () => {
      clients.delete(userId);
      await storage.updateUserOnlineStatus(userId, false);
      const broadcast = JSON.stringify({
        type: "online_status",
        payload: { userId, isOnline: false },
      });
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcast);
        }
      });
    });
  });

  return httpServer;
}
