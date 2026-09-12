import React, { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, Link as LinkIcon, Image as ImageIcon, Settings2 } from 'lucide-react';

const QrMaker = () => {
  const [url, setUrl] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#111111');
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

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const pngUrl = canvas
        .toDataURL('image/png')
        .replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = 'custom-qr.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <QrCode className="w-8 h-8 text-[#51b749]" />
          QR Code Maker
        </h1>
        <p className="text-white/60 mt-2">Create and customize QR codes quickly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-[#51b749]" />
              Link Data
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">URL / Text</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#51b749] transition-colors"
                  placeholder="https://your-link.com"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-[#51b749]" />
              Customization
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Size ({size}px)</label>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-[#51b749]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Error Correction</label>
                <select
                  value={errorCorrectionLevel}
                  onChange={(e) => setErrorCorrectionLevel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#51b749] transition-colors appearance-none"
                >
                  <option value="L">L - Low (7%)</option>
                  <option value="M">M - Medium (15%)</option>
                  <option value="Q">Q - Quartile (25%)</option>
                  <option value="H">H - High (30%)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Foreground Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-white/70 font-mono text-sm">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Background Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <span className="text-white/70 font-mono text-sm">{bgColor}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#51b749]" />
              Center Image
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Upload Image (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-white/70
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-[#51b749]/10 file:text-[#51b749]
                    hover:file:bg-[#51b749]/20 transition-all cursor-pointer"
                />
              </div>
              
              {image && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-1">Image Size ({(imageSize * 100).toFixed(0)}%)</label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.05"
                      value={imageSize}
                      onChange={(e) => setImageSize(Number(e.target.value))}
                      className="w-full accent-[#51b749]"
                    />
                  </div>
                  <button 
                    onClick={() => setImage('')}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Remove Image
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="bg-[#111111] border border-white/10 rounded-2xl p-6 sticky top-8">
            <h2 className="text-xl font-semibold text-white mb-6">Preview</h2>
            
            <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-xl border border-white/10 mb-6 min-h-[350px]">
              {url ? (
                <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
                  <QRCodeCanvas
                    value={url}
                    size={200} // Display size is fixed for preview, download uses actual size state if we rendered a hidden one, but to make it simple we will scale download. Wait, if we render small, download is small. Let's render the requested size but scale it in UI via CSS.
                    fgColor={fgColor}
                    bgColor={bgColor}
                    level={errorCorrectionLevel}
                    imageSettings={image ? {
                      src: image,
                      excavate: true,
                      height: 200 * imageSize,
                      width: 200 * imageSize,
                    } : undefined}
                  />
                  
                  {/* Hidden full size canvas for download */}
                  <div className="hidden">
                    <QRCodeCanvas
                      value={url}
                      size={size}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      level={errorCorrectionLevel}
                      imageSettings={image ? {
                        src: image,
                        excavate: true,
                        height: size * imageSize,
                        width: size * imageSize,
                      } : undefined}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-white/40 text-center text-sm">Enter a URL to generate QR</p>
              )}
            </div>

            <button
              onClick={downloadQR}
              disabled={!url}
              className="w-full flex items-center justify-center gap-2 bg-[#51b749] hover:bg-[#13703a] text-white py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Download PNG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QrMaker;
