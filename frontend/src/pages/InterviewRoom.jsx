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
    Maximize2,
    Minimize2,
    Crown,
    Copy,
    Check,
    RefreshCw,
    Wifi,
    WifiOff
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
import webRTCService from '../services/webrtcService.js';
import toast from 'react-hot-toast';

// Remote video component with proper stream handling
const RemoteVideoTile = ({ stream, participantName, connectionState }) => {
    const videoRef = useRef(null);
    
    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement && stream) {
            if (videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
                videoElement.play().catch(e => {
                    console.log('Remote video play deferred:', e.message);
                });
            }
        }
        
        return () => {
            if (videoElement) {
                videoElement.srcObject = null;
            }
        };
    }, [stream]);

    const isConnecting = connectionState === 'connecting' || connectionState === 'new';
    const isFailed = connectionState === 'failed' || connectionState === 'disconnected';

    return (
        <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-3xl text-white font-bold">
                            {participantName?.[0]?.toUpperCase() || 'P'}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Connection status overlay */}
            {isConnecting && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-white text-sm">Connecting to {participantName || 'participant'}...</p>
                    </div>
                </div>
            )}
            
            {isFailed && (
                <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                    <div className="text-center">
                        <WifiOff className="text-white mx-auto mb-2" size={24} />
                        <p className="text-white text-sm">Connection lost</p>
                    </div>
                </div>
            )}
            
            <div className="absolute bottom-3 left-3">
                <span className="px-2 py-1 bg-black/60 text-white text-sm rounded flex items-center gap-2">
                    {participantName}
                    {connectionState === 'connected' && (
                        <Wifi size={12} className="text-green-400" />
                    )}
                </span>
            </div>
        </div>
    );
};

const InterviewRoom = ({ interviewId, navigate }) => {
    const { user } = useAuth();
    
    // Interview state
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Media state
    const [localStream, setLocalStream] = useState(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    
    // Participants and connections
    const [participants, setParticipants] = useState([]);
    const [remoteStreams, setRemoteStreams] = useState({});
    const [connectionStates, setConnectionStates] = useState({});
    
    // Chat state
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    
    // UI state
    const [showParticipants, setShowParticipants] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [copied, setCopied] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    
    // Refs
    const localVideoRef = useRef(null);
    const socketRef = useRef(null);
    const chatContainerRef = useRef(null);
    const roomIdRef = useRef(null);
    const cleanupRef = useRef(false);

    const isHost = interview?.hostEmail?.toLowerCase() === user?.email?.toLowerCase();

    // Initialize interview
    useEffect(() => {
        let mounted = true;
        cleanupRef.current = false;

        const init = async () => {
            try {
                setLoading(true);
                
                // 1. Fetch interview details
                const interviewData = await getInterviewById(interviewId);
                if (!mounted) return;
                setInterview(interviewData);

                // 2. Join interview (get roomId)
                const joinResult = await joinInterview(interviewId);
                if (!mounted) return;
                roomIdRef.current = joinResult.roomId;
                
                // 3. Load chat history
                try {
                    const chatHistory = await getChatHistory(interviewId);
                    if (mounted) setChatMessages(chatHistory || []);
                } catch (e) {
                    console.warn('Could not load chat history:', e);
                }

                // 4. Initialize media
                const mediaStream = await initializeMedia();
                if (!mounted) return;
                
                // 5. Connect socket (pass stream directly to avoid closure issues)
                await connectSocket(joinResult.roomId, mediaStream);
                
            } catch (err) {
                console.error('Error initializing interview:', err);
                if (mounted) {
                    setError(err.message || 'Failed to join interview');
                    
                    if (err.message?.includes('not invited') || err.message?.includes('unauthorized')) {
                        toast.error('You are not authorized to join this interview');
                        setTimeout(() => navigate('interview-dashboard'), 2000);
                    }
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                    setIsInitializing(false);
                }
            }
        };

        init();

        return () => {
            mounted = false;
            cleanupRef.current = true;
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId]);

    // Update local video element when stream changes
    useEffect(() => {
        const videoElement = localVideoRef.current;
        if (videoElement && localStream) {
            console.log('[Room] Attaching local stream to video element');
            videoElement.srcObject = localStream;
            
            // Force play with user gesture handling
            const playVideo = async () => {
                try {
                    await videoElement.play();
                    console.log('[Room] Local video playing');
                } catch (e) {
                    console.warn('[Room] Local video play blocked:', e.message);
                    // Video might auto-play when user interacts
                }
            };
            playVideo();
        }
        
        return () => {
            // Don't clear srcObject on cleanup - it causes flickering
        };
    }, [localStream]);

    // Scroll chat to bottom
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const initializeMedia = async () => {
        setMediaError(null);
        
        const { stream, error } = await webRTCService.getMediaStream({ video: true, audio: true });
        
        if (error) {
            console.error('Media error:', error);
            setMediaError(error.message);
            
            // Try audio only fallback
            const { stream: audioStream, error: audioError } = await webRTCService.getMediaStream({ video: false, audio: true });
            
            if (audioStream) {
                setLocalStream(audioStream);
                setIsVideoOn(false);
                setIsAudioOn(true);
                setMediaError('Camera unavailable, using audio only');
                toast.success('Connected with audio only');
                return audioStream;
            } else if (audioError) {
                setIsVideoOn(false);
                setIsAudioOn(false);
                setMediaError('Could not access camera or microphone. You can still view others.');
                return null;
            }
        }
        
        if (stream) {
            setLocalStream(stream);
            setIsVideoOn(stream.getVideoTracks().length > 0);
            setIsAudioOn(stream.getAudioTracks().length > 0);
            return stream;
        }
        
        return null;
    };

    const retryMediaAccess = async () => {
        setMediaError(null);
        toast.loading('Requesting camera access...', { id: 'media-retry' });
        
        const stream = await initializeMedia();
        
        if (stream) {
            // Update WebRTC service with new stream
            webRTCService.setLocalStream(stream);
            toast.success('Camera enabled!', { id: 'media-retry' });
        } else {
            toast.error('Could not access camera', { id: 'media-retry' });
        }
    };

    const connectSocket = async (roomId, mediaStream) => {
        return new Promise((resolve, reject) => {
            const socketUrl = getSocketUrl();
            console.log('[Socket] Connecting to:', socketUrl);
            
            socketRef.current = io(socketUrl, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 10,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
                pingTimeout: 30000,
                pingInterval: 25000
            });

            const socket = socketRef.current;

            socket.on('connect', () => {
                console.log('[Socket] Connected:', socket.id);
                setSocketConnected(true);
                
                // Initialize WebRTC service
                webRTCService.init({
                    socket,
                    roomId,
                    onRemoteStream: (socketId, stream) => {
                        console.log('[Room] Received remote stream from:', socketId);
                        setRemoteStreams(prev => ({ ...prev, [socketId]: stream }));
                    },
                    onConnectionStateChange: (socketId, state) => {
                        console.log('[Room] Connection state changed:', socketId, state);
                        setConnectionStates(prev => ({ ...prev, [socketId]: state }));
                    },
                    onError: (err) => {
                        console.error('[Room] WebRTC error:', err);
                        toast.error('Connection error occurred');
                    }
                });
                
                // Set local stream in WebRTC service (use passed stream, not state)
                if (mediaStream) {
                    console.log('[Room] Setting local stream in WebRTC service');
                    webRTCService.setLocalStream(mediaStream);
                }
                
                // Join the room
                socket.emit('join-room', {
                    roomId,
                    userEmail: user?.email || '',
                    userName: user?.name || 'Anonymous',
                    userId: user?._id || ''
                });
                
                resolve();
            });

            socket.on('room-participants', (existingParticipants) => {
                console.log('[Socket] Existing participants:', existingParticipants);
                
                // Filter out self
                const others = existingParticipants.filter(p => 
                    p && p.email && p.email.toLowerCase() !== user?.email?.toLowerCase()
                );
                
                setParticipants(others);
                
                // Proactively initiate connections to existing participants to avoid long "connecting" states
                // Perfect negotiation in webrtcService will handle glare conditions safely.
                others.forEach((participant, idx) => {
                    if (participant?.socketId) {
                        const delay = 200 * idx; // stagger a bit
                        setTimeout(() => {
                            console.log('[Room] Initiating connection to existing participant:', participant.socketId);
                            webRTCService.initiateConnection(participant.socketId);
                        }, delay);
                    }
                });
            });

            socket.on('user-joined', (participant) => {
                console.log('[Socket] User joined:', participant);
                
                if (!participant || !participant.email) return;
                if (participant.email.toLowerCase() === user?.email?.toLowerCase()) return;
                
                toast.success(`${participant.name || 'Someone'} joined`);
                
                setParticipants(prev => {
                    const filtered = prev.filter(p => p?.socketId !== participant.socketId);
                    return [...filtered, participant];
                });
                
                // We are existing user - initiate connection to the new participant
                if (participant.socketId) {
                    console.log('[Room] Initiating connection to:', participant.socketId);
                    webRTCService.initiateConnection(participant.socketId);
                }
            });

            socket.on('user-left', ({ socketId, name }) => {
                console.log('[Socket] User left:', name, socketId);
                toast.info(`${name || 'Someone'} left`);
                
                setParticipants(prev => prev.filter(p => p.socketId !== socketId));
                setRemoteStreams(prev => {
                    const updated = { ...prev };
                    delete updated[socketId];
                    return updated;
                });
                setConnectionStates(prev => {
                    const updated = { ...prev };
                    delete updated[socketId];
                    return updated;
                });
            });

            socket.on('chat-message', (message) => {
                setChatMessages(prev => [...prev, message]);
            });

            socket.on('peer-media-toggle', ({ email, mediaType, enabled }) => {
                console.log(`[Socket] ${email} toggled ${mediaType}: ${enabled}`);
            });

            socket.on('connect_error', (err) => {
                console.error('[Socket] Connection error:', err);
                setSocketConnected(false);
                toast.error('Connection error. Reconnecting...');
            });

            socket.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected:', reason);
                setSocketConnected(false);
                
                if (reason === 'io server disconnect') {
                    // Server disconnected us, try to reconnect
                    socket.connect();
                }
            });

            socket.on('reconnect', () => {
                console.log('[Socket] Reconnected');
                setSocketConnected(true);
                toast.success('Reconnected!');
                
                // Rejoin room
                socket.emit('join-room', {
                    roomId,
                    userEmail: user?.email || '',
                    userName: user?.name || 'Anonymous',
                    userId: user?._id || ''
                });
            });

            // Timeout for initial connection
            setTimeout(() => {
                if (!socket.connected) {
                    reject(new Error('Socket connection timeout'));
                }
            }, 15000);
        });
    };

    const toggleVideo = useCallback(() => {
        if (!localStream) {
            toast.error('Camera not available');
            return;
        }
        
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
            const newState = !videoTrack.enabled;
            videoTrack.enabled = newState;
            webRTCService.toggleVideo(newState);
            setIsVideoOn(newState);
            
            socketRef.current?.emit('toggle-media', {
                roomId: roomIdRef.current,
                mediaType: 'video',
                enabled: newState
            });
        }
    }, [localStream]);

    const toggleAudio = useCallback(() => {
        if (!localStream) {
            toast.error('Microphone not available');
            return;
        }
        
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
            const newState = !audioTrack.enabled;
            audioTrack.enabled = newState;
            webRTCService.toggleAudio(newState);
            setIsAudioOn(newState);
            
            socketRef.current?.emit('toggle-media', {
                roomId: roomIdRef.current,
                mediaType: 'audio',
                enabled: newState
            });
        }
    }, [localStream]);

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            // Stop screen sharing
            webRTCService.stopScreenShare();
            setIsScreenSharing(false);
            
            // Replace screen track with camera track
            if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                    webRTCService.replaceVideoTrack(videoTrack);
                }
            }
            
            socketRef.current?.emit('screen-share-stop', { roomId: roomIdRef.current });
        } else {
            // Start screen sharing
            const { stream, error } = await webRTCService.getScreenStream();
            
            if (error) {
                toast.error(error.message);
                return;
            }
            
            if (stream) {
                setIsScreenSharing(true);
                
                const screenTrack = stream.getVideoTracks()[0];
                webRTCService.replaceVideoTrack(screenTrack);
                
                // Handle user stopping share via browser UI
                screenTrack.onended = () => {
                    toggleScreenShare();
                };
                
                socketRef.current?.emit('screen-share-start', { roomId: roomIdRef.current });
            }
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const message = newMessage.trim();
        setNewMessage('');

        socketRef.current?.emit('chat-message', {
            roomId: roomIdRef.current,
            message,
            senderEmail: user?.email,
            senderName: user?.name
        });

        try {
            await sendChatMessage(interviewId, message);
        } catch (err) {
            console.warn('Could not save message:', err);
        }
    };

    const handleLeave = async () => {
        try {
            await leaveInterview(interviewId);
        } catch (err) {
            console.warn('Error leaving:', err);
        }
        cleanup();
        toast.success('Left the interview');
        navigate('interview-dashboard');
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

    const cleanup = useCallback(() => {
        console.log('[Room] Cleaning up...');
        
        // Stop local stream
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setLocalStream(null);
        
        // Cleanup WebRTC
        webRTCService.cleanup();
        
        // Disconnect socket
        if (socketRef.current) {
            if (roomIdRef.current) {
                socketRef.current.emit('leave-room', { roomId: roomIdRef.current });
            }
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        
        roomIdRef.current = null;
    }, [localStream]);

    const copyRoomLink = () => {
        const link = `${window.location.origin}/interview-room/${interviewId}`;
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
                    <p className="text-gray-400 text-sm mt-2">Setting up camera and microphone...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md px-4">
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
            {/* Media error banner */}
            {mediaError && (
                <div className="bg-yellow-900/50 border-b border-yellow-700 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-yellow-200">
                        <AlertCircle size={18} />
                        <span className="text-sm">{mediaError}</span>
                    </div>
                    <button
                        onClick={retryMediaAccess}
                        className="flex items-center gap-1 px-3 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded transition-all"
                    >
                        <RefreshCw size={14} />
                        Retry
                    </button>
                </div>
            )}

            {/* Connection status banner */}
            {!socketConnected && !loading && (
                <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 flex items-center justify-center gap-2">
                    <WifiOff size={18} className="text-red-300" />
                    <span className="text-red-200 text-sm">Reconnecting to server...</span>
                </div>
            )}

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
                    {socketConnected && (
                        <span className="px-2 py-1 bg-green-600/30 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <Wifi size={12} />
                            Connected
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyRoomLink}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                        title="Copy invite link"
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

            {/* Main content */}
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
                                ref={(el) => {
                                    localVideoRef.current = el;
                                    // Directly attach stream when ref is set
                                    if (el && localStream && el.srcObject !== localStream) {
                                        console.log('[Room] Direct attaching stream to video');
                                        el.srcObject = localStream;
                                        el.play().catch(e => console.warn('Play error:', e));
                                    }
                                }}
                                autoPlay
                                muted
                                playsInline
                                style={{ 
                                    opacity: localStream ? 1 : 0,
                                    transform: 'scaleX(-1)' // Mirror for selfie view
                                }}
                                className="w-full h-full object-cover absolute inset-0 z-10"
                            />
                            
                            {/* Avatar fallback - show when no stream */}
                            {!localStream && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 z-0">
                                    <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-3xl text-white font-bold">
                                            {user?.name?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Camera off overlay */}
                            {localStream && !isVideoOn && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 z-20">
                                    <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-3xl text-white font-bold">
                                            {user?.name?.[0]?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Enable camera button when no stream */}
                            {!localStream && !isInitializing && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                                    <button
                                        onClick={retryMediaAccess}
                                        className="flex flex-col items-center gap-2 p-4 bg-gray-600 hover:bg-gray-500 rounded-xl transition-all"
                                    >
                                        <RefreshCw size={32} className="text-white" />
                                        <span className="text-white text-sm">Enable Camera</span>
                                    </button>
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
                                    {!isVideoOn && (
                                        <span className="p-1 bg-red-500 rounded-full">
                                            <VideoOff size={12} className="text-white" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Remote videos */}
                        {participants.map(participant => (
                            <RemoteVideoTile
                                key={participant.socketId}
                                stream={remoteStreams[participant.socketId]}
                                participantName={participant.name}
                                connectionState={connectionStates[participant.socketId]}
                            />
                        ))}

                        {/* Waiting placeholder */}
                        {participants.length === 0 && (
                            <div className="flex items-center justify-center bg-gray-800/50 rounded-xl aspect-video border-2 border-dashed border-gray-600">
                                <div className="text-center">
                                    <Users size={48} className="text-gray-500 mx-auto mb-2" />
                                    <p className="text-gray-400">Waiting for participants...</p>
                                    <p className="text-gray-500 text-sm mt-1">Share the invite link</p>
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
                            <button onClick={() => setShowChat(false)} className="p-1 text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                            {chatMessages.length === 0 ? (
                                <p className="text-gray-500 text-center text-sm">No messages yet</p>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div 
                                        key={idx}
                                        className={`${
                                            msg.senderEmail === user?.email 
                                                ? 'ml-auto bg-emerald-600' 
                                                : 'mr-auto bg-gray-700'
                                        } max-w-[80%] rounded-lg p-2`}
                                    >
                                        {msg.senderEmail !== user?.email && (
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
                                ))
                            )}
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
                                    disabled={!newMessage.trim()}
                                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                            <button onClick={() => setShowParticipants(false)} className="p-1 text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {/* Self */}
                            <div className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg">
                                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold">
                                        {user?.name?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">{user?.name} (You)</p>
                                    <p className="text-gray-400 text-xs">{isHost ? 'Host' : 'Participant'}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {isAudioOn ? <Mic size={16} className="text-green-500" /> : <MicOff size={16} className="text-red-500" />}
                                    {isVideoOn ? <Video size={16} className="text-green-500" /> : <VideoOff size={16} className="text-red-500" />}
                                </div>
                            </div>
                            
                            {participants.map(participant => (
                                <div key={participant.socketId} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold">
                                            {participant.name?.[0]?.toUpperCase() || 'P'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{participant.name}</p>
                                        <p className="text-gray-400 text-xs truncate">{participant.email}</p>
                                    </div>
                                    <div>
                                        {connectionStates[participant.socketId] === 'connected' ? (
                                            <Wifi size={16} className="text-green-500" />
                                        ) : (
                                            <WifiOff size={16} className="text-yellow-500" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-gray-800 px-4 py-4">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                    {/* Audio */}
                    <button
                        onClick={toggleAudio}
                        disabled={!localStream}
                        className={`p-3 sm:p-4 rounded-full transition-all ${
                            !localStream
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : isAudioOn 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                        title={isAudioOn ? 'Mute' : 'Unmute'}
                    >
                        {isAudioOn ? <Mic size={20} className="sm:w-6 sm:h-6" /> : <MicOff size={20} className="sm:w-6 sm:h-6" />}
                    </button>

                    {/* Video */}
                    <button
                        onClick={toggleVideo}
                        disabled={!localStream}
                        className={`p-3 sm:p-4 rounded-full transition-all ${
                            !localStream
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : isVideoOn 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                        title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isVideoOn ? <Video size={20} className="sm:w-6 sm:h-6" /> : <VideoOff size={20} className="sm:w-6 sm:h-6" />}
                    </button>

                    {/* Retry media if no stream */}
                    {!localStream && !isInitializing && (
                        <button
                            onClick={retryMediaAccess}
                            className="p-3 sm:p-4 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white transition-all"
                            title="Retry camera/microphone"
                        >
                            <RefreshCw size={20} className="sm:w-6 sm:h-6" />
                        </button>
                    )}

                    {/* Screen share */}
                    {interview?.settings?.enableScreenShare !== false && (
                        <button
                            onClick={toggleScreenShare}
                            className={`p-3 sm:p-4 rounded-full transition-all ${
                                isScreenSharing 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                        >
                            {isScreenSharing ? <MonitorOff size={20} className="sm:w-6 sm:h-6" /> : <Monitor size={20} className="sm:w-6 sm:h-6" />}
                        </button>
                    )}

                    {/* Chat */}
                    {interview?.settings?.enableChat !== false && (
                        <button
                            onClick={() => setShowChat(!showChat)}
                            className={`p-3 sm:p-4 rounded-full transition-all ${
                                showChat 
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                            }`}
                            title="Toggle chat"
                        >
                            <MessageSquare size={20} className="sm:w-6 sm:h-6" />
                        </button>
                    )}

                    {/* Participants */}
                    <button
                        onClick={() => setShowParticipants(!showParticipants)}
                        className={`p-3 sm:p-4 rounded-full transition-all ${
                            showParticipants 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                                : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                        title="Show participants"
                    >
                        <Users size={20} className="sm:w-6 sm:h-6" />
                    </button>

                    {/* Leave/End */}
                    <button
                        onClick={() => isHost ? setShowEndConfirm(true) : handleLeave()}
                        className="p-3 sm:p-4 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all"
                        title={isHost ? 'End interview' : 'Leave'}
                    >
                        <Phone size={20} className="rotate-[135deg] sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>

            {/* End confirmation modal */}
            {showEndConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-white mb-2">End Interview?</h3>
                        <p className="text-gray-400 mb-6">
                            This will end the interview for all participants.
                        </p>
                        <div className="flex gap-3 justify-end flex-wrap">
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                            >
                                Continue
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
