import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import surveyRoutes from './routes/surveyRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import aiRouter from './routes/ai.js';
import quizAiRouter from './routes/quizAi.js';
import quizRoutes from './routes/quizRoutes.js';
import codingTestRoutes from './routes/codingTestRoutes.js';
import codingAiRouter from './routes/codingAi.js';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// __dirname replacement for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
// app.use(cors());
const allowedOrigins = ['https://surveyzen.live', 'https://www.surveyzen.live', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json()); // Allows parsing of JSON request bodies

// Simple test route
app.get('/', (req, res) => {
    res.send('Survey API is running...');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/ai', aiRouter);
app.use('/api/quiz-ai', quizAiRouter);
app.use('/api/quizzes', quizRoutes);
app.use('/api/coding-ai', codingAiRouter);
app.use('/api/coding-tests', codingTestRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/interviews', interviewRoutes);

// Error Handling Middleware (Basic example)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something broke!', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Create HTTP server and Socket.io instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Store active rooms and participants
const interviewRooms = new Map();

// Utility function to get room info
function getRoomInfo(roomId) {
    if (!interviewRooms.has(roomId)) {
        interviewRooms.set(roomId, new Map());
    }
    return interviewRooms.get(roomId);
}

// Socket.io connection handling for WebRTC signaling
io.on('connection', (socket) => {
    console.log('[Socket] Connected:', socket.id);

    // Handle errors gracefully
    socket.on('error', (error) => {
        console.error('[Socket] Error for', socket.id, ':', error);
    });

    // Join interview room
    socket.on('join-room', ({ roomId, userEmail, userName, userId }) => {
        if (!roomId || !userEmail) {
            console.error('[Socket] Invalid join-room data');
            socket.emit('error', { message: 'Invalid room or user data' });
            return;
        }

        console.log(`[Socket] User ${userName} (${userEmail}) joining room ${roomId}`);
        
        // Leave any existing room first
        if (socket.roomId && socket.roomId !== roomId) {
            handleLeaveRoom(socket, socket.roomId);
        }
        
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userEmail = userEmail;
        socket.userName = userName;
        socket.userId = userId;
        socket.joinedAt = new Date();

        // Track participants in room
        const room = getRoomInfo(roomId);
        
        // Check if user is already in room (reconnection case)
        const existingEntry = Array.from(room.entries()).find(
            ([, participant]) => participant.email === userEmail
        );
        
        if (existingEntry) {
            // Remove old socket entry
            room.delete(existingEntry[0]);
            console.log(`[Socket] Removed stale entry for ${userEmail}`);
        }
        
        room.set(socket.id, { 
            email: userEmail, 
            name: userName, 
            userId: userId, 
            socketId: socket.id,
            joinedAt: socket.joinedAt
        });

        // Get participants excluding self
        const participants = Array.from(room.values()).filter(
            p => p.socketId !== socket.id
        );
        
        // Send existing participants to the new user first
        socket.emit('room-participants', participants);
        console.log(`[Socket] Sent ${participants.length} existing participants to ${userName}`);

        // Then notify others that a new user joined
        socket.to(roomId).emit('user-joined', {
            email: userEmail,
            name: userName,
            userId: userId,
            socketId: socket.id
        });
        
        console.log(`[Socket] Room ${roomId} now has ${room.size} participants`);
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ roomId, offer, toSocketId }) => {
        if (!offer || !toSocketId) {
            console.error('[Socket] Invalid offer data from', socket.id);
            return;
        }
        
        console.log(`[Socket] Relaying offer from ${socket.id} to ${toSocketId}`);
        socket.to(toSocketId).emit('offer', {
            offer,
            fromSocketId: socket.id,
            fromEmail: socket.userEmail,
            fromName: socket.userName
        });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ roomId, answer, toSocketId }) => {
        if (!answer || !toSocketId) {
            console.error('[Socket] Invalid answer data from', socket.id);
            return;
        }
        
        console.log(`[Socket] Relaying answer from ${socket.id} to ${toSocketId}`);
        socket.to(toSocketId).emit('answer', {
            answer,
            fromSocketId: socket.id,
            fromEmail: socket.userEmail,
            fromName: socket.userName
        });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ roomId, candidate, toSocketId }) => {
        if (!candidate || !toSocketId) {
            return; // ICE candidates can sometimes be null, that's okay
        }
        
        socket.to(toSocketId).emit('ice-candidate', {
            candidate,
            fromSocketId: socket.id
        });
    });

    // Chat message
    socket.on('chat-message', ({ roomId, message, senderEmail, senderName }) => {
        if (!roomId || !message) return;
        
        io.to(roomId).emit('chat-message', {
            message,
            senderEmail: senderEmail || socket.userEmail,
            senderName: senderName || socket.userName,
            timestamp: new Date().toISOString()
        });
    });

    // Toggle media (video/audio)
    socket.on('toggle-media', ({ roomId, mediaType, enabled }) => {
        if (!roomId) return;
        
        socket.to(roomId).emit('peer-media-toggle', {
            socketId: socket.id,
            email: socket.userEmail,
            name: socket.userName,
            mediaType,
            enabled
        });
    });

    // Screen share started
    socket.on('screen-share-start', ({ roomId }) => {
        if (!roomId) return;
        
        socket.to(roomId).emit('peer-screen-share', {
            socketId: socket.id,
            email: socket.userEmail,
            name: socket.userName,
            sharing: true
        });
    });

    // Screen share stopped
    socket.on('screen-share-stop', ({ roomId }) => {
        if (!roomId) return;
        
        socket.to(roomId).emit('peer-screen-share', {
            socketId: socket.id,
            email: socket.userEmail,
            name: socket.userName,
            sharing: false
        });
    });

    // Reconnect request - for handling page refresh or temporary disconnection
    socket.on('reconnect-request', ({ roomId, userEmail }) => {
        if (!roomId || !userEmail) return;
        
        const room = interviewRooms.get(roomId);
        if (room) {
            const participants = Array.from(room.values()).filter(
                p => p.socketId !== socket.id
            );
            socket.emit('room-participants', participants);
            console.log(`[Socket] Handled reconnect for ${userEmail}, sent ${participants.length} participants`);
        }
    });

    // Leave room
    socket.on('leave-room', ({ roomId }) => {
        if (roomId) {
            handleLeaveRoom(socket, roomId);
        }
    });

    // Disconnect
    socket.on('disconnect', (reason) => {
        console.log(`[Socket] Disconnected: ${socket.id}, reason: ${reason}`);
        if (socket.roomId) {
            handleLeaveRoom(socket, socket.roomId);
        }
    });

    function handleLeaveRoom(sock, roomId) {
        if (!roomId) return;
        
        if (interviewRooms.has(roomId)) {
            const room = interviewRooms.get(roomId);
            room.delete(sock.id);
            
            console.log(`[Socket] ${sock.userName || sock.id} left room ${roomId}, ${room.size} remaining`);
            
            if (room.size === 0) {
                interviewRooms.delete(roomId);
                console.log(`[Socket] Room ${roomId} deleted (empty)`);
            }
        }
        
        sock.to(roomId).emit('user-left', {
            socketId: sock.id,
            email: sock.userEmail,
            name: sock.userName
        });
        
        sock.leave(roomId);
        sock.roomId = null;
    }
});

// Periodic cleanup of stale rooms (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    const staleThreshold = 3 * 60 * 60 * 1000; // 3 hours
    
    interviewRooms.forEach((room, roomId) => {
        const allStale = Array.from(room.values()).every(p => {
            const joinedTime = new Date(p.joinedAt).getTime();
            return (now - joinedTime) > staleThreshold;
        });
        
        if (allStale && room.size > 0) {
            console.log(`[Cleanup] Removing stale room: ${roomId}`);
            interviewRooms.delete(roomId);
        }
    });
}, 5 * 60 * 1000);

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
