/* FCM service worker — fill in the web config after the Firebase project exists. */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
// firebase.initializeApp({ apiKey:'', authDomain:'', projectId:'', storageBucket:'', messagingSenderId:'', appId:'' });
// const messaging = firebase.messaging();
// messaging.onBackgroundMessage((p) => self.registration.showNotification((p.notification||{}).title||'Mike’s Nutrition', { body:(p.notification||{}).body||'', icon:'/icon-192.png', data:{ url:(p.data||{}).url||'/' } }));
self.addEventListener('notificationclick', (e) => { e.notification.close(); e.waitUntil(clients.openWindow((e.notification.data&&e.notification.data.url)||'/')); });
