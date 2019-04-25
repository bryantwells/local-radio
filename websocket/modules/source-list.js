const crypto = require('crypto');
const https = require('https');
const { parseString } = require('xml2js');

const Source = require('./source');
const SourceMessage = require('./source-message');

class SourceList {
    constructor(credentials) {
        // initated the sourcelist object
        this.sources = [];
        this.credentials = credentials;

        // encode credentials
        this.credentialStrings = {
            admin: Buffer.from(`${credentials.admin.user}:${credentials.admin.pass}`).toString('base64'),
            source: Buffer.from(`source:${credentials.source.pass}`).toString('base64'),
        };
    }

    createSource(request, credentials, socket) {
        // generate random mountPath
        const mountPath = `/${crypto.randomBytes(3).toString('hex')}`;

        // create new source
        const source = new Source(request, credentials, mountPath, {
            'Accept': '*/*',
            'Transfer-Encoding': 'chunked',
            'Content-Type': 'audio/mpeg',
            'Ice-Public': '1',
            'Request': '100-continue',
            'Ice-Bitrate': '128',
            'Ice-Audio-Info': 'samplerate=44100;channels=2',
        }, socket);

        // add the new source and init
        this.sources.push(source);
        source.init();

        // parse new message from client
        source.socket.on('message', (message) => {
            const sourceMessage = new SourceMessage(source, request, message);
            sourceMessage.init();
        });

        // close a connection and delete the source
        source.socket.on('close', () => {
            source.close();
            this.sources = this.sources.filter(s => s.mountPath !== mountPath);
        });
    }

    getStats() {
        // make https request to get stats from /admin/stats.xml
        return new Promise((resolve, reject) => {
            // list mounts
            https.request({
                method: 'GET',
                host: '127.0.0.1',
                port: process.env.ICECAST_PORT || '8000',
                path: '/admin/stats',
                headers: { 'Authorization': `Basic ${this.credentialStrings.admin}` },
            }, (response) => {
                // eslint-disable-next-line
                process.env.DEBUG_MODE && console.log(response.statusCode, response.statusMessage);

                // handle the received data (server stats)
                response.on('data', (data) => {
                    // convert data to xml string
                    const xml = data.toString('utf8');

                    // convert xml to object
                    parseString(xml, (error, result) => {
                        // eslint-disable-next-line
                        process.env.DEBUG_MODE && console.log(`${new Date()} -- Got server stats`);

                        // return the icestats object
                        resolve(result.icestats);
                    });
                });
                response.on('error', (error) => {
                    reject(error);
                });
            }).end();
        });
    }
}

module.exports = SourceList;
