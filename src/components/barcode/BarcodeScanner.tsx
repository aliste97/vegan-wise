"use client";

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType, type Html5QrcodeResult, type QrcodeErrorCallback, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Barcode, CameraOff, XCircle, Search, RotateCcw } from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  isScanning: boolean;
  setIsScanning: (isScanning: boolean) => void;
  isLoading: boolean;
}

const SCANNER_ELEMENT_ID = 'barcode-reader';

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onBarcodeScanned, isScanning, setIsScanning, isLoading }) => {
  const [manualBarcode, setManualBarcode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // null = undetermined

  useEffect(() => {
    // Only attempt to start scanner if isScanning is true and it's not already initialized
    if (isScanning && !scannerRef.current && document.getElementById(SCANNER_ELEMENT_ID)) {
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF,
      ];

      scannerRef.current = new Html5QrcodeScanner(
        SCANNER_ELEMENT_ID,
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          formatsToSupport: formatsToSupport,
          rememberLastUsedCamera: true,
        },
        false // verbose
      );

      const onScanSuccess = (decodedText: string, result: Html5QrcodeResult) => {
        setHasCameraPermission(true); 
        if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          scannerRef.current.stop().catch(err => console.error("Error stopping scanner:", err));
        }
        scannerRef.current?.clear(); 
        scannerRef.current = null;
        setIsScanning(false); 
        onBarcodeScanned(decodedText);
        setError(null);
      };

      const onScanFailure: QrcodeErrorCallback = (errorMessage) => {
        if (errorMessage.includes("Permission denied") || errorMessage.includes("getUserMedia") || errorMessage.includes("Requested device not found")) {
          setError("Camera permission denied or camera not found. Please allow camera access and ensure a camera is connected.");
          setHasCameraPermission(false);
          setIsScanning(false);
          if (scannerRef.current && scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
             scannerRef.current.stop().catch(()=>{/*ignore*/});
          }
          scannerRef.current?.clear(); 
          scannerRef.current = null;
        } else if (!errorMessage.toLowerCase().includes("not found")) {
           console.warn(`QR Scanner Error: ${errorMessage}`);
        }
      };
      
      try {
          if(scannerRef.current) {
            // The render method itself does not return a promise.
            // Success/failure including permission status are handled by its callbacks.
            scannerRef.current.render(onScanSuccess, onScanFailure);
            setHasCameraPermission(null); // Set to undetermined until a callback updates it
          }
      } catch (err: any) {
        setError(`Failed to start scanner: ${err?.message || "Unknown error"}`);
        setHasCameraPermission(false);
        setIsScanning(false);
        if (scannerRef.current) {
           scannerRef.current.clear().catch(()=>{/*ignore*/});
           scannerRef.current = null;
        }
      }

    } else if (!isScanning && scannerRef.current) {
      if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
         scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
         }).catch(err => {
            console.error("Failed to stop scanner gracefully: ", err);
            const readerElement = document.getElementById(SCANNER_ELEMENT_ID);
            if (readerElement) readerElement.innerHTML = ""; // Force clear UI
            scannerRef.current = null;
         });
      } else {
        scannerRef.current?.clear();
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
         try {
             if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
                scannerRef.current.stop().catch(()=>{/*ignore cleanup error*/});
             }
             scannerRef.current.clear().catch(()=>{/*ignore cleanup error*/});
         } catch (e) { 
            console.error("Error during scanner cleanup:", e); 
         } finally {
             scannerRef.current = null;
         }
      }
    };
  }, [isScanning, onBarcodeScanned, setIsScanning]); 


  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      setIsScanning(false); 
      onBarcodeScanned(manualBarcode.trim());
      setManualBarcode('');
      setError(null);
    }
  };

  const toggleScan = () => {
    setError(null); 
    setIsScanning(!isScanning); 
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-xl shadow-xl space-y-6">
      <h2 className="text-2xl font-semibold text-center text-foreground">Scan Product Barcode</h2>
      
      {error && (
        <Alert variant="destructive">
          {error.includes("permission") || error.includes("camera not found") ? <CameraOff className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <AlertTitle>Scan Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasCameraPermission === false && !isScanning && (
         <Alert variant="destructive">
          <CameraOff className="h-5 w-5" />
          <AlertTitle>Camera Access Problem</AlertTitle>
          <AlertDescription>
            Could not access the camera. Please ensure it's connected and permissions are granted in your browser settings, then try starting the scan again.
          </AlertDescription>
        </Alert>
      )}

      <div id={SCANNER_ELEMENT_ID} className={!isScanning ? 'hidden' : 'border-2 border-primary rounded-lg overflow-hidden min-h-[250px]'}>
          {/* The Html5QrcodeScanner library will inject UI here when render() is called */}
      </div>
      
      <Button 
        onClick={toggleScan} 
        className="w-full text-lg py-3"
        disabled={isLoading || (isScanning && hasCameraPermission === null)} 
        aria-label={isScanning ? "Stop Scanning" : "Start Scanning"}
      >
        {isLoading ? (
          <RotateCcw className="mr-2 h-5 w-5 animate-spin" />
        ) : isScanning ? (
          <XCircle className="mr-2 h-5 w-5" />
        ) : (
          <Barcode className="mr-2 h-5 w-5" />
        )}
        {isLoading ? 'Processing...' : isScanning ? 'Stop Scan' : 'Start Scan with Camera'}
      </Button>

      <div className="relative flex py-3 items-center">
        <div className="flex-grow border-t border-muted"></div>
        <span className="flex-shrink mx-4 text-muted-foreground text-sm">OR</span>
        <div className="flex-grow border-t border-muted"></div>
      </div>

      <form onSubmit={handleManualSubmit} className="space-y-3">
        <Input
          type="text"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          placeholder="Enter barcode manually"
          className="text-center text-base"
          aria-label="Manual barcode input"
          disabled={isLoading || isScanning} 
        />
        <Button type="submit" className="w-full" variant="secondary" disabled={isLoading || isScanning || !manualBarcode.trim()}>
          <Search className="mr-2 h-5 w-5" />
          Lookup Barcode
        </Button>
      </form>
    </div>
  );
};

export default BarcodeScanner;
