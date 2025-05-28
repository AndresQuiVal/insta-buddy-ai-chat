import React, { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { Brain, Save, AlertCircle } from 'lucide-react';

const PersonalityEditor: React.FC = () => {
  const [conversations, setConversations] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSavePersonality = async () => {
    if (!conversations.trim()) {
      toast({
        title: "Error",
        description: "Por favor, pega al menos una conversación",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const openaiKey = localStorage.getItem('hower-openai-key-demo');
      if (!openaiKey) {
        throw new Error('No hay API key de OpenAI configurada');
      }

      // Enviar las conversaciones a OpenAI para analizar la personalidad
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Eres un analista de personalidad y estilo de comunicación. Analiza las siguientes conversaciones y describe el estilo, tono, personalidad y forma de comunicarse de la persona. Sé específico sobre cómo habla, qué palabras usa, cómo estructura sus mensajes, y su actitud general. El resultado debe ser un prompt que pueda usarse para que una IA imite este estilo de comunicación.'
            },
            {
              role: 'user',
              content: `Analiza estas conversaciones y genera un prompt detallado que capture la personalidad y estilo de comunicación:\n\n${conversations}`
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No se pudo generar la personalidad');
      }

      // Guardar el nuevo prompt
      localStorage.setItem('hower-system-prompt', data.choices[0].message.content);
      
      toast({
        title: "¡Personalidad actualizada!",
        description: "La IA ahora imitará el estilo de comunicación basado en tus conversaciones",
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar la personalidad",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-purple-100 shadow-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-800">Editor de Personalidad</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Instrucciones</h4>
              <p className="text-sm text-yellow-700">
                1. Copia y pega aquí 5 conversaciones completas que hayas tenido con prospectos o clientes.<br />
                2. Incluye tanto tus mensajes como las respuestas.<br />
                3. La IA analizará tu estilo de comunicación y lo usará para sus respuestas automáticas.
              </p>
            </div>
          </div>
        </div>

        <div>
          <textarea
            value={conversations}
            onChange={(e) => setConversations(e.target.value)}
            placeholder="Pega aquí tus conversaciones..."
            className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSavePersonality}
            disabled={loading || !conversations.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Generando...' : 'Guardar Personalidad'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PersonalityEditor; 