import { Picker } from 'https://cdn.skypack.dev/emoji-mart';

document.addEventListener("DOMContentLoaded", () => {
  // Establish a Socket.IO connection
  const socket = io();

  // Get DOM elements
  const messageInput = document.getElementById("messageInput");
  const emojiButton = document.getElementById("emojiButton");
  const fileButton = document.getElementById("fileButton");
  const fileInput = document.getElementById("fileInput");
  const sendButton = document.getElementById("sendButton");
  const messagesList = document.getElementById("messages");

  // Initialize the emoji picker
  const picker = new Picker({
    set: 'apple',
    onEmojiSelect: (emoji) => {
      messageInput.value += emoji.native;
      picker.style.display = 'none';
    },
  });

  // Position and hide the picker by default
  picker.style.position = 'absolute';
  picker.style.bottom = '50px';
  picker.style.display = 'none';
  document.body.appendChild(picker);

  // Toggle emoji picker on emoji button click
  emojiButton.addEventListener("click", () => {
    picker.style.display = (picker.style.display === 'none' ? 'block' : 'none');
  });

  // Trigger hidden file input when file button is clicked
  fileButton.addEventListener("click", () => {
    fileInput.click();
  });

  // When a file is selected, upload it to the server
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Create a FormData object for the file upload
    const formData = new FormData();
    formData.append("myFile", file);

    try {
      // Send the file via fetch to your /upload endpoint
      const res = await fetch("/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data && data.fileUrl) {
        // Build a structured file message object
        const fileMessage = {
          type: 'file',
          sender: localStorage.getItem("username") || "Unknown",
          fileUrl: data.fileUrl,
          originalName: data.originalName || file.name,
          mimetype: data.mimetype,
        };

        // Emit the file message via Socket.IO
        socket.emit("message", fileMessage);
      } else {
        console.error("File upload failed: missing fileUrl in response", data);
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  });

  // Send text messages when the send button is clicked

  const sessionId = localStorage.getItem("currentSessionId") || "abc123";
  sendButton.addEventListener("click", (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    if (message !== "") {
      // Optionally, you could include the sessionId if it's managed on the client.
      socket.emit("message", { type: 'text', text: message, sender: localStorage.getItem("username") || "Anonymous" });
      messageInput.value = "";
    }
  });

  // Listen for incoming messages and display them
  socket.on("message", (msg) => {
    const messagesList = document.getElementById("messages");
    const li = document.createElement("li");
  
    // Check the message type
    if (msg.type === 'file') {
      // If it's a file message, determine if it's an image
      if (msg.mimetype && msg.mimetype.startsWith("image/")) {
        // Display an inline image preview
        li.innerHTML = `${msg.sender}:<br/>
          <img src="${msg.fileUrl}" alt="${msg.originalName}" style="max-width:200px;">`;
      } else {
        // For non-image files, display a clickable download link
        li.innerHTML = `${msg.sender}: <a href="${msg.fileUrl}" target="_blank">${msg.originalName}</a>`;
      }
    } else if (msg.type === 'text') {
      // For text messages (including Markdown that was sanitized to HTML)
      li.innerHTML = `${msg.sender}: ${msg.text}`;
    } else {
      // Fallback if 'type' isn't recognized
      li.textContent = `${msg.sender}: ${JSON.stringify(msg)}`;
    }
  
    // Finally, append the message element to the messages list
    messagesList.appendChild(li);
  });
  

  // Optional: Listen for session assignment from the server and store it
  socket.on("sessionAssigned", (data) => {
    sessionId = data.sessionId;
    localStorage.setItem("currentSessionId", sessionId);
    console.log("Session assigned:", sessionId);
  });
});