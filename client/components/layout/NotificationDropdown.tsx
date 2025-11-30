'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notification.service';
import Link from 'next/link';

export function NotificationDropdown() {
  const { unreadCount } = useNotifications();

  const { data: recentNotifications } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: () => notificationService.getNotifications({ limit: 5 }),
  });

  const notifications = recentNotifications?.data?.notifications || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem key={notification.id} asChild>
                  <Link href="/notifications" className="block p-2 hover:bg-accent rounded">
                    <div className="flex items-start gap-2">
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </div>
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full text-center">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

