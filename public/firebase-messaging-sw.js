importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// IMPORTANT: You MUST hardcode your Firebase config here.
// Env vars DO NOT work inside service workers.

firebase.initializeApp({
  apiKey: "AIzaSyC42t-5F2ex-YkHa5l7eP0uxZpf3weG6PI",
  authDomain: "meet-project-da39a.firebaseapp.com",
  projectId: "meet-project-da39a",
  messagingSenderId: "279122890348",
  appId: "1:279122890348:web:e026e52e9d6bb5eb2b1249",
});

// Initialize messaging
const messaging = firebase.messaging();

// Handle background push
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "New Notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon.png", // optional
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
