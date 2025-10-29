import React, { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from './hooks/useFocusTrap';

// Html5Qrcode is loaded from a script tag in index.html
declare const Html5Qrcode: any;

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
    const scannerRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    // Trap focus inside the modal for accessibility
    useFocusTrap(containerRef, true);

    useEffect(() => {
        const qrCodeScanner = new Html5Qrcode("qr-reader");
        scannerRef.current = qrCodeScanner;

        const qrCodeSuccessCallback = (decodedText: string, decodedResult: any) => {
            if (scannerRef.current?.isScanning) {
                scannerRef.current.stop().then(() => {
                    onScanSuccess(decodedText);
                }).catch((err: any) => {
                    console.error("Failed to stop scanner", err);
                    onScanSuccess(decodedText); // Proceed even if stop fails
                });
            }
        };

        const qrCodeErrorCallback = (errorMessage: string) => {
            // This callback is called frequently when no QR code is found.
            // We can leave it empty or use it for debugging.
        };

        const qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.75);
            return {
                width: qrboxSize,
                height: qrboxSize,
            };
        };

        const config = { fps: 10, qrbox: qrboxFunction, aspectRatio: 1.0 };

        const startScanner = async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length) {
                    let cameraId: string | null = null;
                    // Filter for back-facing cameras, looking for "back" or French "arrière"
                    const backCameras = cameras.filter((camera: any) => {
                        const label = camera.label.toLowerCase();
                        return label.includes('back') || label.includes('arrière');
                    });

                    if (backCameras.length > 0) {
                        // Prefer a camera that isn't "ultra wide" or a telephoto/zoom lens.
                        // This helps select the standard 1x camera on modern phones.
                        const idealCamera = backCameras.find((camera: any) => {
                             const label = camera.label.toLowerCase();
                             return !label.includes('ultra') && 
                                !label.includes('telephoto') &&
                                !label.includes('téléobjectif') && // French for telephoto
                                !label.includes('zoom');
                        });
                        cameraId = idealCamera ? idealCamera.id : backCameras[0].id; // Fallback to the first back camera
                    } else if (cameras.length > 0) {
                        // If no "back" camera found, use the first available camera.
                        cameraId = cameras[0].id;
                    }
                    
                    if(cameraId) {
                        await qrCodeScanner.start(cameraId, config, qrCodeSuccessCallback, qrCodeErrorCallback);
                    } else {
                        // Fallback to default environment camera if no suitable camera is found
                        await qrCodeScanner.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, qrCodeErrorCallback);
                    }
                } else {
                    // Fallback if getCameras fails or returns empty
                    await qrCodeScanner.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, qrCodeErrorCallback);
                }
            } catch (err: any) {
                console.error("Unable to start scanning.", err);
                setError("Impossible de démarrer la caméra. Veuillez accorder la permission et rafraîchir.");
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch((err: any) => {
                    console.log("Scanner stop error (ignorable on cleanup):", err);
                });
            }
        };
    }, [onScanSuccess]);

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-scanner-title"
        >
            <div id="qr-reader" className="w-full max-w-md aspect-square relative overflow-hidden rounded-2xl"></div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[75vw] h-[75vw] max-w-[320px] max-h-[320px] border-4 border-dashed border-white/50 rounded-2xl"></div>
                <div id="qr-scanner-title" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[220px] text-white text-lg font-semibold bg-black/30 px-4 py-2 rounded-md">
                    Aligner le QR code dans le cadre
                </div>
            </div>

            {error && <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-100 text-red-700 p-4 rounded-lg">{error}</p>}
            
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 flex items-center justify-center rounded-full size-12 bg-white/20 text-white hover:bg-white/30 transition-colors"
                aria-label="Fermer le scanner"
            >
                <span className="material-symbols-outlined !text-2xl">close</span>
            </button>
        </div>
    );
};

export default QRScanner;