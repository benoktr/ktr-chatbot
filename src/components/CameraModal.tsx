
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setCapturedImage(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      if (err instanceof Error) {
        // Handle specific error names for camera access
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            // Check if the user dismissed the prompt vs. permanently denied it.
            if (err.message.includes("Permission dismissed")) {
                 setError("Camera permission request was dismissed. Click 'Retry' to ask again.");
            } else {
                 setError("Camera permission denied. Please enable camera access in your browser settings.");
            }
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            setError("No camera found. Please ensure a camera is connected and enabled.");
        } else {
            setError("Could not access the camera. Please try again.");
        }
      } else {
        setError("An unknown error occurred while accessing the camera.");
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) {
    return null;
  }

  const handleTakePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleUsePhoto = () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          onCapture(file);
          onClose();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 shadow-2xl relative w-full max-w-2xl aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors z-10" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {error && (
            <div className="h-full flex flex-col justify-center items-center text-center text-red-400 p-4">
                <p className="text-lg">{error}</p>
                {error.includes("dismissed") ? (
                     <button onClick={startCamera} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Retry</button>
                ) : (
                     <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Close</button>
                )}
            </div>
        )}
        {!error && (
            <div className="w-full h-full relative">
                <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover rounded-md ${capturedImage ? 'hidden' : 'block'}`}></video>
                <canvas ref={canvasRef} className="hidden"></canvas>
                {capturedImage && <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain rounded-md" />}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-4">
                    {capturedImage ? (
                        <>
                            <button onClick={handleRetake} className="px-6 py-3 bg-slate-700/80 rounded-full text-white font-semibold hover:bg-slate-600 transition-colors">Retake</button>
                            <button onClick={handleUsePhoto} className="px-6 py-3 bg-blue-600 rounded-full text-white font-semibold hover:bg-blue-700 transition-colors">Use Photo</button>
                        </>
                    ) : (
                        <button onClick={handleTakePhoto} className="w-16 h-16 rounded-full bg-white/30 border-4 border-white flex items-center justify-center hover:bg-white/50 transition-colors" aria-label="Take Photo">
                            <div className="w-12 h-12 rounded-full bg-white"></div>
                        </button>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default CameraModal;
