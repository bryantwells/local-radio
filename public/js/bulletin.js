const socket = new WebSocket(`ws://${host}:8080`);
const postInput = document.querySelector('.PostInput');
const postButton = document.querySelector('.PostButton');

postButton.addEventListener('click', () => {
    socket.send(postInput.innerText);
});