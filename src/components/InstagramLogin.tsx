
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Instagram, Copy, Check } from 'lucide-react';
import { initiateInstagramAuth } from '@/services/instagramService';
import { useToast } from '@/hooks/use-toast';

const InstagramLogin = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generar URL de autorización manual
  const generateAuthUrl = () => {
    const clientId = "1059372749433300";
    const redirectUri = window.location.origin + "/auth/instagram/callback";
    const scope = "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments";
    
    const authUrl = new URL("https://www.instagram.com/oauth/authorize");
    authUrl.searchParams.append("client_id", clientId);
    authUrl.searchParams.append("redirect_uri", redirectUri);
    authUrl.searchParams.append("scope", scope);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("state", "hower-state-" + Date.now());
    
    return authUrl.toString();
  };

  const copyToClipboard = async () => {
    try {
      const url = generateAuthUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: "URL copiada",
        description: "El enlace de autorización ha sido copiado al portapapeles",
        variant: "default"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el enlace. Inténtalo de nuevo.",
        variant: "destructive"
      });
    }
  };

  const handleInstagramLogin = () => {
    console.log("🔥 BOTÓN CLICKEADO - Iniciando proceso de login");
    
    // Detectar si es móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    console.log("📱 Es dispositivo móvil:", isMobile);
    
    if (isMobile) {
      // Para móviles, mostrar instrucciones específicas
      toast({
        title: "📱 Conexión en móvil",
        description: "Te redirigiremos a Instagram. Si se abre la app, usa el menú (⋯) para 'Abrir en navegador'",
        variant: "default"
      });
      
      // Delay pequeño para que el usuario lea el toast
      setTimeout(() => {
        console.log("⏰ Ejecutando redirección después de delay...");
        const success = initiateInstagramAuth();
        if (!success) {
          toast({
            title: "Error de conexión",
            description: "No se pudo conectar con Instagram.",
            variant: "destructive"
          });
        }
      }, 2000);
    } else {
      // Para desktop, proceso normal
      console.log("💻 Dispositivo desktop, proceso normal");
      const success = initiateInstagramAuth();
      if (!success) {
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con Instagram.",
          variant: "destructive"
        });
      }
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
              Hower
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

          {/* Separador */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-gray-400 text-sm font-light">o</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Opciones alternativas */}
          <div className="space-y-3">
            <p className="text-gray-500 text-xs font-light">
              ¿Problemas con el botón? Usa este método alternativo:
            </p>
            
            <div className="flex justify-center">
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="text-xs py-2 px-4"
              >
                {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? 'Copiado' : 'Copiar URL'}
              </Button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 text-left">
              <p className="text-xs text-gray-600 mb-1 font-medium">URL de autorización:</p>
              <p className="text-xs text-gray-500 break-all leading-relaxed">
                {generateAuthUrl().substring(0, 80)}...
              </p>
            </div>

            {/* Instrucciones paso a paso */}
            <div className="bg-blue-50 rounded-lg p-3 text-left mt-3">
              <p className="text-xs font-medium text-blue-700 mb-2">Instrucciones:</p>
              <ol className="text-xs text-blue-600 space-y-1">
                <li className="flex items-start">
                  <span className="font-medium mr-1">1.</span>
                  <span>Copia el link</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-1">2.</span>
                  <span>Abre el link en una NUEVA pestaña</span>
                </li>
                <li className="flex items-start">
                  <span className="font-medium mr-1">3.</span>
                  <span>Sigue los pasos!</span>
                </li>
              </ol>
            </div>
          </div>

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
