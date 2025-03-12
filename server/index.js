const webSocket = require('ws');
const server = new webSocket.Server({port: '3000'});

// Listens for incoming WebSocket connection,
// Logs messages from clients AND sends the message back to client.
server.on('connection', (socket) => {
    socket.on('message', (message) => {
        const buffer = Buffer.from(message);
        console.log(buffer.toString());
        socket.send(`${message}`)
    });
});