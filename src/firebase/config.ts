import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBDm7VB0PMboRwA_gvnaphQGuPmUuL60xY",
  authDomain: "vku-study-room.firebaseapp.com",
  projectId: "vku-study-room",
  storageBucket: "vku-study-room.firebasestorage.app",
  messagingSenderId: "31318583212",
  appId: "1:31318583212:web:b5aa955051e7f5b91f3c09"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);