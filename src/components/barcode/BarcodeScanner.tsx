"use client";

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, type Html5QrcodeResult, type QrcodeErrorCallback } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Barcode, CameraOff, XCircle, CheckCircle, Search, RotateCcw } from 'lucide-react';

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
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isScanning && !scannerRef.current) {
      const formatsToSupport = [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.QR_CODE, // Added QR Code for broader compatibility
      ];
      
      scannerRef.current = new Html5QrcodeScanner(
        SCANNER_ELEMENT_ID,
        { 
          fps: 10, 
          qrbox: { width: 250, height: 150 },
          supportedScanTypes: [], // Scan all supported types
          formatsToSupport: formatsToSupport,
        },
        false // verbose
      );

      const onScanSuccess = (decodedText: string, result: Html5QrcodeResult) => {
        scannerRef.current?.clear();
        setIsScanning(false);
        onBarcodeScanned(decodedText);
        setError(null);
      };

      const onScanFailure: QrcodeErrorCallback = (errorMessage) => {
        // This callback can be noisy if it reports every non-detection.
        // Only set persistent errors.
        if (errorMessage.includes("not found") || errorMessage.includes("NotFoundException")) {
          // This is a common "no barcode detected in frame" message, can be ignored or handled subtly
        } else if (errorMessage.includes("Permission denied") || errorMessage.includes("getUserMedia")) {
          setError("Camera permission denied. Please allow camera access in your browser settings.");
          setHasCameraPermission(false);
          setIsScanning(false);
        } else {
          // Other errors could be logged or displayed if needed
          // console.warn(`QR error = ${errorMessage}`);
        }
      };
      
      scannerRef.current.render(onScanSuccess, onScanFailure)
        .then(() => setHasCameraPermission(true))
        .catch(err => {
          setError("Failed to start scanner. Ensure camera is available and permissions are granted.");
          setHasCameraPermission(false);
          setIsScanning(false);
        });

    } else if (!isScanning && scannerRef.current) {
      // Ensure scanner is stopped and cleared
      if (scannerRef.current.getState() === 2) { // 2 is SCANNING state
         scannerRef.current.stop().then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
         }).catch(err => {
            // console.error("Failed to stop scanner: ", err);
            // Fallback clear
            const readerElement = document.getElementById(SCANNER_ELEMENT_ID);
            if (readerElement) readerElement.innerHTML = "";
            scannerRef.current = null;
         });
      } else {
        scannerRef.current?.clear();
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        // Check if element exists before clearing
        if (document.getElementById(SCANNER_ELEMENT_ID)) {
          try {
             if (scannerRef.current.getState() === 2) { // SCANNING
                scannerRef.current.stop().catch(()=>{/*ignore*/});
             }
             scannerRef.current.clear().catch(()=>{/*ignore*/});
          } catch (e) { /* console.error("Cleanup error:", e); */ }
        }
        scannerRef.current = null;
      }
    };
  }, [isScanning, setIsScanning, onBarcodeScanned]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode.trim()) {
      onBarcodeScanned(manualBarcode.trim());
      setManualBarcode('');
      setError(null);
    }
  };

  const toggleScan = () => {
    setError(null); // Clear previous errors
    if (isScanning && scannerRef.current) {
        // Stop scanning
        setIsScanning(false);
    } else {
        // Start scanning
        setIsScanning(true);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-card rounded-xl shadow-xl space-y-6">
      <h2 className="text-2xl font-semibold text-center text-foreground">Scan Product Barcode</h2>
      
      {error && (
        <Alert variant="destructive">
          {error.includes("permission") ? <CameraOff className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
          <AlertTitle>Scan Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {hasCameraPermission === false && !isScanning && (
         <Alert variant="destructive">
          <CameraOff className="h-5 w-5" />
          <AlertTitle>Camera Access Denied</AlertTitle>
          <AlertDescription>
            VeganWise needs camera access to scan barcodes. Please enable camera permissions in your browser settings and try again.
          </AlertDescription>
        </Alert>
      )}

      <div id={SCANNER_ELEMENT_ID} className={isScanning ? "border-2 border-primary rounded-lg overflow-hidden" : "hidden"}></div>
      
      <Button 
        onClick={toggleScan} 
        className="w-full text-lg py-3"
        disabled={isLoading}
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
