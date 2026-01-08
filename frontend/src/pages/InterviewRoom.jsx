import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Video, 
    VideoOff, 
    Mic, 
    MicOff, 
    Phone, 
    MessageSquare, 
    Users, 
    Monitor,
    MonitorOff,
    Send,
    X,
    AlertCircle,
    Settings,
    Maximize2,
    Minimize2,
    Crown,
    Clock,
    Copy,
    Check
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext.jsx';
import { 
    getInterviewById, 
    joinInterview, 
    leaveInterview, 
    endInterview,
    sendChatMessage,
    getChatHistory,
    getSocketUrl 
} from '../services/interviewService.js';
import toast from 'react-hot-toast';

// ICE servers for WebRTC (use free STUN servers, add TURN servers for production)
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
    ]
};

const InterviewRoom = ({ interviewId, navigate }) => {
    const { user } = useAuth();
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Media states
    const [localStream, setLocalStream] = useState(null);
    const [screenStream, setScreenStream] = useState(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    
    // Participants and connections
    const [participants, setParticipants] = useState([]);
    const [peerConnections, setPeerConnections] = useState({});
    const [remoteStreams, setRemoteStreams] = useState({});
    
    // Chat
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    // UI states
    const [showParticipants, setShowParticipants] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [copied, setCopied] = useState(false);
    
    // Refs
    const localVideoRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const chatContainerRef = useRef(null);

    const isHost = interview?.hostEmail?.toLowerCase() === user?.email?.toLowerCase();

    // Initialize interview and media
    useEffect(() => {
        initializeInterview();
        return () => {
            cleanup();
        };
    }, [interviewId]);

    // Scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const initializeInterview = async () => {
        try {
            setLoading(true);
            
            // Fetch interview details
            const interviewData = await getInterviewById(interviewId);
            setInterview(interviewData);

            // Join interview
            const joinResult = await joinInterview(interviewId);
            
            // Load chat history
            try {
                const chatHistory = await getChatHistory(interviewId);
                setChatMessages(chatHistory);
            } catch (e) {
                console.warn('Could not load chat history:', e);
            }

            // Initialize media
            await initializeMedia();
            
            // Connect to socket
            connectSocket(joinResult.roomId);
            
        } catch (err) {
            console.error('Error initializing interview:', err);
            setError(err.message || 'Failed to join interview');
            
            if (err.message?.includes('not invited') || err.message?.includes('unauthorized')) {
                toast.error('You are not authorized to join this interview');
                setTimeout(() => navigate('interview-dashboard'), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    const initializeMedia = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            setLocalStream(stream);
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error accessing media devices:', err);
            toast.error('Could not access camera/microphone. Please check permissions.');
            
            // Try audio only
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });
                setLocalStream(audioStream);
                setIsVideoOn(false);
            } catch (audioErr) {
                console.error('Could not access audio either:', audioErr);
            }
        }
    };

    const connectSocket = (roomId) => {
        const socketUrl = getSocketUrl();
        socketRef.current = io(socketUrl, {
            transports: ['websocket', 'polling']
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            
            // Join the room
            socket.emit('join-room', {
                roomId,
                userEmail: user.email,
                userName: user.name,
                userId: user._id
            });
        });

        socket.on('room-participants', (existingParticipants) => {
            console.log('Existing participants:', existingParticipants);
            setParticipants(existingParticipants.filter(p => p.email !== user.email));
            
            // Create peer connections to existing participants
            existingParticipants.forEach(participant => {
                if (participant.email !== user.email) {
                    createPeerConnection(participant.socketId, true);
                }
            });
        });

        socket.on('user-joined', (participant) => {
            console.log('User joined:', participant);
            toast.success(`${participant.name} joined the interview`);
            setParticipants(prev => [...prev.filter(p => p.email !== participant.email), participant]);
            
            // Create peer connection (don't initiate, wait for them)
        });

        socket.on('user-left', ({ socketId, email, name }) => {
            console.log('User left:', name);
            toast.info(`${name} left the interview`);
            setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            
            // Close peer connection
            if (peerConnectionsRef.current[socketId]) {
                peerConnectionsRef.current[socketId].close();
                delete peerConnectionsRef.current[socketId];
            }
            
            setRemoteStreams(prev => {
                const updated = { ...prev };
                delete updated[socketId];
                return updated;
            });
        });

        socket.on('offer', async ({ offer, fromSocketId, fromEmail, fromName }) => {
            console.log('Received offer from:', fromName);
            await handleOffer(offer, fromSocketId);
        });

        socket.on('answer', async ({ answer, fromSocketId }) => {
            console.log('Received answer from:', fromSocketId);
            await handleAnswer(answer, fromSocketId);
        });

        socket.on('ice-candidate', async ({ candidate, fromSocketId }) => {
            await handleIceCandidate(candidate, fromSocketId);
        });

        socket.on('chat-message', (message) => {
            setChatMessages(prev => [...prev, message]);
        });

        socket.on('peer-media-toggle', ({ socketId, email, mediaType, enabled }) => {
            // Handle remote peer media toggle (for UI updates)
            console.log(`${email} turned ${mediaType} ${enabled ? 'on' : 'off'}`);
        });

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err);
            toast.error('Connection error. Trying to reconnect...');
        });
    };

    const createPeerConnection = async (remoteSocketId, initiator = false) => {
        if (peerConnectionsRef.current[remoteSocketId]) {
            return peerConnectionsRef.current[remoteSocketId];
        }

        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionsRef.current[remoteSocketId] = pc;

        // Add local tracks
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('ice-candidate', {
                    roomId: interview?.roomId,
                    candidate: event.candidate,
                    toSocketId: remoteSocketId
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.streams);
            setRemoteStreams(prev => ({
                ...prev,
                [remoteSocketId]: event.streams[0]
            }));
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${remoteSocketId}:`, pc.connectionState);
        };

        // If initiator, create and send offer
        if (initiator) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                socketRef.current?.emit('offer', {
                    roomId: interview?.roomId,
                    offer,
                    toSocketId: remoteSocketId
                });
            } catch (err) {
                console.error('Error creating offer:', err);
            }
        }

        return pc;
    };

    const handleOffer = async (offer, fromSocketId) => {
        const pc = await createPeerConnection(fromSocketId, false);
        
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            socketRef.current?.emit('answer', {
                roomId: interview?.roomId,
                answer,
                toSocketId: fromSocketId
            });
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    };

    const handleAnswer = async (answer, fromSocketId) => {
        const pc = peerConnectionsRef.current[fromSocketId];
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (err) {
                console.error('Error handling answer:', err);
            }
        }
    };

    const handleIceCandidate = async (candidate, fromSocketId) => {
        const pc = peerConnectionsRef.current[fromSocketId];
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.error('Error adding ICE candidate:', err);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOn(videoTrack.enabled);
                
                socketRef.current?.emit('toggle-media', {
                    roomId: interview?.roomId,
                    mediaType: 'video',
                    enabled: videoTrack.enabled
                });
            }
        }
    };

    const toggleAudio = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioOn(audioTrack.enabled);
                
                socketRef.current?.emit('toggle-media', {
                    roomId: interview?.roomId,
                    mediaType: 'audio',
                    enabled: audioTrack.enabled
                });
            }
        }
    };

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            // Stop screen sharing
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                setScreenStream(null);
            }
            setIsScreenSharing(false);
            
            // Replace screen track with camera track in all peer connections
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && videoTrack) {
                        sender.replaceTrack(videoTrack);
                    }
                });
            }
            
            socketRef.current?.emit('screen-share-stop', { roomId: interview?.roomId });
        } else {
            // Start screen sharing
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: true,
                    audio: true 
                });
                
                setScreenStream(stream);
                setIsScreenSharing(true);
                
                // Replace camera track with screen track in all peer connections
                const screenTrack = stream.getVideoTracks()[0];
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                });
                
                // Handle screen share stop
                screenTrack.onended = () => {
                    toggleScreenShare();
                };
                
                socketRef.current?.emit('screen-share-start', { roomId: interview?.roomId });
            } catch (err) {
                console.error('Error starting screen share:', err);
                toast.error('Could not start screen sharing');
            }
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const message = newMessage.trim();
        setNewMessage('');

        // Emit via socket for real-time
        socketRef.current?.emit('chat-message', {
            roomId: interview?.roomId,
            message,
            senderEmail: user.email,
            senderName: user.name
        });

        // Save to database
        try {
            await sendChatMessage(interviewId, message);
        } catch (err) {
            console.warn('Could not save message to database:', err);
        }
    };

    const handleLeave = async () => {
        try {
            await leaveInterview(interviewId);
            cleanup();
            toast.success('Left the interview');
            navigate('interview-dashboard');
        } catch (err) {
            console.error('Error leaving interview:', err);
            cleanup();
            navigate('interview-dashboard');
        }
    };

    const handleEndInterview = async () => {
        try {
            await endInterview(interviewId);
            toast.success('Interview ended');
            cleanup();
            navigate(`interview-details/${interviewId}`);
        } catch (err) {
            toast.error(err.message || 'Failed to end interview');
        }
    };

    const cleanup = () => {
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        
        // Stop screen stream
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        
        // Close all peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
        peerConnectionsRef.current = {};
        
        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.emit('leave-room', { roomId: interview?.roomId });
            socketRef.current.disconnect();
        }
    };

    const copyRoomLink = () => {
        const link = `${window.location.origin}/#interview-room/${interviewId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Joining interview...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Cannot Join Interview</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('interview-dashboard')}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 flex flex-col">
            {/* Header */}
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-white font-semibold truncate max-w-[200px] sm:max-w-none">
                        {interview?.title}
                    </h1>
                    {isHost && (
                        <span className="px-2 py-1 bg-emerald-600 text-white text-xs rounded-full flex items-center gap-1">
                            <Crown size={12} />
                            Host
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyRoomLink}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                        title="Copy link"
                    >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                    <button
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                        title="Toggle fullscreen"
                    >
                        {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video grid */}
                <div className="flex-1 p-4 overflow-auto">
                    <div className={`grid gap-4 h-full ${
                        participants.length === 0 
                            ? 'grid-cols-1' 
                            : participants.length === 1 
                                ? 'grid-cols-1 md:grid-cols-2' 
                                : participants.length <= 3 
                                    ? 'grid-cols-2' 
                                    : 'grid-cols-2 md:grid-cols-3'
                    }`}>
                        {/* Local video */}
                        <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                            />
                            {!isVideoOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                    <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center">
                                        <span className="text-3xl text-white font-bold">
                                            {user?.name?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                <span className="px-2 py-1 bg-black/60 text-white text-sm rounded">
                                    You {isHost && '(Host)'}
                                </span>
                                <div className="flex items-center gap-1">
                                    {!isAudioOn && (
                                        <span className="p-1 bg-red-500 rounded-full">
                                            <MicOff size={12} className="text-white" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Remote videos */}
                        {participants.map(participant => (
                            <div 
                                key={participant.socketId} 
                                className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video"
                            >
                                {remoteStreams[participant.socketId] ? (
                                    <video
                                        autoPlay
                                        playsInline
                                        ref={(el) => {
                                            if (el && remoteStreams[participant.socketId]) {
                                                el.srcObject = remoteStreams[participant.socketId];
                                            }
                                        }}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                        <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                                            <span className="text-3xl text-white font-bold">
                                                {participant.name?.[0]?.toUpperCase() || 'P'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute bottom-3 left-3">
                                    <span className="px-2 py-1 bg-black/60 text-white text-sm rounded">
                                        {participant.name}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {/* Empty slots for waiting */}
                        {participants.length === 0 && (
                            <div className="flex items-center justify-center bg-gray-800/50 rounded-xl aspect-video border-2 border-dashed border-gray-600">
                                <div className="text-center">
                                    <Users size={48} className="text-gray-500 mx-auto mb-2" />
                                    <p className="text-gray-400">Waiting for participants...</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat panel */}
                {showChat && (
                    <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-white font-semibold">Chat</h3>
                            <button
                                onClick={() => setShowChat(false)}
                                className="p-1 text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div 
                            ref={chatContainerRef}
                            className="flex-1 overflow-y-auto p-3 space-y-3"
                        >
                            {chatMessages.map((msg, idx) => (
                                <div 
                                    key={idx}
                                    className={`${
                                        msg.senderEmail === user.email 
                                            ? 'ml-auto bg-emerald-600' 
                                            : 'mr-auto bg-gray-700'
                                    } max-w-[80%] rounded-lg p-2`}
                                >
                                    {msg.senderEmail !== user.email && (
                                        <p className="text-xs text-gray-400 mb-1">{msg.senderName}</p>
                                    )}
                                    <p className="text-white text-sm">{msg.message}</p>
                                    <p className="text-xs text-gray-300/60 mt-1">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-3 border-t border-gray-700">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all"
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Participants panel */}
                {showParticipants && (
                    <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col">
                        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-white font-semibold">
                                Participants ({participants.length + 1})
                            </h3>
                            <button
                                onClick={() => setShowParticipants(false)}
                                className="p-1 text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {/* Host (you if you are host, or the actual host) */}
                            <div className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg">
                                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">
                                        {user?.name?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">
                                        {user?.name} (You)
                                    </p>
                                    <p className="text-gray-400 text-xs">{isHost ? 'Host' : 'Participant'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {isAudioOn ? (
                                        <Mic size={16} className="text-green-500" />
                                    ) : (
                                        <MicOff size={16} className="text-red-500" />
                                    )}
                                </div>
                            </div>
                            
                            {participants.map(participant => (
                                <div 
                                    key={participant.socketId}
                                    className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg"
                                >
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            {participant.name?.[0]?.toUpperCase() || 'P'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-medium">
                                            {participant.name}
                                        </p>
                                        <p className="text-gray-400 text-xs truncate">
                                            {participant.email}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls bar */}
            <div className="bg-gray-800 px-4 py-4">
                <div className="flex items-center justify-center gap-4">
                    {/* Audio toggle */}
                    <button
                        onClick={toggleAudio}
                        className={`p-4 rounded-full transition-all ${
                            isAudioOn 
                                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                        title={isAudioOn ? 'Mute' : 'Unmute'}
                    >
                        {isAudioOn ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>

                    {/* Video toggle */}
                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all ${
                            isVideoOn 
                                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                        title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>

                    {/* Screen share */}
                    {interview?.settings?.enableScreenShare && (
                        <button
                            onClick={toggleScreenShare}
                            className={`p-4 rounded-full transition-all ${
                                isScreenSharing 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                        >
                            {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
                        </button>
                    )}

                    {/* Chat toggle */}
                    {interview?.settings?.enableChat && (
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`p-4 rounded-full transition-all ${
                                showChat 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                            title="Toggle chat"
                        >
                            <MessageSquare size={24} />
                        </button>
                    )}

                    {/* Participants toggle */}
                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className={`p-4 rounded-full transition-all ${
                            showParticipants 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        title="Show participants"
                    >
                        <Users size={24} />
                    </button>

                    {/* End call */}
                    <button
                        onClick={() => isHost ? setShowEndConfirm(true) : handleLeave()}
                        className="p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all"
                        title={isHost ? 'End interview' : 'Leave interview'}
                    >
                        <Phone size={24} className="rotate-[135deg]" />
                    </button>
                </div>
            </div>

            {/* End interview confirmation modal */}
            {showEndConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-2">End Interview?</h3>
                        <p className="text-gray-400 mb-6">
                            This will end the interview for all participants. You can add notes and outcome afterward.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                            >
                                Continue Interview
                            </button>
                            <button
                                onClick={handleLeave}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all"
                            >
                                Just Leave
                            </button>
                            <button
                                onClick={handleEndInterview}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                            >
                                End Interview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewRoom;
