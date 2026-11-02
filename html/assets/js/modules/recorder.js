import createSourceManager from "./source-manager.js?v=2";

/**
 * @param {string} deviceId 
 * @param {Object} metadata
 * @param {string} metadata.title
 * @param {string} metadata.description
 */
export default async (deviceId, metadata) => {

	/**
	 * Vars
	 */
	const context = new AudioContext();
	const encoderProcessorURL = new URL('/assets/js/lib/encoder-processor.js', window.location.origin);
	const encoderWorkerURL = new URL('/assets/js/lib/encoder-worker.js', window.location.origin);
	const encoderWorker = new Worker(encoderWorkerURL);

	let audioSourceNode;
	let isRecording = false;
	let SAMPLE_RATE = 48000;
	let TARGET_BUFFER_LENGTH = SAMPLE_RATE * 3;

	const { createSource, putSourceData, killSource, onReconnect } = await createSourceManager();

	/**
	 * Start Recording
	 */
	const startRecording = async () => {
		try {

			// create stream
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					deviceId,
					echoCancellation: false,
					noiseSuppression: false,
					autoGainControl: false,
				},
			});

			// create source
			createSource(USER_ID, MOUNT_ID, TARGET_BUFFER_LENGTH, metadata);
			isRecording = true;

			// start audio
			context.resume();
			SAMPLE_RATE = context.sampleRate;
			TARGET_BUFFER_LENGTH = SAMPLE_RATE * 3;

			// setup source node (microphone)
			audioSourceNode = context.createMediaStreamSource(stream);

			// create processor node
			const encoderProcessorNode = new AudioWorkletNode(
				context,
				'encoder-processor'
			);

			// connect worklet node to processor, destination
			audioSourceNode.connect(encoderProcessorNode);
			encoderProcessorNode.connect(context.destination);


			// AudioWorkletProcessor Event
			// pass buffer to the encoder whenever they are made available
			encoderProcessorNode.port.onmessage = (e) => {
				encoderWorker.postMessage({
					'cmd': 'append',
					'buffer': e.data
				});
			};

		} catch (error) {
			alert('Something went wrong');
			console.log(error);
		}
	}

	/**
	 * Stop Recording
	 */
	const stopRecording = async () => {

		// Disconnect
		audioSourceNode?.disconnect();
		context.suspend();

		// Kill source
		killSource(USER_ID, MOUNT_ID, TARGET_BUFFER_LENGTH);
		isRecording = false;

	}
	/**
	 * Init Processor
	 * Add processor module to worklet
	 * @param {AudioContext} context 
	 */
	const initProcessor = async (context) => {
		try {
			await context.audioWorklet.addModule(encoderProcessorURL);
		} catch {
			alert('Something went wrong');
			console.log(error);
		}
	}

	/**
	 * Init Worker
	 * Init the service worker (converts buffer from Float32 to Int16)
	 * Add an event listener that monitors for prepared buffer
	 * @param {Object} metadata
	 * @param {string} metadata.title
	 * @param {string} metadata.description
	 * @returns {Worker}
	 */
	const initWorker = (metadata) => {
		encoderWorker.postMessage({
			'cmd': 'init',
			'bufferLength': TARGET_BUFFER_LENGTH,
		});
		encoderWorker.addEventListener('message', (e) => {
			if (e.data.cmd == 'end') {
				putSourceData(
					USER_ID,
					MOUNT_ID,
					e.data.payload,
					TARGET_BUFFER_LENGTH,
					metadata
				);
			}
		});
		return encoderWorker;
	}

	/**
	 * Init Reconnect
	 * The middleware kills the source when the socket disconnects,
	 * so recreate it if the socket reconnects while still recording
	 * @param {Object} metadata
	 * @param {string} metadata.title
	 * @param {string} metadata.description
	 */
	const initReconnect = (metadata) => {
		onReconnect(() => {
			if (isRecording) {
				createSource(USER_ID, MOUNT_ID, TARGET_BUFFER_LENGTH, metadata);
			}
		});
	}

	await initProcessor(context);
	initWorker(metadata);
	initReconnect(metadata);

	return { startRecording, stopRecording };

}
