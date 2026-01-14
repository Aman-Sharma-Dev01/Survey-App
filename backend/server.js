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

// Socket.io connection handling for WebRTC signaling
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join interview room
    socket.on('join-room', ({ roomId, userEmail, userName, userId }) => {
        console.log(`User ${userName} (${userEmail}) joining room ${roomId}`);
        
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userEmail = userEmail;
        socket.userName = userName;
        socket.userId = userId;

        // Track participants in room
        if (!interviewRooms.has(roomId)) {
            interviewRooms.set(roomId, new Map());
        }
        const room = interviewRooms.get(roomId);
        room.set(socket.id, { 
            email: userEmail, 
            name: userName, 
            userId: userId, 
            socketId: socket.id 
        });

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
            email: userEmail,
            name: userName,
            userId: userId,
            socketId: socket.id
        });

        // Send list of existing participants to the new user
        const participants = Array.from(room.values());
        socket.emit('room-participants', participants);
    });

    // WebRTC signaling: offer
    socket.on('offer', ({ roomId, offer, toSocketId }) => {
        socket.to(toSocketId).emit('offer', {
            offer,
            fromSocketId: socket.id,
            fromEmail: socket.userEmail,
            fromName: socket.userName
        });
    });

    // WebRTC signaling: answer
    socket.on('answer', ({ roomId, answer, toSocketId }) => {
        socket.to(toSocketId).emit('answer', {
            answer,
            fromSocketId: socket.id
        });
    });

    // WebRTC signaling: ICE candidate
    socket.on('ice-candidate', ({ roomId, candidate, toSocketId }) => {
        socket.to(toSocketId).emit('ice-candidate', {
            candidate,
            fromSocketId: socket.id
        });
    });

    // Chat message
    socket.on('chat-message', ({ roomId, message, senderEmail, senderName }) => {
        io.to(roomId).emit('chat-message', {
            message,
            senderEmail,
            senderName,
            timestamp: new Date().toISOString()
        });
    });

    // Toggle media (video/audio)
    socket.on('toggle-media', ({ roomId, mediaType, enabled }) => {
        socket.to(roomId).emit('peer-media-toggle', {
            socketId: socket.id,
            email: socket.userEmail,
            mediaType,
            enabled
        });
    });

    // Screen share started
    socket.on('screen-share-start', ({ roomId }) => {
        socket.to(roomId).emit('peer-screen-share', {
            socketId: socket.id,
            email: socket.userEmail,
            sharing: true
        });
    });

    // Screen share stopped
    socket.on('screen-share-stop', ({ roomId }) => {
        socket.to(roomId).emit('peer-screen-share', {
            socketId: socket.id,
            email: socket.userEmail,
            sharing: false
        });
    });

    // Leave room
    socket.on('leave-room', ({ roomId }) => {
        handleLeaveRoom(socket, roomId);
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
        if (socket.roomId) {
            handleLeaveRoom(socket, socket.roomId);
        }
    });

    function handleLeaveRoom(socket, roomId) {
        if (interviewRooms.has(roomId)) {
            const room = interviewRooms.get(roomId);
            room.delete(socket.id);
            
            if (room.size === 0) {
                interviewRooms.delete(roomId);
            }
        }
        
        socket.to(roomId).emit('user-left', {
            socketId: socket.id,
            email: socket.userEmail,
            name: socket.userName
        });
        
        socket.leave(roomId);
    }
});

httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
