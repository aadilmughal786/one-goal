// app/components/tools/DrawingTool.tsx
'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import React, { createRef, useState } from 'react';
import { FaEraser, FaRedo, FaUndo } from 'react-icons/fa';
import { FiDownload, FiFeather, FiMaximize, FiMinimize, FiTrash2 } from 'react-icons/fi';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';

const colorPalette = [
  '#FFFFFF',
  '#EF4444',
  '#F97316',
  '#F59E0B',
  '#84CC16',
  '#22C55E',
  '#14B8A6',
  '#38BDF8',
  '#6366F1',
  '#A855F7',
  '#EC4899',
];

const DrawingTool: React.FC = () => {
  const [strokeColor, setStrokeColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [eraserWidth, setEraserWidth] = useState(10);
  const [isErasing, setIsErasing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const canvasRef = createRef<ReactSketchCanvasRef>();
  const showToast = useNotificationStore(state => state.showToast);
  const showConfirmation = useNotificationStore(state => state.showConfirmation);

  const handleExportImage = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUri = await canvasRef.current.exportImage('png');
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = `one-goal-drawing-${new Date().toISOString()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Drawing exported successfully!', 'success');
    } catch {
      showToast('Failed to export drawing.', 'error');
    }
  };

  const handleClearCanvas = () => {
    showConfirmation({
      title: 'Clear Canvas?',
      message: 'Are you sure you want to erase everything on the canvas? This cannot be undone.',
      action: () => {
        canvasRef.current?.clearCanvas();
        showToast('Canvas cleared.', 'info');
      },
    });
  };

  const toggleFullScreen = () => {
    const elem = document.querySelector('.drawing-canvas-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        showToast(`Error entering fullscreen: ${err.message}`, 'error');
      });
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  const handleToolToggle = () => {
    setIsErasing(prev => !prev);
    if (canvasRef.current) {
      canvasRef.current.eraseMode(!isErasing);
    }
  };

  return (
    <div
      className={`drawing-canvas-container relative flex flex-col bg-bg-secondary backdrop-blur-sm border border-border-primary rounded-md shadow-lg transition-all duration-300 ${
        isFullScreen ? 'w-screen h-screen' : 'w-full'
      }`}
    >
      <div className="relative flex-grow w-full h-96 md:h-[500px] border-0">
        <ReactSketchCanvas
          ref={canvasRef}
          className="w-full h-full"
          strokeWidth={isErasing ? eraserWidth : strokeWidth}
          strokeColor={strokeColor}
          canvasColor="var(--color-bg-tertiary)"
        />
      </div>

      <div className="flex-shrink-0 p-4 border-t border-border-primary">
        <div className="flex flex-wrap gap-4 justify-center items-center">
          <div className="flex gap-2 p-2 rounded-lg bg-bg-primary">
            <button
              onClick={() => canvasRef.current?.undo()}
              className="p-2 rounded-md cursor-pointer text-text-secondary hover:bg-bg-tertiary"
              title="Undo"
            >
              <FaUndo />
            </button>
            <button
              onClick={() => canvasRef.current?.redo()}
              className="p-2 rounded-md cursor-pointer text-text-secondary hover:bg-bg-tertiary"
              title="Redo"
            >
              <FaRedo />
            </button>
            <button
              onClick={handleClearCanvas}
              className="p-2 text-red-400 rounded-md cursor-pointer hover:bg-red-500/20"
              title="Clear All"
            >
              <FiTrash2 />
            </button>
          </div>

          <div className="flex gap-2 p-2 rounded-lg bg-bg-primary">
            <button
              onClick={handleToolToggle}
              className={`p-2 rounded-md transition-colors cursor-pointer ${
                isErasing ? 'text-white bg-blue-500' : 'text-text-secondary hover:bg-bg-tertiary'
              }`}
              title={isErasing ? 'Switch to Pen' : 'Switch to Eraser'}
            >
              {isErasing ? <FiFeather /> : <FaEraser />}
            </button>
          </div>

          <div className="flex gap-3 items-center p-2 rounded-lg bg-bg-primary">
            <label htmlFor="stroke-width" className="text-sm text-text-secondary">
              {isErasing ? 'Eraser Size' : 'Stroke'}
            </label>
            <input
              id="stroke-width"
              type="range"
              min="1"
              max="50"
              value={isErasing ? eraserWidth : strokeWidth}
              onChange={e =>
                isErasing
                  ? setEraserWidth(Number(e.target.value))
                  : setStrokeWidth(Number(e.target.value))
              }
              className="w-24 cursor-pointer accent-text-accent"
            />
          </div>

          {!isErasing && (
            <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-bg-primary">
              {colorPalette.map(color => (
                <button
                  key={color}
                  onClick={() => setStrokeColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 cursor-pointer ${
                    strokeColor === color
                      ? 'ring-2 ring-offset-2 ring-offset-bg-primary ring-border-accent'
                      : ''
                  }`}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          )}

          <div className="flex gap-2 p-2 rounded-lg bg-bg-primary">
            <button
              onClick={handleExportImage}
              className="p-2 rounded-md cursor-pointer text-text-secondary hover:bg-bg-tertiary"
              title="Download as PNG"
            >
              <FiDownload />
            </button>
            <button
              onClick={toggleFullScreen}
              className="p-2 rounded-md cursor-pointer text-text-secondary hover:bg-bg-tertiary"
              title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullScreen ? <FiMinimize /> : <FiMaximize />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawingTool;
