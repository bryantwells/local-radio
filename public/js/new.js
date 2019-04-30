// Audio options
const mainElement = document.querySelector('main');
const titleInput = document.querySelector('.StreamOptions-title');
const sourceSelect = document.querySelector('.StreamOptions-sourceSelect');
const descriptionInput = document.querySelector('.StreamOptions-description');
const streamButton = document.querySelector('.StreamButton');
const streamTitle = document.querySelector('.Header-titleSpan--stream');

class Stream {
    constructor() {
        this.isActive = false;
        this.webcast = null;
        this.context = null;
        this.source = null;
        this.inputSampleRate = null;
        this.encoder = null;
        this.activateStreamEvent = new Event('activateStream');
        this.deactivateStreamEvent = new Event('deactivateStream');
    }

    activate(deviceId) {
        navigator.mediaDevices.getUserMedia({ audio: { deviceId }, video: false })
            .then((stream) => {
                this.context = new AudioContext();
                this.source = this.context.createMediaStreamSource(stream);
                this.inputSampleRate = this.source.context.sampleRate;
                this.encoder = new Webcast.Encoder.Mp3({
                    channels: 2,
                    samplerate: 44100,
                    bitrate: 128,
                });
                this.encoder = new Webcast.Encoder.Resample({
                    encoder: this.encoder,
                    samplerate: this.inputSampleRate,
                });
                this.openWebcast();
            })
            .catch((error) => {
                console.error(error);
            });
    }

    openWebcast() {
        this.webcast = this.context.createWebcastSource(4096, 2);
        this.source.connect(this.webcast);
        this.webcast.connect(this.context.destination);
        this.webcast.connectSocket(this.encoder, `wss://${host}/mount`);
        this.webcast.getSocket().addEventListener('open', () => {
            this.isActive = true;
            window.dispatchEvent(this.activateStreamEvent);
        });
        this.webcast.getSocket().addEventListener('message', (e) => {
            this.handleMessage(e);
        });
    }

    deactivate() {
        this.webcast.close(() => {
            this.isActive = false;
            this.context = null;
            this.source = null;
            this.inputSampleRate = null;
            this.encoder = null;
            this.webcast = null;
            window.dispatchEvent(this.deactivateStreamEvent);
        });
    }

    handleMessage(e) {
        // parse JSON message
        const message = JSON.parse(e.data);
        switch (message.type) {
        case 'status':
            switch (message.event) {
            case 'ready':
                this.webcast.sendMetadata({
                    title: titleInput.value,
                    description: descriptionInput.value,
                    init: true,
                });
                break;
            default:
            }
            break;
        case 'metadata':
            break;
        default:
        }
    }
}

// Get user media
if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(() => {
            const stream = new Stream();

            // populate device list
            navigator.mediaDevices.enumerateDevices()
                .then((devices) => {
                    const inputDevices = devices.filter(d => d.kind === 'audioinput');
                    inputDevices.forEach((d) => {
                        sourceSelect.innerHTML += `<option value='${d.deviceId}'>${d.label}</option>`;
                    });
                });

            // select device
            streamButton.addEventListener('click', (e) => {
                e.preventDefault();

                // get id of selected device, create stream
                const deviceId = sourceSelect[sourceSelect.selectedIndex].value;
                if (!stream.isActive) {
                    stream.activate(deviceId);
                } else {
                    stream.deactivate();
                }
            });

            titleInput.addEventListener('keyup', () => {
                if (titleInput.value && descriptionInput.value && sourceSelect.value !== '') {
                    streamButton.disabled = false;
                } else {
                    streamButton.disabled = true;
                }
            });

            descriptionInput.addEventListener('keyup', () => {
                if (titleInput.value && descriptionInput.value && sourceSelect.value !== '') {
                    streamButton.disabled = false;
                } else {
                    streamButton.disabled = true;
                }
                descriptionInput.style.height = '0px';
                descriptionInput.style.height = `${descriptionInput.scrollHeight}px`;
            });

            sourceSelect.addEventListener('change', () => {
                if (titleInput.value && descriptionInput.value && sourceSelect.value !== '') {
                    streamButton.disabled = false;
                } else {
                    streamButton.disabled = true;
                }
            });

            window.addEventListener('activateStream', () => {
                mainElement.classList.add('is-active');
                titleInput.disabled = true;
                sourceSelect.disabled = true;
                descriptionInput.disabled = true;
                streamTitle.innerText = titleInput.value;
                streamButton.innerText = 'Stop Streaming';
            });

            window.addEventListener('deactivateStream', () => {
                mainElement.classList.remove('is-active');
                titleInput.disabled = false;
                sourceSelect.disabled = false;
                descriptionInput.disabled = false;
                streamTitle.innerText = '';
                streamButton.innerText = 'start streaming';
            });

            window.addEventListener('beforeunload', () => {
                // eslint-disable-next-line
                const confirmation = confirm('Are you sure you want to close this window');
                if (confirmation) {
                    return true;
                }
                return false;
            });
        })
        .catch((error) => {
            console.log('hi');
            console.error(error);
        });
} else {
    console.error('getUserMedia not supported');
}
