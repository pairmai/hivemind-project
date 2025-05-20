import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBRfUn6NL0sGTPr7EI73beqEdyq6QZ78-k",
  authDomain: "hivemind-project-bee.firebaseapp.com",
  projectId: "hivemind-project-bee",
  storageBucket: "hivemind-project-bee.firebasestorage.app",
  messagingSenderId: "150874196406",
  appId: "1:150874196406:web:9b6a81a9283eedf60e9917",
  measurementId: "G-FFJK7CTP65"
};

const app = initializeApp(firebaseConfig);

let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app); 
}

export const auth = getAuth(app);
export const db = getFirestore(app);