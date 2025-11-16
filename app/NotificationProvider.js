'use client'

import { useEffect } from "react";
import { messaging } from "../firebase/clientApp";
import { getToken, onMessage } from "firebase/messaging";

export default function NotificationProvider() {

  useEffect(() => {
    if (!messaging) return;

    Notification.requestPermission().then(async (perm) => {
      if (perm !== "granted") return;

      try {
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });

        console.log("FCM Token:", token);

      } catch (err) {
        console.error("Token error:", err);
      }
    });

    // Foreground notifications
    onMessage(messaging, (payload) => {
      console.log("Foreground notification:", payload);

      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/icon.png"
      });
    });

  }, []);

  return null;
}
