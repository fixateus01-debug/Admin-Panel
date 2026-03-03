// import { initializeApp } from "firebase/app";
// import { getAuth } from "firebase/auth";
// import { getFirestore } from "firebase/firestore";
// import { getStorage } from "firebase/storage";

// const firebaseConfig = {
//   apiKey: "AIzaSyAdRlA_h0OBrgn3QLNDFXlEpQPIRkQJJlw",
//   authDomain: "ranksprint.firebaseapp.com",
//   projectId: "ranksprint",
//   storageBucket: "ranksprint.firebasestorage.app",
//   messagingSenderId: "860899860233",
//   appId: "1:860899860233:web:ec32bad326abf6fc633dd8"
// };

// const app = initializeApp(firebaseConfig);

// export const auth = getAuth(app);
// export const db = getFirestore(app);
// export const storage = getStorage(app);





import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyAdRlA_h0OBrgn3QLNDFXlEpQPIRkQJJlw",
  authDomain: "ranksprint.firebaseapp.com",
  projectId: "ranksprint",
  storageBucket: "ranksprint.firebasestorage.app",
  messagingSenderId: "860899860233",
  appId: "1:860899860233:web:ec32bad326abf6fc633dd8"
};

const app = initializeApp(firebaseConfig);

/* 🔐 Core Services */
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

/* 🚀 Cloud Functions (IMPORTANT FIX) */
export const functions = getFunctions(app, "us-central1");
// make sure region matches where your function is deployed