import { initializeApp } from "firebase/app";
import firebase from "firebase/compat/app"
import "firebase/compat/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAedXHHDbJrLLdG5e_lm_pz-pG1mTrhHw0",
  authDomain: "linkedinapp-3e86a.firebaseapp.com",
  projectId: "linkedinapp-3e86a",
  storageBucket: "linkedinapp-3e86a.appspot.com",
  messagingSenderId: "305596683649",
  appId: "1:305596683649:web:6d473540ce6fb377c88480",
  measurementId: "G-GLPXG3CZWZ"
};

// Initialize Firebase
if(!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
}

export {firebase}