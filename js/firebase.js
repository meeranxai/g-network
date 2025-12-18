import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyD8Sg8rBwkCS4BYwgVrb_V_KQ4eMd0PkZ0",
  authDomain: "g-network-community.firebaseapp.com",
  projectId: "g-network-community",
  storageBucket: "g-network-community.firebasestorage.app",
  messagingSenderId: "358032029950",
  appId: "1:358032029950:web:a8dc470de9d85ead240daf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("Firebase Connected (Database Mode)!");

// Sirf Database aur Auth export kar rahe hain (No Storage = No Payment Error)
export const db = getFirestore(app);
export const auth = getAuth(app);