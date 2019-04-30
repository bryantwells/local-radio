const spinner = document.querySelector('.Spinner');
const frames = ['▙', '▛', '▜', '▟'];
let index = 0;

window.setInterval(() => {
    spinner.innerText = frames[index];
    index = (index < frames.length - 1) ? index + 1 : 0;
}, 100);
