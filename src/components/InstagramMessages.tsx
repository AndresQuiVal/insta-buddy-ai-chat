
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, User, Bot, RefreshCw, Settings, Clock, Brain, Star, ArrowLeft } from 'lucide-react';
import { handleAutomaticResponse, ChatMessage } from '@/services/openaiService';
import { sendInstagramMessage } from '@/services/instagramService';
import HistoricalSyncButton from './HistoricalSyncButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTraitAnalysis } from '@/hooks/useTraitAnalysis';
import { useAITraitAnalysis } from '@/hooks/useAITraitAnalysis';

interface InstagramMessage {
  id: string;
  instagram_message_id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  message_type: 'received' | 'sent';
  timestamp: string;
  created_at: string;
  raw_data: any;
  is_read?: boolean;
}

interface Conversation {
  sender_id: string;
  messages: InstagramMessage[];
  last_message: InstagramMessage;
  unread_count: number;
  matchPoints?: number;
  metTraits?: string[];
  metTraitIndices?: number[];
}

interface TraitWithPosition {
  trait: string;
  enabled: boolean;
  position: number;
}

interface SavedAnalysis {
  matchPoints: number;
  metTraits: string[];
  metTraitIndices: number[];
  lastAnalyzedAt: string;
  messageCount: number;
}

interface UserSettings {
  id: string;
  instagram_page_id?: string;
  ia_persona?: string;
  ai_enabled?: boolean;
  ai_delay?: number;
}

interface ProspectAnalysis {
  id: string;
  sender_id: string;
  match_points?: number;
  met_traits?: string[];
  met_trait_indices?: number[];
  last_analyzed_at?: string;
  message_count?: number;
}

const InstagramMessages: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [aiDelay, setAiDelay] = useState(3);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [pageId, setPageId] = useState<string | null>(null);
  const [iaPersona, setIaPersona] = useState<string>('');
  const [showPersona, setShowPersona] = useState<boolean>(false);
  const aiEnabledRef = useRef(aiEnabled);
  const [isTabLeader, setIsTabLeader] = useState(false);
  const TAB_KEY = 'hower-active-tab';
  const myTabId = React.useRef(`${Date.now()}-${Math.random()}`);
  const isMobile = useIsMobile();
  const [idealTraits, setIdealTraits] = useState<{trait: string, enabled: boolean}[]>([]);
  
  // Hook de análisis de características
  const { isAnalyzing, analyzeAndUpdateProspect } = useTraitAnalysis();
  const { isAnalyzing: isAnalyzingAll, analyzeAll, loadIdealTraits } = useAITraitAnalysis();

  // 🔥 NUEVA FLAG PARA EVITAR BUCLES
  const isLoadingRef = useRef(false);

  useEffect(() => { aiEnabledRef.current = aiEnabled; }, [aiEnabled]);

  useEffect(() => {
    // Intentar ser el líder al montar
    localStorage.setItem(TAB_KEY, myTabId.current);
    setIsTabLeader(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === TAB_KEY && e.newValue !== myTabId.current) {
        setIsTabLeader(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      if (localStorage.getItem(TAB_KEY) === myTabId.current) {
        localStorage.removeItem(TAB_KEY);
      }
    };
  }, []);

  useEffect(() => {
    const traits = loadIdealTraits();
    setIdealTraits(traits);
    console.log("📋 Características cargadas en Messages:", traits);
  }, [loadIdealTraits]);

  useEffect(() => {
    loadConversations();
    
    // Configurar suscripción a nuevos mensajes
    const channel = supabase
      .channel('instagram-messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'instagram_messages'
        },
        (payload) => {
          console.log('🔔 Nuevo mensaje recibido:', payload.new);
          handleNewMessage(payload.new as any);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleNewMessage = async (newMessage: any) => {
    console.log('📨 Procesando nuevo mensaje:', newMessage);
    
    // Solo analizar mensajes recibidos (no enviados)
    if (newMessage.message_type === 'received') {
      console.log('🔍 Analizando mensaje recibido de:', newMessage.sender_id);
      
      try {
        // Obtener todas las características ideales
        const { data: traitsData } = await supabase
          .from('ideal_client_traits')
          .select('*')
          .eq('enabled', true)
          .order('position');

        if (traitsData && traitsData.length > 0) {
          const traits = traitsData.map(t => ({
            trait: t.trait,
            enabled: t.enabled,
            position: t.position
          }));

          // Obtener todo el historial de mensajes de este remitente
          const { data: allMessages } = await supabase
            .from('instagram_messages')
            .select('*')
            .eq('sender_id', newMessage.sender_id)
            .order('created_at', { ascending: true });

          if (allMessages && allMessages.length > 0) {
            // Crear texto completo de la conversación (solo mensajes del usuario)
            const userMessages = allMessages
              .filter(msg => msg.message_type === 'received')
              .map(msg => msg.message_text)
              .join(' ');

            console.log('📝 Texto completo para análisis:', userMessages.substring(0, 200) + '...');

            // Analizar con AI
            const result = await analyzeAndUpdateProspect(
              newMessage.sender_id,
              `Usuario ${newMessage.sender_id.slice(-4)}`,
              userMessages,
              traits
            );

            console.log('✅ Resultado del análisis:', result);

            // Guardar análisis en Supabase
            if (result.matchPoints > 0) {
              await saveAnalysisToSupabase(newMessage.sender_id, result, allMessages.length);
            }

            // Recargar conversaciones para mostrar el análisis actualizado
            await loadConversations();
          }
        }
      } catch (error) {
        console.error('❌ Error analizando nuevo mensaje:', error);
      }
    }
    
    // Recargar conversaciones para mostrar el nuevo mensaje
    await loadConversations();
  };

  const saveAnalysisToSupabase = async (senderId: string, analysis: any, messageCount: number) => {
    try {
      console.log('💾 Guardando análisis en Supabase:', { senderId, analysis, messageCount });
      
      const analysisData = {
        sender_id: senderId,
        match_points: analysis.matchPoints || 0,
        met_traits: analysis.metTraits || [],
        met_trait_indices: analysis.metTraitIndices || [],
        last_analyzed_at: new Date().toISOString(),
        message_count: messageCount,
        analysis_data: {
          timestamp: new Date().toISOString(),
          traits_analyzed: idealTraits.length,
          full_analysis: analysis
        }
      };

      const { data, error } = await supabase
        .from('prospect_analysis')
        .upsert(analysisData, { 
          onConflict: 'sender_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('❌ Error guardando análisis:', error);
      } else {
        console.log('✅ Análisis guardado correctamente:', data);
      }
    } catch (error) {
      console.error('❌ Error en saveAnalysisToSupabase:', error);
    }
  };

  const handleAnalyzeAll = async () => {
    console.log("🔍 Iniciando análisis completo con IA...");
    
    try {
      await analyzeAll();
      
      toast({
        title: "🤖 ¡Análisis completado!",
        description: "Todas las conversaciones han sido analizadas con IA",
      });
      
      // Recargar estadísticas después del análisis
      await loadConversations();
      
    } catch (error) {
      console.error("Error en análisis:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al analizar las conversaciones",
        variant: "destructive"
      });
    }
  };

  const loadConversations = async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    try {
      setLoading(true);
      
      const { data: messages, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      // Obtener configuraciones de usuario
      const { data: userData, error: userError } = await supabase
        .from('user_settings')
        .select('*')
        .single();

      if (!userError && userData) {
        setPageId(userData.instagram_page_id || null);
        setIaPersona(userData.ia_persona || '');
      }

      // Agrupar mensajes por conversación
      const conversationMap = new Map<string, Conversation>();

      messages?.forEach((message) => {
        const conversationId = message.sender_id;
        
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            sender_id: conversationId,
            messages: [],
            last_message: {
              id: message.id,
              instagram_message_id: message.instagram_message_id,
              sender_id: message.sender_id,
              recipient_id: message.recipient_id,
              message_text: message.message_text,
              message_type: message.message_type as 'received' | 'sent',
              timestamp: message.timestamp,
              created_at: message.created_at,
              raw_data: message.raw_data
            },
            unread_count: 0,
            matchPoints: 0,
            metTraits: [],
            metTraitIndices: []
          });
        }

        const conversation = conversationMap.get(conversationId)!;
        const messageObj: InstagramMessage = {
          id: message.id,
          instagram_message_id: message.instagram_message_id,
          sender_id: message.sender_id,
          recipient_id: message.recipient_id,
          message_text: message.message_text,
          message_type: message.message_type as 'received' | 'sent',
          timestamp: message.timestamp,
          created_at: message.created_at,
          raw_data: message.raw_data,
          is_read: message.is_read
        };
        
        conversation.messages.push(messageObj);
        
        // Actualizar último mensaje (el más reciente)
        if (new Date(message.created_at) > new Date(conversation.last_message.created_at)) {
          conversation.last_message = messageObj;
        }

        // Contar mensajes no leídos
        if (message.message_type === 'received' && !message.is_read) {
          conversation.unread_count++;
        }
      });

      // Cargar análisis guardados
      const { data: analysisData, error: analysisError } = await supabase
        .from('prospect_analysis')
        .select('*');

      if (!analysisError && analysisData) {
        analysisData.forEach((analysis: any) => {
          const conversation = conversationMap.get(analysis.sender_id);
          if (conversation) {
            conversation.matchPoints = analysis.match_points || 0;
            conversation.metTraits = analysis.met_traits || [];
            conversation.metTraitIndices = analysis.met_trait_indices || [];
          }
        });
      }

      const conversationsArray = Array.from(conversationMap.values())
        .sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime());

      setConversations(conversationsArray);
      
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las conversaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const getUserDisplayName = (senderId: string): string => {
    return `Usuario ${senderId.slice(-4)}`;
  };

  const selectedMessages = selectedConversation 
    ? conversations.find(c => c.sender_id === selectedConversation)?.messages
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || []
    : [];

  const sendMessage = async (messageText: string) => {
    if (!selectedConversation || !messageText.trim() || !pageId) return;
    
    try {
      setSending(true);
      
      const result = await sendInstagramMessage(selectedConversation, messageText);
      
      if (result.success) {
        setNewMessage('');
        toast({
          title: "Mensaje enviado",
          description: "Tu mensaje se ha enviado correctamente",
        });
        
        // Recargar conversaciones para mostrar el nuevo mensaje
        loadConversations();
      } else {
        toast({
          title: "Error al enviar",
          description: result.error || "No se pudo enviar el mensaje",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Error al enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const handleFeedAI = async () => {
    try {
      const { data: messages } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);

      if (!messages || messages.length === 0) {
        toast({
          title: "No hay mensajes",
          description: "No se encontraron mensajes para alimentar la IA",
          variant: "destructive"
        });
        return;
      }

      // Crear contexto de conversación
      const conversationContext = messages.map(msg => ({
        role: msg.message_type === 'sent' ? 'assistant' : 'user',
        content: msg.message_text
      }));

      toast({
        title: "IA Alimentada",
        description: `Se alimentó la IA con ${messages.length} mensajes`,
      });

    } catch (error) {
      console.error('Error feeding AI:', error);
      toast({
        title: "Error",
        description: "Error al alimentar la IA",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex">
      {/* Lista de conversaciones */}
      <div className={`${isMobile && selectedConversation ? 'hidden' : 'flex'} flex-col w-full ${!isMobile ? 'max-w-md' : ''} border-r border-purple-100`}>
        <div className="flex items-center justify-between p-4 border-b border-purple-100">
          <div>
            <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" /> Conversaciones
            </h2>
            <p className="text-sm text-gray-600">{conversations.length} conversaciones</p>
            <p className="text-sm text-gray-600 mt-1">
              Características configuradas: {idealTraits.filter(t => t.enabled).length} activas
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Configuración"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={loadConversations}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Recargar"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Botón Analizar Todo con IA */}
        <div className="p-4 border-b border-purple-100">
          <button
            onClick={handleAnalyzeAll}
            disabled={isAnalyzingAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Brain className="w-4 h-4" />
            {isAnalyzingAll ? 'Analizando...' : `🔍 Analizar Todo (${idealTraits.filter(t => t.enabled).length} criterios)`}
            {isAnalyzingAll && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
          </button>
        </div>

        {/* Configuración */}
        {showSettings && (
          <div className="p-4 border-b border-purple-100 bg-gray-50">
            <h3 className="font-semibold text-gray-700 mb-3">Configuración IA</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">IA Habilitada</label>
                <input
                  type="checkbox"
                  checked={aiEnabled}
                  onChange={(e) => setAiEnabled(e.target.checked)}
                  className="rounded"
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600 block mb-1">
                  Delay respuesta (segundos): {aiDelay}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={aiDelay}
                  onChange={(e) => setAiDelay(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <button
                onClick={handleFeedAI}
                className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Alimentar IA
              </button>

              <HistoricalSyncButton />

              {iaPersona && (
                <div className="mt-3">
                  <button
                    onClick={() => setShowPersona(!showPersona)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {showPersona ? 'Ocultar' : 'Ver'} personalidad IA
                  </button>
                  {showPersona && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-gray-700">
                      {iaPersona}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista de conversaciones */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay conversaciones</h3>
              <p className="text-gray-500">Las conversaciones aparecerán aquí cuando lleguen mensajes</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.sender_id}
                onClick={() => setSelectedConversation(conversation.sender_id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.sender_id ? 'bg-purple-50 border-purple-200' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-800">
                      {getUserDisplayName(conversation.sender_id)}
                    </h4>
                    {(conversation.matchPoints || 0) > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-yellow-700">
                          {conversation.matchPoints}/4
                        </span>
                      </div>
                    )}
                  </div>
                  {conversation.unread_count > 0 && (
                    <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 truncate">
                  {conversation.last_message.message_text}
                </p>
                
                {/* Características cumplidas */}
                {(() => {
                  const metTraitIndices = conversation.metTraitIndices || [];
                  if (metTraitIndices.length > 0) {
                    return (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-medium text-green-700">
                          ✅ Características cumplidas:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {metTraitIndices.slice(0, 2).map((idx, i) => {
                            const trait = idealTraits[idx];
                            if (!trait) return null;
                            
                            const shortTrait = trait.trait.length > 25 
                              ? trait.trait.substring(0, 25) + "..." 
                              : trait.trait;
                            
                            return (
                              <span 
                                key={i} 
                                className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs border border-green-200"
                                title={trait.trait}
                              >
                                {shortTrait}
                              </span>
                            );
                          })}
                          {metTraitIndices.length > 2 && (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs border border-green-200">
                              +{metTraitIndices.length - 2} más
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  } else if ((conversation.matchPoints || 0) === 0) {
                    return (
                      <div className="mt-2">
                        <div className="text-xs text-gray-500 italic">
                          📋 Sin características analizadas
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(conversation.last_message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Panel de chat */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header del chat */}
          <div className="p-4 border-b border-purple-100 flex items-center gap-3">
            {isMobile && (
              <button
                onClick={() => setSelectedConversation(null)}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="font-semibold text-gray-800">
                {getUserDisplayName(selectedConversation)}
              </h3>
              <p className="text-sm text-gray-500">
                {selectedMessages.length} mensajes
              </p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.message_type === 'sent' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.message_type === 'sent'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.message_type === 'sent' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-75">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.message_text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input de mensaje */}
          <div className="p-4 border-t border-purple-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage(newMessage)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                disabled={sending}
              />
              <button
                onClick={() => sendMessage(newMessage)}
                disabled={sending || !newMessage.trim()}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Selecciona una conversación
            </h3>
            <p className="text-gray-500">
              Elige una conversación de la lista para ver los mensajes
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramMessages;
