// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBRfUn6NL0sGTPr7EI73beqEdyq6QZ78-k",
  authDomain: "hivemind-project-bee.firebaseapp.com",
  projectId: "hivemind-project-bee",
  storageBucket: "hivemind-project-bee.firebasestorage.app",
  messagingSenderId: "150874196406",
  appId: "1:150874196406:web:9b6a81a9283eedf60e9917",
  measurementId: "G-FFJK7CTP65"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Import the functions you need from Firebase SDKs
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export functions for authentication
export const signup = (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const login = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const googleLogin = () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const resetPassword = (email) => {
  return sendPasswordResetEmail(auth, email);
};
