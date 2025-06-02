
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ConfigPanel from '@/components/ConfigPanel';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const [isOnboarded, setIsOnboarded] = useState(localStorage.getItem('hower-onboarded') === 'true');
  
  // Verificar si el usuario ha completado el onboarding
  useEffect(() => {
    if (!isOnboarded) {
      // Redirigir a la página de onboarding
      window.location.href = '/onboarding';
    }
  }, [isOnboarded]);

  if (!isOnboarded) {
    // Mostrar pantalla de carga mientras redirige
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  Configuración
                </h1>
                <p className="text-gray-600 text-sm">Personaliza tu asistente Hower</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <ConfigPanel />
        </div>
      </div>
    </div>
  );
};

export default Settings;
