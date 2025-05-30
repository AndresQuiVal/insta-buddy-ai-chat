
import React from 'react';
import { Button } from '@/components/ui/button';
import { Instagram } from 'lucide-react';
import { initiateInstagramAuth } from '@/services/instagramService';
import { useToast } from '@/hooks/use-toast';

const InstagramLogin = () => {
  const { toast } = useToast();

  const handleInstagramLogin = () => {
    const success = initiateInstagramAuth();
    if (!success) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con Instagram.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-sm w-full mx-4">
        <div className="bg-white/90 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl p-12 text-center">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
              alt="Hower"
              className="w-20 h-20 rounded-3xl object-cover mx-auto mb-6"
            />
            <h1 className="text-2xl font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hower Assistant
            </h1>
          </div>

          {/* Botón de conexión */}
          <Button
            onClick={handleInstagramLogin}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg border-0"
            size="lg"
          >
            <Instagram className="w-5 h-5 mr-3" />
            Conectar Instagram
          </Button>

          {/* Texto mínimo */}
          <p className="text-gray-400 text-sm mt-6 font-light">
            Conecta tu cuenta para comenzar
          </p>
        </div>
      </div>
    </div>
  );
};

export default InstagramLogin;
