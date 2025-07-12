// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAPNYkcRXug6bPLftrsVKVajsheiwiyavs",
  authDomain: "chess-app-20717.firebaseapp.com",
  projectId: "chess-app-20717",
  storageBucket: "chess-app-20717.firebasestorage.app",
  messagingSenderId: "1050446678114",
  appId: "1:1050446678114:web:972af908937be2d81ae93b",
  measurementId: "G-0ETEC1GL8V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export { app };
