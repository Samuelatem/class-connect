import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Message, User } from "@shared/schema";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { UserList } from "./user-list";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";

const GENERAL_ROOM = "general";

export function ChatRoom() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<Map<number, User>>(new Map());

  const { data: initialMessages } = useQuery<Message[]>({
    queryKey: [`/api/messages/${GENERAL_ROOM}`],
  });

  const { data: onlineUsers } = useQuery<User[]>({
    queryKey: ["/api/users/online"],
  });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (onlineUsers) {
      setUsers(new Map(onlineUsers.map(user => [user.id, user])));
    }
  }, [onlineUsers]);

  const sendMessage = useWebSocket((message) => {
    if (message.type === "message") {
      setMessages(prev => [...prev, message.payload]);
    } else if (message.type === "online_status") {
      const { userId, isOnline } = message.payload;
      setUsers(prev => {
        const next = new Map(prev);
        const user = next.get(userId);
        if (user) {
          next.set(userId, { ...user, isOnline });
        }
        return next;
      });
    }
  });

  const handleSendMessage = (content: string) => {
    sendMessage({
      type: "message",
      payload: {
        content,
        roomId: GENERAL_ROOM,
      },
    });
  };

  if (!user) return null;

  return (
    <Card className="flex h-[calc(100vh-2rem)] m-4">
      <div className="flex-1 flex flex-col">
        <MessageList
          messages={messages}
          users={users}
          currentUserId={user.id}
        />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      <UserList users={Array.from(users.values())} />
    </Card>
  );
}
