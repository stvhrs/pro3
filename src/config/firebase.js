import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = typeof window.__firebase_config !== 'undefined' 
  ? JSON.parse(window.__firebase_config) 
  : {
      apiKey: "AIzaSyBNZoi27IP1bMb65MVgKlQqEtYHfvkHD3Q",
      authDomain: "elkapede.firebaseapp.com",
      databaseURL: "https://elkapede-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "elkapede",
      storageBucket: "elkapede.firebasestorage.app",
      messagingSenderId: "969146186573",
      appId: "1:969146186573:web:ec3ac0b16b54635313d504"
    };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'elkapede-v3-pro-production';

// Helper shortcuts
export const getPublicCol = (col) => collection(db, 'artifacts', appId, 'public', 'data', col);
export const getPublicDoc = (col, id) => doc(db, 'artifacts', appId, 'public', 'data', col, id);