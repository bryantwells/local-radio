import { PassThrough } from "stream";
import { readFileSync } from "fs";
import Ffmpeg from "fluent-ffmpeg";

export default (io, icecastService) => {

	// Get Sources
	function getSources() {
		const socket = this;
		socket.emit('sourceList', icecastService.getSourceList());
	}

	// Create Source
	async function createSource(userId, mountId, bufferLength, metadata) {
		await icecastService.createSource(userId, mountId, bufferLength, metadata, 'audio/ogg');
		await icecastService.createSource(`${userId}-mp3`, `${mountId}-mp3`, bufferLength, metadata, 'audio/mp3');
		io.emit('sourceList', icecastService.getSourceList());
		console.log('createSource', userId, mountId);
	}

	// Put Source Data
	async function putSourceData(userId, mountId, buffer, bufferLength, metadata) {

		// create strea
		const bufferStream = new PassThrough();
		bufferStream.end(buffer);

		// ffmpeg encoding
		new Ffmpeg()
			.input(bufferStream)
			.inputFormat('s16le')
			.inputOptions('-ar 48000')
			.output('./buffer.ogg')
			.audioCodec('libvorbis')
			.format('ogg')
			.output('./buffer.mp3')
			.audioCodec('libmp3lame')
			.format('mp3')
			.output('./buffer.raw')
			.audioChannels(2)
			.format('s16le')
			.on('error', (err) => {

				// on error
				console.error('ffmpeg-error', err);
				reject(err);
			})
			.on('end', async () => {

				// on encoding completion
				const oggBuffer = readFileSync('./buffer.ogg');
				const mp3Buffer = readFileSync('./buffer.mp3');
				await icecastService.putSourceData(userId, mountId, oggBuffer, bufferLength, metadata, 'audio/ogg');
				await icecastService.putSourceData(`${userId}-mp3`, `${mountId}-mp3`, mp3Buffer, bufferLength, metadata, 'audio/mp3');
			})
			.run();
	}

	// Kill Source
	async function killSource(userId, mountId, bufferLength) {
		await icecastService.killSource(userId, mountId, bufferLength);
		await icecastService.killSource(`${userId}-mp3`, `${mountId}-mp3`, bufferLength);
		await icecastService.killAllSources();
		io.emit('sourceList', icecastService.getSourceList());
		console.log('killSource', userId, mountId);
	}

	return {
		getSources,
		createSource,
		putSourceData,
		killSource,
	}
}