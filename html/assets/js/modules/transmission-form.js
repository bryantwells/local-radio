import createRecorder from "./recorder.js";

export default async () => {

	/**
	 * Vars
	 */
	const form = document.querySelector('#form-transmission');
	const deviceInput = form.querySelector('#input-device');
	const titleInput = form.querySelector('#input-title');
	const descriptionInput = form.querySelector('#input-description');
	const startButton = form.querySelector('#button-start');
	const stopButton = form.querySelector('#button-stop');

	/**
	 * Init
	 */
	const init = async () => {
		await addDeviceOptions();
		form.addEventListener('submit', handleFormSubmit);
	}

	/**
	 * Add Device Options
	 * Get media devices from the computer and add options to select input
	 */
	const addDeviceOptions = async () => {
		await navigator.mediaDevices.getUserMedia({ audio: true });
		const inputDevices = await navigator.mediaDevices.enumerateDevices();
		const audioInputDevices = inputDevices.filter((d) => d.kind == 'audioinput');
		audioInputDevices.forEach((device) => {
			const option = document.createElement('option');
			option.value = device.deviceId;
			option.text = device.label;
			deviceInput.appendChild(option);
		});
	}

	/**
	 * Handle Form Submit
	 * Submit the form and start recording
	 * @param {Event} event 
	 */
	const handleFormSubmit = async (event) => {
		event.preventDefault();
		const { startRecording, stopRecording } = await createRecorder(
			deviceInput.value,
			{ title: titleInput.value, description: descriptionInput.value }
		);

		disableForm();
		await startRecording();

		stopButton.addEventListener('click', () => {
			stopRecording();
			enableForm();
		}, { once: true });
	}

	/**
	 * Disable Form
	 */
	const disableForm = () => {
		document.documentElement.dataset.streaming = true;
		startButton.setAttribute('hidden', 'true');
		stopButton.removeAttribute('hidden');
		[deviceInput, titleInput, descriptionInput].forEach((input) => {
			input.setAttribute('disabled', 'true');
		});
	}

	/**
	 * Enable Form
	 */
	const enableForm = () => {
		document.documentElement.dataset.streaming = false;
		startButton.removeAttribute('hidden');
		stopButton.setAttribute('hidden', 'true');
		[deviceInput, titleInput, descriptionInput].forEach((input) => {
			input.removeAttribute('disabled');
		});
	}

	init();

}

