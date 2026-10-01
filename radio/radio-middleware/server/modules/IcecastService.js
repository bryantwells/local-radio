import * as fs from 'node:fs';

import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { Low } from 'lowdb';
import { JSONFileSync } from "lowdb/node";
import { IcecastClient } from './IcecastClient.js';

/**
 * Icecast mount state management
 */
export class IcecastService {

	/**
	 * Constructor
	 * @param {string} host 
	 * @param {number} port 
	 * @param {string} adminUser 
	 * @param {string} adminPass 
	 * @param {string} sourcePass 
	 */
	constructor(host, port, adminUser, adminPass, sourcePass) {

		// Set props
		this.host = host
		this.port = port;
		this.adminUser = adminUser;
		this.adminPass = adminPass;
		this.sourcePass = sourcePass;

		// Additional Props
		this.adminCredentials = Buffer.from(`${adminUser}:${adminPass}`)
			.toString('base64');
		this.sourceCredentials = Buffer.from(`source:${sourcePass}`)
			.toString('base64');

		// Init props
		this.db = null;
		this.clients = [];
	}

	/**
	 * Init database
	 */
	async init() {
		await this.initDatabase();
	}

	/**
	 * Init Database
	 */
	async initDatabase() {

		// Create JSON DB
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		const dbFile = join(__dirname, '../models/sources.json');
		const dbAdapter = new JSONFileSync(dbFile);
		this.db = new Low(dbAdapter);

		// Get data from DB
		await this.db.read();

		// Make sources model
		this.db.data.sources = (this.db.data.sources)
			? this.db.data.sources
			: [];
	}

	/**
	 * Create an icecast source
	 * @param {string} userId
	 * @param {string} mountId
	 * @param {Blob} data
	 * @param {Object} metadata
	 */
	async createSource(userId, mountId, bufferLength, metadata, mimeType) {

		// Register the user
		if (!this.getClientByUserId(userId)) {
			this.addClient(userId, mountId, bufferLength, mimeType);
		}

		// Get the icecast client and make request
		const client = this.getClientByUserId(userId);
		client.putSourceData(Buffer.alloc(10));

		// Update the database
		if (!this.sourceExists(mountId)) {
			await this.addSource(userId, mountId, metadata);
		}
	}

	/**
	 * Send data to an icecast source
	 * @param {string} userId
	 * @param {string} mountId
	 * @param {Blob} data
	 * @param {Object} metadata
	 */
	async putSourceData(userId, mountId, data, bufferLength, metadata, mimeType) {

		// Get the icecast client and make request
		if (this.getClientByUserId(userId)) {
			const client = this.getClientByUserId(userId);
			client.putSourceData(data);
		}
	}

	/**
	 * Kill Source
	 * @param {string} userId
	 * @param {string} mountId 
	 */
	async killSource(userId, mountId, bufferLength) {

		// Create the client
		if (!this.getClientByUserId(userId)) {
			this.addClient(userId, mountId, bufferLength);
		}

		// Get the icecast client and make request
		const client = this.getClientByUserId(userId);
		client.killSource(mountId);

		// Update the database
		if (this.sourceExists(mountId)) {
			await this.removeSource(mountId);
		}

		// Remove the client
		this.removeClient(userId);
	}

	/**
	 * Kill All Sources
	 */
	async killAllSources() {
		await Promise.all(this.db.data.sources.map((source) => {
			return new Promise(async (resolve) => {
				await this.killSource(source.userId, source.mountId)
			});
		}));
		this.db.data.sources = [];
		await this.db.write();
	}

	/**
	 * Register user by creating a new icecast client
	 * @param {string} userId
	 */
	addClient(userId, mountId, bufferLength, mimeType) {
		const client = new IcecastClient(
			this.host,
			this.port,
			this.adminCredentials,
			this.sourceCredentials,
			userId,
			mountId,
			bufferLength,
			mimeType
		);
		this.clients.push(client);
	}

	/**
	 * Register user by creating a new icecast client
	 * @param {string} userId
	 */
	removeClient(userId) {
		this.clients = this.clients.filter((client) => {
			return client.userId !== userId
		});
	}

	/**
	 * Add mount to the database
	 * @param {string} mountId
	 * @param {string} userId
	 * @param {Object} metadata
	 */
	async addSource(userId, mountId, metadata) {
		this.db.data.sources.push({
			userId,
			mountId,
			metadata
		});
		await this.db.write();
	}

	/**
	 * Remove mount from the database
	 * @param {string} mountId
	 */
	async removeSource(mountId) {
		this.db.data.sources = this.db.data.sources.filter((source) => {
			return source.mountId !== mountId;
		});
		await this.db.write();
	}

	/**
	 * Get source by mount id
	 * @param {string} mountId
	 */
	getSourceByMountId(mountId) {
		return this.db.data.sources.find((source) => {
			return source.mountId == mountId;
		});
	}

	/**
	 * Check if the database contains mount
	 * @param {string} mountId
	 */
	sourceExists(mountId) {
		return this.db.data.sources.some((source) => {
			return source.mountId == mountId;
		});
	}

	/**
	 * List sources from the JSON database
	 */
	getSourceList() {
		return this.db.data.sources;
	}

	/**
	 * Get icecast client by socket id
	 * @param {string} userId
	 */
	getClientByUserId(userId) {
		return this.clients.find((client) => {
			return client.userId == userId;
		});
	}

	/**
	 * Get Stats from iceacst
	 */
	async getStats() {
		return await this.clients[0].getStats();
	}
}