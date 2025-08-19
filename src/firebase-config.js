// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyB1XAaS8jVlLTvTVzzFyasSA5Zjy3nkJL8",
    authDomain: "do-an-8c3e4.firebaseapp.com",
    projectId: "do-an-8c3e4",
    storageBucket: "do-an-8c3e4.firebasestorage.app",
    messagingSenderId: "362967619052",
    appId: "1:362967619052:web:e3a329cc39fb08bc035cc9",
    measurementId: "G-8HFSLW069S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);