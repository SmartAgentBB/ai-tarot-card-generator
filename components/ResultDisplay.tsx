import React from 'react';
import type { TarotAnalysis } from '../types';
import { RetryIcon } from './icons/RetryIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultDisplayProps {
  originalImageUrl: string;
  generatedImageUrl: string;
  analysis: TarotAnalysis;
  secondCardName: string | null;
  secondCardImageUrl: string | null;
  secondCardExplanation: string | null;
  cardChoices: string[];
  onSelectSecondCard: (cardName: string) => void;
  onShuffleChoices: () => void;
  onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  originalImageUrl, 
  generatedImageUrl, 
  analysis, 
  secondCardName, 
  secondCardImageUrl, 
  secondCardExplanation,
  cardChoices,
  onSelectSecondCard,
  onShuffleChoices, 
  onReset 
}) => {

  const handleSavePrimaryCard = () => {
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `${analysis.cardName.replace(/\s+/g, '_')}-Tarot-Card.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSaveSecondCard = () => {
    if (!secondCardImageUrl || !secondCardName) return;
    const link = document.createElement('a');
    link.href = secondCardImageUrl;
    link.download = `${secondCardName.replace(/\s+/g, '_')}-Tarot-Card.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.replace(/\n/g, ' \n ').split(' ');
    let line = '';
    
    for (let n = 0; n < words.length; n++) {
      const word = words[n];
      if (word === '\n') {
        context.fillText(line.trim(), x, y);
        line = '';
        y += lineHeight;
        continue;
      }
      const testLine = line + word + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        context.fillText(line.trim(), x, y);
        line = word + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line.trim(), x, y);
  };

  const handleSaveAll = async () => {
    if (!secondCardImageUrl || !secondCardName || !secondCardExplanation) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      alert("Canvas is not supported in your browser.");
      return;
    }

    const originalImg = new Image();
    originalImg.crossOrigin = "anonymous";
    originalImg.src = originalImageUrl;
    
    const generatedImg = new Image();
    generatedImg.crossOrigin = "anonymous";
    generatedImg.src = generatedImageUrl;

    const secondCardImg = new Image();
    secondCardImg.crossOrigin = "anonymous";
    secondCardImg.src = secondCardImageUrl;

    try {
      await Promise.all([
        new Promise((resolve, reject) => { originalImg.onload = resolve; originalImg.onerror = reject; }),
        new Promise((resolve, reject) => { generatedImg.onload = resolve; generatedImg.onerror = reject; }),
        new Promise((resolve, reject) => { secondCardImg.onload = resolve; secondCardImg.onerror = reject; }),
      ]);
    } catch (error) {
      console.error("Error loading images for canvas:", error);
      alert("Could not load images to create composite image. Please try again.");
      return;
    }

    const padding = 60;
    const imageWidth = 450;
    const imageHeight = imageWidth * 1.5; // 1:1.5 aspect ratio
    const gap = 40;
    const headerHeight = 50;
    const textBlockHeight = 150;

    canvas.width = (imageWidth * 3) + (gap * 2) + (padding * 2);
    canvas.height = padding + headerHeight + imageHeight + textBlockHeight + padding;

    // Background
    ctx.fillStyle = '#100f1c'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Helper function to draw image with object-cover behavior
    const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
      const imgRatio = img.width / img.height;
      const containerRatio = w / h;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

      if (imgRatio > containerRatio) { 
        sWidth = img.height * containerRatio;
        sx = (img.width - sWidth) / 2;
      } else { 
        sHeight = img.width / containerRatio;
        sy = (img.height - sHeight) / 2;
      }
      ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
    };

    // Titles
    ctx.fillStyle = '#fde68a'; // amber-200
    ctx.font = '32px "Cormorant Garamond", serif';
    ctx.textAlign = 'center';
    
    const titleY = padding + headerHeight - 15;
    const leftImageX = padding;
    const middleImageX = padding + imageWidth + gap;
    const rightImageX = padding + (imageWidth * 2) + (gap * 2);

    ctx.fillText('Source', leftImageX + imageWidth / 2, titleY);
    ctx.fillText(analysis.cardName, middleImageX + imageWidth / 2, titleY);
    ctx.fillText(secondCardName, rightImageX + imageWidth / 2, titleY);

    // Images
    const imageY = padding + headerHeight;
    drawImageCover(ctx, originalImg, leftImageX, imageY, imageWidth, imageHeight);
    drawImageCover(ctx, generatedImg, middleImageX, imageY, imageWidth, imageHeight);
    drawImageCover(ctx, secondCardImg, rightImageX, imageY, imageWidth, imageHeight);

    // Text blocks
    const textY = imageY + imageHeight + 40;
    ctx.fillStyle = '#cbd5e1'; // slate-300
    ctx.font = '16px "Lato", sans-serif';

    wrapText(ctx, analysis.personDescription, leftImageX + imageWidth / 2, textY, imageWidth - 20, 22);
    wrapText(ctx, analysis.explanation, middleImageX + imageWidth / 2, textY, imageWidth - 20, 22);
    wrapText(ctx, secondCardExplanation, rightImageX + imageWidth / 2, textY, imageWidth - 20, 22);
    
    // Trigger Download
    const link = document.createElement('a');
    link.download = `My-${analysis.cardName.replace(/\s+/g, '_')}-Reading.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* Source Column */}
        <div className="flex flex-col items-center">
          <h3 className="text-xl font-serif text-slate-400 mb-2 h-8 flex items-center">Source</h3>
          <div className="w-full rounded-lg shadow-lg overflow-hidden aspect-[2/3] bg-black/20">
            <img src={originalImageUrl} alt="Original user upload" className="w-full h-full object-cover" />
          </div>
          <p className="mt-4 text-sm text-slate-400 text-center px-2 min-h-[6em] font-sans">{analysis.personDescription}</p>
        </div>
        
        {/* First Card Column */}
        <div className="flex flex-col items-center">
          <div className="h-8 mb-2 w-full flex justify-center items-center gap-2 relative">
            <h3 className="text-xl font-serif text-amber-300">{analysis.cardName}</h3>
            <button
              onClick={handleSavePrimaryCard}
              className="text-slate-500 hover:text-amber-300 transition-colors"
              title="Save Your Tarot Card"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="w-full rounded-lg shadow-lg overflow-hidden aspect-[2/3] bg-black/20">
            <img src={generatedImageUrl} alt={`Generated tarot card for ${analysis.cardName}`} className="w-full h-full object-cover" />
          </div>
          <p className="mt-4 text-sm text-slate-400 text-center px-2 min-h-[6em] font-sans">{analysis.explanation}</p>
        </div>
        
        {/* Second Card Column (Conditional) */}
        <div className="flex flex-col items-center">
          {secondCardImageUrl && secondCardName ? (
            <>
              <div className="h-8 mb-2 w-full flex justify-center items-center gap-2 relative">
                 <h3 className="text-xl font-serif text-amber-300">{secondCardName}</h3>
                 <button
                  onClick={handleSaveSecondCard}
                  className="text-slate-500 hover:text-amber-300 transition-colors"
                  title="Save The Second Tarot Card"
                >
                  <DownloadIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="w-full rounded-lg shadow-lg overflow-hidden aspect-[2/3] bg-black/20">
                <img src={secondCardImageUrl} alt={`Generated tarot card for ${secondCardName}`} className="w-full h-full object-cover" />
              </div>
              <p className="mt-4 text-sm text-slate-400 text-center px-2 min-h-[6em] font-sans">{secondCardExplanation}</p>
            </>
          ) : (
            <>
              <h3 className="text-xl font-serif text-slate-400 mb-2 h-8 flex items-center">Choose Your Path</h3>
              <div className="w-full rounded-lg shadow-lg bg-black/30 aspect-[2/3] p-4 flex flex-col justify-center items-center gap-4">
                  <div className="grid grid-cols-2 gap-3 w-full">
                      {cardChoices.map((cardName) => (
                          <button 
                              key={cardName} 
                              onClick={() => onSelectSecondCard(cardName)}
                              className="font-serif text-sm bg-slate-800/50 hover:bg-amber-900/40 border border-slate-700 hover:border-amber-500 rounded-md p-2 h-16 transition-colors text-slate-300 hover:text-amber-200"
                          >
                            {cardName}
                          </button>
                      ))}
                  </div>
                  <button
                    onClick={onShuffleChoices}
                    className="mt-4 inline-flex items-center gap-2 text-slate-400 hover:text-amber-300 transition-colors text-sm font-sans"
                  >
                    <RetryIcon className="w-4 h-4" />
                    Shuffle Choices
                  </button>
              </div>
              <p className="mt-4 text-sm text-slate-500 text-center px-2 min-h-[6em] font-sans">Select a card to reveal another aspect of your reading.</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 flex-wrap">
          <button 
            onClick={onReset}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-full transition-transform duration-200 ease-in-out hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 shadow-lg"
          >
            <RetryIcon className="w-5 h-5" />
            Divine Another Fate
          </button>
          
          {secondCardImageUrl && (
            <button 
              onClick={handleSaveAll}
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold py-3 px-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 border border-amber-500/50 animate-fade-in"
              title="Save all three images as a single composite"
            >
              <DownloadIcon className="w-5 h-5" />
              <span>Save Reading</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
