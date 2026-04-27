import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

const QRCodeGenerator = ({ url }) => {
  const canvasRef = useRef(null); // Reference for the canvas element

  // This effect runs every time the `url` prop changes
  useEffect(() => {
    // Generate the QR code and display it on the canvas with custom size
    QRCode.toCanvas(canvasRef.current, url, { width: 100, height: 100 }, (error) => {
      if (error) console.error('Error generating QR code:', error);
      console.log('QR code generated!');
    });
  }, [url]); // Runs whenever the URL changes

  return (
    <div>
      <canvas ref={canvasRef} style={{ width: '100px', height: '100px' }}></canvas> {/* This is where the QR code will be drawn */}
    </div>
  );
};

export default QRCodeGenerator;