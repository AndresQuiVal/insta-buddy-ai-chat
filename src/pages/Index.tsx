
import React, { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import ConversationList from '@/components/ConversationList';
import ConfigPanel from '@/components/ConfigPanel';
import { Settings, MessageCircle } from 'lucide-react';

const Index = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    name: 'AsistenteIA',
    personality: 'amigable',
    responseDelay: 2000,
    autoRespond: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-purple-100 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Instagram AI Assistant
              </h1>
              <p className="text-gray-600 text-sm">Automatiza tus conversaciones de Instagram</p>
            </div>
          </div>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all duration-200"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
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
  );
};

export default Index;
