
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useProspects } from '@/hooks/useProspects';
import { supabase } from '@/integrations/supabase/client';

const stateConfig = {
  follow_up: {
    label: 'En seguimiento',
    color: 'bg-orange-100 text-orange-700'
  },
  reactivation_sent: {
    label: 'Mensaje reactivación enviado',
    color: 'bg-yellow-100 text-yellow-700'
  },
  no_response: {
    label: 'Sin contestar',
    color: 'bg-red-100 text-red-700'
  },
  invited: {
    label: 'Invitado',
    color: 'bg-green-100 text-green-700'
  }
};

const ProspectList = () => {
  const { prospects, loading } = useProspects();
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [loadingProspects, setLoadingProspects] = useState<Set<string>>(new Set());

  const getAISuggestion = async (prospect: any) => {
    console.log('🤖 Iniciando sugerencia de IA para prospecto:', prospect.username);
    
    setLoadingProspects(prev => new Set(prev).add(prospect.id));
    
    try {
      // Preparar historial de conversación en formato legible
      const conversationHistory = prospect.conversationMessages
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((msg: any) => {
          const sender = msg.message_type === 'sent' ? 'Yo' : prospect.username;
          return `${sender}: ${msg.message_text}`;
        })
        .join('\n');

      console.log('📝 Conversación preparada:', conversationHistory.substring(0, 200) + '...');

      const requestBody = {
        message: `Analiza esta conversación y dame una sugerencia del siguiente mensaje o paso que debería realizar con este prospecto:

Conversación:
${conversationHistory}

Estado actual: ${stateConfig[prospect.state].label}

Dame una sugerencia específica y accionable para el siguiente paso.`,
        systemPrompt: 'Eres un experto en ventas y marketing que ayuda a mejorar las conversaciones con prospectos. Proporciona sugerencias específicas, prácticas y orientadas a resultados en español.'
      };

      console.log('🚀 Enviando solicitud a chatgpt-response...');

      const { data, error } = await supabase.functions.invoke('chatgpt-response', {
        body: requestBody
      });

      console.log('📥 Respuesta recibida:', { data, error });

      if (error) {
        console.error('❌ Error invocando función:', error);
        let errorMessage = 'Error al conectar con el servicio de IA';
        
        if (error.message) {
          if (error.message.includes('API key')) {
            errorMessage = 'API key de OpenAI no configurada correctamente. Ve a configuración para añadirla.';
          } else if (error.message.includes('quota')) {
            errorMessage = 'Cuota de OpenAI agotada. Verifica tu plan de OpenAI.';
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }
        
        setSuggestions(prev => ({
          ...prev,
          [prospect.id]: errorMessage
        }));
      } else if (data?.response) {
        console.log('✅ Sugerencia generada exitosamente');
        setSuggestions(prev => ({
          ...prev,
          [prospect.id]: data.response
        }));
      } else {
        console.error('❌ Respuesta vacía de la función');
        setSuggestions(prev => ({
          ...prev,
          [prospect.id]: 'No se pudo generar una sugerencia. Verifica que la API key de OpenAI esté configurada correctamente.'
        }));
      }
    } catch (error) {
      console.error('💥 Error inesperado:', error);
      let errorMessage = 'Error de conexión';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Error de red. Verifica tu conexión a internet.';
        } else if (error.message.includes('API key')) {
          errorMessage = 'API key de OpenAI no configurada. Ve a configuración del proyecto.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      setSuggestions(prev => ({
        ...prev,
        [prospect.id]: errorMessage
      }));
    } finally {
      setLoadingProspects(prev => {
        const newSet = new Set(prev);
        newSet.delete(prospect.id);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 px-2 sm:px-0">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">Cargando prospectos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2 sm:px-0">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Mis Prospectos</h2>
        
        {prospects.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay prospectos aún</p>
            <p className="text-sm text-gray-500">Los prospectos aparecerán cuando recibas mensajes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prospects.map((prospect) => (
              <div 
                key={prospect.id} 
                className="bg-gray-50 rounded-lg p-3 sm:p-4 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="font-medium text-gray-900 text-sm sm:text-base">{prospect.username}</span>
                      <Badge className={`${stateConfig[prospect.state].color} text-xs sm:text-sm whitespace-nowrap`}>
                        {stateConfig[prospect.state].label}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500">
                      Último mensaje: {new Date(prospect.lastMessageTime).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} • {prospect.lastMessageType === 'sent' ? 'Enviado por ti' : 'Recibido'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {prospect.conversationMessages.length} mensaje(s) en total • {prospect.conversationMessages.filter(msg => msg.message_type === 'received').length} respuesta(s) del prospecto
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    onClick={() => getAISuggestion(prospect)}
                    disabled={loadingProspects.has(prospect.id)}
                  >
                    {loadingProspects.has(prospect.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className="text-xs sm:text-sm">Sugerencia IA</span>
                  </Button>
                </div>
                
                {suggestions[prospect.id] && (
                  <div className="mt-3 p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-start gap-3">
                      {suggestions[prospect.id]?.includes('Error') || suggestions[prospect.id]?.includes('API key') ? (
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-1" />
                      ) : (
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-1" />
                      )}
                      <div>
                        <h4 className="font-medium text-purple-900 text-sm sm:text-base mb-1">
                          {suggestions[prospect.id]?.includes('Error') || suggestions[prospect.id]?.includes('API key') ? 'Error de Configuración' : 'Sugerencia de IA'}
                        </h4>
                        {loadingProspects.has(prospect.id) ? (
                          <p className="text-xs sm:text-sm text-purple-600">Analizando conversación...</p>
                        ) : (
                          <p className={`text-xs sm:text-sm ${suggestions[prospect.id]?.includes('Error') || suggestions[prospect.id]?.includes('API key') ? 'text-red-700' : 'text-purple-700'}`}>
                            {suggestions[prospect.id]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProspectList;
