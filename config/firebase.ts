import { initializeApp, getApps } from "firebase/app";
import { getAuth, getReactNativePersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { getDatabase, ref, set, push, remove, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth } from 'firebase/auth';

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


// Initialize Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
console.log("Firebase initialized successfully");

// Initialize Firebase Auth with React Native persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const database = getDatabase(app);
console.log('Auth initialized successfully');
console.log('Database initialized successfully');

export { 
  auth, 
  database,
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
  equalTo
};