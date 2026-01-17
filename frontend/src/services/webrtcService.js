/**
 * WebRTC Service - Handles all WebRTC peer connection logic
 * This is a robust implementation that handles:
 * - Peer connection management
 * - Media stream handling
 * - Signaling coordination
 * - ICE candidate queuing
 * - Connection recovery
 */

// ICE servers configuration with STUN and TURN
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // Free TURN servers from OpenRelay
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

class WebRTCService {
    constructor() {
        this.peerConnections = new Map();
        this.pendingCandidates = new Map();
        this.localStream = null;
        this.screenStream = null;
        this.socket = null;
        this.roomId = null;
        this.onRemoteStream = null;
        this.onConnectionStateChange = null;
        this.onError = null;
        this.isPolite = false; // For perfect negotiation pattern
        this.makingOffer = new Map();
        this.ignoreOffer = new Map();
    }

    /**
     * Initialize the service with socket and callbacks
     */
    init({ socket, roomId, onRemoteStream, onConnectionStateChange, onError }) {
        this.socket = socket;
        this.roomId = roomId;
        this.onRemoteStream = onRemoteStream;
        this.onConnectionStateChange = onConnectionStateChange;
        this.onError = onError;

        // Set up socket listeners for WebRTC signaling
        this.setupSocketListeners();
    }

    /**
     * Set local media stream
     */
    setLocalStream(stream) {
        this.localStream = stream;
        
        // Update tracks on existing peer connections
        this.peerConnections.forEach((pc) => {
            this.updateTracksOnPeerConnection(pc, stream);
        });
    }

    /**
     * Get media stream with proper error handling
     */
    async getMediaStream(constraints = { video: true, audio: true }) {
        try {
            // Check for media devices support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Media devices not supported in this browser');
            }

            const defaultConstraints = {
                video: constraints.video ? {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    facingMode: 'user',
                    frameRate: { ideal: 30, max: 60 }
                } : false,
                audio: constraints.audio ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : false
            };

            console.log('[WebRTC] Requesting media with constraints:', defaultConstraints);
            const stream = await navigator.mediaDevices.getUserMedia(defaultConstraints);
            
            console.log('[WebRTC] Got media stream:', {
                videoTracks: stream.getVideoTracks().length,
                audioTracks: stream.getAudioTracks().length
            });

            this.localStream = stream;
            return { stream, error: null };
        } catch (error) {
            console.error('[WebRTC] Error getting media:', error);
            
            let errorMessage = 'Could not access camera/microphone';
            let canRetry = true;

            switch (error.name) {
                case 'NotAllowedError':
                case 'PermissionDeniedError':
                    errorMessage = 'Permission denied. Please allow camera/microphone access.';
                    break;
                case 'NotFoundError':
                case 'DevicesNotFoundError':
                    errorMessage = 'No camera or microphone found.';
                    break;
                case 'NotReadableError':
                case 'TrackStartError':
                    errorMessage = 'Camera/microphone is in use by another app.';
                    break;
                case 'OverconstrainedError':
                    errorMessage = 'Camera does not support requested settings.';
                    break;
                case 'AbortError':
                    errorMessage = 'Media access was aborted.';
                    break;
                default:
                    errorMessage = error.message || 'Failed to access media devices.';
            }

            return { stream: null, error: { message: errorMessage, canRetry, originalError: error } };
        }
    }

    /**
     * Get screen share stream
     */
    async getScreenStream() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'monitor'
                },
                audio: true
            });

            this.screenStream = stream;

            // Handle when user stops sharing via browser UI
            stream.getVideoTracks()[0].onended = () => {
                this.stopScreenShare();
            };

            return { stream, error: null };
        } catch (error) {
            console.error('[WebRTC] Screen share error:', error);
            if (error.name === 'AbortError' || error.name === 'NotAllowedError') {
                return { stream: null, error: null }; // User cancelled
            }
            return { stream: null, error: { message: 'Could not start screen sharing', originalError: error } };
        }
    }

    /**
     * Stop screen sharing
     */
    stopScreenShare() {
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
    }

    /**
     * Set up socket listeners for WebRTC signaling
     */
    setupSocketListeners() {
        if (!this.socket) return;

        this.socket.on('offer', async (data) => {
            console.log('[WebRTC] Received offer from:', data.fromSocketId);
            await this.handleOffer(data);
        });

        this.socket.on('answer', async (data) => {
            console.log('[WebRTC] Received answer from:', data.fromSocketId);
            await this.handleAnswer(data);
        });

        this.socket.on('ice-candidate', async (data) => {
            console.log('[WebRTC] Received ICE candidate from:', data.fromSocketId);
            await this.handleIceCandidate(data);
        });

        this.socket.on('user-left', ({ socketId }) => {
            console.log('[WebRTC] User left:', socketId);
            this.closePeerConnection(socketId);
        });
    }

    /**
     * Create or get existing peer connection for a remote peer
     */
    createPeerConnection(remoteSocketId) {
        // Return existing connection if it exists and is not closed
        let pc = this.peerConnections.get(remoteSocketId);
        if (pc && pc.connectionState !== 'closed') {
            return pc;
        }

        console.log('[WebRTC] Creating peer connection for:', remoteSocketId);

        pc = new RTCPeerConnection(ICE_SERVERS);
        this.peerConnections.set(remoteSocketId, pc);
        this.makingOffer.set(remoteSocketId, false);
        this.ignoreOffer.set(remoteSocketId, false);

        // Add local tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                console.log('[WebRTC] Adding local track:', track.kind);
                pc.addTrack(track, this.localStream);
            });
        }

        // Ensure we can receive remote tracks even if local tracks are off
        const hasLocalVideo = !!(this.localStream && this.localStream.getVideoTracks().length > 0);
        const hasLocalAudio = !!(this.localStream && this.localStream.getAudioTracks().length > 0);

        if (!hasLocalVideo) {
            try {
                pc.addTransceiver('video', { direction: 'recvonly' });
                console.log('[WebRTC] Added recvonly video transceiver');
            } catch (e) {
                console.warn('[WebRTC] Failed to add video transceiver:', e);
            }
        }

        if (!hasLocalAudio) {
            try {
                pc.addTransceiver('audio', { direction: 'recvonly' });
                console.log('[WebRTC] Added recvonly audio transceiver');
            } catch (e) {
                console.warn('[WebRTC] Failed to add audio transceiver:', e);
            }
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] Sending ICE candidate to:', remoteSocketId);
                this.socket?.emit('ice-candidate', {
                    roomId: this.roomId,
                    candidate: event.candidate,
                    toSocketId: remoteSocketId
                });
            }
        };

        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
            console.log('[WebRTC] ICE connection state:', pc.iceConnectionState, 'for:', remoteSocketId);
            
            if (pc.iceConnectionState === 'failed') {
                console.log('[WebRTC] ICE failed, restarting ICE...');
                pc.restartIce();
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', pc.connectionState, 'for:', remoteSocketId);
            
            this.onConnectionStateChange?.(remoteSocketId, pc.connectionState);

            if (pc.connectionState === 'failed') {
                console.log('[WebRTC] Connection failed, attempting reconnection...');
                this.reconnectPeer(remoteSocketId);
            }
        };

        // Handle incoming tracks (remote media)
        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote track:', event.track.kind, 'from:', remoteSocketId);
            
            if (event.streams && event.streams[0]) {
                this.onRemoteStream?.(remoteSocketId, event.streams[0]);
            }
        };

        // Handle negotiation needed (for renegotiation)
        pc.onnegotiationneeded = async () => {
            console.log('[WebRTC] Negotiation needed for:', remoteSocketId);
            
            try {
                this.makingOffer.set(remoteSocketId, true);
                await pc.setLocalDescription();
                
                this.socket?.emit('offer', {
                    roomId: this.roomId,
                    offer: pc.localDescription,
                    toSocketId: remoteSocketId
                });
            } catch (err) {
                console.error('[WebRTC] Error in negotiation:', err);
            } finally {
                this.makingOffer.set(remoteSocketId, false);
            }
        };

        return pc;
    }

    /**
     * Initiate connection to a new peer (send offer)
     */
    async initiateConnection(remoteSocketId) {
        console.log('[WebRTC] Initiating connection to:', remoteSocketId);
        
        const pc = this.createPeerConnection(remoteSocketId);
        
        // Always create and send offer manually to ensure connection starts
        // The onnegotiationneeded event may not fire if tracks were added during creation
        try {
            this.makingOffer.set(remoteSocketId, true);
            const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            await pc.setLocalDescription(offer);
            
            console.log('[WebRTC] Sending offer to:', remoteSocketId);
            this.socket?.emit('offer', {
                roomId: this.roomId,
                offer: pc.localDescription,
                toSocketId: remoteSocketId
            });
        } catch (err) {
            console.error('[WebRTC] Error creating offer:', err);
            this.onError?.(err);
        } finally {
            this.makingOffer.set(remoteSocketId, false);
        }
    }

    /**
     * Handle incoming offer (Perfect Negotiation pattern)
     */
    async handleOffer({ offer, fromSocketId }) {
        const pc = this.createPeerConnection(fromSocketId);
        
        // Perfect negotiation: check if we should ignore this offer
        const offerCollision = this.makingOffer.get(fromSocketId) || pc.signalingState !== 'stable';
        
        // Determine politeness based on socket ID comparison (higher ID is polite)
        const isPolite = this.socket?.id < fromSocketId;
        this.ignoreOffer.set(fromSocketId, !isPolite && offerCollision);
        
        if (this.ignoreOffer.get(fromSocketId)) {
            console.log('[WebRTC] Ignoring offer due to collision from:', fromSocketId);
            return;
        }

        try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Process any queued ICE candidates
            await this.processQueuedCandidates(fromSocketId);
            
            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            console.log('[WebRTC] Sending answer to:', fromSocketId);
            this.socket?.emit('answer', {
                roomId: this.roomId,
                answer: pc.localDescription,
                toSocketId: fromSocketId
            });
        } catch (err) {
            console.error('[WebRTC] Error handling offer:', err);
            this.onError?.(err);
        }
    }

    /**
     * Handle incoming answer
     */
    async handleAnswer({ answer, fromSocketId }) {
        const pc = this.peerConnections.get(fromSocketId);
        if (!pc) {
            console.warn('[WebRTC] No peer connection for answer from:', fromSocketId);
            return;
        }

        try {
            // Only set remote description if we're waiting for an answer
            if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                
                // Process any queued ICE candidates
                await this.processQueuedCandidates(fromSocketId);
            } else {
                console.warn('[WebRTC] Unexpected answer in state:', pc.signalingState);
            }
        } catch (err) {
            console.error('[WebRTC] Error handling answer:', err);
            this.onError?.(err);
        }
    }

    /**
     * Handle incoming ICE candidate
     */
    async handleIceCandidate({ candidate, fromSocketId }) {
        const pc = this.peerConnections.get(fromSocketId);
        
        // If no peer connection or remote description not set, queue the candidate
        if (!pc || !pc.remoteDescription || !pc.remoteDescription.type) {
            console.log('[WebRTC] Queueing ICE candidate from:', fromSocketId);
            if (!this.pendingCandidates.has(fromSocketId)) {
                this.pendingCandidates.set(fromSocketId, []);
            }
            this.pendingCandidates.get(fromSocketId).push(candidate);
            return;
        }

        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            // Ignore errors for candidates that arrive after connection is established
            if (!this.ignoreOffer.get(fromSocketId)) {
                console.warn('[WebRTC] Error adding ICE candidate:', err);
            }
        }
    }

    /**
     * Process queued ICE candidates
     */
    async processQueuedCandidates(socketId) {
        const candidates = this.pendingCandidates.get(socketId);
        if (!candidates || candidates.length === 0) return;

        const pc = this.peerConnections.get(socketId);
        if (!pc || !pc.remoteDescription) return;

        console.log('[WebRTC] Processing', candidates.length, 'queued candidates for:', socketId);

        for (const candidate of candidates) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.warn('[WebRTC] Error adding queued ICE candidate:', err);
            }
        }

        this.pendingCandidates.set(socketId, []);
    }

    /**
     * Update tracks on an existing peer connection
     */
    updateTracksOnPeerConnection(pc, stream) {
        if (!stream) return;

        const senders = pc.getSenders();
        
        stream.getTracks().forEach(track => {
            const sender = senders.find(s => s.track?.kind === track.kind);
            if (sender) {
                sender.replaceTrack(track);
            } else {
                pc.addTrack(track, stream);
            }
        });
    }

    /**
     * Replace video track (for screen sharing)
     */
    replaceVideoTrack(newTrack) {
        this.peerConnections.forEach((pc) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
                sender.replaceTrack(newTrack);
            }
        });
    }

    /**
     * Attempt to reconnect to a peer
     */
    async reconnectPeer(remoteSocketId) {
        console.log('[WebRTC] Attempting reconnection to:', remoteSocketId);
        
        // Close existing connection
        this.closePeerConnection(remoteSocketId);
        
        // Wait a bit before reconnecting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reinitiate connection
        await this.initiateConnection(remoteSocketId);
    }

    /**
     * Close a specific peer connection
     */
    closePeerConnection(remoteSocketId) {
        const pc = this.peerConnections.get(remoteSocketId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(remoteSocketId);
            this.pendingCandidates.delete(remoteSocketId);
            this.makingOffer.delete(remoteSocketId);
            this.ignoreOffer.delete(remoteSocketId);
            console.log('[WebRTC] Closed peer connection:', remoteSocketId);
        }
    }

    /**
     * Clean up all resources
     */
    cleanup() {
        console.log('[WebRTC] Cleaning up...');
        
        // Close all peer connections
        this.peerConnections.forEach((pc) => {
            try {
                pc.close();
            } catch (e) {
                console.warn('[WebRTC] Error closing peer connection:', e);
            }
        });
        this.peerConnections.clear();
        this.pendingCandidates.clear();
        this.makingOffer.clear();
        this.ignoreOffer.clear();

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
            });
            this.localStream = null;
        }

        // Stop screen stream
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }

        // Clear socket listeners
        if (this.socket) {
            this.socket.off('offer');
            this.socket.off('answer');
            this.socket.off('ice-candidate');
            this.socket.off('user-left');
        }

        this.socket = null;
        this.roomId = null;
    }

    /**
     * Toggle video track
     */
    toggleVideo(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    /**
     * Toggle audio track
     */
    toggleAudio(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    /**
     * Get connection stats for debugging
     */
    async getStats(remoteSocketId) {
        const pc = this.peerConnections.get(remoteSocketId);
        if (!pc) return null;

        try {
            const stats = await pc.getStats();
            const result = {};
            
            stats.forEach(report => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    result.connectionType = report.remoteCandidateType;
                    result.bytesReceived = report.bytesReceived;
                    result.bytesSent = report.bytesSent;
                }
            });

            return result;
        } catch (err) {
            console.warn('[WebRTC] Error getting stats:', err);
            return null;
        }
    }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
export default webRTCService;
