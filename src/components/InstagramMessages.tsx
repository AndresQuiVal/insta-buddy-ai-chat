import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, User, Bot, RefreshCw, Settings, Clock, Brain, Star, ArrowLeft, Bug, Terminal } from 'lucide-react';
import { handleAutomaticResponse, ChatMessage } from '@/services/openaiService';
import { sendInstagramMessage } from '@/services/instagramService';
import HistoricalSyncButton from './HistoricalSyncButton';
import ConversationDebug from './ConversationDebug';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTraitAnalysis } from '@/hooks/useTraitAnalysis';
import { useAITraitAnalysis } from '@/hooks/useAITraitAnalysis';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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

interface LogMessage {
  timestamp: Date;
  message: string;
  type: 'info' | 'error' | 'success';
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
  const [showDebug, setShowDebug] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logsRef = useRef<LogMessage[]>([]);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  
  // Hook de análisis de características
  const { isAnalyzing, analyzeAndUpdateProspect } = useTraitAnalysis();

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
    // Cargar características ideales desde Supabase
    loadIdealTraits();
    
    // Escuchar cambios en las características
    const handleTraitsUpdate = () => {
      console.log("🔄 Recargando características por evento...");
      loadIdealTraits();
    };
    
    window.addEventListener('traits-updated', handleTraitsUpdate);
    
    return () => {
      window.removeEventListener('traits-updated', handleTraitsUpdate);
    };
  }, []);

  const loadIdealTraits = async () => {
    try {
      console.log("🔍 Cargando características ideales desde Supabase...");
      
      const { data: traits, error } = await supabase
        .from('ideal_client_traits')
        .select('*')
        .order('position');

      if (error) {
        console.error('❌ Error loading ideal traits:', error);
        // Si hay error en Supabase, intentar cargar desde localStorage
        const savedTraits = localStorage.getItem('hower-ideal-client-traits');
        if (savedTraits) {
          const parsedTraits = JSON.parse(savedTraits);
          const traitsData = parsedTraits.map((t: any) => ({
            trait: t.trait,
            enabled: t.enabled
          }));
          setIdealTraits(traitsData);
          console.log("✅ Características cargadas desde localStorage:", traitsData);
          return;
        }
        
        toast({
          title: "Error al cargar características",
          description: "Verifica tu conexión y recarga las características",
          variant: "destructive"
        });
        return;
      }

      console.log("📋 Datos de características obtenidos desde Supabase:", traits);

      if (!traits || traits.length === 0) {
        console.log("⚠️ No se encontraron características en Supabase");
        setIdealTraits([]);
        toast({
          title: "⚠️ Sin características configuradas",
          description: "Ve a Configuración > Cliente Ideal para configurar las características",
          variant: "destructive"
        });
        return;
      }

      const traitsData = traits.map(t => ({
        trait: t.trait,
        enabled: t.enabled
      }));

      console.log("✅ Características procesadas desde Supabase:", traitsData);
      console.log(`📊 Total características: ${traitsData.length}, Habilitadas: ${traitsData.filter(t => t.enabled).length}`);

      setIdealTraits(traitsData);
      
      const enabledCount = traitsData.filter(t => t.enabled).length;
      
      if (enabledCount === 0) {
        toast({
          title: "⚠️ Sin características habilitadas",
          description: "Ve a Configuración > Cliente Ideal y habilita al menos una característica",
          variant: "destructive"
        });
      } else {
        console.log(`✅ ${enabledCount} de ${traitsData.length} características habilitadas correctamente`);
      }

    } catch (error) {
      console.error('💥 Error in loadIdealTraits:', error);
      toast({
        title: "Error",
        description: "Error al cargar las características del cliente ideal",
        variant: "destructive"
      });
    }
  };

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
        if (idealTraits && idealTraits.length > 0) {
          const traits = idealTraits.map((t, idx) => ({
            trait: t.trait,
            enabled: t.enabled,
            position: idx
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
    if (idealTraits.length === 0) {
      toast({
        title: "⚠️ Sin características configuradas",
        description: "Primero configura las características del cliente ideal en Configuración",
        variant: "destructive"
      });
      return;
    }

    const enabledTraits = idealTraits.filter(t => t.enabled);
    
    if (enabledTraits.length === 0) {
      toast({
        title: "⚠️ Sin características habilitadas",
        description: "Habilita al menos una característica en Configuración > Cliente Ideal",
        variant: "destructive"
      });
      return;
    }

    console.log("🔍 INICIANDO ANÁLISIS COMPLETO DE TODAS LAS CONVERSACIONES");
    console.log(`🎯 Características habilitadas: ${enabledTraits.length}/${idealTraits.length}`);
    enabledTraits.forEach((trait, idx) => {
      console.log(`   ${idx + 1}. ${trait.trait}`);
    });

    setIsAnalyzingAll(true);
    addLog('=== INICIANDO ANÁLISIS COMPLETO ===', 'info');
    addLog(`Características habilitadas: ${enabledTraits.length}/${idealTraits.length}`, 'info');
    
    try {
      let totalAnalyzed = 0;
      let totalWithMatches = 0;

      for (const conversation of conversations) {
        addLog(`🔍 Analizando: Usuario ${conversation.sender_id.slice(-4)}`, 'info');
        
        // Obtener solo los mensajes del usuario (recibidos)
        const userMessages = conversation.messages
          .filter(msg => msg.message_type === 'received')
          .map(msg => msg.message_text)
          .join(' ');

        if (userMessages.trim()) {
          console.log(`📝 Analizando ${conversation.sender_id}: "${userMessages.substring(0, 100)}..."`);
          
          const traits = enabledTraits.map((t, idx) => ({
            trait: t.trait,
            enabled: t.enabled,
            position: idx
          }));

          try {
            const result = await analyzeAndUpdateProspect(
              conversation.sender_id,
              `Usuario ${conversation.sender_id.slice(-4)}`,
              userMessages,
              traits
            );

            totalAnalyzed++;
            
            if (result.matchPoints > 0) {
              totalWithMatches++;
              addLog(`✅ Usuario ${conversation.sender_id.slice(-4)}: ${result.matchPoints}/${enabledTraits.length} características`, 'success');
              
              // Guardar en Supabase
              await saveAnalysisToSupabase(conversation.sender_id, result, conversation.messages.length);
            } else {
              addLog(`❌ Usuario ${conversation.sender_id.slice(-4)}: 0 características cumplidas`, 'info');
            }

          } catch (error) {
            console.error(`❌ Error analizando ${conversation.sender_id}:`, error);
            addLog(`❌ Error analizando Usuario ${conversation.sender_id.slice(-4)}: ${error.message}`, 'error');
          }
        } else {
          addLog(`⚠️ Usuario ${conversation.sender_id.slice(-4)}: Sin mensajes del usuario para analizar`, 'info');
        }
      }

      addLog('=== ANÁLISIS COMPLETADO ===', 'success');
      addLog(`📊 Total conversaciones analizadas: ${totalAnalyzed}`, 'success');
      addLog(`⭐ Conversaciones con características: ${totalWithMatches}`, 'success');

      // Recargar conversaciones para mostrar análisis actualizado
      await loadConversations();
      
      toast({
        title: "🤖 ¡Análisis completado!",
        description: `${totalAnalyzed} conversaciones analizadas. ${totalWithMatches} con características cumplidas.`,
      });
      
    } catch (error) {
      console.error("❌ Error en análisis completo:", error);
      addLog(`❌ Error general: ${error.message}`, 'error');
      toast({
        title: "Error en análisis",
        description: "Hubo un problema al analizar las conversaciones",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingAll(false);
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

      // ORDENAR CONVERSACIONES POR MATCH POINTS (mayor a menor) Y LUEGO POR FECHA
      const conversationsArray = Array.from(conversationMap.values())
        .sort((a, b) => {
          // Primero ordenar por matchPoints (mayor a menor)
          const matchPointsA = a.matchPoints || 0;
          const matchPointsB = b.matchPoints || 0;
          
          if (matchPointsA !== matchPointsB) {
            return matchPointsB - matchPointsA;
          }
          
          // Si tienen los mismos matchPoints, ordenar por fecha (más reciente primero)
          return new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime();
        });

      console.log("📊 CONVERSACIONES ORDENADAS POR MATCH POINTS:");
      conversationsArray.forEach((conv, idx) => {
        console.log(`${idx + 1}. Usuario ${conv.sender_id.slice(-4)}: ${conv.matchPoints || 0}/${idealTraits.length} características`);
      });

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

  const addLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const newLog = { timestamp: new Date(), message, type };
    logsRef.current = [...logsRef.current, newLog];
    setLogs(logsRef.current);
  };

  const sendMessage = async (messageText: string) => {
    if (!selectedConversation || !messageText.trim() || !pageId) return;
    
    try {
      setSending(true);
      
      // Obtener y mostrar la conversación completa antes de enviar
      const currentConversation = conversations.find(c => c.sender_id === selectedConversation);
      if (currentConversation) {
        addLog('=== CONVERSACIÓN COMPLETA ANTES DE ENVIAR MENSAJE ===', 'info');
        addLog(`ID de Conversación: ${selectedConversation}`, 'info');
        addLog('Historial de mensajes:', 'info');
        currentConversation.messages
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .forEach((msg, index) => {
            addLog(`[${index + 1}] ${msg.message_type === 'received' ? 'USUARIO' : 'BOT'} (${new Date(msg.timestamp).toLocaleString()}): ${msg.message_text}`, 'info');
          });
        addLog('=== FIN DE LA CONVERSACIÓN ===', 'info');
        addLog(`Nuevo mensaje a enviar: ${messageText}`, 'info');
      }
      
      const result = await sendInstagramMessage(selectedConversation, messageText);
      
      if (result.success) {
        setNewMessage('');
        addLog('Mensaje enviado exitosamente', 'success');
        toast({
          title: "Mensaje enviado",
          description: "Tu mensaje se ha enviado correctamente",
        });
        
        // Recargar conversaciones para mostrar el nuevo mensaje
        loadConversations();
      } else {
        addLog(`Error al enviar mensaje: ${result.error}`, 'error');
        toast({
          title: "Error al enviar",
          description: result.error || "No se pudo enviar el mensaje",
          variant: "destructive"
        });
      }
    } catch (error) {
      addLog(`Error en envío de mensaje: ${error.message}`, 'error');
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
    <div className="flex-1 flex">
      {/* Lista de conversaciones */}
      <div className={`w-80 border-r border-gray-200 flex flex-col ${isMobile && selectedConversation ? 'hidden' : ''}`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Mensajes</h2>
          <div className="flex items-center gap-2">
            <HistoricalSyncButton />
            {selectedConversation && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowDebug(true)}
                  title="Ver debug de conversación"
            >
                  <Bug className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowLogs(true)}
                  title="Ver logs en vivo"
            >
                  <Terminal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Botón Analizar Todo con IA */}
        <div className="p-4 border-b border-purple-100">
          <button
            onClick={handleAnalyzeAll}
            disabled={isAnalyzingAll || idealTraits.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Brain className="w-4 h-4" />
            {isAnalyzingAll ? 'Analizando...' : `🔍 Analizar Todo (${idealTraits.filter(t => t.enabled).length} criterios)`}
            {isAnalyzingAll && <RefreshCw className="w-4 h-4 animate-spin ml-2" />}
          </button>
          {idealTraits.length === 0 && (
            <p className="text-xs text-red-500 mt-1 text-center">
              Configura características del cliente ideal primero
            </p>
          )}
          {idealTraits.length > 0 && idealTraits.filter(t => t.enabled).length === 0 && (
            <p className="text-xs text-orange-500 mt-1 text-center">
              Habilita al menos una característica en Configuración
            </p>
          )}
          <div className="mt-2 text-center">
            <button 
              onClick={loadIdealTraits}
              disabled={isAnalyzingAll}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              🔄 Recargar características
            </button>
          </div>
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
                          {conversation.matchPoints}/{idealTraits.length}
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

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Logs en Vivo</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setLogs([])}>Limpiar</Button>
                <Button variant="outline" onClick={() => setShowLogs(false)}>Cerrar</Button>
              </div>
            </div>
            
            <ScrollArea className="flex-1 bg-gray-900 rounded-lg p-4 font-mono text-sm">
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'success' ? 'text-green-400' :
                      'text-gray-300'
                    }`}
                  >
                    <span className="text-gray-500">[{log.timestamp.toLocaleTimeString()}]</span>{' '}
                    {log.message}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Debug Modal */}
      {showDebug && selectedConversation && (
        <ConversationDebug
          messages={conversations.find(c => c.sender_id === selectedConversation)?.messages.map(msg => ({
            text: msg.message_text,
            sender: msg.message_type === 'sent' ? 'ai' : 'user',
            timestamp: new Date(msg.timestamp),
            id: msg.id
          })) || []}
          onClose={() => setShowDebug(false)}
        />
      )}
    </div>
  );
};

export default InstagramMessages;

}
