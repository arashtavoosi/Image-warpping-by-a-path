import React from 'react';
import { useWarpStore } from '../hooks/useWarpStore';
import { Camera, RefreshCw, Upload, Download } from 'lucide-react';

const IconWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-6 h-6 flex items-center justify-center text-gray-400 mr-3">{children}</div>
);

const Controls: React.FC = () => {
  const {
    resolution,
    setResolution,
    warpIntensity,
    setWarpIntensity,
    heightScale,
    setHeightScale,
    pathOffset,
    setPathOffset,
    imageLengthRatio,
    setImageLengthRatio,
    setImageUrl,
    triggerSave,
    isSaving,
  } = useWarpStore();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadRandomImage = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setImageUrl(`https://picsum.photos/id/${randomId}/1024/1024`);
  };

  return (
    <aside className="w-full md:w-80 bg-gray-800 p-4 md:p-6 text-white shadow-lg z-20 flex-shrink-0">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-center md:text-left text-cyan-400">Image Warp Tool</h1>
        
        <div className="space-y-2">
          <label htmlFor="image-upload" className="font-semibold text-gray-300 flex items-center">
            <IconWrapper><Upload size={18} /></IconWrapper>
            Load Image
          </label>
          <div className="flex space-x-2">
            <input
              id="image-upload-input"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => document.getElementById('image-upload-input')?.click()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              Choose File
            </button>
            <button
              onClick={loadRandomImage}
              title="Load random image"
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="resolution" className="font-semibold text-gray-300 flex items-center">
              <IconWrapper><Camera size={18} /></IconWrapper>
              Mesh Resolution: {resolution}
            </label>
            <input
              id="resolution"
              type="range"
              min="10"
              max="150"
              step="1"
              value={resolution}
              onChange={(e) => setResolution(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          <div className="space-y-2">
             <label htmlFor="warpIntensity" className="font-semibold text-gray-300 flex items-center">
                <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12c.83-.83 2.17-1 3.5-1s2.67.17 3.5 1-2.67 1-3.5 1-2.67-.17-3.5-1Z"/><path d="M17 12c.83-.83 2.17-1 3.5-1s2.67.17 3.5 1-2.67 1-3.5 1-2.67-.17-3.5-1Z"/><path d="M13.5 5c.83-.83 2.17-1 3.5-1s2.67.17 3.5 1-2.67 1-3.5 1-2.67-.17-3.5-1Z"/><path d="M3.5 19c.83-.83 2.17-1 3.5-1s2.67.17 3.5 1-2.67 1-3.5 1-2.67-.17-3.5-1Z"/></svg></IconWrapper>
                Warp Intensity: {warpIntensity.toFixed(2)}
            </label>
            <input
              id="warpIntensity"
              type="range"
              min="0"
              max="3"
              step="0.05"
              value={warpIntensity}
              onChange={(e) => setWarpIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          <div className="space-y-2">
             <label htmlFor="heightScale" className="font-semibold text-gray-300 flex items-center">
                <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg></IconWrapper>
                Height Scale: {heightScale.toFixed(2)}
            </label>
            <input
              id="heightScale"
              type="range"
              min="0.2"
              max="2"
              step="0.05"
              value={heightScale}
              onChange={(e) => setHeightScale(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          <div className="space-y-2">
             <label htmlFor="imageLength" className="font-semibold text-gray-300 flex items-center">
                <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 6H3"/><path d="M21 12H3"/><path d="M21 18H3"/></svg></IconWrapper>
                Image Length: {imageLengthRatio.toFixed(2)}
            </label>
            <input
              id="imageLength"
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={imageLengthRatio}
              onChange={(e) => setImageLengthRatio(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          <div className="space-y-2">
             <label htmlFor="pathOffset" className="font-semibold text-gray-300 flex items-center">
                <IconWrapper><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 5H3"/><path d="M21 12H3"/><path d="M17 19H3"/><path d="m21 19-4-4 4-4"/></svg></IconWrapper>
                Image Shift: {pathOffset.toFixed(2)}
            </label>
            <input
              id="pathOffset"
              type="range"
              min="0"
              max={1 - imageLengthRatio}
              step="0.01"
              value={pathOffset}
              onChange={(e) => setPathOffset(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
        
        <button
          onClick={triggerSave}
          disabled={isSaving}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-md transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Download size={20} />
              <span>Save as PNG</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Controls;
