import { User } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type UserListProps = {
  users: User[];
};

export function UserList({ users }: UserListProps) {
  return (
    <ScrollArea className="w-64 border-l">
      <div className="p-4">
        <h2 className="font-semibold mb-4">Online Users</h2>
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate">{user.username}</span>
              {user.isOnline && (
                <Badge variant="secondary" className="h-2 w-2 rounded-full bg-green-500" />
              )}
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
