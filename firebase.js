// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBCRoZVl06YqcMvL0jcWyHgonDS75ojyJI",
  authDomain: "aluminios-88a45.firebaseapp.com",
  projectId: "aluminios-88a45",
  storageBucket: "aluminios-88a45.firebasestorage.app",
  messagingSenderId: "38740849156",
  appId: "1:38740849156:web:14f5ae306c63557f15fb51",
  measurementId: "G-SWD0MFTRCH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Analytics only if supported
isSupported().then((supported) => {
  if (supported) {
    getAnalytics(app);
    console.log("Firebase Analytics initialized.");
  } else {
    console.log("Firebase Analytics is not supported in this environment.");
  }
});

// Export Firestore instance
export { db };