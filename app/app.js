const socket = new WebSocket('ws://localhost:3000');

function sendMessage(event) {
    event.preventDefault();
    const input = document.querySelector('input');
    if (input.value) {
        socket.send(input.value);
        input.value = '';
    }
    input.focus();
}

document.querySelector('form')
    .addEventListener('submit', sendMessage);

socket.addEventListener('message', ({data}) => {
    const listItem = document.createElement('li');
    listItem.textContent = data;
    document.querySelector('ul').appendChild(listItem);
});