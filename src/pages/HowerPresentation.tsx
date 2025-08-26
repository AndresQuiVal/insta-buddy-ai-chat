import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HowerPresentation = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 via-blue-900 to-purple-900">
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Logo */}
        <div className="mb-8 flex justify-center animate-fade-in">
          <img 
            src="/src/assets/hower-logo.png" 
            alt="Hower Assistant Logo" 
            className="w-24 h-auto object-contain"
          />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-5xl font-bold mb-12 text-white text-center animate-fade-in max-w-4xl">
          Administra tus prospectos en un solo lugar con Hower Assistant
        </h1>

        {/* Video Container */}
        <div className="w-full max-w-4xl mb-12 animate-scale-in">
          <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden shadow-2xl">
            <iframe
              src="https://www.loom.com/embed/YOUR_LOOM_VIDEO_ID"
              frameBorder="0"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full"
              title="Hower Assistant Demo"
            ></iframe>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          onClick={handleGetStarted}
          size="lg"
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in"
        >
          Usar Hower Assistant
        </Button>
      </div>
    </div>
  );
};

export default HowerPresentation;