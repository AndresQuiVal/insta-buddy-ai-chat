import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, User, Bot, RefreshCw, Settings, Clock, Brain, Star, ArrowLeft } from 'lucide-react';
import { handleAutomaticResponse } from '@/services/openaiService';
import { sendInstagramMessage } from '@/services/instagramService';
import HistoricalSyncButton from './HistoricalSyncButton';
import { useIsMobile } from '@/hooks/use-mobile';

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

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('instagram_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los mensajes",
          variant: "destructive"
        });
        return;
      }

      // Filtrar mensajes reales
      const realMessages = data?.filter((message: any) => {
        return !message.sender_id.includes('webhook_') && 
               !message.sender_id.includes('debug') && 
               !message.sender_id.includes('error') &&
               !message.message_text.includes('PAYLOAD COMPLETO') &&
               !message.message_text.includes('ERROR:') &&
               message.sender_id !== 'diagnostic_user';
      }) || [];

      // Obtener mi page ID
      const myPageId = pageId || localStorage.getItem('hower-page-id');
      console.log('Mi Page ID para agrupación:', myPageId);

      // Agrupar mensajes por conversación
      const conversationGroups: { [key: string]: InstagramMessage[] } = {};
      
      realMessages.forEach((message: any) => {
        // Determinar el ID del prospecto (la otra persona en la conversación)
        let prospectId = '';
        let messageType: 'sent' | 'received' = 'received';
        
        if (myPageId) {
          // Si tengo mi PAGE-ID, usar lógica correcta
          if (message.sender_id === myPageId) {
            // Yo envié el mensaje, el prospecto es el recipient
            prospectId = message.recipient_id;
            messageType = 'sent';
          } else {
            // El prospecto me envió el mensaje
            prospectId = message.sender_id;
            messageType = 'received';
          }
        } else {
          // Fallback: revisar si es mensaje echo o determinar por raw_data
          if (message.raw_data?.is_echo || message.message_type === 'sent') {
            messageType = 'sent';
            prospectId = message.recipient_id;
          } else {
            messageType = 'received';
            prospectId = message.sender_id;
          }
        }
        
        console.log(`Mensaje: "${message.message_text}" - Prospecto ID: ${prospectId} - Tipo: ${messageType}`);
        
        if (!conversationGroups[prospectId]) {
          conversationGroups[prospectId] = [];
        }
        
        // Aplicar el tipo de mensaje correcto
        const messageWithCorrectType = {
          ...message,
          message_type: messageType
        };
        
        conversationGroups[prospectId].push(messageWithCorrectType);
      });

      console.log('Grupos de conversación creados:', Object.keys(conversationGroups));

      // Cargar matches de localStorage
      const localMatches = JSON.parse(localStorage.getItem('hower-conversations') || '[]');

      // Convertir a array de conversaciones
      const conversationsArray = Object.entries(conversationGroups).map(([prospectId, messages]) => {
        // Ordenar mensajes por timestamp ascendente
        const sortedMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        // Contar mensajes sin leer (solo los que recibí del prospecto)
        const unreadCount = messages.filter(msg => msg.message_type === 'received').length;
        
        // Buscar matchPoints/metTraits en localStorage
        const localMatch = localMatches.find((c: any) => c.sender_id === prospectId) || {};
        
        return {
          sender_id: prospectId,
          messages: sortedMessages,
          last_message: sortedMessages[sortedMessages.length - 1],
          unread_count: 0, // Quitar conteo de no leídos
          matchPoints: localMatch.matchPoints || 0,
          metTraits: localMatch.metTraits || []
        };
      });

      // Ordenar conversaciones por matchPoints y luego por último mensaje
      conversationsArray.sort((a, b) => {
        if ((b.matchPoints || 0) !== (a.matchPoints || 0)) {
          return (b.matchPoints || 0) - (a.matchPoints || 0);
        }
        return new Date(b.last_message.timestamp).getTime() - new Date(a.last_message.timestamp).getTime();
      });

      console.log('Conversaciones finales:', conversationsArray.length);
      setConversations(conversationsArray);
      
      // Seleccionar la primera conversación si no hay ninguna seleccionada
      if (!selectedConversation && conversationsArray.length > 0) {
        setSelectedConversation(conversationsArray[0].sender_id);
      }

    } catch (error) {
      console.error('Error in loadConversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Utilidad para extraer matchPoints y características de la respuesta de la IA
  const extractMatchFromAIResponse = (aiResponse: string, idealTraits: string[]) => {
    let matchPoints = 0;
    let metTraits: string[] = [];
    // Buscar la nota interna
    const matchRegex = /([0-4])\s*\/\s*4|Prospecto ideal \(4\/4\)/i;
    const found = aiResponse.match(matchRegex);
    if (found) {
      matchPoints = found[1] ? parseInt(found[1], 10) : 4;
    }
    // Opcional: buscar nombres de características cumplidas (si la IA los lista)
    if (matchPoints && idealTraits) {
      metTraits = idealTraits.slice(0, matchPoints);
    }
    return { matchPoints, metTraits };
  };

  const handleNewIncomingMessage = async (message: InstagramMessage) => {
    if (!aiEnabled) return;

    console.log(`Generando respuesta automática en ${aiDelay} segundos...`);
    
    setTimeout(async () => {
      try {
        // Configuración básica del negocio
        const businessConfig = {
          businessName: "Hower Assistant",
          businessDescription: "Asistente inteligente para Instagram",
          tone: "Amigable, profesional y servicial",
          idealClientTraits: [
            "Interesado en nuestros productos o servicios",
            "Tiene presupuesto adecuado",
            "Está listo para tomar decisiones",
            "Se encuentra en nuestra zona de servicio"
          ]
        };

        const aiResponse = await handleAutomaticResponse(
          message.message_text,
          [], // Historial vacío por ahora
          businessConfig
        );

        // EXTRAER MATCHPOINTS Y GUARDAR EN LA CONVERSACIÓN
        const idealTraits = businessConfig.idealClientTraits;
        const { matchPoints, metTraits } = extractMatchFromAIResponse(aiResponse, idealTraits);
        
        // Actualizar la conversación en localStorage
        const savedConvs = JSON.parse(localStorage.getItem('hower-conversations') || '[]');
        const idx = savedConvs.findIndex((c: any) => c.sender_id === message.sender_id);
        if (idx !== -1) {
          savedConvs[idx].matchPoints = matchPoints;
          savedConvs[idx].metTraits = metTraits;
        } else {
          savedConvs.push({
            sender_id: message.sender_id,
            matchPoints,
            metTraits,
            messages: [message],
          });
        }
        localStorage.setItem('hower-conversations', JSON.stringify(savedConvs));
        
        // Enviar la respuesta automática
        const sendResult = await sendInstagramMessage(
          message.sender_id,
          aiResponse,
          message.instagram_message_id
        );

        if (sendResult.success) {
          console.log('✅ Respuesta automática enviada via Instagram API');
        } else {
          console.error('❌ Error enviando respuesta automática:', sendResult.error);
        }

      } catch (error) {
        console.error('Error generando respuesta automática:', error);
      }
    }, aiDelay * 1000);
  };

  const getUserDisplayName = (senderId: string) => {
    if (senderId === 'hower_bot') return 'Hower Assistant';
    if (senderId.length > 8) {
      return `Usuario ${senderId.slice(-4)}`;
    }
    return `Usuario ${senderId}`;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);

      // Enviar mensaje usando la API real de Instagram
      const sendResult = await sendInstagramMessage(selectedConversation, newMessage.trim());

      if (sendResult.success) {
        setNewMessage('');
        loadConversations();

        toast({
          title: "Mensaje enviado",
          description: "Tu mensaje fue enviado exitosamente a Instagram",
        });
      } else {
        throw new Error(sendResult.error || 'Error enviando mensaje');
      }

    } catch (error) {
      console.error('Error in sendMessage:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error enviando mensaje",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Obtener mensajes de la conversación seleccionada
  const selectedMessages = conversations.find(conv => conv.sender_id === selectedConversation)?.messages.slice(-20) || [];

  // Botón Alimentar IA
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
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-purple-100">
        <h2 className="text-xl font-bold text-purple-700 flex items-center gap-2">
          <MessageCircle className="w-6 h-6" /> Mensajes de Instagram
        </h2>
      </div>

      {/* Layout principal: bandejas y chat */}
      <div className="flex flex-1 h-0 min-h-0">
        {/* Panel de conversaciones individuales - En móvil se oculta cuando hay conversación seleccionada */}
        <div className={`${isMobile && selectedConversation ? 'hidden' : 'flex'} ${isMobile ? 'w-full' : 'w-1/3 min-w-[260px] max-w-[400px]'} border-r border-purple-100 flex-shrink-0 flex-col`}>
          <div className="p-4 border-b border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Conversaciones</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Configuración de IA"
                >
                  <Settings className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={loadConversations}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Botón de sincronización histórica */}
            <div className="mb-3">
              <HistoricalSyncButton />
            </div>
            
            {/* Indicador de estado de IA */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${aiEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">
                IA {aiEnabled ? 'Activa' : 'Inactiva'} • {aiDelay}s delay
              </span>
            </div>
          </div>
          
          <div className="overflow-y-auto h-[calc(100%-140px)]">
            {conversations.length === 0 ? (
              <div className="p-4 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No hay conversaciones aún</p>
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800 truncate flex items-center gap-2">
                          {getUserDisplayName(conversation.sender_id)}
                          {/* Estrellas de compatibilidad */}
                          <span className="flex items-center ml-2">
                            {[...Array(4)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < (conversation.matchPoints || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </span>
                        </h4>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.last_message.message_text}
                      </p>
                      {/* Criterios cumplidos */}
                      {conversation.metTraits && conversation.metTraits.length > 0 && (
                        <div className="mt-1 text-xs text-green-700 flex flex-wrap gap-1">
                          {conversation.metTraits.map((trait, idx) => (
                            <span key={idx} className="bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                              {trait}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(conversation.last_message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel de chat - En móvil ocupa toda la pantalla cuando hay conversación seleccionada */}
        <div className={`${isMobile && !selectedConversation ? 'hidden' : 'flex'} ${isMobile ? 'w-full' : 'flex-1'} flex-col min-w-0`}>
          {selectedConversation ? (
            <>
              {/* Header del chat */}
              <div className="p-4 border-b border-purple-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Botón de volver en móvil */}
                    {isMobile && (
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                      </button>
                    )}
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {getUserDisplayName(selectedConversation)}
                      </h3>
                      <p className="text-sm text-green-600">● En línea</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPersona((v) => !v)}
                      className={`flex items-center gap-2 px-3 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors ${isMobile ? 'text-xs' : ''}`}
                    >
                      <Brain className="w-4 h-4" /> {!isMobile && 'Ver personalidad'}
                    </button>
                    <button
                      onClick={handleFeedAI}
                      className={`flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors ${isMobile ? 'text-xs' : ''}`}
                    >
                      <Brain className="w-4 h-4" /> {!isMobile && 'Alimentar IA'}
                    </button>
                  </div>
                </div>
              </div>

              {showPersona && (
                <div className="p-4 border-b border-purple-100 bg-purple-50/50">
                  <h3 className="text-sm font-semibold text-purple-700 mb-1 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Personalidad actual de la IA
                  </h3>
                  <div className="text-xs text-gray-700 whitespace-pre-line bg-white/70 rounded p-2 border border-purple-100">
                    {iaPersona ? iaPersona : 'Aún no has alimentado la IA con tus mensajes.'}
                  </div>
                </div>
              )}

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedMessages.map((message) => {
                  // Determinar si el mensaje es enviado por mí
                  const isSentByMe = message.message_type === 'sent' || message.sender_id === pageId;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isSentByMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${isMobile ? 'max-w-[90%]' : ''} ${isSentByMe ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isSentByMe 
                            ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                            : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}>
                          {isSentByMe ? (
                            <Bot className="w-5 h-5 text-white" />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          isSentByMe
                            ? 'bg-gradient-to-r from-green-400 to-blue-500 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          <p className="text-sm">{message.message_text}</p>
                          <div className={`text-xs mt-1 flex items-center gap-1 ${
                            isSentByMe ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {message.raw_data?.auto_response && (
                              <Bot className="w-3 h-3" />
                            )}
                            {message.raw_data?.historical_sync && (
                              <Clock className="w-3 h-3" />
                            )}
                            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input de mensaje */}
              <div className="p-4 border-t border-purple-100">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 px-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                    disabled={sending}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Selecciona una conversación</h3>
                <p className="text-gray-500">Elige una conversación para ver los mensajes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Panel de configuración */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96 max-w-[90%]">
            <h3 className="text-lg font-semibold mb-4">Configuración de IA</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>Respuestas automáticas habilitadas</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Delay de respuesta (segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={aiDelay}
                  onChange={(e) => setAiDelay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
              >
                Guardar
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramMessages;
