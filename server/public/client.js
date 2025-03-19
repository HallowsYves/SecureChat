// Connect to the Socket.IO server
const socket = io('http://localhost:3500');

// Select the necessary DOM elements
const messageForm = document.querySelector("form");
const messageInput = document.querySelector("input");
const messageList = document.querySelector("ul");

// Retrieve username from localStorage
const storedUsername = localStorage.getItem("username");
const username = storedUsername || "Unknown"; // Use fallback if username is missing

// Debug log to check username retrieval
console.log("✅ Retrieved username from localStorage:", username);

// Optional: Listen for when the socket connects
socket.on("connect", () => {
    console.log("Socket connected with ID:", socket.id);
});

// Handle message sending
messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (messageInput.value.trim() !== "") {
        const messageData = {
            username: username,  // Using the fallback variable
            text: messageInput.value.trim()
        };
        console.log("📨 Sending message:", messageData); // Debug log

        socket.emit("message", messageData); // Send the message as an object
        messageInput.value = "";
    }
});

// Handle receiving messages
socket.on("message", (data) => {
    console.log("📩 Received message:", data); // Debug log

    // Validate data structure
    if (!data.username || !data.text) {
        console.error("❌ Invalid message received:", data);
        return;
    }

    const messageElement = document.createElement("li");
    messageElement.textContent = `${data.username}: ${data.text}`;
    messageList.appendChild(messageElement);
});
