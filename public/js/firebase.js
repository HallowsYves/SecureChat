import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBMM9I-7dL77Jd-GNaCGk9KCuW73eVkkxs",
    authDomain: "chat-95258.firebaseapp.com",
    projectId: "chat-95258",
    storageBucket: "chat-95258.firebasestorage.app",
    messagingSenderId: "341631280166",
    appId: "1:341631280166:web:c7020a040bdfe54fc672e7"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

export {storage};