
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { handleInstagramCallback } from '@/services/instagramService';

const InstagramCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState<string>('Procesando la conexión con Instagram...');

  useEffect(() => {
    async function processCallback() {
      // Obtener el código de autorización de la URL
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      
      if (!code) {
        setStatus('Error: No se recibió un código de autorización válido');
        return;
      }
      
      try {
        const result = await handleInstagramCallback(code);
        
        if (result.success) {
          // Redirigir al usuario a donde estaba antes
          navigate(result.redirectPath, { replace: true });
        } else {
          setStatus(`Error: ${result.error || 'Hubo un problema al conectar con Instagram'}`);
          // Después de 3 segundos, redirigir al onboarding
          setTimeout(() => navigate('/onboarding', { replace: true }), 3000);
        }
      } catch (error) {
        setStatus('Error al procesar la autorización. Redirigiendo...');
        setTimeout(() => navigate('/onboarding', { replace: true }), 3000);
      }
    }

    processCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Conectando con Instagram</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
};

export default InstagramCallback;
