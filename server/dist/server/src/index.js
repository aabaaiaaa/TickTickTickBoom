import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './rooms/RoomManager.js';
import { setupSocketHandlers } from './socket/handlers.js';
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
        methods: ['GET', 'POST'],
    },
});
// Initialize room manager
const roomManager = new RoomManager();
// Setup socket handlers
setupSocketHandlers(io, roomManager);
// Health check endpoint
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', rooms: roomManager.getRoomCount() });
});
httpServer.listen(PORT, () => {
    console.log(`🎮 Tick Tick Tick Boom! server running on port ${PORT}`);
});
