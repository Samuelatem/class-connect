import { users, messages, type User, type Message, type InsertUser, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void>;
  getOnlineUsers(): Promise<User[]>;
  createMessage(message: InsertMessage & { senderId: number }): Promise<Message>;
  getMessagesByRoom(roomId: string): Promise<Message[]>;
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await db.update(users)
      .set({ isOnline })
      .where(eq(users.id, userId));
  }

  async getOnlineUsers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.isOnline, true));
  }

  async createMessage(message: InsertMessage & { senderId: number }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesByRoom(roomId: string): Promise<Message[]> {
    return db.select()
      .from(messages)
      .where(eq(messages.roomId, roomId))
      .orderBy(messages.createdAt);
  }
}

export const storage = new DatabaseStorage();