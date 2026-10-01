/**
 * Vars
 */
let dataBuffer = [];
let targetLength = 0;

/**
 * Init
 * @param {number} bufferLength 
 */
const init = (bufferLength) => {
	dataBuffer = [];
	targetLength = bufferLength;
};

/**
 * Append
 * @param {Array<number>} data
 */
const append = (data) => {

	// append data to buffer
	dataBuffer = [...dataBuffer, ...data];

	// check buffer length
	if (dataBuffer.length > targetLength) {

		// create float array from first chunk in buffer
		const floatPayload = new Float32Array(dataBuffer.splice(0, targetLength));

		// convert float array to int
		const intPayload = new Int16Array(floatPayload.map((n) => {
			const s = Math.max(-1, Math.min(1, n));
			return (s < 0 ? s * 0x8000 : s * 0x7FFF);
		}));

		// send message with payload
		self.postMessage({
			cmd: 'end',
			payload: intPayload
		});
	}
}


/**
 * On Message
 * @param {MessageEvent} e 
 */
self.onmessage = function (e) {
	switch (e.data.cmd) {
		case 'init':
			init(e.data.bufferLength);
			break;
		case 'append':
			append(e.data.buffer);
			break;
	}
};
