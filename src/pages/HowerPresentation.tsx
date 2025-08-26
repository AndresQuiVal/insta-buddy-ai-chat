import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Users, Bot } from 'lucide-react';
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
        <h1 className="text-3xl md:text-5xl mb-12 text-white text-center animate-fade-in max-w-4xl">
          Administra tus prospectos en un solo lugar con{' '}
          <span className="font-normal">Hower</span>{' '}
          <span className="font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Assistant</span>
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
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fade-in mb-16"
        >
          Usar Hower Assistant
        </Button>

        {/* Features Section */}
        <div className="w-full max-w-6xl mb-16 px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Tus Números */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Tus Números</h3>
                <p className="text-white/90 text-sm">
                  Controla cuántos prospectos contactas y das seguimiento
                </p>
              </CardContent>
            </Card>

            {/* Tus prospectos en 1 lugar */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Tus prospectos en 1 lugar</h3>
                <p className="text-white/90 text-sm">
                  Gestiona todos tus prospectos sin usar etiquetas de Instagram
                </p>
              </CardContent>
            </Card>

            {/* Un Asistente para ti */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-300 animate-fade-in">
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Un Asistente para ti</h3>
                <p className="text-white/90 text-sm">
                  Tu asistente de prospección que te recuerda las tareas importantes
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowerPresentation;