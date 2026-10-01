export default () => {

	/**
	 * Vars
	 */
	const container = document.querySelector('#timestamp');

	/**
	 * Init
	 */
	const init = () => {
		update();
		setInterval(() => {
			update();
		}, 1000);
	}

	/**
	 * Update
	 */
	const update = () => {
		const now = new Date();
		container.innerText = now.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
		});
	}

	init();

}