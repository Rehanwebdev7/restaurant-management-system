// Firebase configuration for Cloud Messaging (FCM)
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { FIREBASE_VAPID_KEY } from "../utils/constants";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWMWS7aqICcgGgLZniW19V6Wc76nhIVkQ",
  authDomain: "restms-86a5d.firebaseapp.com",
  projectId: "restms-86a5d",
  storageBucket: "restms-86a5d.firebasestorage.app",
  messagingSenderId: "711098757178",
  appId: "1:711098757178:web:9e50e0d2b49be9fafd8503",
  measurementId: "G-H933LMXXND"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging lazily to avoid unsupported-browser crashes.
let messaging = null;
let messagingInitPromise = null;

const initializeMessaging = async () => {
  if (messaging) return messaging;
  if (messagingInitPromise) return messagingInitPromise;

  messagingInitPromise = (async () => {
    try {
      const supported = await isSupported();
      if (!supported) {
        console.warn("Firebase messaging is not supported in this browser");
        return null;
      }

      messaging = getMessaging(app);
      return messaging;
    } catch (error) {
      console.warn("Firebase messaging not supported:", error);
      return null;
    }
  })();

  return messagingInitPromise;
};

// Get FCM Token
export const getFCMToken = async () => {
  try {
    const messagingInstance = await initializeMessaging();
    if (!messagingInstance) {
      console.warn("Firebase messaging is not initialized");
      return null;
    }

    if (typeof Notification === "undefined") {
      console.warn("Notification API is not available in this browser");
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Notification permission denied");
      return null;
    }

    // Get the FCM token using VAPID key from constants
    const token = await getToken(messagingInstance, {
      vapidKey: FIREBASE_VAPID_KEY
    });

    if (token) {
      console.log("FCM Token:", token);
      return token;
    } else {
      console.warn("No FCM token available");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
};

// Handle foreground messages (Promise - resolves once)
export const onMessageListener = () => {
  return new Promise((resolve) => {
    initializeMessaging().then((messagingInstance) => {
      if (!messagingInstance) {
        console.warn("Firebase messaging is not initialized");
        resolve(null);
        return;
      }

      onMessage(messagingInstance, (payload) => {
        console.log("Foreground message received:", payload);
        resolve(payload);
      });
    }).catch((error) => {
      console.warn("Unable to initialize Firebase messaging:", error);
      resolve(null);
    });
  });
};

// Continuous foreground message listener (callback-based)
export const onForegroundMessage = (callback) => {
  let isActive = true;
  let unsubscribe = () => {};

  initializeMessaging().then((messagingInstance) => {
    if (!isActive || !messagingInstance) {
      if (!messagingInstance) {
        console.warn("Firebase messaging is not initialized");
      }
      return;
    }

    unsubscribe = onMessage(messagingInstance, (payload) => {
      console.log("Foreground message received:", payload);
      callback(payload);
    });
  }).catch((error) => {
    console.warn("Unable to initialize Firebase messaging:", error);
  });

  return () => {
    isActive = false;
    unsubscribe();
  };
};

export { app, messaging };
