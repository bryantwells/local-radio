import createSourceManager from "./source-manager.js"

export default async () => {

	/**
	 * Vars
	 */
	const titleElement = document.querySelector('#title');
	const descriptionElement = document.querySelector('#description');
	const timeElement = document.querySelector('#time');
	const statusElement = document.querySelector('#status');
	const playerElement = document.querySelector('#player');
	const playerAudio = document.querySelector('#player audio');
	const playButton = document.querySelector('#button-play');
	const pauseButton = document.querySelector('#button-pause');

	let mode = null;
	let playerIsBuilt = false;

	const { getActiveSourceExists, getActiveSource } = await createSourceManager();

	/**
	 * Init Player
	 */
	const init = async () => {
		playButton.addEventListener('click', play);
		pauseButton.addEventListener('click', pause);
		checkSources();
		setInterval(() => {
			checkSources();
		}, 1000);
	}

	/**
	 * Play
	 */
	const play = () => {
		pauseButton.removeAttribute('hidden');
		playButton.setAttribute('hidden', '');
		playerAudio.play();
	}

	/**
	 * Pause
	 */
	const pause = () => {
		playButton.removeAttribute('hidden');
		pauseButton.setAttribute('hidden', '');
		playerAudio.pause();
	}

	/**
	 * Check Sources
	 */
	const checkSources = () => {
		if (getActiveSourceExists()) {
			if (!playerIsBuilt) {
				buildPlayer();
			} else {
				showPlayer();
			}
		} else {
			showStatus();
		}
	}

	/**
	 * Show Status
	 */
	const showStatus = () => {
		if (mode !== "STATUS") {
			statusElement.removeAttribute('hidden');
			playerElement.setAttribute('hidden', '');
			playerAudio.pause();

			mode = "STATUS";
		}
	}

	/**
	 * Show Player
	 */
	const showPlayer = () => {
		if (mode !== "PLAYER") {
			playerElement.removeAttribute('hidden');
			statusElement.setAttribute('hidden', '');

			mode = "PLAYER";
		}
	}

	/**
	 * Format Time
	 * @param {number} seconds 
	 * @returns 
	 */
	const formatTime = (seconds) => {
		if (isNaN(seconds) || seconds < 0) return "00:00";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = Math.floor(seconds % 60);
		const pad = (num) => String(num).padStart(2, '0');

		return (hours > 0)
			? `${hours}:${pad(minutes)}:${pad(secs)}`
			: `${pad(minutes)}:${pad(secs)}`;

	}

	/**
	 * Init Audio
	 */
	const buildPlayer = () => {
		const source = getActiveSource();
		titleElement.innerText = source.metadata.title;
		descriptionElement.innerText = source.metadata.description;
		playerAudio.src = `${SERVER_HOST}/${source.mountId}`;
		playerAudio.addEventListener('timeupdate', () => timeElement.innerText = formatTime(playerAudio.currentTime));
		showPlayer();

		playerIsBuilt = true;
	}

	init();

}

