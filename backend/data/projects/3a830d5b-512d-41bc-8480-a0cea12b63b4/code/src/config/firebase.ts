import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// If using Expo, you can access config from app.json
// import Constants from 'expo-constants';

// Firebase configuration object.
// IMPORTANT: Replace these placeholder values with your actual Firebase project credentials.
// It's highly recommended to use environment variables or a secure configuration management
// system for sensitive data like API keys, especially in production.
// For Expo, you can define these in your app.json under 'extra'.
const firebaseConfig = {
  // apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  // authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  // projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  // storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  // messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  // appId: Constants.expoConfig?.extra?.firebaseAppId,

  // Replace with your actual Firebase project credentials:
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_FIREBASE_AUTH_DOMAIN',
  projectId: 'YOUR_FIREBASE_PROJECT_ID',
  storageBucket: 'YOUR_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'YOUR_FIREBASE_APP_ID',
};

// Initialize Firebase application
const app = initializeApp(firebaseConfig);

// Get Firebase Authentication instance
const auth = getAuth(app);

// Get Firestore instance
const db = getFirestore(app);

// Export the initialized services
export { app, auth, db };
