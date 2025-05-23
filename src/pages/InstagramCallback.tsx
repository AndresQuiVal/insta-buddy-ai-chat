
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

const InstagramCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulamos una conexión exitosa inmediatamente
    console.log('Simulando callback exitoso de Instagram...');
    
    // Guardar token simulado
    localStorage.setItem('hower-instagram-token', `demo-callback-token-${Date.now()}`);
    
    // Mostrar mensaje de éxito
    toast({
      title: "Conexión exitosa (simulada)",
      description: "Tu cuenta de Instagram ha sido conectada a Hower."
    });
    
    // Redirigir al dashboard o a la ruta guardada
    const redirectPath = localStorage.getItem('hower-auth-redirect') || '/';
    localStorage.removeItem('hower-auth-redirect');
    navigate(redirectPath, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Conectando con Instagram</h1>
        <p className="text-gray-600">Procesando autenticación simulada...</p>
      </div>
    </div>
  );
};

export default InstagramCallback;
