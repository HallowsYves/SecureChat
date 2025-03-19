import { Picker } from 'https://cdn.skypack.dev/emoji-mart';


document.addEventListener("DOMContentLoaded", () => {
    const messageInput = document.getElementById("messageInput");
    const emojiButton = document.getElementById("emojiButton");

    const picker = new Picker({
        set: 'apple',
        onEmojiSelect: (emoji) => {
            messageInput.value += emoji.native;
            picker.style.display = 'none';
        },
    });

    picker.style.position = 'absolute';
    picker.style.bottom = '50px';
    picker.style.display = 'none';
    document.body.appendChild(picker);

    emojiButton.addEventListener("click", () => {
        picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
    });
});
