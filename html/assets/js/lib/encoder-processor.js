/**
 * Encoder Processor
 */
class EncoderProcessor extends AudioWorkletProcessor {

	constructor() {
		super();
	}

	/**
	 * Process
	 * @param {Float32Array} inputs 
	 * @returns {boolean}
	 */
	process(inputs) {
		const channelData = inputs[0]?.[0];
		if (channelData) {
			this.port.postMessage(channelData);
		}
		return true;
	}
}

registerProcessor('encoder-processor', EncoderProcessor);
