import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyAeaNbP5w9HXLYtjFXu9c7uQYrtPVgSKLk",
  authDomain: "my-project-1-951cf.firebaseapp.com",
  projectId: "my-project-1-951cf",
  storageBucket: "my-project-1-951cf.firebasestorage.app",
  messagingSenderId: "37733334848",
  appId: "1:37733334848:web:b5019152f45ea6c25d04a5",
  measurementId: "G-R9Z99RXH0X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;