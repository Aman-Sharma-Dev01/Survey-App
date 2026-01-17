import React, { useState, useEffect, useRef } from 'react';
import { 
    Video, 
    VideoOff, 
    Mic, 
    MicOff, 
    Settings,
    Check,
    AlertCircle,
    RefreshCw,
    Monitor,
    Volume2
} from 'lucide-react';
/**
 * Media Pre-Check Component
 * Shows camera/mic preview and allows user to test before joining
 */
const MediaPreCheck = ({ 
    onJoin, 
    onCancel, 
    userName,
    interviewTitle 
}) => {
    const [stream, setStream] = useState(null);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAudioOn, setIsAudioOn] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [audioLevel, setAudioLevel] = useState(0);
    const [devices, setDevices] = useState({ video: [], audio: [] });
    const [selectedDevices, setSelectedDevices] = useState({ video: '', audio: '' });
    const [showSettings, setShowSettings] = useState(false);
    
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        initializeMedia();
        enumerateDevices();
        
        return () => {
            cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(e => console.warn('Video play error:', e));
            
            // Set up audio level monitoring
            setupAudioMonitoring(stream);
        }
    }, [stream]);

    const initializeMedia = async (constraints = {}) => {
        setIsLoading(true);
        setError(null);
        
        // Stop existing stream
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        try {
            const mediaConstraints = {
                video: constraints.videoDeviceId 
                    ? { deviceId: { exact: constraints.videoDeviceId } }
                    : {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    },
                audio: constraints.audioDeviceId
                    ? { deviceId: { exact: constraints.audioDeviceId } }
                    : {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
            };
            
            const mediaStream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            setStream(mediaStream);
            setIsVideoOn(true);
            setIsAudioOn(true);
            
            // Store device IDs for selection
            const videoTrack = mediaStream.getVideoTracks()[0];
            const audioTrack = mediaStream.getAudioTracks()[0];
            
            if (videoTrack) {
                setSelectedDevices(prev => ({
                    ...prev,
                    video: videoTrack.getSettings().deviceId || ''
                }));
            }
            if (audioTrack) {
                setSelectedDevices(prev => ({
                    ...prev,
                    audio: audioTrack.getSettings().deviceId || ''
                }));
            }
            
        } catch (err) {
            console.error('Media error:', err);
            
            let errorMessage = 'Could not access camera/microphone';
            
            if (err.name === 'NotAllowedError') {
                errorMessage = 'Permission denied. Please allow camera and microphone access in your browser settings.';
            } else if (err.name === 'NotFoundError') {
                errorMessage = 'No camera or microphone found. Please connect a device.';
            } else if (err.name === 'NotReadableError') {
                errorMessage = 'Camera or microphone is being used by another application.';
            }
            
            setError(errorMessage);
            
            // Try audio only
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ 
                    video: false, 
                    audio: true 
                });
                setStream(audioStream);
                setIsVideoOn(false);
                setIsAudioOn(true);
                setError('Camera unavailable. You can join with audio only.');
            } catch (audioErr) {
                console.error('Audio fallback failed:', audioErr);
                setIsVideoOn(false);
                setIsAudioOn(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const enumerateDevices = async () => {
        try {
            const deviceList = await navigator.mediaDevices.enumerateDevices();
            
            const videoDevices = deviceList.filter(d => d.kind === 'videoinput');
            const audioDevices = deviceList.filter(d => d.kind === 'audioinput');
            
            setDevices({
                video: videoDevices,
                audio: audioDevices
            });
        } catch (err) {
            console.warn('Could not enumerate devices:', err);
        }
    };

    const setupAudioMonitoring = (mediaStream) => {
        try {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            
            const source = audioContextRef.current.createMediaStreamSource(mediaStream);
            source.connect(analyserRef.current);
            
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            
            const updateLevel = () => {
                if (!analyserRef.current) return;
                
                analyserRef.current.getByteFrequencyData(dataArray);
                const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                setAudioLevel(Math.min(100, average * 1.5));
                
                animationRef.current = requestAnimationFrame(updateLevel);
            };
            
            updateLevel();
        } catch (err) {
            console.warn('Audio monitoring not available:', err);
        }
    };

    const cleanup = () => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOn(videoTrack.enabled);
            }
        }
    };

    const toggleAudio = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioOn(audioTrack.enabled);
            }
        }
    };

    const handleDeviceChange = async (type, deviceId) => {
        setSelectedDevices(prev => ({ ...prev, [type]: deviceId }));
        
        await initializeMedia({
            videoDeviceId: type === 'video' ? deviceId : selectedDevices.video,
            audioDeviceId: type === 'audio' ? deviceId : selectedDevices.audio
        });
    };

    const handleJoin = () => {
        // Don't cleanup - pass stream to the room
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        
        // Pass the stream and settings to parent
        onJoin({
            stream,
            isVideoOn,
            isAudioOn
        });
    };

    const handleCancel = () => {
        cleanup();
        onCancel();
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">Ready to join?</h1>
                    {interviewTitle && (
                        <p className="text-gray-400">{interviewTitle}</p>
                    )}
                </div>

                {/* Video Preview */}
                <div className="bg-gray-800 rounded-2xl overflow-hidden mb-6">
                    <div className="relative aspect-video bg-gray-900">
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : stream && isVideoOn ? (
                            <video
                                ref={videoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover transform -scale-x-100"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center">
                                    <span className="text-4xl text-white font-bold">
                                        {userName?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Camera off indicator */}
                        {!isLoading && !isVideoOn && (
                            <div className="absolute top-4 left-4 px-3 py-1 bg-gray-800/80 rounded-lg flex items-center gap-2 text-gray-300 text-sm">
                                <VideoOff size={16} />
                                Camera off
                            </div>
                        )}

                        {/* Settings button */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="absolute top-4 right-4 p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg text-gray-300 transition-all"
                        >
                            <Settings size={20} />
                        </button>
                    </div>

                    {/* Audio level indicator */}
                    {isAudioOn && (
                        <div className="px-4 py-3 bg-gray-800 border-t border-gray-700">
                            <div className="flex items-center gap-3">
                                <Volume2 size={18} className="text-gray-400" />
                                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-75"
                                        style={{ width: `${audioLevel}%` }}
                                    />
                                </div>
                                <span className="text-gray-400 text-xs">Mic test</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg flex items-start gap-3">
                        <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-yellow-200 text-sm">{error}</p>
                            <button
                                onClick={() => initializeMedia()}
                                className="mt-2 text-yellow-400 hover:text-yellow-300 text-sm flex items-center gap-1"
                            >
                                <RefreshCw size={14} />
                                Try again
                            </button>
                        </div>
                    </div>
                )}

                {/* Device settings panel */}
                {showSettings && (
                    <div className="mb-6 p-4 bg-gray-800 rounded-xl space-y-4">
                        <h3 className="text-white font-medium mb-3">Device Settings</h3>
                        
                        {/* Camera select */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Camera</label>
                            <select
                                value={selectedDevices.video}
                                onChange={(e) => handleDeviceChange('video', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {devices.video.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Camera ${devices.video.indexOf(device) + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Microphone select */}
                        <div>
                            <label className="block text-gray-400 text-sm mb-2">Microphone</label>
                            <select
                                value={selectedDevices.audio}
                                onChange={(e) => handleDeviceChange('audio', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                                {devices.audio.map(device => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label || `Microphone ${devices.audio.indexOf(device) + 1}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Controls */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    <button
                        onClick={toggleAudio}
                        disabled={!stream?.getAudioTracks().length}
                        className={`p-4 rounded-full transition-all ${
                            !stream?.getAudioTracks().length
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : isAudioOn 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                    >
                        {isAudioOn ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>
                    
                    <button
                        onClick={toggleVideo}
                        disabled={!stream?.getVideoTracks().length}
                        className={`p-4 rounded-full transition-all ${
                            !stream?.getVideoTracks().length
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : isVideoOn 
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                    >
                        {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                    </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleJoin}
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={20} />
                        Join Now
                    </button>
                </div>

                {/* Join without media option */}
                {!stream && !isLoading && (
                    <button
                        onClick={() => onJoin({ stream: null, isVideoOn: false, isAudioOn: false })}
                        className="w-full mt-4 px-6 py-3 text-gray-400 hover:text-white transition-all text-sm"
                    >
                        Join without camera or microphone
                    </button>
                )}
            </div>
        </div>
    );
};

export default MediaPreCheck;
