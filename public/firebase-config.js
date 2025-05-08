let storage;

const firebaseConfig = {
    apiKey: "AIzaSyBMM9I-7dL77Jd-GNaCGk9KCuW73eVkkxs",
    authDomain: "chat-95258.firebaseapp.com",
    projectId: "chat-95258",
    storageBucket: "chat-95258.appspot.com",
    messagingSenderId: "341631280166",
    appId: "1:341631280166:web:c7020a040bdfe54fc672e7"
};
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully.");
} else {
    console.error("Firebase SDK not loaded before config.js");
}