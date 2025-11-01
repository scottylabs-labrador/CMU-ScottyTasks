import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDLgZUNjGOqdKQRJ0u6Cnc2-dS0XjhQg-g",
  authDomain: "scottytasks.firebaseapp.com",
  projectId: "scottytasks",
  storageBucket: "scottytasks.firebasestorage.app",
  messagingSenderId: "166161287009",
  appId: "1:166161287009:web:23826e2e57ce0c7b646720",
  measurementId: "G-WTJRJG0MWW"
};

const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully');

const auth = getAuth(app);
console.log('Auth initialized successfully');

export { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updateProfile };