// Create WebSocket connection.
const socket = new WebSocket('wss://localhost:3000');

// Connection opened
socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
});
