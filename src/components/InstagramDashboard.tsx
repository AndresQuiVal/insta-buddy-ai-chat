
import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, TrendingUp, Activity, Sparkles, Brain } from 'lucide-react';
import ConversationList from './ConversationList';
import ChatInterface from './ChatInterface';
import { useAITraitAnalysis } from '@/hooks/useAITraitAnalysis';
import { toast } from '@/hooks/use-toast';

const InstagramDashboard = () => {
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [idealTraits, setIdealTraits] = useState<{trait: string, enabled: boolean, position: number}[]>([]);
  const { isAnalyzing, analyzeAllWithAI } = useAITraitAnalysis();

  // Configuración básica de la IA
  const [aiConfig] = useState({
    name: 'Asistente IA',
    personality: 'amigable',
    responseDelay: 2000,
    autoRespond: true
  });

  // Cargar características del cliente ideal
  useEffect(() => {
    loadIdealTraitsFromStorage();
    
    // Escuchar cambios en las características
    const handleTraitsUpdate = () => {
      loadIdealTraitsFromStorage();
    };

    window.addEventListener('traits-updated', handleTraitsUpdate);
    window.addEventListener('storage', handleTraitsUpdate);
    
    return () => {
      window.removeEventListener('traits-updated', handleTraitsUpdate);
      window.removeEventListener('storage', handleTraitsUpdate);
    };
  }, []);

  const loadIdealTraitsFromStorage = () => {
    try {
      const savedTraits = localStorage.getItem('hower-ideal-client-traits');
      console.log("🔍 CARGANDO CARACTERÍSTICAS DESDE LOCALSTORAGE:", savedTraits);
      
      if (savedTraits) {
        const parsedTraits = JSON.parse(savedTraits);
        console.log("📋 CARACTERÍSTICAS PARSEADAS:", parsedTraits);
        
        const formattedTraits = parsedTraits.map((item: any) => ({
          trait: item.trait,
          enabled: item.enabled,
          position: item.position || 0
        }));
        
        setIdealTraits(formattedTraits);
        console.log("✅ Características cargadas en Dashboard:", formattedTraits);
        
        // Mostrar toast con las características cargadas
        const enabledCount = formattedTraits.filter((t: any) => t.enabled).length;
        toast({
          title: `🎯 ${enabledCount} características cargadas`,
          description: `Listas para análisis con IA: ${formattedTraits.filter((t: any) => t.enabled).map((t: any) => t.trait).join(', ')}`,
        });
      } else {
        console.log("⚠️ No se encontraron características en localStorage");
        setIdealTraits([]);
      }
    } catch (error) {
      console.error("❌ Error al cargar características:", error);
      setIdealTraits([]);
    }
  };

  const handleAnalyzeAll = () => {
    console.log("🤖 Botón de análisis masivo presionado");
    console.log("🎯 Características que se van a usar:", idealTraits);
    
    if (idealTraits.length === 0) {
      toast({
        title: "⚠️ No hay características configuradas",
        description: "Ve a Configuración → Cliente Ideal para configurar las características primero",
        variant: "destructive"
      });
      return;
    }
    
    const enabledTraits = idealTraits.filter(t => t.enabled);
    if (enabledTraits.length === 0) {
      toast({
        title: "⚠️ No hay características habilitadas",
        description: "Habilita al menos una característica en la configuración del cliente ideal",
        variant: "destructive"
      });
      return;
    }
    
    console.log("🚀 INICIANDO ANÁLISIS CON CARACTERÍSTICAS:", enabledTraits);
    analyzeAllWithAI(idealTraits);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Instagram IA Dashboard
          </h1>
          <p className="text-gray-600">
            Gestiona tus conversaciones con análisis inteligente en tiempo real
          </p>
          
          {/* Debug info de características */}
          <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-800">
            <strong>🔍 Debug Características:</strong> {idealTraits.length} total, {idealTraits.filter(t => t.enabled).length} habilitadas
            {idealTraits.length > 0 && (
              <div className="mt-1">
                {idealTraits.map((trait, idx) => (
                  <span key={idx} className={`inline-block mr-2 px-2 py-1 rounded ${trait.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {trait.trait}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Botón de análisis masivo */}
          <div className="mt-4">
            <button
              onClick={handleAnalyzeAll}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analizar Todo con IA ({idealTraits.filter(t => t.enabled).length} características)
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Analiza todas las conversaciones con inteligencia artificial
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-purple-100 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversaciones</p>
                <p className="text-2xl font-bold text-gray-800">12</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-purple-100 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prospectos Activos</p>
                <p className="text-2xl font-bold text-gray-800">8</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-purple-100 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasa de Respuesta</p>
                <p className="text-2xl font-bold text-gray-800">85%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-6 border border-purple-100 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Características IA</p>
                <p className="text-2xl font-bold text-gray-800">
                  {idealTraits.filter(t => t.enabled).length}
                </p>
              </div>
              <Sparkles className="w-8 h-8 text-pink-500" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversation List */}
          <div className="lg:col-span-1">
            <ConversationList 
              activeConversation={activeConversation}
              onSelectConversation={setActiveConversation}
            />
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <ChatInterface 
              activeConversation={activeConversation}
              aiConfig={aiConfig}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramDashboard;
