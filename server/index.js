const webSocket = require('ws');
const server = new webSocket.Server({port: '3000'});

server.on('connection', (socket) => {
    socket.on('message', (message) => {
        console.log(message)
        socket.send(`${message}`)
    });
});