import { createServer } from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { IcecastService } from "./modules/IcecastService.js";
import eventHandlers from './modules/eventHandlers.js';

// ENV
const ICECAST_HOSTNAME = process.env.ICECAST_HOSTNAME || 'radio-server';
const ICECAST_PORT = process.env.ICECAST_PORT || 8000;
const ICECAST_ADMIN_USER = process.env.ICECAST_ADMIN_USER || 'admin';
const ICECAST_ADMIN_PASS = process.env.ICECAST_ADMIN_PASS || 'hackme';
const ICECAST_SOURCE_PASS = process.env.ICECAST_SOURCE_PASS || 'hackme';

// Express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Server
const server = createServer(app);

// Icecast Service
const icecastService = new IcecastService(
    ICECAST_HOSTNAME,
    ICECAST_PORT,
    ICECAST_ADMIN_USER,
    ICECAST_ADMIN_PASS,
    ICECAST_SOURCE_PASS
);
await icecastService.init();
icecastService.killAllSources();

// Socket IO
const io = new Server(server, { cors: { origin: '*' } });
const { getSources, createSource, putSourceData, killSource } = eventHandlers(io, icecastService);
io.on('connection', (socket) => {
    console.log('connection');
    socket.emit('sourceList', icecastService.getSourceList());
    socket.on('getSources', getSources);
    socket.on('createSource', createSource);
    socket.on('putSourceData', putSourceData);
    socket.on('killSource', killSource);
});

app.get('/', (request, response) => {
    response.send('Hello World from Radio!');
})

// Mount
server.listen(3000);
console.log('server listening on :3000');