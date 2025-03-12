import { createServer } from "http";
import { Server } from "socket.io";


const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:5500", "http://127.0.0.1:5500"]
    }
})

// Listens for incoming WebSocket connection,
// Logs messages from clients AND sends the message back to client.

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected`)

    socket.on('message', data => {
        console.log(data);

        // emits to everyone in the server, 
        io.emit('message', `${socket.id.substring(0,5)}: ${data}`);
    });
});

httpServer.listen(3500, () => console.log('listening on port 3500.'));