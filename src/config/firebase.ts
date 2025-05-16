import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDxycR2hu4dXoJnScRbRc3UZviWdEyVHYk",
  authDomain: "perfectly-styled.firebaseapp.com",
  projectId: "perfectly-styled",
  storageBucket: "perfectly-styled.firebasestorage.app",
  messagingSenderId: "377334244117",
  appId: "1:377334244117:web:3fff766d728fd838a83f1c",
  measurementId: "G-LLZ1XNNXET"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
