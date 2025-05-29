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
    { username: '@user1', state: 'first_message_sent' },
    { username: '@user2', state: 'reactivation_sent' },
    { username: '@user3', state: 'no_response' },
    { username: '@user4', state: 'invited' },
    { username: '@user5', state: 'presented' },
    { username: '@user6', state: 'closed' },
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
    <div className="space-y-4 px-2 sm:px-0">
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Mis Prospectos</h2>
        <div className="space-y-3">
          {prospects.map((prospect, index) => (
            <div 
              key={index} 
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
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  onClick={() => getAISuggestion(prospect.username)}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">Sugerencia</span>
                </Button>
              </div>
              
              {selectedProspect === prospect.username && (
                <div className="mt-3 p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mt-1" />
                    <div>
                      <h4 className="font-medium text-purple-900 text-sm sm:text-base mb-1">Sugerencia de IA</h4>
                      {isLoading ? (
                        <p className="text-xs sm:text-sm text-purple-600">Analizando conversación...</p>
                      ) : (
                        <p className="text-xs sm:text-sm text-purple-700">{suggestion}</p>
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