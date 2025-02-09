// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGwjTf-62pGXjhItJh8f5T_rIKp5ER1C0",
  authDomain: "short-film-streaming.firebaseapp.com",
  projectId: "short-film-streaming",
  storageBucket: "short-film-streaming.firebasestorage.app",
  messagingSenderId: "787058692873",
  appId: "1:787058692873:web:ac5f1fb91e3f7bab57b9d8",
  measurementId: "G-WK20VYG9T9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
export const functions = getFunctions();

export function signInWithGoogle() {
    return signInWithPopup(auth, new GoogleAuthProvider());
}

export function signOut() {
    return auth.signOut();
}

//Trigger a callback when the user's auth state changes
export function onAuthStateChangedHelper(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}