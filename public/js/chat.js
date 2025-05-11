import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getAuth, signInAnonymously, onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";



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


const auth = getAuth(app);
signInAnonymously(auth)
  .then(() => {
    console.log(" Signed in anonymously with Firebase UID:", auth.currentUser?.uid);
  })
  .catch((error) => {
    console.error(" Anonymous sign-in failed:", error);
  });
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Auth Ready. UID:", user.uid);
  }
});
// Helper: Generate a conversation ID from two usernames (alphabetically sorted)
function generateConversationId(userA, userB) {
  return [userA, userB].sort().join('-');
}


document.addEventListener("DOMContentLoaded", () => {
  const BACKEND_URL = "https://securechat-olu7.onrender.com";
  let currentConversationId = null;
  const currentUser = localStorage.getItem("username");

  // Establish Socket.IO connection
  const socket = io();

  socket.emit("userConnected", currentUser);

  // Get DOM elements
  const chatTitle = document.getElementById("chatTitle");
  const userList = document.getElementById("userList");
  const messagesList = document.getElementById("messages");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const fileButton = document.getElementById("fileButton");
  const fileInput = document.getElementById("fileInput");
  const typingIndicator = document.getElementById("typingIndicator");


  // Typing indicator 
  let typingTimeout;

  messageInput.addEventListener("input", () => {
    const recipient = chatTitle.textContent.replace("Talking with: ", "").trim();
    socket.emit("Typing", {user: currentUser, to:recipient});

    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit("stopTyping", { user: currentUser, to:recipient});
    }, 1000);
  });


  // Online / Offline
  window.addEventListener("beforeunload", () => {
    socket.emit("userDisconnected", currentUser);
  });

  // HELPER FUNCTIONS
  async function getPrivateKey() {
    const privateKeyJwk = JSON.parse(localStorage.getItem("privateKey"));
    return await window.crypto.subtle.importKey(
      "jwk",
      privateKeyJwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      ["decrypt"]
    );
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Load user list from server and populate sidebar
  async function loadUserList() {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/users`);
      if (!response.ok) throw new Error("Failed to fetch user list");
      const users = await response.json();
      
      userList.innerHTML = ""; // Clear existing entries
      users.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = user.username;
        li.setAttribute("data-username", user.username);
        userList.appendChild(li);
      });
    } catch (error) {
      console.error("Error loading user list:", error);
    }
  }
  loadUserList();

  // Sidebar: When a user is clicked, join their conversation room.
  userList.addEventListener("click", (e) => {
    if (e.target && e.target.nodeName === "LI") {
      const selectedUser = e.target.getAttribute("data-username");
      if (!selectedUser) return;

      // Update chat title
      chatTitle.textContent = `Talking with: ${selectedUser}`;

      // Generate conversationId for a one-to-one chat between currentUser and selectedUser
      currentConversationId = generateConversationId(currentUser, selectedUser);
      console.log("Joining conversation:", currentConversationId);

      // Emit join event to the server so that socket joins that room
      socket.emit("joinConversation", currentConversationId);

      // Clear the messages area to load new conversation messages
      messagesList.innerHTML = "";
    }
  });


  // Emoji Picker integration
  const emojiButton = document.querySelector('#emojiButton');
  const emojiPicker = document.querySelector('#emojiPicker');

  emojiButton.addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
    const {bottom, left } = emojiButton.getBoundingClientRect();
    emojiPicker.style.top = `${bottom + window.scrollY}px`;
    emojiPicker.style.left = `${bottom + window.scrollX}px`;
    
  })



  emojiPicker.addEventListener('emoji-click', event => {
    messageInput.value += event.detail.unicode;
    emojiPicker.style.display = 'none';
  }) 

  // Trigger file input when file button is clicked
  fileButton.addEventListener("click", () => {
    fileInput.click();
  });

  // File upload: When a file is selected, upload and then emit a file message.
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    try {
      if (!file.type.match(/^image\/(png|jpe?g|gif)$/)) {
        alert("Only PNG, JPG, JPEG, and GIF files are allowed.");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert("File must be 5MB or smaller.");
        return;
      }
      const storageRef = ref(storage, `chat_uploads/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);
  
      if (fileUrl) {
        const fileMessage = {
          conversationId: currentConversationId,
          type: 'file',
          sender: currentUser,
          fileUrl: fileUrl,
          originalName: file.name,
          mimetype: file.type
        };
        socket.emit("message", fileMessage);
      } else {
        console.error("File upload failed: missing fileUrl");
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  });

  const publicKeys = new Map();

  // Fetch user's public key from the server and cache it.
  async function fetchPublicKey(username) {
    if (publicKeys.has(username)) return publicKeys.get(username);
    const token = localStorage.getItem("token");
    const response = await fetch(`${BACKEND_URL}/auth/publicKey/${username}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch public key for ${username}`);
      return null;
    }

    const {publicKey: jwk} = await response.json();
    const key = await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      ["encrypt"]
    );

    publicKeys.set(username, key);
    return key;
  }

  function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }


// Sending text messages when the message form is submitted.
document.getElementById("messageForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message && currentConversationId) {
    const recipient = chatTitle.textContent.replace("Talking with: ", "").trim();
    const recipientKey = await fetchPublicKey(recipient);
    if (!recipientKey) {
      alert("Could not fetch recipient encryption key.");
      return;
    }

    const encoded = new TextEncoder().encode(message);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      recipientKey,
      encoded
    );
    const encryptedBase64 = arrayBufferToBase64(encrypted);

    socket.emit("message", {
      conversationId: currentConversationId,
      type: 'text',
      text: encryptedBase64,
      sender: currentUser || "Anonymous"
    });
    messageInput.value = "";
  } else {
    alert("Please select a user to chat with before sending a message.");
  }
});


  // Listen for incoming messages and display them
  socket.on("message", (msg) => {
    // Only display messages for the current conversation
    if (msg.conversationId !== currentConversationId) return;
    const li = document.createElement("li");
    if (msg.type === 'file') {
      if (msg.mimetype && msg.mimetype.startsWith("image/")) {
        li.innerHTML = `${msg.sender}:<br/><img src="${msg.fileUrl}" alt="${msg.originalName}" style="max-width:200px;">`;
      } else {
        li.innerHTML = `${msg.sender}: <a href="${msg.fileUrl}" target="_blank">${msg.originalName}</a>`;
      }
    } else if (msg.type === 'text') {
      (async () => {
        let decryptedText = "[Unable to decrypt]";
        try {
          const privateKey = await getPrivateKey();
          const cipherBytes = base64ToArrayBuffer(msg.text);
          const plainBuffer = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            cipherBytes
          );
          decryptedText = new TextDecoder().decode(plainBuffer);
        } catch (err) {
          console.error("Failed to decrypt message:", err);
        }
        li.innerHTML = `${msg.sender}: ${decryptedText}`;
        messagesList.appendChild(li);
      })();
      return;
    } else {
      li.textContent = `${msg.sender}: ${JSON.stringify(msg)}`;
    }
    messagesList.appendChild(li);
  });

  socket.on("typing", ({ user }) => {
    typingIndicator.textContent = `${user} is typing...`;
  });

  socket.on("stopTyping", ({ user }) => {
    typingIndicator.textContent = "";
  });

  // Listen for session assignment (optional)
  socket.on("sessionAssigned", (data) => {
    localStorage.setItem("currentSessionId", data.sessionId);
    console.log("Session assigned:", data.sessionId);
  });
});
