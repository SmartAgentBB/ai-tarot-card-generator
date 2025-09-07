import React from 'react';

interface LoadingIndicatorProps {
  message: string;
}

const TarotCardSpinner: React.FC = () => (
    <div className="relative w-24 h-36">
        <div className="absolute inset-0 border-2 border-amber-400/50 rounded-lg bg-slate-800/50 animate-spin-slow"></div>
        <div className="absolute inset-2 border-2 border-purple-400/50 rounded-md bg-slate-900/50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-amber-300 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-9-5.197m14-4.654v-1a5.008 5.008 0 00-5-5h-1a5.008 5.008 0 00-5 5v1" />
            </svg>
        </div>
    </div>
);

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <TarotCardSpinner />
      <p className="mt-6 text-lg font-semibold text-amber-200 animate-pulse font-sans">{message}</p>
    </div>
  );
};