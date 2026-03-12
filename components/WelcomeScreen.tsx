
import React from 'react';
import { useTranslation } from '../App';

interface WelcomeScreenProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onUseDemoImages: () => void;
  isLoading: boolean;
}

const UploadIcon = () => (
    <div className="w-16 h-16 text-gray-500 mb-4 border-2 border-dashed border-gray-500 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
    </div>
);


export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFileChange, onUseDemoImages, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
      <UploadIcon />
      <h2 className="text-2xl font-bold text-gray-200 mb-2">{t('welcomeTitle')}</h2>
      <p className="text-gray-400 mb-6 max-w-md">
        {t('welcomeSubtitle')}
      </p>
      <div className="flex items-center space-x-4">
        <label
          htmlFor="file-upload-welcome"
          className="cursor-pointer relative inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        >
          {isLoading ? t('loading') : t('selectImages')}
          <input id="file-upload-welcome" name="file-upload" type="file" className="sr-only" multiple onChange={onFileChange} accept="image/*" />
        </label>
        <button
          onClick={onUseDemoImages}
          className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400"
        >
          {t('tryDemo')}
        </button>
      </div>
    </div>
  );
};
