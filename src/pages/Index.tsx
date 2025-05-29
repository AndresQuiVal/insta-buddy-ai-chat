import React, { useState } from 'react';
import InstagramDashboard, { DashboardDebugPanel } from '@/components/InstagramDashboard';
import InstagramMessages from '@/components/InstagramMessages';
import InstagramDiagnostic from '@/components/InstagramDiagnostic';
import AdvancedMetrics from '@/components/AdvancedMetrics';
import TokenManager from '@/components/TokenManager';
import InstagramProspect from '@/components/InstagramProspect';
import HamburgerMenu from '@/components/HamburgerMenu';
import { BarChart3, MessageCircle, Settings, Instagram, CheckCircle, AlertCircle, Key, Brain, LogOut, Bug, Users, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import PersonalityEditor from '@/components/PersonalityEditor';
import MyProspects from '@/components/MyProspects';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [accessToken, setAccessToken] = useState('');
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const { toast } = useToast();
  const [showDebug, setShowDebug] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [instagramToken, setInstagramToken] = useState('');
  const [pageId, setPageId] = useState('');

  const handleSaveToken = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un token válido",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('instagram_access_token', accessToken);
    setIsTokenSaved(true);
    setAccessToken('');
    
    toast({
      title: "¡Token guardado!",
      description: "Tu token de Instagram se ha configurado correctamente",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('instagram_access_token');
    setIsTokenSaved(false);
    toast({
      title: "¡Sesión cerrada!",
      description: "Tu sesión se ha cerrado correctamente",
    });
  };

  const handleSaveOpenAIKey = () => {
    if (!openaiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa una API key de OpenAI",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('hower-openai-key-demo', openaiKey);
    toast({
      title: "¡API Key guardada!",
      description: "La configuración de OpenAI se ha guardado correctamente",
    });
  };

  const handleSaveInstagramToken = () => {
    if (!instagramToken.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un token de Instagram",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('hower-instagram-token', instagramToken);
    toast({
      title: "¡Token guardado!",
      description: "La configuración de Instagram se ha guardado correctamente",
    });
  };

  const handleSavePageId = () => {
    if (!pageId.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa un PAGE-ID",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('hower-page-id', pageId);
    toast({
      title: "¡PAGE-ID guardado!",
      description: "La configuración del PAGE-ID se ha guardado correctamente",
    });
  };

  function buildHowerPrompt() {
    const personalidad = localStorage.getItem('hower-system-prompt') || 'Amigable, cercano y empático...';
    const ideal = JSON.parse(localStorage.getItem('hower-ideal-customer') || '{}');
    const traits = [ideal.trait1, ideal.trait2, ideal.trait3, ideal.trait4].filter(Boolean);

    return `
Actúa como un asistente conversacional humano que se comunica a través de mensajes directos en Instagram. Tu objetivo es filtrar prospectos para mi negocio, conversando de manera genuina, cálida y natural, y recolectando información relevante para identificar si cumplen con las características de mi cliente ideal.

### Personalidad a imitar:
${personalidad}

### Características clave del cliente ideal:
${traits.map((t, i) => `${i + 1}. ${t}`).join('\n')}

### Instrucciones:
- Mantén una conversación natural, empática y centrada en el usuario.
- Haz preguntas abiertas y escucha activamente.
- Sin que el prospecto lo note, intenta descubrir si cumple con cada una de las características clave.
- Si logras identificar que cumple con una característica, anótalo internamente (no lo digas al usuario).
- Al final de la conversación, indica internamente (no al usuario) cuántas características cumple el prospecto, por ejemplo: "Características cumplidas: 3/4".
- Si cumple con las 4 características, indícalo internamente: "✅ Prospecto ideal (4/4)".
- Si no cumple con alguna, indícalo internamente: "Características cumplidas: X/4".
- Nunca reveles que estás evaluando características ni que eres un filtro.

Responde siempre con el tono y estilo de la personalidad indicada arriba.
    `.trim();
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <InstagramDashboard onShowAnalysis={() => setActiveTab('analysis')} />;
      case 'my_prospects':
        return <MyProspects />;
      case 'messages':
        return <InstagramMessages />;
      case 'prospect':
        return <InstagramProspect />;
      case 'analysis':
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <Button
                onClick={() => setActiveTab('dashboard')}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                variant="ghost"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Análisis Detallado</h1>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <AdvancedMetrics />
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <TokenManager />
            <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-bold text-gray-800">Configuración</h3>
              </div>

              <div className="space-y-4">
                {/* OpenAI Key */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    OpenAI API Key
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={openaiKey}
                      onChange={(e) => setOpenaiKey(e.target.value)}
                      placeholder="sk-..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                    <button
                      onClick={handleSaveOpenAIKey}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Token de Instagram */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Token de Instagram
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={instagramToken}
                      onChange={(e) => setInstagramToken(e.target.value)}
                      placeholder="EAA..."
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                    <button
                      onClick={handleSaveInstagramToken}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* PAGE-ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PAGE-ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={pageId}
                      onChange={(e) => setPageId(e.target.value)}
                      placeholder="123456789"
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    />
                    <button
                      onClick={handleSavePageId}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>

                {/* Debug Panel */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowDebug(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Bug className="w-4 h-4" />
                    Debug
                  </button>
                </div>
              </div>
            </div>

            {/* Editor de Personalidad */}
            <PersonalityEditor />
          </div>
        );
      default:
        return <InstagramDashboard onShowAnalysis={() => setActiveTab('analysis')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
              alt="Logo Hower"
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Hower Assistant
            </h1>
          </div>
          <HamburgerMenu activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;
