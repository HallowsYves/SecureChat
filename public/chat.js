import { Picker } from 'https://cdn.skypack.dev/emoji-mart';

document.addEventListener("DOMContentLoaded", () => {
  // Get references to DOM elements
  const messageInput = document.getElementById("messageInput");
  const emojiButton = document.getElementById("emojiButton");
  const fileButton = document.getElementById("fileButton");
  const fileInput = document.getElementById("fileInput");

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

  // Toggle the emoji picker when the emoji button is clicked
  emojiButton.addEventListener("click", () => {
    picker.style.display = (picker.style.display === 'none' ? 'block' : 'none');
  });

  // File upload: trigger the hidden file input when file button is clicked
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
        // For example, emit a chat message containing a download link:
        // (Assumes you have a socket connection set up)
        // socket.emit("message", `File uploaded: <a href="${data.fileUrl}" target="_blank">Download File</a>`);

        // Alternatively, you can directly append the link to the chat UI:
        const messages = document.getElementById("messages");
        const li = document.createElement("li");
        li.innerHTML = `File uploaded: <a href="${data.fileUrl}" target="_blank">Download File</a>`;
        messages.appendChild(li);
      } else {
        console.error("File upload failed: missing fileUrl in response", data);
      }
    } catch (error) {
      console.error("File upload error:", error);
    }
  });
});
