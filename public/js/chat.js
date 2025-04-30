import dotenv from 'dotenv';

// Helper: Generate a conversation ID from two usernames (alphabetically sorted)
function generateConversationId(userA, userB) {
  return [userA, userB].sort().join('-');
}

document.addEventListener("DOMContentLoaded", () => {
  // Establish Socket.IO connection
  const socket = io();

  // Get DOM elements
  const chatTitle = document.getElementById("chatTitle");
  const userList = document.getElementById("userList");
  const messagesList = document.getElementById("messages");
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  const fileButton = document.getElementById("fileButton");
  const fileInput = document.getElementById("fileInput");

  const BACKEND_URL = dotenv.BACKEND_URL;

  let currentConversationId = null;
  const currentUser = localStorage.getItem("username");

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

    const formData = new FormData();
    formData.append("myFile", file);

    try {
      const res = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data && data.fileUrl) {
        const fileMessage = {
          conversationId: currentConversationId,
          type: 'file',
          sender: currentUser,
          fileUrl: data.fileUrl,
          originalName: data.originalName || file.name,
          mimetype: data.mimetype
        };
        socket.emit("message", fileMessage);
      } else {
        console.error("File upload failed: missing fileUrl in response", data);
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  });

  // Sending text messages when the message form is submitted.
// Correct: includes conversationId
document.getElementById("messageForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message && currentConversationId) {
    socket.emit("message", {
      conversationId: currentConversationId,
      type: 'text',
      text: message,
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
      li.innerHTML = `${msg.sender}: ${msg.text}`;
    } else {
      li.textContent = `${msg.sender}: ${JSON.stringify(msg)}`;
    }
    messagesList.appendChild(li);
  });

  // Listen for session assignment (optional)
  socket.on("sessionAssigned", (data) => {
    localStorage.setItem("currentSessionId", data.sessionId);
    console.log("Session assigned:", data.sessionId);
  });
});
