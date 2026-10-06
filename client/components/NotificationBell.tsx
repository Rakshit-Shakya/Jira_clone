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

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        axiosInstance.get("/api/notifications"),
        axiosInstance.get("/api/notifications/unread-count"),
      ]);
      setNotifications(notifsRes.data);
      setUnreadCount(countRes.data.count || 0);
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
        className="relative p-2 rounded-full hover:bg-gray-200 text-gray-700 transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 bg-white border border-[#DFE1E6] rounded shadow-xl z-50 p-3">
          <div className="flex items-center justify-between pb-2 mb-2 border-b">
            <span className="font-semibold text-sm text-[#172B4D]">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-[#0052CC] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No notifications yet</p>
            ) : (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                    n.read ? "bg-white text-gray-600" : "bg-blue-50 text-[#172B4D] font-medium"
                  }`}
                >
                  <p>{n.message}</p>
                  <span className="text-[10px] text-gray-400 mt-1 block">
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
