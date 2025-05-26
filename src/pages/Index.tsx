
import React, { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ConversationList from '@/components/ConversationList';
import ConfigPanel from '@/components/ConfigPanel';
import Navigation from '@/components/Navigation';
import InstagramMessages from '@/components/InstagramMessages';
import { Settings, MessageCircle, Bot } from 'lucide-react';

const Index = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulator' | 'instagram'>('simulator');
  const [aiConfig, setAiConfig] = useState({
    name: 'Hower',
    personality: 'amigable',
    responseDelay: 10000,
    autoRespond: true
  });
  const [isOnboarded, setIsOnboarded] = useState(localStorage.getItem('hower-onboarded') === 'true');

  useEffect(() => {
    if (!isOnboarded) {
      window.location.href = '/onboarding';
    }
    
    if (!localStorage.getItem('hower-conversations')) {
      localStorage.setItem('hower-conversations', JSON.stringify([]));
    }
  }, [isOnboarded]);

  const toggleConfigPanel = () => {
    setShowConfig(prevState => !prevState);
  };

  if (!isOnboarded) {
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
      <Navigation />
      
      <div className="flex-1">
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
                <p className="text-gray-600 text-sm">Gestión de conversaciones</p>
              </div>
              
              {/* Tabs */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('simulator')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'simulator'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  Simulador
                </button>
                <button
                  onClick={() => setActiveTab('instagram')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'instagram'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Instagram Real
                </button>
              </div>
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
          {activeTab === 'simulator' ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
              <div className="lg:col-span-1">
                <ConversationList
                  activeConversation={activeConversation}
                  onSelectConversation={setActiveConversation}
                />
              </div>

              <div className="lg:col-span-2">
                <ChatInterface
                  activeConversation={activeConversation}
                  aiConfig={aiConfig}
                />
              </div>

              <div className="lg:col-span-1">
                {showConfig && (
                  <ConfigPanel
                    config={aiConfig}
                    onConfigChange={setAiConfig}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
              <div className="lg:col-span-3">
                <InstagramMessages />
              </div>

              <div className="lg:col-span-1">
                {showConfig && (
                  <ConfigPanel
                    config={aiConfig}
                    onConfigChange={setAiConfig}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
