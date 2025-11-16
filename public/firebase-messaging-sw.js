// Service worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js')


firebase.initializeApp({
apiKey: self.__FIREBASE_CONFIG__?.apiKey || 'FIREBASE_API_KEY',
authDomain: self.__FIREBASE_CONFIG__?.authDomain || 'FIREBASE_AUTH_DOMAIN',
projectId: self.__FIREBASE_CONFIG__?.projectId || 'FIREBASE_PROJECT_ID',
messagingSenderId: self.__FIREBASE_CONFIG__?.messagingSenderId || 'FIREBASE_SENDER_ID',
appId: self.__FIREBASE_CONFIG__?.appId || 'FIREBASE_APP_ID'
})


const messaging = firebase.messaging()


messaging.onBackgroundMessage(function(payload) {
const title = payload.notification?.title || 'Notification'
const options = {
body: payload.notification?.body,
data: payload.data,
}
self.registration.showNotification(title, options)
})