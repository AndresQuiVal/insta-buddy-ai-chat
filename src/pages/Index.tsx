
import React, { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ConversationList from '@/components/ConversationList';
import ConfigPanel from '@/components/ConfigPanel';
import Navigation from '@/components/Navigation';
import { Settings, MessageCircle } from 'lucide-react';

const Index = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    name: 'Hower',
    personality: 'amigable',
    responseDelay: 10000, // Valor inicial ahora es 10 segundos
    autoRespond: true
  });
  const [isOnboarded, setIsOnboarded] = useState(localStorage.getItem('hower-onboarded') === 'true');

  // Verificar si el usuario ha completado el onboarding
  useEffect(() => {
    if (!isOnboarded) {
      // Redirigir a la página de onboarding
      window.location.href = '/onboarding';
    }
    
    // Inicializar estructura para las conversaciones si no existe
    if (!localStorage.getItem('hower-conversations')) {
      localStorage.setItem('hower-conversations', JSON.stringify([]));
    }
  }, [isOnboarded]);

  const toggleConfigPanel = () => {
    setShowConfig(prevState => !prevState);
  };

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
              <h1 className="text-2xl font-bold text-primary">
                Dashboard
              </h1>
              <p className="text-gray-600 text-sm">Gestión de conversaciones</p>
            </div>
            <button
              onClick={toggleConfigPanel}
              className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark hover:shadow-lg transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
            {/* Lista de conversaciones */}
            <div className="lg:col-span-1">
              <ConversationList
                activeConversation={activeConversation}
                onSelectConversation={setActiveConversation}
              />
            </div>

            {/* Chat principal */}
            <div className="lg:col-span-2">
              <ChatInterface
                activeConversation={activeConversation}
                aiConfig={aiConfig}
              />
            </div>

            {/* Panel de configuración */}
            <div className="lg:col-span-1">
              {showConfig && (
                <ConfigPanel
                  config={aiConfig}
                  onConfigChange={setAiConfig}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
