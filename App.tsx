
import React, { useRef } from 'react';
import Controls from './components/Controls';
import WarpCanvas from './components/WarpCanvas';

const App: React.FC = () => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-800 font-sans">
      <Controls />
      <main ref={canvasContainerRef} className="flex-1 h-full w-full relative bg-gray-900">
        <div className="absolute top-2 left-2 text-white bg-black bg-opacity-50 px-2 py-1 rounded-md text-xs z-10">
          <p>Drag the white spheres to warp the image.</p>
        </div>
        <WarpCanvas />
      </main>
    </div>
  );
};

export default App;
