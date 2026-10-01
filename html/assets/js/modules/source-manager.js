/**
 * @typedef {Object} Source
 * @property {string} userId
 * @property {string} mountId
 * @property {Object} metadata
 * @property {string} metadata.title
 * @property {string} metadata.description
 */

export default async () => {

	/**
	 * Vars
	 */
	let sources = [];
	const socket = io(MIDDLEWARE_HOST);

	/**
	 * Init Socket
	 */
	const init = () => {
		return new Promise((resolve) => {
			socket.on('sourceList', (data) => {
				sources = data;
				resolve();
			});
		});
	}

	/**
	 * Get Active Source
	 * @returns {Source|undefined} source
	 */
	const getActiveSource = () => sources.find((source) => source.mountId == MOUNT_ID);

	/**
	 * Get Active Source Exists
	 * @returns {boolean}
	 */
	const getActiveSourceExists = () => sources.filter((source) => source.mountId == MOUNT_ID).length > 0;

	/**
	 * Create Source
	 * @param {string} userId 
	 * @param {string} mountId 
	 * @param {number} bufferLength 
	 * @param {Object} metadata 
	 * @param {string} metadata.title
	 * @param {string} metadata.description
	 */
	const createSource = (userId, mountId, bufferLength, metadata) => {
		socket.emit('createSource', userId, mountId, bufferLength, metadata);
	}

	/**
	 * 
	 * @param {string} userId 
	 * @param {string} mountId 
	 * @param {Int16Array} data 
	 * @param {number} bufferLength 
	 * @param {Object} metadata 
	 * @param {string} metadata.title
	 * @param {string} metadata.description
	 */
	const putSourceData = (userId, mountId, data, bufferLength, metadata) => {
		socket.emit('putSourceData', userId, mountId, data, bufferLength, metadata);
	}

	/**
	 * 
	 * @param {string} userId 
	 * @param {string} mountId 
	 * @param {number} bufferLength 
	 */
	const killSource = (userId, mountId, bufferLength) => {
		socket.emit('killSource', userId, mountId, bufferLength);
	}

	await init();

	return { getActiveSource, getActiveSourceExists, createSource, putSourceData, killSource }

}

