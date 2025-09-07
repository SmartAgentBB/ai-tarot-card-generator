import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { LoadingIndicator } from './components/LoadingIndicator';
import { TarotIcon } from './components/icons/TarotIcon';
import { getTarotCardSuggestion, generateTarotImage, getSecondCardExplanation } from './services/geminiService';
import { majorArcana } from './services/tarotData';
import type { TarotAnalysis } from './types';

const App: React.FC = () => {
  const [imageData, setImageData] = useState<{ data: string; mimeType: string } | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<TarotAnalysis | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [cardChoices, setCardChoices] = useState<string[]>([]);
  const [secondCardName, setSecondCardName] = useState<string | null>(null);
  const [secondCardImageUrl, setSecondCardImageUrl] = useState<string | null>(null);
  const [secondCardExplanation, setSecondCardExplanation] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const generateCardChoices = useCallback((excludeCardName: string) => {
      const choices: string[] = [];
      const availableCards = majorArcana.filter(card => card.name !== excludeCardName);
      while (choices.length < 4 && availableCards.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableCards.length);
          choices.push(availableCards.splice(randomIndex, 1)[0].name);
      }
      setCardChoices(choices);
  }, []);

  const resetState = () => {
    setImageData(null);
    setImagePreviewUrl(null);
    setAnalysisResult(null);
    setGeneratedImageUrl(null);
    setCardChoices([]);
    setSecondCardName(null);
    setSecondCardImageUrl(null);
    setSecondCardExplanation(null);
    setIsLoading(false);
    setError(null);
  };
  
  const processImage = useCallback(async (imgData: { data: string; mimeType: string }) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setGeneratedImageUrl(null);
    setCardChoices([]);
    setSecondCardName(null);
    setSecondCardImageUrl(null);
    setSecondCardExplanation(null);

    try {
      setLoadingMessage('Consulting the cosmos...');
      const { data, mimeType } = imgData;

      const analysis = await getTarotCardSuggestion(data, mimeType);
      setAnalysisResult(analysis);
      
      setLoadingMessage(`Summoning the essence of ${analysis.cardName}...`);
      const generatedImage = await generateTarotImage(data, mimeType, analysis.cardName);
      setGeneratedImageUrl(generatedImage);

      generateCardChoices(analysis.cardName);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [generateCardChoices]);

  useEffect(() => {
    if (imageData) {
      processImage(imageData);
    }
  }, [imageData, processImage]);

  const handleSelectSecondCard = useCallback(async (cardName: string) => {
    if (!imageData || !analysisResult) return;

    setIsLoading(true);
    setError(null);
    setSecondCardName(cardName);

    try {
      setLoadingMessage('Interpreting your choice...');
      const { data, mimeType } = imageData;
      
      const explanationResult = await getSecondCardExplanation(data, mimeType, analysisResult, cardName);
      setSecondCardExplanation(explanationResult.explanation);

      setLoadingMessage(`Summoning the essence of ${cardName}...`);
      const generatedImage = await generateTarotImage(data, mimeType, cardName);
      setSecondCardImageUrl(generatedImage);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try again.');
      setSecondCardName(null); // Reset on error
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [imageData, analysisResult]);

  const handleShuffleChoices = useCallback(() => {
    if (analysisResult) {
      generateCardChoices(analysisResult.cardName);
    }
  }, [analysisResult, generateCardChoices]);


  const handleImageUpload = (file: File) => {
    resetState();
    setImagePreviewUrl(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      setImageData({ data, mimeType: file.type });
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setError("Could not read the image file. Please try another one.");
    };
  };

  const isResultReady = generatedImageUrl && analysisResult && imagePreviewUrl;

  return (
    <div className="min-h-screen font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#100f1c] to-[#1a1a2e]">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <TarotIcon className="w-12 h-12 text-amber-300"/>
            <h1 className="text-5xl sm:text-6xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400">
              Tarot Card Craft
            </h1>
          </div>
          <p className="text-slate-400 max-w-2xl mx-auto font-sans">
            Peer into the digital crystal ball. Your portrait holds the key to the cards.
          </p>
        </header>

        <main className="bg-black/20 p-6 rounded-2xl shadow-2xl shadow-amber-900/20 ring-1 ring-amber-400/20 backdrop-blur-sm">
          {error && (
            <div className="bg-red-900/50 text-red-300 border border-red-700 rounded-lg p-4 mb-6 text-center">
              <p className="font-bold">A Misfortune!</p>
              <p>{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <LoadingIndicator message={loadingMessage} />
          ) : isResultReady ? (
            <ResultDisplay 
              originalImageUrl={imagePreviewUrl}
              generatedImageUrl={generatedImageUrl}
              analysis={analysisResult}
              secondCardName={secondCardName}
              secondCardImageUrl={secondCardImageUrl}
              secondCardExplanation={secondCardExplanation}
              cardChoices={cardChoices}
              onSelectSecondCard={handleSelectSecondCard}
              onShuffleChoices={handleShuffleChoices}
              onReset={resetState}
            />
          ) : (
            <ImageUploader onImageUpload={handleImageUpload} />
          )}
        </main>
        
        <footer className="text-center mt-8 text-slate-500 text-sm font-sans">
          <p>Powered by Google Gemini. For entertainment purposes only.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;