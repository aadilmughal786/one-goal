// app/components/tools/QRCodeGenerator.tsx
'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNotificationStore } from '@/store/useNotificationStore';

const MAX_QR_CODE_LENGTH = 250; // Define a reasonable character limit for QR codes

const QRCodeGenerator: React.FC = () => {
  const [text, setText] = useState<string>('');
  const showToast = useNotificationStore(state => state.showToast);
  const qrCodeRef = useRef<HTMLDivElement>(null); // Ref to the div containing the QR code SVG

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputText = e.target.value;
    if (inputText.length > MAX_QR_CODE_LENGTH) {
      showToast(
        `QR code content limited to ${MAX_QR_CODE_LENGTH} characters. Text has been truncated.`,
        'info'
      );
      setText(inputText.substring(0, MAX_QR_CODE_LENGTH));
    } else {
      setText(inputText);
    }
  };

  const handleDownload = () => {
    if (!qrCodeRef.current || !text) {
      showToast('No QR code to download.', 'info');
      return;
    }

    // Find the SVG element within the ref'd div
    const svgElement = qrCodeRef.current.querySelector('svg');
    if (!svgElement) {
      showToast('Could not find QR code SVG.', 'error');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'qrcode.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);

    showToast('QR code downloaded successfully!', 'success');
  };

  return (
    <div className="p-6 mx-auto max-w-md rounded-lg shadow-lg bg-bg-secondary text-text-primary">
      <h2 className="mb-6 text-2xl font-semibold text-center">QR Code Generator</h2>

      <div className="mb-4">
        <label htmlFor="qr-text" className="block mb-2 text-sm font-medium">
          Text or URL
        </label>
        <input
          type="text"
          id="qr-text"
          className="p-2 w-full rounded-md border bg-bg-primary border-border-primary focus:outline-none focus:ring-2 focus:ring-accent"
          value={text}
          onChange={handleTextChange}
          placeholder="Enter text or URL to generate QR code"
        />
        <p className="text-right text-xs text-text-muted mt-1">
          {text.length}/{MAX_QR_CODE_LENGTH} characters
        </p>
      </div>

      {text && (
        <div
          ref={qrCodeRef}
          className="flex justify-center p-4 mt-6 rounded-md border bg-bg-primary border-border-primary"
        >
          <QRCodeSVG
            value={text}
            size={256}
            level="H"
            fgColor="#000000" // Always black for QR code
            bgColor="#FFFFFF" // Always white for QR code
          />
        </div>
      )}

      {text && (
        <button
          onClick={handleDownload}
          className="w-full py-3 mt-4 font-semibold text-black bg-white rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-dark"
        >
          Download QR Code (SVG)
        </button>
      )}

      <p className="mt-6 text-xs text-center text-text-muted">
        Enter text or a URL above to generate a QR code.
      </p>
    </div>
  );
};

export default QRCodeGenerator;
