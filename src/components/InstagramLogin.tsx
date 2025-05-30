
import React from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, LogIn } from 'lucide-react';
import { initiateInstagramAuth, checkInstagramConnection } from '@/services/instagramService';
import { useToast } from '@/hooks/use-toast';

const InstagramLogin = () => {
  const { toast } = useToast();

  const handleInstagramLogin = () => {
    const success = initiateInstagramAuth();
    if (!success) {
      toast({
        title: "Error de conexión",
        description: "No se pudo iniciar la conexión con Instagram. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-8">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img
                src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
                alt="Logo Hower"
                className="w-16 h-16 rounded-2xl object-cover"
              />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Hower Assistant
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Gestiona tus prospectos de Instagram de manera inteligente
            </p>
          </div>

          {/* Mensaje de bienvenida */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              ¡Bienvenido!
            </h2>
            <p className="text-gray-600">
              Para comenzar, necesitas conectar tu cuenta de Instagram y autorizar el acceso a tus mensajes.
            </p>
          </div>

          {/* Botón de login */}
          <Button
            onClick={handleInstagramLogin}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
            size="lg"
          >
            <Instagram className="w-5 h-5 mr-2" />
            Conectar con Instagram
          </Button>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <LogIn className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">¿Qué necesitas autorizar?</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Acceso a mensajes directos de Instagram</li>
                  <li>• Información básica de tu perfil</li>
                  <li>• Capacidad para enviar respuestas</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Al conectar tu cuenta, aceptas nuestros términos de servicio y política de privacidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramLogin;
