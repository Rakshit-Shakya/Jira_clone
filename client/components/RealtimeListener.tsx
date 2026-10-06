"use client";

import { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@/lib/AuthContext";

export default function RealtimeListener() {
  const { user, selectedProject } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !user) return;

    const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const socket = new SockJS(`${baseURL}/ws?token=${token}`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      reconnectDelay: 5000,
    });

    stompClient.onConnect = () => {
      stompClient.subscribe(`/topic/user/${user.id}/notifications`, (message) => {
        try {
          const notification = JSON.parse(message.body);
          window.dispatchEvent(new CustomEvent("jira-notification", { detail: notification }));
        } catch (e) {
          console.error(e);
        }
      });

      if (selectedProject?.id) {
        stompClient.subscribe(`/topic/project/${selectedProject.id}`, (message) => {
          try {
            const event = JSON.parse(message.body);
            window.dispatchEvent(new CustomEvent("jira-project-event", { detail: event }));
          } catch (e) {
            console.error(e);
          }
        });
      }
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [user, selectedProject?.id]);

  return null;
}
