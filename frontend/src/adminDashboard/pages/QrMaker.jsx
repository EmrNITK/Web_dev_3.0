import React, { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, Link as LinkIcon, Image as ImageIcon, Settings2, Code, Image as ImageFileIcon } from 'lucide-react';

const QrMaker = () => {
  const [url, setUrl] = useState('https://example.com');
  const [size, setSize] = useState(1024); // Default to a high-quality size for download
  const [marginSize, setMarginSize] = useState(2); // Padding / quiet zone
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [image, setImage] = useState('');
  const [imageSize, setImageSize] = useState(0.2);
  const [errorCorrectionLevel, setErrorCorrectionLevel] = useState('H');
  
  const qrRef = useRef();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadPNG = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png', 1.0)
        .replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'custom-qr.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const downloadSVG = () => {
    const svg = qrRef.current.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = 'custom-qr.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const qrProps = {
    value: url || ' ',
    size: size,
    fgColor: fgColor,
    bgColor: bgColor,
    level: errorCorrectionLevel,
    marginSize: marginSize,
    imageSettings: image ? {
      src: image,
      excavate: true,
      height: size * imageSize,
      width: size * imageSize,
    } : undefined
  };

  // Preview props are the same but scaled down for the UI
  const previewProps = {
    ...qrProps,
    size: 250, // Fixed size for UI rendering
    imageSettings: image ? {
      ...qrProps.imageSettings,
      height: 250 * imageSize,
      width: 250 * imageSize,
    } : undefined
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <QrCode className="w-8 h-8 text-[#51b749]" />
          Ultimate QR Maker
        </h1>
        <p className="text-white/60 mt-2">Generate high-quality, fully customizable QR codes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[#51b749]" />
              Content Data
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">URL / Text / Wi-Fi / Contact</label>
                <textarea
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#51b749] transition-colors min-h-[100px] resize-y"
                  placeholder="Enter your link or text data here..."
                />
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-[#51b749]" />
              Styling & Quality
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-white/70">Export Size</label>
                  <span className="text-xs text-[#51b749] font-mono">{size}x{size} px</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="2000"
                  step="10"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-[#51b749]"
                />
                <p className="text-xs text-white/40 mt-1">Determines PNG download resolution</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-white/70">Padding (Quiet Zone)</label>
                  <span className="text-xs text-[#51b749] font-mono">{marginSize} modules</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={marginSize}
                  onChange={(e) => setMarginSize(Number(e.target.value))}
                  className="w-full accent-[#51b749]"
                />
                <p className="text-xs text-white/40 mt-1">White space around the QR code</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Error Correction Level</label>
                <div className="relative">
                  <select
                    value={errorCorrectionLevel}
                    onChange={(e) => setErrorCorrectionLevel(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#51b749] transition-colors appearance-none"
                  >
                    <option value="L">Low (7% recovery) - Best for simple URLs</option>
                    <option value="M">Medium (15% recovery)</option>
                    <option value="Q">Quartile (25% recovery)</option>
                    <option value="H">High (30% recovery) - Best for logos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Foreground</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-white/70 font-mono text-sm">{fgColor}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Background</label>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-white/70 font-mono text-sm">{bgColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#51b749]" />
              Brand Logo
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">Upload Center Logo</label>
                <div className="relative border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-[#51b749]/50 transition-colors bg-white/5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="pointer-events-none flex flex-col items-center justify-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-white/40" />
                    <span className="text-sm text-white/70 font-medium">Click or drag image to upload</span>
                    <span className="text-xs text-white/40">PNG, JPG, SVG up to 2MB</span>
                  </div>
                </div>
              </div>
              
              {image && (
                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={image} alt="Logo preview" className="w-12 h-12 rounded-lg object-cover border border-white/10 bg-white" />
                    <button 
                      onClick={() => setImage('')}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors font-medium px-3 py-1.5 rounded-lg bg-red-400/10 hover:bg-red-400/20"
                    >
                      Remove Logo
                    </button>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-white/70">Logo Scale</label>
                      <span className="text-xs text-[#51b749] font-mono">{(imageSize * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.4"
                      step="0.05"
                      value={imageSize}
                      onChange={(e) => setImageSize(Number(e.target.value))}
                      className="w-full accent-[#51b749]"
                    />
                    <p className="text-xs text-yellow-500/80 mt-1">Keep under 30% to maintain scannability</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview & Download */}
        <div className="lg:col-span-1">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 sticky top-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-6">Live Preview</h2>
            
            <div className="flex flex-col items-center justify-center p-6 bg-black/50 rounded-xl border border-white/10 mb-8 min-h-[350px]">
              {url ? (
                <div className="bg-white p-2 rounded-xl shadow-[0_0_40px_rgba(81,183,73,0.15)] transition-all duration-300 hover:scale-105">
                  <QRCodeSVG
                    {...previewProps}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center text-white/30">
                  <QrCode className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-sm">Enter content to generate</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={downloadPNG}
                disabled={!url}
                className="w-full flex items-center justify-center gap-2 bg-[#51b749] hover:bg-[#13703a] text-white py-3.5 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:shadow-[#51b749]/20"
              >
                <ImageFileIcon className="w-5 h-5" />
                Download PNG (High-Res)
              </button>
              
              <button
                onClick={downloadSVG}
                disabled={!url}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3.5 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
              >
                <Code className="w-5 h-5" />
                Download SVG (Vector)
              </button>
            </div>
            
            <p className="text-xs text-white/40 text-center mt-4">
              SVG is recommended for print and infinite scaling.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden containers for full-res downloads */}
      <div className="hidden" ref={qrRef}>
        {/* Canvas for PNG */}
        <QRCodeCanvas {...qrProps} />
        {/* SVG for Vector */}
        <QRCodeSVG {...qrProps} />
      </div>
    </div>
  );
};

export default QrMaker;
