import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles } from 'lucide-react';

type ProspectState = 
  | 'first_message_sent'
  | 'reactivation_sent'
  | 'no_response'
  | 'invited'
  | 'presented'
  | 'closed';

interface Prospect {
  username: string;
  state: ProspectState;
  lastMessage?: string;
}

const stateConfig = {
  first_message_sent: {
    label: 'Primer mensaje enviado',
    color: 'bg-blue-100 text-blue-700'
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
  },
  presented: {
    label: 'Presentado',
    color: 'bg-purple-100 text-purple-700'
  },
  closed: {
    label: 'Cerrado',
    color: 'bg-gray-100 text-gray-700'
  }
};

const ProspectList = () => {
  const [selectedProspect, setSelectedProspect] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // This would be replaced with actual data from your backend
  const prospects: Prospect[] = [
    { 
      username: '@user1', 
      state: 'first_message_sent',
      lastMessage: "Hola, me interesa tu producto..."
    },
    { 
      username: '@user2', 
      state: 'reactivation_sent',
      lastMessage: "¿Podrías darme más información?"
    },
    { 
      username: '@user3', 
      state: 'no_response',
      lastMessage: "Gracias por la información"
    },
    { 
      username: '@user4', 
      state: 'invited',
      lastMessage: "Me gustaría agendar una llamada"
    },
    { 
      username: '@user5', 
      state: 'presented',
      lastMessage: "¿Cuál es el siguiente paso?"
    },
    { 
      username: '@user6', 
      state: 'closed',
      lastMessage: "No me interesa por ahora"
    },
  ];

  const getAISuggestion = async (username: string) => {
    setIsLoading(true);
    setSelectedProspect(username);
    
    // This would be replaced with actual AI API call
    setTimeout(() => {
      const suggestions = [
        "Sugerencia: Pregunta sobre sus objetivos específicos y cómo tu producto podría ayudarlos a alcanzarlos.",
        "Sugerencia: Comparte un caso de éxito relevante que se alinee con su industria.",
        "Sugerencia: Ofrece una demostración personalizada basada en sus necesidades.",
        "Sugerencia: Envía un mensaje de seguimiento con contenido valioso relacionado con su último interés.",
        "Sugerencia: Propón una llamada rápida para resolver sus dudas específicas."
      ];
      setSuggestion(suggestions[Math.floor(Math.random() * suggestions.length)]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Mis Prospectos</h2>
        <div className="space-y-4">
          {prospects.map((prospect, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-900">{prospect.username}</span>
                    <Badge className={stateConfig[prospect.state].color}>
                      {stateConfig[prospect.state].label}
                    </Badge>
                  </div>
                  {prospect.lastMessage && (
                    <p className="text-sm text-gray-600 italic">
                      "{prospect.lastMessage}"
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => getAISuggestion(prospect.username)}
                >
                  <Sparkles className="w-4 h-4" />
                  Sugerencia
                </Button>
              </div>
              
              {selectedProspect === prospect.username && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-purple-900 mb-1">Sugerencia de IA</h4>
                      {isLoading ? (
                        <p className="text-sm text-purple-600">Analizando conversación...</p>
                      ) : (
                        <p className="text-sm text-purple-700">{suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProspectList; 