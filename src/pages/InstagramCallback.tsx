
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleInstagramCallback } from '@/services/instagramService';
import { toast } from '@/hooks/use-toast';

const InstagramCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      console.log('🔄 Iniciando procesamiento del callback de Instagram...');
      console.log('📋 URL params:', Object.fromEntries(searchParams.entries()));
      
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorReason = searchParams.get('error_reason');
      const errorDescription = searchParams.get('error_description');
      
      if (error) {
        console.error('❌ Error en callback de Instagram:', {
          error,
          errorReason,
          errorDescription
        });
        
        setStatus('error');
        
        let errorMessage = "El usuario canceló la autorización o hubo un error.";
        if (errorDescription) {
          errorMessage = errorDescription;
        }
        
        toast({
          title: "Error de autorización",
          description: errorMessage,
          variant: "destructive"
        });
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
        return;
      }
      
      if (!code) {
        console.error('❌ No se recibió código de autorización');
        setStatus('error');
        toast({
          title: "Error de autorización",
          description: "No se recibió el código de autorización de Instagram.",
          variant: "destructive"
        });
        
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
        return;
      }
      
      console.log('✅ Código recibido, procesando con API...');
      
      const result = await handleInstagramCallback(code);
      
      if (result.success) {
        setStatus('success');
        console.log('🎉 Callback procesado exitosamente');
        
        // 🔍 LOG DETALLADO DEL ID QUE SE ESTÁ GUARDANDO
        const savedUserData = localStorage.getItem('hower-instagram-user');
        if (savedUserData) {
          const userData = JSON.parse(savedUserData);
          console.log('📊 DATOS GUARDADOS EN LOCALSTORAGE:');
          console.log('- Facebook ID:', userData.facebook?.id);
          console.log('- Instagram ID:', userData.instagram?.id);
          console.log('- Final ID usado:', userData.instagram?.id || userData.facebook?.id);
        }
        
        // Verificar si venimos del onboarding y marcar como exitoso
        const authSource = localStorage.getItem('instagram_auth_source');
        if (authSource === 'onboarding') {
          localStorage.setItem('instagram_auth_success', 'true');
          console.log('🚀 Marcando auth exitoso para onboarding...');
          
          setTimeout(() => {
            localStorage.removeItem('instagram_auth_source');
            console.log('🚀 Regresando al onboarding...');
            navigate('/hower-lite-onboarding', { replace: true });
          }, 500);
        } else {
          // Login normal - marcar flag y ir directo a tasks-to-do
          console.log('🎯 Login exitoso, navegando a tasks-to-do...');
          localStorage.setItem('just-logged-in', 'true');
          
          setTimeout(() => {
            navigate('/tasks-to-do', { replace: true });
          }, 500);
        }
      } else {
        console.error('❌ Error procesando callback:', result.error);
        setStatus('error');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };
    
    processCallback();
  }, [navigate, searchParams]);

  const getStatusContent = () => {
    switch (status) {
      case 'processing':
        return {
          title: 'Conectando con Instagram',
          description: 'Procesando autenticación...',
          icon: <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>,
          bgColor: 'bg-blue-50'
        };
      case 'success':
        return {
          title: '¡Conexión exitosa!',
          description: 'Redirigiendo a tus tareas...',
          icon: <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">✓</div>,
          bgColor: 'bg-green-50'
        };
      case 'error':
        return {
          title: 'Error de conexión',
          description: 'Redirigiendo...',
          icon: <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">✗</div>,
          bgColor: 'bg-red-50'
        };
      default:
        return {
          title: 'Procesando...',
          description: '',
          icon: null,
          bgColor: 'bg-gray-50'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className={`min-h-screen ${content.bgColor} flex items-center justify-center`}>
      <div className="text-center p-8 max-w-md">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          {content.icon}
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{content.title}</h1>
        <p className="text-gray-600">{content.description}</p>
        
        {status === 'processing' && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-primary h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramCallback;
