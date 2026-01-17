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
    Check,
    RefreshCw
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

// ICE servers for WebRTC (STUN + free TURN servers for better connectivity)
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Free TURN servers from OpenRelay (for users behind strict NATs)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 10
};

// Component to handle remote video stream properly
const RemoteVideo = ({ stream, participantName }) => {
    const videoRef = useRef(null);
    
    useEffect(() => {
        if (videoRef.current && stream) {
            // Only set srcObject if it's different
            if (videoRef.current.srcObject !== stream) {
                videoRef.current.srcObject = stream;
                // Play with user interaction consideration
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {
                        // Auto-play was prevented, video will play when user interacts
                        console.log('Auto-play prevented for remote video, will play on interaction');
                    });
                }
            }
        }
    }, [stream]);

    if (!stream) {
        return (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-3xl text-white font-bold">
                        {participantName?.[0]?.toUpperCase() || 'P'}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
        />
    );
};

const InterviewRoom = ({ interviewId, navigate }) => {
    const { user } = useAuth();
    const [interview, setInterview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Media states
    const [localStream, setLocalStream] = useState(null);
    // Note: screenStream state is managed via screenStreamRef for reliable access
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [isMediaInitializing, setIsMediaInitializing] = useState(true);
    
    // Participants and connections
    const [participants, setParticipants] = useState([]);
    // Note: peerConnections are managed via peerConnectionsRef for reliable access
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
    
    // Refs - Use refs for media stream to avoid stale closure issues
    const localVideoRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnectionsRef = useRef({});
    const chatContainerRef = useRef(null);
    const localStreamRef = useRef(null); // Keep track of stream in ref for reliable access
    const screenStreamRef = useRef(null);
    const roomIdRef = useRef(null); // Keep track of roomId in ref to avoid stale closures
    const pendingIceCandidatesRef = useRef({}); // Queue ICE candidates until remote description is set

    const isHost = interview?.hostEmail?.toLowerCase() === user?.email?.toLowerCase();

    // Initialize interview and media
    useEffect(() => {
        initializeInterview();
        return () => {
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [interviewId]);

    // Set video source when stream is ready and video element is mounted
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            console.log('Setting local video srcObject');
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(err => {
                console.warn('Could not auto-play local video:', err);
            });
        }
    }, [localStream]);

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
            
            // Store roomId in ref for reliable access in callbacks
            roomIdRef.current = joinResult.roomId;
            
            // Load chat history
            try {
                const chatHistory = await getChatHistory(interviewId);
                setChatMessages(chatHistory);
            } catch (e) {
                console.warn('Could not load chat history:', e);
            }

            // Initialize media FIRST before connecting socket
            // This ensures we have tracks to add to peer connections
            await initializeMedia();
            
            // Connect to socket after media is ready
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
        setIsMediaInitializing(true);
        setMediaError(null);
        
        try {
            // First check if mediaDevices is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Media devices are not supported in this browser');
            }

            // Request permissions with explicit constraints
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            console.log('Requesting media with constraints:', constraints);
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            console.log('Got media stream:', stream.getTracks().map(t => ({ kind: t.kind, label: t.label, enabled: t.enabled })));
            
            // Store in both state and ref
            localStreamRef.current = stream;
            setLocalStream(stream);
            
            // Check which tracks we actually got
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();
            
            setIsVideoOn(videoTracks.length > 0 && videoTracks[0].enabled);
            setIsAudioOn(audioTracks.length > 0 && audioTracks[0].enabled);
            
            // Set video element source
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                // Ensure the video plays
                try {
                    await localVideoRef.current.play();
                } catch (playError) {
                    console.warn('Auto-play blocked, user may need to interact:', playError);
                }
            }
            
            setMediaError(null);
            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            
            let errorMessage = 'Could not access camera/microphone.';
            
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = 'Camera/microphone permission denied. Please allow access in your browser settings.';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = 'No camera or microphone found. Please connect a device.';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage = 'Camera/microphone is already in use by another application.';
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = 'Could not satisfy media constraints. Trying with defaults...';
            } else if (err.message) {
                errorMessage = err.message;
            }
            
            setMediaError(errorMessage);
            toast.error(errorMessage);
            
            // Try fallback: audio only
            try {
                console.log('Trying audio-only fallback...');
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });
                
                localStreamRef.current = audioStream;
                setLocalStream(audioStream);
                setIsVideoOn(false);
                setIsAudioOn(true);
                setMediaError('Camera unavailable, using audio only');
                toast.success('Connected with audio only');
                return audioStream;
            } catch (audioErr) {
                console.error('Could not access audio either:', audioErr);
                setIsVideoOn(false);
                setIsAudioOn(false);
                setMediaError('Could not access camera or microphone. You can still view others and use chat.');
                return null;
            }
        } finally {
            setIsMediaInitializing(false);
        }
    };

    // Function to retry media access
    const retryMediaAccess = async () => {
        // Stop any existing streams first
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
        }
        
        const stream = await initializeMedia();
        
        // If we have a stream and peer connections, update them with new tracks
        if (stream && Object.keys(peerConnectionsRef.current).length > 0) {
            stream.getTracks().forEach(track => {
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === track.kind);
                    if (sender) {
                        sender.replaceTrack(track);
                    } else {
                        pc.addTrack(track, stream);
                    }
                });
            });
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
                userEmail: user?.email || '',
                userName: user?.name || 'Anonymous',
                userId: user?._id || ''
            });
        });

        socket.on('room-participants', (existingParticipants) => {
            console.log('Existing participants:', existingParticipants);
            // Filter out self and any invalid participants
            const validParticipants = existingParticipants.filter(p => p && p.email && p.email !== user?.email);
            setParticipants(validParticipants);
            
            // DON'T create offers here - wait for existing participants to send us offers
            // The existing participants will receive 'user-joined' and initiate the connection
            // We just prepare empty peer connections that will receive offers
            validParticipants.forEach(participant => {
                if (participant.socketId) {
                    // Create peer connection but DON'T initiate (initiator=false)
                    // We will receive an offer from them
                    console.log('Preparing to receive offer from:', participant.name);
                }
            });
        });

        socket.on('user-joined', (participant) => {
            console.log('User joined:', participant);
            if (!participant || !participant.email) {
                console.warn('Invalid participant data received');
                return;
            }
            toast.success(`${participant.name || 'Someone'} joined the interview`);
            setParticipants(prev => [...prev.filter(p => p?.email !== participant.email), participant]);
            
            // WE are the existing user, so WE initiate the connection
            // Create peer connection and send offer to the new participant
            if (participant.socketId) {
                console.log('Initiating connection to new participant:', participant.name);
                createPeerConnection(participant.socketId, true);
            }
        });

        socket.on('user-left', ({ socketId, name }) => {
            console.log('User left:', name);
            toast.info(`${name} left the interview`);
            setParticipants(prev => prev.filter(p => p.socketId !== socketId));
            
            // Close peer connection
            if (peerConnectionsRef.current[socketId]) {
                peerConnectionsRef.current[socketId].close();
                delete peerConnectionsRef.current[socketId];
            }
            
            // Clean up pending ICE candidates
            if (pendingIceCandidatesRef.current[socketId]) {
                delete pendingIceCandidatesRef.current[socketId];
            }
            
            setRemoteStreams(prev => {
                const updated = { ...prev };
                delete updated[socketId];
                return updated;
            });
        });

        socket.on('offer', async ({ offer, fromSocketId, fromName }) => {
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

        socket.on('peer-media-toggle', ({ email, mediaType, enabled }) => {
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

        // Add local tracks - use ref for reliable access
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => {
                console.log('Adding track to peer connection:', track.kind, track.label);
                pc.addTrack(track, stream);
            });
        } else {
            console.warn('No local stream available when creating peer connection');
        }

        // Handle ICE candidates - use roomIdRef for reliable access
        pc.onicecandidate = (event) => {
            if (event.candidate && roomIdRef.current) {
                socketRef.current?.emit('ice-candidate', {
                    roomId: roomIdRef.current,
                    candidate: event.candidate,
                    toSocketId: remoteSocketId
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind, event.streams);
            if (event.streams && event.streams[0]) {
                setRemoteStreams(prev => ({
                    ...prev,
                    [remoteSocketId]: event.streams[0]
                }));
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${remoteSocketId}:`, pc.connectionState);
            if (pc.connectionState === 'failed') {
                console.error('Peer connection failed, attempting to restart ICE');
                pc.restartIce();
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log(`ICE connection state with ${remoteSocketId}:`, pc.iceConnectionState);
        };

        // If initiator, create and send offer
        if (initiator && roomIdRef.current) {
            try {
                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                await pc.setLocalDescription(offer);
                
                socketRef.current?.emit('offer', {
                    roomId: roomIdRef.current,
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
        console.log('Handling offer from:', fromSocketId);
        
        // Check if we already have a peer connection in a conflicting state
        let pc = peerConnectionsRef.current[fromSocketId];
        
        if (pc) {
            // If we already have a connection and it's not in the right state, reset it
            if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
                console.log('Existing PC in state:', pc.signalingState, '- will handle offer');
            }
            // If we sent an offer too (glare), we need to rollback
            if (pc.signalingState === 'have-local-offer') {
                console.log('Glare detected - rolling back local offer');
                await pc.setLocalDescription({ type: 'rollback' });
            }
        } else {
            // Create new peer connection (we're receiving, not initiating)
            pc = await createPeerConnection(fromSocketId, false);
        }
        
        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Process any queued ICE candidates
            await processQueuedIceCandidates(fromSocketId);
            
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            if (roomIdRef.current) {
                console.log('Sending answer to:', fromSocketId);
                socketRef.current?.emit('answer', {
                    roomId: roomIdRef.current,
                    answer,
                    toSocketId: fromSocketId
                });
            }
        } catch (err) {
            console.error('Error handling offer:', err);
        }
    };

    const handleAnswer = async (answer, fromSocketId) => {
        const pc = peerConnectionsRef.current[fromSocketId];
        if (!pc) {
            console.warn('No peer connection found for answer from:', fromSocketId);
            return;
        }
        
        // Only set remote description if we're in the right state
        if (pc.signalingState !== 'have-local-offer') {
            console.warn('Received answer but signaling state is:', pc.signalingState);
            return;
        }
        
        try {
            console.log('Setting remote answer from:', fromSocketId);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            
            // Process any queued ICE candidates
            await processQueuedIceCandidates(fromSocketId);
        } catch (err) {
            console.error('Error handling answer:', err);
        }
    };

    const processQueuedIceCandidates = async (socketId) => {
        const candidates = pendingIceCandidatesRef.current[socketId] || [];
        if (candidates.length > 0) {
            console.log(`Processing ${candidates.length} queued ICE candidates for:`, socketId);
            const pc = peerConnectionsRef.current[socketId];
            if (pc) {
                for (const candidate of candidates) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (err) {
                        console.warn('Error adding queued ICE candidate:', err);
                    }
                }
            }
            pendingIceCandidatesRef.current[socketId] = [];
        }
    };

    const handleIceCandidate = async (candidate, fromSocketId) => {
        const pc = peerConnectionsRef.current[fromSocketId];
        
        if (!pc) {
            // Queue candidate - peer connection not created yet
            console.log('Queueing ICE candidate - no peer connection yet');
            if (!pendingIceCandidatesRef.current[fromSocketId]) {
                pendingIceCandidatesRef.current[fromSocketId] = [];
            }
            pendingIceCandidatesRef.current[fromSocketId].push(candidate);
            return;
        }
        
        // Only add ICE candidate if remote description is set
        if (!pc.remoteDescription) {
            console.log('Queueing ICE candidate - remote description not set');
            if (!pendingIceCandidatesRef.current[fromSocketId]) {
                pendingIceCandidatesRef.current[fromSocketId] = [];
            }
            pendingIceCandidatesRef.current[fromSocketId].push(candidate);
            return;
        }
        
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.error('Error adding ICE candidate:', err);
        }
    };

    const toggleVideo = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) {
            toast.error('Camera not available. Click retry to enable camera.');
            return;
        }
        
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const newEnabled = !videoTrack.enabled;
            videoTrack.enabled = newEnabled;
            setIsVideoOn(newEnabled);
            
            console.log('Video toggled:', newEnabled ? 'ON' : 'OFF');
            
            if (roomIdRef.current) {
                socketRef.current?.emit('toggle-media', {
                    roomId: roomIdRef.current,
                    mediaType: 'video',
                    enabled: newEnabled
                });
            }
        } else {
            toast.error('No video track available');
        }
    }, []);

    const toggleAudio = useCallback(() => {
        const stream = localStreamRef.current;
        if (!stream) {
            toast.error('Microphone not available. Click retry to enable microphone.');
            return;
        }
        
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
            const newEnabled = !audioTrack.enabled;
            audioTrack.enabled = newEnabled;
            setIsAudioOn(newEnabled);
            
            console.log('Audio toggled:', newEnabled ? 'ON' : 'OFF');
            
            if (roomIdRef.current) {
                socketRef.current?.emit('toggle-media', {
                    roomId: roomIdRef.current,
                    mediaType: 'audio',
                    enabled: newEnabled
                });
            }
        } else {
            toast.error('No audio track available');
        }
    }, []);

    const toggleScreenShare = async () => {
        if (isScreenSharing) {
            // Stop screen sharing
            const currentScreenStream = screenStreamRef.current;
            if (currentScreenStream) {
                currentScreenStream.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }
            setIsScreenSharing(false);
            
            // Replace screen track with camera track in all peer connections
            const stream = localStreamRef.current;
            if (stream) {
                const videoTrack = stream.getVideoTracks()[0];
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender && videoTrack) {
                        sender.replaceTrack(videoTrack);
                    }
                });
            }
            
            if (roomIdRef.current) {
                socketRef.current?.emit('screen-share-stop', { roomId: roomIdRef.current });
            }
        } else {
            // Start screen sharing
            try {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ 
                    video: {
                        cursor: 'always'
                    },
                    audio: true 
                });
                
                screenStreamRef.current = displayStream;
                setIsScreenSharing(true);
                
                // Replace camera track with screen track in all peer connections
                const screenTrack = displayStream.getVideoTracks()[0];
                Object.values(peerConnectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) {
                        sender.replaceTrack(screenTrack);
                    }
                });
                
                // Handle screen share stop (when user clicks browser's stop sharing button)
                screenTrack.onended = () => {
                    toggleScreenShare();
                };
                
                if (roomIdRef.current) {
                    socketRef.current?.emit('screen-share-start', { roomId: roomIdRef.current });
                }
            } catch (err) {
                console.error('Error starting screen share:', err);
                if (err.name !== 'AbortError') { // Don't show error if user cancelled
                    toast.error('Could not start screen sharing');
                }
            }
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        const message = newMessage.trim();
        setNewMessage('');

        // Emit via socket for real-time
        if (roomIdRef.current) {
            socketRef.current?.emit('chat-message', {
                roomId: roomIdRef.current,
                message,
                senderEmail: user.email,
                senderName: user.name
            });
        }

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

    const cleanup = useCallback(() => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('Stopped track:', track.kind);
            });
            localStreamRef.current = null;
        }
        
        // Stop screen stream
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }
        
        // Close all peer connections
        Object.values(peerConnectionsRef.current).forEach(pc => {
            try {
                pc.close();
            } catch (e) {
                console.warn('Error closing peer connection:', e);
            }
        });
        peerConnectionsRef.current = {};
        
        // Disconnect socket
        if (socketRef.current) {
            if (roomIdRef.current) {
                socketRef.current.emit('leave-room', { roomId: roomIdRef.current });
            }
            socketRef.current.disconnect();
        }
        
        // Clear roomId ref
        roomIdRef.current = null;
    }, []);

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
                    {isMediaInitializing && (
                        <p className="text-gray-400 text-sm mt-2">Setting up camera and microphone...</p>
                    )}
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
                                webkit-playsinline="true"
                                className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                                onLoadedMetadata={(e) => {
                                    // Ensure video plays when metadata is loaded
                                    e.target.play().catch(err => console.warn('Video play failed:', err));
                                }}
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
                            {/* Media retry button on video when no stream */}
                            {!localStream && !isMediaInitializing && (
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
                                </div>
                            </div>
                        </div>

                        {/* Remote videos */}
                        {participants.map(participant => (
                            <div 
                                key={participant.socketId} 
                                className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video"
                            >
                                <RemoteVideo 
                                    stream={remoteStreams[participant.socketId]} 
                                    participantName={participant.name}
                                />
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
                        disabled={!localStream && !isMediaInitializing}
                        className={`p-4 rounded-full transition-all ${
                            !localStream && !isMediaInitializing
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : isAudioOn 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                        title={!localStream ? 'Microphone unavailable' : isAudioOn ? 'Mute' : 'Unmute'}
                    >
                        {isAudioOn ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>

                    {/* Video toggle */}
                    <button
                        onClick={toggleVideo}
                        disabled={!localStream && !isMediaInitializing}
                        className={`p-4 rounded-full transition-all ${
                            !localStream && !isMediaInitializing
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : isVideoOn 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                        title={!localStream ? 'Camera unavailable' : isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>

                    {/* Retry media button when no stream */}
                    {!localStream && !isMediaInitializing && (
                        <button
                            onClick={retryMediaAccess}
                            className="p-4 rounded-full bg-yellow-600 hover:bg-yellow-500 text-white transition-all"
                            title="Retry camera/microphone access"
                        >
                            <RefreshCw size={24} />
                        </button>
                    )}

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
