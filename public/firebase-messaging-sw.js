
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: self.location.search.split('apiKey=')[1].split('&')[0],
  authDomain: self.location.search.split('authDomain=')[1].split('&')[0],
  projectId: self.location.search.split('projectId=')[1].split('&')[0],
  storageBucket: self.location.search.split('storageBucket=')[1].split('&')[0],
  messagingSenderId: self.location.search.split('messagingSenderId=')[1].split('&')[0],
  appId: self.location.search.split('appId=')[1].split('&')[0],
  measurementId: self.location.search.split('measurementId=')[1].split('&')[0],
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/app-logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
