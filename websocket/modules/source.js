const { EventEmitter } = require('events');
const https = require('https');

class Source extends EventEmitter {
    constructor(request, credentials, mountPath, headers, socket) {
        super();

        // general assignments
        this.metadata = {};
        this.request = request;
        this.mountPath = mountPath;
        this.socket = socket;

        // set agent and source credentials
        this.keepAliveAgent = new https.Agent({ keepAlive: true });
        this.adminCredentials = Buffer.from(`${credentials.admin.user}:${credentials.admin.pass}`).toString('base64');
        this.sourceCredentials = Buffer.from(`source:${credentials.source.pass}`).toString('base64');

        // initial request options
        this.options = {
            agent: this.keepAliveAgent,
            method: 'PUT',
            host: '127.0.0.1',
            port: process.env.ICECAST_PORT || '8000',
            path: this.mountPath,
            headers,
        };

        // auth string
        this.options.headers.Authorization = `Basic ${this.sourceCredentials}`;
    }

    init() {
        // eslint-disable-next-line
        process.env.DEBUG_MODE && console.log(`${new Date()} -- Connection from ${this.request.headers.origin}`);

        // make request
        this.httpsRequest = https.request(this.options, (response) => {
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.log(response.statusCode, response.statusMessage);

            // send status update to the client
            this.socket.send(JSON.stringify({
                type: 'status',
                event: 'ready',
            }));
        });

        this.httpsRequest.on('error', (error) => {
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.error(error) 
        });
    }

    close() {
        // close ssource https request
        // eslint-disable-next-line
        process.env.DEBUG_MODE && console.log(`${new Date()} peer disconnected`);

        // end the original request
        this.httpsRequest.on('end', (response) => {
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.log(response) 
        });
        this.httpsRequest.end();

        // create kill request
        const killRequest = https.request({
            method: 'GET',
            host: '127.0.0.1',
            port: process.env.ICECAST_PORT || '8000',
            path: `/admin/killsource?mount=${this.options.path}`,
            headers: { 'Authorization': `Basic ${this.adminCredentials}` },
        }, (response) => {
            // response returns 404 since switching from http to https, for some reason
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.log(response.statusCode, response.statusMessage);
        }).end();

        // catch error
        killRequest.on('error', (error) => {
            // eslint-disable-next-line
            console.log(error);
        });

        return killRequest;
    }

    updateMetadata(metadata) {
        // update the source object
        Object.assign(this.metadata, metadata);

        // eslint-disable-next-line
        process.env.DEBUG_MODE && console.log(this.metadata.title, this.metadata.description);

        // update icecast metadata
        const updateRequest = https.request({
            method: 'GET',
            host: '127.0.0.1',
            port: process.env.ICECAST_PORT || '8000',
            path: encodeURI(`/admin/metadata?pass=${this.sourceCredentials}&mount=${this.options.path}&mode=updinfo&song=${this.metadataString}`),
            headers: { 'Authorization': `Basic ${this.sourceCredentials}` },
        }, (response) => {
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.log(response.statusCode, response.statusMessage);
        }).end();

        // catch update error
        updateRequest.on('error', (error) => {
            // eslint-disable-next-line
            process.env.DEBUG_MODE && console.log(error);
        });

        // send metadata back to the client
        this.socket.send(JSON.stringify({
            type: 'metadata',
            data: metadata,
        }));
    }

    get metadataString() {
        return JSON.stringify({
            title: this.metadata.title,
            description: this.metadata.description,
        });
    }
}

module.exports = Source;
