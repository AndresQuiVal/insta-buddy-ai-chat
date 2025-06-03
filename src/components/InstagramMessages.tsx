import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, User, Bot, RefreshCw, Settings, Clock, Brain, Star, ArrowLeft } from 'lucide-react';
import { handleAutomaticResponse, ChatMessage } from '@/services/openaiService';
import { sendInstagramMessage } from '@/services/instagramService';
import HistoricalSyncButton from './HistoricalSyncButton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTraitAnalysis } from '@/hooks/useTraitAnalysis';

interface InstagramMessage {
  id: string;
  instagram_message_id: string;
  sender_id: string;
  recipient_id: string;
  message_text: string;
  message_type: 'received' | 'sent';
  timestamp: string;
  raw_data: any;
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

  // Función para cargar características desde localStorage
  const loadTraitsFromStorage = (): TraitWithPosition[] => {
    try {
      const savedTraits = localStorage.getItem('hower-ideal-client-traits');
      if (savedTraits) {
        return JSON.parse(savedTraits);
      }
    } catch (error) {
      console.error("Error al cargar características:", error);
    }
    
    // Características por defecto
    return [
      { trait: "Interesado en nuestros productos o servicios", enabled: true, position: 0 },
      { trait: "Tiene presupuesto adecuado para adquirir nuestras soluciones", enabled: true, position: 1 },
      { trait: "Está listo para tomar una decisión de compra", enabled: true, position: 2 },
      { trait: "Se encuentra en nuestra zona de servicio", enabled: true, position: 3 }
    ];
  };

  // 🔥 CARGAR ANÁLISIS PREVIOS SIN DISPARAR EVENTOS
  const loadSavedAnalysis = (): Record<string, SavedAnalysis> => {
    try {
      const savedConversationsStr = localStorage.getItem('hower-conversations');
      if (!savedConversationsStr) return {};
      
      const savedConversations = JSON.parse(savedConversationsStr);
      const analysisMap: Record<string, SavedAnalysis> = {};
      
      savedConversations.forEach((conv: any) => {
        const key = conv.id || conv.senderId;
        if (key) {
          analysisMap[key] = {
            matchPoints: conv.matchPoints || 0,
            metTraits: conv.metTraits || [],
            metTraitIndices: conv.metTraitIndices || [],
            lastAnalyzedAt: conv.lastAnalyzedAt || new Date().toISOString(),
            messageCount: conv.messageCount || 0
          };
        }
      });
      
      console.log("📦 ANÁLISIS PREVIOS CARGADOS:", Object.keys(analysisMap).length, "conversaciones");
      return analysisMap;
    } catch (error) {
      console.error("Error cargando análisis previos:", error);
      return {};
    }
  };

  // Helper function to safely check if raw_data has is_echo property
  const isEchoMessage = (rawData: any): boolean => {
    if (!rawData || typeof rawData !== 'object') return false;
    return Boolean(rawData.is_echo);
  };

  // 🔥 FUNCIÓN MEJORADA PARA DETERMINAR CONVERSATION ID UNIFICADO
  const getUnifiedConversationId = (message: any, myPageId: string | null) => {
    // Si tenemos PAGE_ID, usamos esa lógica
    if (myPageId) {
      if (message.sender_id === myPageId) {
        // Mensaje enviado por nosotros - conversación con el recipient
        return message.recipient_id;
      } else {
        // Mensaje recibido - conversación con el sender
        return message.sender_id;
      }
    } else {
      // Sin PAGE_ID, usamos la lógica por defecto mejorada
      if (isEchoMessage(message.raw_data) || message.message_type === 'sent') {
        // Mensaje enviado por nosotros
        return message.recipient_id;
      } else {
        // Mensaje recibido
        return message.sender_id;
      }
    }
  };

  // 🔥 FUNCIÓN SEPARADA PARA CARGAR SOLO MENSAJES (SIN ANÁLISIS)
  const loadConversationsOnly = async () => {
    try {
      console.log('🔄 CARGANDO CONVERSACIONES (SIN ANÁLISIS)...');

      // Obtener TODOS los mensajes de Supabase
      const { data: messages, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
        return [];
      }

      console.log(`📥 TOTAL MENSAJES OBTENIDOS: ${messages?.length || 0}`);

      // Filtrar mensajes válidos
      const validMessages = messages?.filter((message: any) => {
        return !message.sender_id.includes('webhook_') && 
               !message.sender_id.includes('debug') && 
               !message.sender_id.includes('error') &&
               !message.message_text.includes('PAYLOAD COMPLETO') &&
               !message.message_text.includes('ERROR:') &&
               message.sender_id !== 'diagnostic_user';
      }) || [];

      console.log(`✅ MENSAJES VÁLIDOS: ${validMessages.length}`);

      const myPageId = pageId || localStorage.getItem('hower-page-id');
      const conversationGroups: { [key: string]: InstagramMessage[] } = {};
      
      // 🔥 AGRUPAR MENSAJES CON LÓGICA UNIFICADA
      validMessages.forEach((message: any) => {
        // Obtener ID unificado de conversación
        const conversationId = getUnifiedConversationId(message, myPageId);
        
        // Determinar tipo de mensaje
        let messageType: 'sent' | 'received' = 'received';
        if (myPageId) {
          messageType = message.sender_id === myPageId ? 'sent' : 'received';
        } else {
          messageType = (isEchoMessage(message.raw_data) || message.message_type === 'sent') ? 'sent' : 'received';
        }
        
        if (!conversationGroups[conversationId]) {
          conversationGroups[conversationId] = [];
        }
        
        conversationGroups[conversationId].push({
          ...message,
          message_type: messageType
        });
      });

      // 🔥 CARGAR ANÁLISIS GUARDADOS (SIN DISPARAR EVENTOS)
      const savedAnalysis = loadSavedAnalysis();
      const conversationsArray: Conversation[] = [];

      console.log("📋 PROCESANDO CONVERSACIONES CON ANÁLISIS GUARDADO...");
      console.log("🗂️ CONVERSACIONES ENCONTRADAS:", Object.keys(conversationGroups).length);

      // Procesar cada conversación SIN ANÁLISIS
      for (const [conversationId, messages] of Object.entries(conversationGroups)) {
        if (messages.length === 0) continue;
        
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const lastMessage = sortedMessages[sortedMessages.length - 1];
        const unreadCount = sortedMessages.filter(m => m.message_type === 'received').length;

        // 🔥 USAR ANÁLISIS GUARDADO (NO GENERAR NUEVO)
        const analysis = savedAnalysis[conversationId] || { 
          matchPoints: 0, 
          metTraits: [], 
          metTraitIndices: [] 
        };

        console.log(`📋 [${conversationId.slice(-6)}] USANDO ANÁLISIS GUARDADO: ${analysis.matchPoints}/4 características`);
        console.log(`💬 [${conversationId.slice(-6)}] TOTAL MENSAJES: ${sortedMessages.length} (enviados: ${sortedMessages.filter(m => m.message_type === 'sent').length}, recibidos: ${sortedMessages.filter(m => m.message_type === 'received').length})`);

        conversationsArray.push({
          sender_id: conversationId,
          messages: sortedMessages,
          last_message: lastMessage,
          unread_count: unreadCount,
          matchPoints: analysis.matchPoints,
          metTraits: analysis.metTraits,
          metTraitIndices: analysis.metTraitIndices
        });
      }

      // Ordenar por timestamp del último mensaje
      conversationsArray.sort((a, b) => 
        new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime()
      );

      console.log(`✅ CONVERSACIONES UNIFICADAS CARGADAS: ${conversationsArray.length}`);
      return conversationsArray;
      
    } catch (error) {
      console.error('Error in loadConversationsOnly:', error);
      return [];
    }
  };

  // 🔥 FUNCIÓN PRINCIPAL QUE EVITA BUCLES
  const loadConversations = async () => {
    // Evitar bucles
    if (isLoadingRef.current) {
      console.log("🚫 EVITANDO BUCLE - Ya está cargando");
      return;
    }

    try {
      setLoading(true);
      isLoadingRef.current = true;
      
      const conversationsArray = await loadConversationsOnly();
      setConversations(conversationsArray);
      
    } catch (error) {
      console.error('Error in loadConversations:', error);
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

  // 🔥 FUNCIÓN SEPARADA PARA ANALIZAR SOLO CONVERSACIONES NUEVAS
  const analyzeNewConversation = async (senderId: string, messageText: string) => {
    try {
      console.log(`🤖 ANALIZANDO CONVERSACIÓN NUEVA: [${senderId.slice(-6)}]`);
      
      // Obtener TODA la conversación para este sender usando lógica unificada
      const myPageId = pageId || localStorage.getItem('hower-page-id');
      
      const { data: allMessages } = await supabase
        .from('instagram_messages')
        .select('*')
        .or(`sender_id.eq.${senderId},recipient_id.eq.${senderId}`)
        .order('timestamp', { ascending: true });

      if (allMessages) {
        // 🔥 FILTRAR TODOS LOS MENSAJES DE ESTA CONVERSACIÓN UNIFICADA
        const conversationMessages = allMessages.filter(msg => {
          const msgConversationId = getUnifiedConversationId(msg, myPageId);
          return msgConversationId === senderId;
        });

        // Obtener solo los mensajes del prospecto (recibidos)
        const allProspectMessages = conversationMessages
          .filter(msg => {
            if (myPageId) {
              return msg.sender_id !== myPageId; // Mensajes que NO son nuestros
            } else {
              return !isEchoMessage(msg.raw_data) && msg.message_type !== 'sent'; // Mensajes recibidos
            }
          })
          .map(msg => msg.message_text)
          .filter(text => text && text.trim())
          .join(' ');

        console.log(`📊 ANALIZANDO CONVERSACIÓN UNIFICADA: "${allProspectMessages.substring(0, 150)}..."`);
        console.log(`💬 TOTAL MENSAJES EN CONVERSACIÓN: ${conversationMessages.length}`);
        
        // Analizar características SOLO para esta conversación
        const traits = loadTraitsFromStorage();
        await analyzeAndUpdateProspect(
          senderId,
          getUserDisplayName(senderId),
          allProspectMessages,
          traits
        );

        // Recargar SOLO las conversaciones (sin re-análisis)
        const updatedConversations = await loadConversationsOnly();
        setConversations(updatedConversations);
      }
    } catch (error) {
      console.error('Error analizando conversación nueva:', error);
    }
  };

  const handleNewIncomingMessage = async (message: InstagramMessage) => {
    try {
      console.log('🔄 PROCESANDO NUEVO MENSAJE ENTRANTE:', message.message_text);
      
      if (message.message_type === 'received') {
        // 🔥 ANALIZAR SOLO ESTA CONVERSACIÓN (SIN BUCLE)
        await analyzeNewConversation(message.sender_id, message.message_text);

        // Respuesta automática con IA
        const delay = parseInt(localStorage.getItem('hower-ai-delay') || '3');
        setTimeout(async () => {
          try {
            // Build conversation history from all messages
            const { data: allMessages } = await supabase
              .from('instagram_messages')
              .select('*')
              .or(`sender_id.eq.${message.sender_id},recipient_id.eq.${message.sender_id}`)
              .order('timestamp', { ascending: true });

            const conversationHistory: ChatMessage[] = allMessages
              ?.filter(msg => 
                (msg.sender_id === message.sender_id || msg.recipient_id === message.sender_id) &&
                !msg.sender_id.includes('webhook_') && 
                !msg.sender_id.includes('debug')
              )
              .map(msg => ({
                role: msg.message_type === 'sent' ? 'assistant' : 'user' as 'user' | 'assistant',
                content: msg.message_text
              })) || [];

            const businessConfig = {
              businessName: 'Hower',
              businessDescription: 'Asistente de Instagram',
              tone: localStorage.getItem('hower-system-prompt') || 'Amigable y profesional',
              idealClientTraits: loadTraitsFromStorage().map(t => t.trait)
            };

            const response = await handleAutomaticResponse(
              message.message_text, 
              conversationHistory,
              businessConfig
            );
            
            if (response !== null && response !== undefined) {
              if (typeof response === 'string' && response.trim()) {
                await sendMessage(response, message.sender_id);
              } else if (typeof response === 'object') {
                const responseObj = response as any;
                if (responseObj && 'success' in responseObj && 'reply' in responseObj) {
                  const typedResponse = responseObj as { success: boolean; reply: string };
                  if (typedResponse.success && typedResponse.reply) {
                    await sendMessage(typedResponse.reply, message.sender_id);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error en respuesta automática:', error);
          }
        }, delay * 1000);
      }
    } catch (error) {
      console.error('Error procesando mensaje entrante:', error);
    }
  };

  const extractMatchFromAIResponse = (text: string): number => {
    const match = text.match(/MATCH:\s*(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  };

  const getUserDisplayName = (senderId: string) => {
    if (senderId === 'hower_bot') return 'Hower Assistant';
    if (senderId.length > 8) {
      return `Usuario ${senderId.slice(-4)}`;
    }
    return `Usuario ${senderId}`;
  };

  const sendMessage = async (text: string, recipientId?: string) => {
    if ((!text.trim() && !recipientId) || (!selectedConversation && !recipientId)) return;
    
    const targetRecipient = recipientId || selectedConversation;
    if (!targetRecipient) return;

    try {
      setSending(true);
      console.log('📤 Enviando mensaje:', text, 'a:', targetRecipient);
      
      const result = await sendInstagramMessage(text, targetRecipient);
      if (result.success) {
        if (!recipientId) setNewMessage('');
        await loadConversations();
        toast({
          title: "Mensaje enviado",
          description: "Tu mensaje se envió correctamente"
        });
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Obtener PAGE-ID automáticamente al montar
    const fetchPageId = async () => {
      const storedPageId = localStorage.getItem('hower-page-id');
      if (storedPageId) {
        setPageId(storedPageId);
        console.log('PAGE-ID cargado desde localStorage:', storedPageId);
        return;
      }

      const pageAccessToken = localStorage.getItem('hower-instagram-token');
      if (!pageAccessToken) return;
      try {
        const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${pageAccessToken}`);
        const data = await res.json();
        if (data.id) {
          setPageId(data.id);
          localStorage.setItem('hower-page-id', data.id);
          console.log('PAGE-ID obtenido y guardado:', data.id);
        }
      } catch (e) {
        console.error('No se pudo obtener el PAGE-ID automáticamente', e);
      }
    };
    fetchPageId();
    loadConversations();
    setIaPersona(localStorage.getItem('hower-system-prompt') || '');
    
    // Suscribirse a nuevos mensajes en tiempo real
    console.log('Suscripción a supabase creada');
    const subscription = supabase
      .channel('instagram-messages-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'instagram_messages'
      }, (payload) => {
        console.log('Nuevo mensaje recibido:', payload);
        const newMessage = payload.new as InstagramMessage;
        if (newMessage.message_type === 'received' && aiEnabledRef.current && isTabLeader) {
          handleNewIncomingMessage(newMessage);
        }
        loadConversations();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isTabLeader]);

  // Obtener mensajes de la conversación seleccionada - MOSTRAR TODOS
  const selectedMessages = conversations.find(conv => conv.sender_id === selectedConversation)?.messages || [];

  const handleFeedAI = async () => {
    try {
      const pageAccessToken = localStorage.getItem('hower-instagram-token');
      if (!pageAccessToken || !pageId) {
        toast({
          title: 'Error',
          description: 'Falta el PAGE-ACCESS-TOKEN o el PAGE-ID.',
          variant: 'destructive',
        });
        return;
      }
      // 1. Obtener conversaciones
      const convRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&access_token=${pageAccessToken}`);
      const convData = await convRes.json();
      if (!convRes.ok || !convData.data) throw new Error(convData.error?.message || 'No se pudieron obtener conversaciones');
      // 2. Obtener mensajes de las primeras 3 conversaciones
      const allMessages: string[] = [];
      for (const conv of convData.data.slice(0, 3)) {
        const msgRes = await fetch(`https://graph.facebook.com/v19.0/${conv.id}?fields=messages&access_token=${pageAccessToken}`);
        const msgData = await msgRes.json();
        if (msgData.messages?.data) {
          for (const m of msgData.messages.data) {
            // Obtener detalles del mensaje
            const detRes = await fetch(`https://graph.facebook.com/v19.0/${m.id}?fields=from,message&access_token=${pageAccessToken}`);
            const detData = await detRes.json();
            if (detData.message && detData.from?.id === pageId) {
              allMessages.push(detData.message);
            }
          }
        }
      }
      // Mostrar mensajes en consola y toast
      console.log('Mensajes previos usados para alimentar IA:', allMessages);
      if (allMessages.length > 0) {
        toast({
          title: 'Mensajes previos extraídos',
          description: allMessages.slice(0, 5).map((msg, i) => `${i + 1}. ${msg}`).join('\n'),
          duration: 8000,
        });
      }
      if (allMessages.length === 0) throw new Error('No se encontraron mensajes enviados por la cuenta.');
      // 3. Pedir a OpenAI que resuma el estilo/persona
      const openaiKey = localStorage.getItem('hower-openai-key-demo');
      if (!openaiKey) throw new Error('No hay API key de OpenAI configurada.');
      const aiPrompt = `Analiza los siguientes mensajes y describe el estilo, tono y personalidad de quien los escribió, en español, en 3 frases.\n\nMensajes:\n${allMessages.slice(0, 20).join('\n')}`;
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Eres un analista de personalidad.' },
            { role: 'user', content: aiPrompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });
      const aiData = await aiRes.json();
      const personality = aiData.choices?.[0]?.message?.content || '';
      if (!personality) throw new Error('No se pudo generar la personalidad.');
      // 4. Guardar el resultado como prompt personalizado
      localStorage.setItem('hower-system-prompt', personality);
      setIaPersona(personality); // Actualiza la vista
      toast({
        title: '¡IA alimentada!',
        description: 'La personalidad de la IA se ha actualizado con base en tus mensajes.',
      });
    } catch (err: any) {
      toast({
        title: 'Error alimentando IA',
        description: err.message || 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    }
  };

  // 🔥 EVENTOS SIN BUCLES - SOLO RECARGAR UI, NO RE-ANALIZAR
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('📦 Storage change detected, recargando SOLO UI...');
      // Solo recargar conversaciones SIN análisis
      if (!isLoadingRef.current) {
        loadConversations();
      }
    };

    const handleConversationsUpdate = () => {
      console.log('📦 Conversations updated event detected, recargando SOLO UI...');
      // Solo recargar conversaciones SIN análisis  
      if (!isLoadingRef.current) {
        loadConversations();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('conversations-updated', handleConversationsUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('conversations-updated', handleConversationsUpdate);
    };
  }, []);

  const traits = loadTraitsFromStorage();

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
                            const trait = traits[idx];
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
