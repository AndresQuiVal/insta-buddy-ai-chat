
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleInstagramCallback } from '@/services/instagramService';
import { toast } from '@/components/ui/use-toast';

const InstagramCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const processCallback = async () => {
      // Obtener el código de autorización de los parámetros de la URL
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('Error en callback de Instagram:', error);
        toast({
          title: "Error de autorización",
          description: "El usuario canceló la autorización o hubo un error.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
        return;
      }
      
      if (!code) {
        console.error('No se recibió código de autorización');
        toast({
          title: "Error de autorización",
          description: "No se recibió el código de autorización de Instagram.",
          variant: "destructive"
        });
        navigate('/', { replace: true });
        return;
      }
      
      // Procesar el código de autorización
      const result = await handleInstagramCallback(code);
      
      if (result.success) {
        navigate(result.redirectPath, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    };
    
    processCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Conectando con Instagram</h1>
        <p className="text-gray-600">Procesando autenticación...</p>
      </div>
    </div>
  );
};

export default InstagramCallback;
