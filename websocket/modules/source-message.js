class SourceMessage {
    constructor(source, request, message) {
        this.source = source;
        this.socket = source.socket;
        this.httpsRequest = source.httpsRequest;
        this.request = request;
        this.message = message;
    }

    init() {
        switch (typeof this.message) {
        case 'string':

            this.message = JSON.parse(this.message);

            if (!this.socket.hello) {
                // require hello initiail message
                if (this.message.type !== 'hello') {
                    // eslint-disable-next-line
                    process.env.DEBUG_MODE && console.log(`${new Date()} -- Error: First message not hello`);
                    return this.socket.close();
                }

                // create hello property with metadata
                // mount point, MIME type, channels
                this.socket.hello = this.message.data;
                // eslint-disable-next-line
                process.env.DEBUG_MODE && console.log(`${new Date()} -- Mount point: ${this.request.url}.`);
                // eslint-disable-next-line
                process.env.DEBUG_MODE && console.log(`${new Date()} -- MIME type: ${this.socket.hello.mime}.`);
                // eslint-disable-next-line
                process.env.DEBUG_MODE && console.log(`${new Date()} -- Audio channels: ${this.socket.hello.audio.channels}.`);

                // bitrate
                if (this.socket.hello.mime === 'audio/mpeg') {
                    // eslint-disable-next-line
                    process.env.DEBUG_MODE && console.log(`${new Date()} -- Audio bitrate: ${this.socket.hello.audio.bitrate}.`);
                }
            } else if (this.message.type === 'metadata') {
                // update metadata
                const metadata = this.message.data;

                // eslint-disable-next-line
                process.env.DEBUG_MODE && console.log(`${new Date()} -- Got new metadata: ${JSON.stringify(metadata)}.`);
                this.source.updateMetadata(metadata);
            } else {
                // invalid message
                // eslint-disable-next-line
                process.env.DEBUG_MODE && console.log(`${new Date()} -- Invalid message`);
            }

            break;

        case 'object':

            if (this.message instanceof Buffer) {
                // recieve binary data and send it to icecast
                // eslint-disable-next-line
                // process.env.DEBUG_MODE && console.log(`${new Date()} -- Got $
                //    {this.message.length} bytes of binary data`);
                this.httpsRequest.write(this.message);
                break;
            } else {
                // invalid message
                // eslint-disable-next-line
                process.env.DEBUG_MODE && console.log(`${new Date()} -- Invalid message`);
            }

            break;

        default:
            // invalid message
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.log(`${new Date()} -- Invalid message`);
        }

        return 1;
    }
}


module.exports = SourceMessage;
