"use client";

import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import axiosInstance from "@/lib/Axiosinstance";
import { useAuth } from "@/lib/AuthContext";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        axiosInstance.get("/api/notifications"),
        axiosInstance.get("/api/notifications/unread-count"),
      ]);
      const newCount = countRes.data.count || 0;
      if (newCount > unreadCount) {
        setHasNew(true);
        setTimeout(() => setHasNew(false), 3000);
      }
      setNotifications(notifsRes.data);
      setUnreadCount(newCount);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    
    const handleWebSocketNotification = (e: any) => {
      fetchNotifications();
    };
    window.addEventListener("jira-notification", handleWebSocketNotification);

    return () => {
      clearInterval(interval);
      window.removeEventListener("jira-notification", handleWebSocketNotification);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await axiosInstance.put(`/api/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.put("/api/notifications/read-all");
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 hover:bg-secondary text-muted-foreground hover:text-foreground ${
          hasNew ? "animate-bounce text-primary" : ""
        }`}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-popover border border-border rounded-2xl shadow-xl z-50 p-4 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/60">
            <span className="font-semibold text-xs uppercase tracking-wider text-card-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary font-medium hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No notifications yet</p>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                    n.read
                      ? "bg-secondary/40 text-muted-foreground hover:bg-secondary"
                      : "bg-primary/10 text-card-foreground font-medium border border-primary/20"
                  }`}
                >
                  <p className="leading-snug">{n.message}</p>
                  <span className="text-[10px] text-muted-foreground mt-1.5 block">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
