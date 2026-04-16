import { useRef, useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import ChatData from '../Hooks/ChatData';

const MessageInput = () => {
    const [text, setText] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const { sendMessage } = ChatData();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file", { 
                style: { background: '#FFF0F0', color: '#BA1A1A', border: '1px solid #FFDAD6' },
                iconTheme: { primary: '#BA1A1A', secondary: '#FFF' }
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // --- Voice Recording ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            setAudioDuration(0);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
                clearInterval(timerRef.current);
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Timer for duration display
            const startTime = Date.now();
            timerRef.current = setInterval(() => {
                setAudioDuration(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } catch (err) {
            console.error("Microphone access denied:", err);
            toast.error("Microphone access denied. Please allow microphone permissions.", {
                style: { background: '#FFF0F0', color: '#BA1A1A', border: '1px solid #FFDAD6' }
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setAudioBlob(null);
        setAudioDuration(0);
        clearInterval(timerRef.current);
    };

    const removeAudio = () => {
        setAudioBlob(null);
        setAudioDuration(0);
    };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !imagePreview && !audioBlob) return;

        try {
            const payload = {
                message: text.trim(),
                image: imagePreview,
            };

            if (audioBlob) {
                payload.audio = await blobToBase64(audioBlob);
            }

            await sendMessage(payload);

            setText("");
            setImagePreview(null);
            setAudioBlob(null);
            setAudioDuration(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Failed to send message:", error);
            toast.error("Failed to send message", {
                style: { background: '#FFF0F0', color: '#BA1A1A', border: '1px solid #FFDAD6' }
            });
        }
    };

    return (
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/15 flex-shrink-0 z-10 w-full mt-auto">
            {/* Image Preview */}
            {imagePreview && (
                <div className="mb-4">
                    <div className="relative inline-block border-2 border-primary/20 rounded-xl p-1 bg-surface-container-low shadow-sm group">
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-24 h-24 object-cover rounded-lg"
                        />
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-error flex items-center justify-center text-on-error rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border-none outline-none"
                            type="button"
                            title="Remove image"
                        >
                            <X size={14} className="stroke-[3]" />
                        </button>
                    </div>
                </div>
            )}

            {/* Audio Preview */}
            {audioBlob && !isRecording && (
                <div className="mb-4">
                    <div className="flex items-center gap-3 bg-surface-container-low rounded-2xl p-3 max-w-sm border border-primary/20">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>graphic_eq</span>
                        <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 flex-1" style={{ maxWidth: '240px' }} />
                        <button
                            onClick={removeAudio}
                            className="w-6 h-6 bg-error flex items-center justify-center text-on-error rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform border-none outline-none"
                            type="button"
                            title="Remove audio"
                        >
                            <X size={14} className="stroke-[3]" />
                        </button>
                    </div>
                </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
                <div className="mb-4">
                    <div className="flex items-center gap-3 bg-error/5 border border-error/20 rounded-2xl p-3 max-w-sm animate-pulse">
                        <span className="w-3 h-3 bg-error rounded-full animate-ping" />
                        <span className="text-sm font-medium text-error">Recording... {formatDuration(audioDuration)}</span>
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={cancelRecording}
                                className="p-1.5 rounded-full hover:bg-error/10 text-error transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center"
                                type="button"
                                title="Cancel recording"
                            >
                                <X size={18} className="stroke-[2.5]" />
                            </button>
                            <button
                                onClick={stopRecording}
                                className="p-1.5 px-3 rounded-full bg-error text-on-error text-xs font-bold border-none cursor-pointer hover:bg-error/90 transition-colors flex items-center gap-1"
                                type="button"
                                title="Stop recording"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>stop</span>
                                Stop
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto w-full">
                <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl shadow-sm border border-transparent focus-within:border-primary/30 focus-within:bg-surface-container-lowest transition-all group">
                    <div className="flex items-center px-1">
                        <button type="button" className="p-2 hover:bg-surface-container-high rounded-full text-outline transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center" title="More options">
                            <span className="material-symbols-outlined">add_circle</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={() => fileInputRef.current?.click()} 
                            className={`p-2 hover:bg-surface-container-high rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center ${imagePreview ? "text-primary" : "text-outline"}`} 
                            title="Attach image"
                        >
                            <span className="material-symbols-outlined">image</span>
                        </button>
                    </div>

                    <textarea
                        className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 py-2.5 px-2 text-on-surface resize-none max-h-32 min-h-[44px] placeholder:text-outline-variant text-sm"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e);
                            }
                        }}
                        rows={1}
                        style={{ height: "auto" }}
                    />

                    <div className="flex items-center gap-2">
                        <button 
                            type="button" 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-2 rounded-full transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center ${
                                isRecording 
                                    ? "text-error bg-error/10 animate-pulse" 
                                    : audioBlob 
                                        ? "text-primary bg-primary/10"
                                        : "text-outline hover:bg-surface-container-high"
                            }`} 
                            title={isRecording ? "Stop recording" : "Voice message"}
                        >
                            <span className="material-symbols-outlined">{isRecording ? "stop_circle" : "mic"}</span>
                        </button>
                        <button
                            type="submit"
                            disabled={!text.trim() && !imagePreview && !audioBlob}
                            className={`p-2.5 rounded-xl shadow-md transition-all active:scale-95 border-none outline-none flex items-center justify-center ${
                                !text.trim() && !imagePreview && !audioBlob
                                ? "bg-surface-container text-outline cursor-not-allowed" 
                                : "bg-primary hover:bg-primary-container text-on-primary cursor-pointer hover:scale-[1.02]"
                            }`}
                            title="Send message"
                        >
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                        </button>
                    </div>
                </div>

                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                />
            </form>
        </div>
    );
};

export default MessageInput;
