import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  initializeAuth // Only needed if initializing auth with custom persistence
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  push,
  remove,
  onValue,
  off,
  query,
  orderByChild,
  equalTo,
  update,
  runTransaction,
} from 'firebase/database';

// ⚠️ IMPORTANT: You must import 'Platform' from 'react-native' for the platform check
// Assuming this project is based on Expo/React Native, this import should exist.
import { Platform } from 'react-native'; 
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyDLgZUNjGOqdKQRJ0u6Cnc2-dS0XjhQg-g",
  authDomain: "scottytasks.firebaseapp.com",
  databaseURL: "https://scottytasks-default-rtdb.firebaseio.com/",
  projectId: "scottytasks",
  storageBucket: "scottytasks.firebasestorage.app",
  messagingSenderId: "166161287009",
  appId: "1:166161287009:web:23826e2e57ce0c7b646720",
  measurementId: "G-WTJRJG0MWW"
};


// 1. Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
console.log("Firebase initialized successfully");

// 2. Conditionally Determine Persistence based on platform
let authInstance;

if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    authInstance = getAuth(app);
  }
}

// 3. Initialize Firebase Auth with the determined persistence method
export const auth = authInstance;

export const database = getDatabase(app);

// Re-export all other functions you were trying to import
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile,
  ref, 
  set, 
  push, 
  remove, 
  onValue, 
  off, 
  query, 
  orderByChild, 
  equalTo,
  update,
  runTransaction,
};
