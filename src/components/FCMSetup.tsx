
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db, app as firebaseApp, isFirebaseConfigured } from '@/lib/firebase';
import { toast } from 'sonner';

export default function FCMSetup({ userId }: { userId: string }) {
  useEffect(() => {
    if (!isFirebaseConfigured || typeof window === 'undefined') return;

    const requestFCMToken = async () => {
      try {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            const messaging = getMessaging(firebaseApp);
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            
            if (!vapidKey) {
                console.error("VAPID key is not configured in .env file.");
                return;
            }

            const token = await getToken(messaging, { vapidKey: vapidKey });
            
            if (token) {
              await setDoc(doc(db, "fcmTokens", token), { userId }, { merge: true });
              console.log("FCM Token saved:", token);

              // Handle foreground messages
              onMessage(messaging, (payload) => {
                  console.log('Message received. ', payload);
                  toast.info(payload.notification?.title, {
                    description: payload.notification?.body,
                  });
              });

            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          } else {
            console.log('Unable to get permission to notify.');
          }
        }
      } catch (err) {
        console.error("An error occurred while retrieving token. ", err);
      }
    };

    requestFCMToken();
  }, [userId]);

  return null; // This component doesn't render anything
}
