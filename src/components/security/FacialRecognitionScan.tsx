import React, { useState, useEffect, useRef } from 'react';
import MaterialIcon from '../ui/MaterialIcon';
import Button from '../ui/Button';
import { cn } from '../../lib/utils';

interface FacialRecognitionScanProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const FacialRecognitionScan: React.FC<FacialRecognitionScanProps> = ({ onSuccess, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 400, height: 400 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);
      setError(null);
    } catch (err) {
      setError("Accès caméra refusé ou non disponible.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    if (isScanning && progress < 100) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setTimeout(onSuccess, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [isScanning, progress]);

  return (
    <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative group">
        {/* Scanner Container */}
        <div className="w-64 h-64 rounded-full border-4 border-primary/20 overflow-hidden bg-on-surface flex items-center justify-center relative shadow-elevation-5">
          {error ? (
            <div className="text-center p-6 space-y-4">
              <MaterialIcon name="videocam_off" size={48} className="text-error mx-auto" />
              <p className="text-label-small text-on-surface-variant uppercase">{error}</p>
              <Button size="sm" variant="outlined" onClick={startCamera}>Réessayer</Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover grayscale brightness-110"
              />
              {/* Scan Overlay Lines */}
              <div className="absolute inset-0 border-[20px] border-on-surface/40 rounded-full"></div>

              {/* Biometric Points Simulation */}
              {isScanning && progress > 10 && progress < 90 && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--md-sys-color-primary)]"
                      style={{
                        top: `${30 + Math.random() * 40}%`,
                        left: `${30 + Math.random() * 40}%`,
                        animationDelay: `${i * 150}ms`
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Scanning Beam */}
              {isScanning && (
                <div
                  className="absolute left-0 right-0 h-1 bg-primary/60 shadow-[0_0_15px_var(--md-sys-color-primary)] z-20 transition-all duration-100 ease-standard"
                  style={{ top: `${(Math.sin(progress / 5) * 40) + 50}%` }}
                />
              )}
            </>
          )}
        </div>

        {/* Circular Progress Path */}
        <svg className="absolute -inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)] pointer-events-none transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="48%"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray="100 100"
            strokeDashoffset={100 - progress}
            className={cn(
              "transition-all duration-medium2 ease-emphasized",
              progress === 100 ? "text-tertiary" : "text-primary"
            )}
            pathLength="100"
          />
        </svg>

        {/* Status Icon */}
        <div className="absolute -bottom-2 right-4 bg-surface-container-lowest p-2 rounded-full shadow-elevation-2 border border-outline-variant animate-bounce">
          {progress === 100 ? <MaterialIcon name="verified_user" className="text-tertiary" size={24} /> : <MaterialIcon name="document_scanner" className="text-primary" size={24} />}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-title-large text-on-surface">
          {progress < 100 ? "Analyse biométrique..." : "Identité confirmée"}
        </h3>
        <p className="text-body-medium text-on-surface-variant">
          {progress < 100
            ? "Veuillez rester face à l'objectif pour la validation."
            : "Authentification réussie."}
        </p>
      </div>

      <Button variant="outlined" onClick={onCancel} className="text-on-surface-variant">Annuler le scan</Button>
    </div>
  );
};

