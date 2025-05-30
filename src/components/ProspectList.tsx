
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useProspects } from '@/hooks/useProspects';
import { supabase } from '@/integrations/supabase/client';

const stateConfig = {
  primer_mensaje_enviado: {
    label: 'Primer mensaje enviado',
    color: 'bg-blue-100 text-blue-700'
  },
  seguimiento: {
    label: 'Seguimiento',
    color: 'bg-yellow-100 text-yellow-700'
  },
  sin_contestar: {
    label: 'Sin contestar',
    color: 'bg-red-100 text-red-700'
  },
  invitado: {
    label: 'Invitado',
    color: 'bg-green-100 text-green-700'
  }
};

const ProspectList = () => {
  const { prospects, loading } = useProspects();
  const [selectedProspect, setSelectedProspect] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  const getAISuggestion = async (prospect: any) => {
    setIsLoadingSuggestion(true);
    setSelectedProspect(prospect.id);
    
    try {
      // Preparar historial de conversación en formato legible
      const conversationHistory = prospect.conversationMessages
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((msg: any) => {
          const sender = msg.message_type === 'sent' ? 'Yo' : prospect.username;
          return `${sender}: ${msg.message_text}`;
        })
        .join('\n');

      console.log('Enviando conversación para análisis:', conversationHistory);

      const { data, error } = await supabase.functions.invoke('chatgpt-response', {
        body: {
          message: `Analiza esta conversación y dame una sugerencia del siguiente mensaje o paso que debería realizar con este prospecto:

Conversación:
${conversationHistory}

Estado actual: ${stateConfig[prospect.state].label}

Dame una sugerencia específica y accionable para el siguiente paso.`,
          systemPrompt: 'Eres un experto en ventas y marketing que ayuda a mejorar las conversaciones con prospectos. Proporciona sugerencias específicas, prácticas y orientadas a resultados.'
        }
      });

      if (error) {
        console.error('Error getting AI suggestion:', error);
        setSuggestion('Error al conectar con el servicio de IA. Verifica que la API key de OpenAI esté configurada correctamente.');
      } else if (data?.response) {
        setSuggestion(data.response);
      } else {
        setSuggestion('No se pudo generar una sugerencia. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error:', error);
      setSuggestion('Error de conexión. Verifica que la función de IA esté configurada correctamente.');
    } finally {
      setIsLoadingSuggestion(false);
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
                      {prospect.conversationMessages.length} mensaje(s) en total
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-2 w-full sm:w-auto"
                    onClick={() => getAISuggestion(prospect)}
                    disabled={isLoadingSuggestion && selectedProspect === prospect.id}
                  >
                    {isLoadingSuggestion && selectedProspect === prospect.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span className="text-xs sm:text-sm">Sugerencia IA</span>
                  </Button>
                </div>
                
                {selectedProspect === prospect.id && (
                  <div className="mt-3 p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-start gap-3">
                      {suggestion?.includes('Error') || suggestion?.includes('Verifica') ? (
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-1" />
                      ) : (
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-1" />
                      )}
                      <div>
                        <h4 className="font-medium text-purple-900 text-sm sm:text-base mb-1">
                          {suggestion?.includes('Error') ? 'Error de Configuración' : 'Sugerencia de IA'}
                        </h4>
                        {isLoadingSuggestion ? (
                          <p className="text-xs sm:text-sm text-purple-600">Analizando conversación...</p>
                        ) : (
                          <p className={`text-xs sm:text-sm ${suggestion?.includes('Error') ? 'text-red-700' : 'text-purple-700'}`}>
                            {suggestion}
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
