import http from 'http';
import { XMLParser } from 'fast-xml-parser';

/**
 * Icecast Client
 * Protocol specification: 
 * https://gist.github.com/ePirat/adc3b8ba00d85b7e3870
 * https://www.icecast.org/docs/icecast-trunk/admin_interface/
 */
export class IcecastClient {

    /**
     * Constructor
     * @param {string} host
     * @param {number} port
     * @param {string} adminCredentials
     * @param {string} sourceCredentials
     * @param {string} userId
     * @param {string} mountId
     */
    constructor(host, port, adminCredentials, sourceCredentials, userId, mountId, bufferLength, mimeType = 'audio/ogg', sampleRate = 48000) {

        // Set props
        this.host = host;
        this.port = port;
        this.adminCredentials = adminCredentials;
        this.sourceCredentials = sourceCredentials;
        this.userId = userId;
        this.mountId = mountId;
        this.bufferLength = bufferLength;
        this.mimeType = mimeType;
        this.sampleRate = sampleRate;
        this.bufferQueue = [];
        

        // Init put request
        this.putRequest = null;

        // Put interval
        this.putIntervalId = 0;
        this.putDelay = this.bufferLength / this.sampleRate * 1000;
        
        setTimeout(() => {
            this.putIntervalId = setInterval(() => {
                this.makePutRequest();
            }, this.putDelay);
        }, this.putDelay * 1.25);
    }

    /**
     * Get Stats
     * @returns icecast server info 
     */
    getStats() {
        return new Promise((resolve, reject) => {
            http.request(
                {
                    method: 'GET',
                    host: this.host,
                    port: this.port,
                    path: '/admin/stats',
                    headers: {
                        'Authorization': `Basic ${this.adminCredentials}`
                    },
                },
                (response) => {
                    response.on('data', (data) => {
                        const xmlParser = new XMLParser();
                        const xml = xmlParser.parse(data);
                        resolve(xml.icestats);
                    });
                    response.on('error', (error) => {
                        reject(error);
                    });
                }
            ).end();
        });
    }

    /**
     * List Mounts
     * @returns icecast server info 
     */
    listMounts() {
        return new Promise((resolve, reject) => {
            http.request(
                {
                    method: 'GET',
                    host: this.host,
                    port: this.port,
                    path: '/admin/listmounts',
                    headers: {
                        'Authorization': `Basic ${this.adminCredentials}`
                    },
                },
                (response) => {
                    response.on('data', (data) => {
                        const xmlParser = new XMLParser({
                            ignoreAttributes: false
                        });
                        const xml = xmlParser.parse(data);
                        resolve(xml.icestats);
                    });
                    response.on('error', (error) => {
                        reject(error);
                    });
                }
            ).end();
        });
    }

    /**
     * Send data to a mountpoint source
     * @param {string} userId
     * @param {string} mountId
     * @param {Blob} data
     */
    putSourceData(data) {
        this.bufferQueue.push(data);
    }

    /**
     * Make put request
     */
    makePutRequest() {
        
        if (this.bufferQueue.length > 0) {
            const data = this.bufferQueue[0];
            this.bufferQueue.shift();
            if (!this.putRequest) {
                this.putRequest = http.request(
                    {
                        method: 'PUT',
                        host: this.host,
                        port: this.port,
                        path: `/${this.mountId}`,
                        agent: new http.Agent({
                            keepAlive: true,
                        }),
                        headers: {
                            'Authorization': `Basic ${this.sourceCredentials}`,
                            'Accept': '*/*',
                            'Transfer-Encoding': 'chunked',
                            'Content-Type': this.mimeType,
                            'Ice-Public': '1',
                            'Request': '100-continue',
                            'Ice-Bitrate': '128',
                            'Ice-Audio-Info': `samplerate=${this.sampleRate};quality=10%2e0;channels=1`,
                            'Ice-Name': `${this.userId}`
                        },
                        data,
                    }
                );
                this.putRequest.on('error', () => {
                    console.log("socket closed");
                });
                // console.log('put', data);
            } else {
                this.putRequest.write(data);
                // console.log('write', data);
            }
        }
    }

    /**
     * Kill Source
     * @param {string} mountId 
     */
    killSource(mountId) {
        return new Promise((resolve, reject) => {
            clearInterval(this.putIntervalId);
            if (this.putRequest) {
                this.putRequest.end();
            }
            http.request(
                {
                    method: 'GET',
                    host: this.host,
                    port: this.port,
                    path: `/admin/killsource?mount=/${mountId}`,
                    headers: {
                        'Authorization': `Basic ${this.adminCredentials}`,
                    },
                },
                (response) => {
                    resolve(response.statusCode);
                    response.on('error', () => {
                        reject(error);
                    });
                }
            ).end();
        });
    }
}
