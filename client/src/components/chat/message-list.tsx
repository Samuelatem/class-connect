import { useEffect, useRef } from "react";
import { Message, User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";

type MessageListProps = {
  messages: Message[];
  users: Map<number, User>;
  currentUserId: number;
};

export function MessageList({ messages, users, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea ref={scrollRef} className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUserId;
          const user = users.get(message.senderId);

          return (
            <div
              key={message.id}
              className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user?.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isOwn
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{user?.username}</span>
                  <span className="text-xs opacity-70">
                    {format(new Date(message.createdAt), "HH:mm")}
                  </span>
                </div>
                <p className="mt-1">{message.content}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
