
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Brain, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PersonalityEditor: React.FC = () => {
  const [conversations, setConversations] = useState('');
  const [savedPersonality, setSavedPersonality] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar personalidad guardada al montar el componente
  useEffect(() => {
    loadSavedPersonality();
  }, []);

  const loadSavedPersonality = async () => {
    try {
      // Intentar cargar desde Supabase primero
      const { data } = await supabase
        .from('user_settings')
        .select('ia_persona')
        .limit(1);

      if (data && data.length > 0 && data[0].ia_persona) {
        setSavedPersonality(data[0].ia_persona);
        // También guardar en localStorage para compatibilidad
        localStorage.setItem('hower-system-prompt', data[0].ia_persona);
      } else {
        // Fallback a localStorage
        const localPersonality = localStorage.getItem('hower-system-prompt');
        if (localPersonality) {
          setSavedPersonality(localPersonality);
        }
      }
    } catch (error) {
      console.error('Error cargando personalidad:', error);
      // Fallback a localStorage
      const localPersonality = localStorage.getItem('hower-system-prompt');
      if (localPersonality) {
        setSavedPersonality(localPersonality);
      }
    }
  };

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
      const openaiKey = localStorage.getItem('hower-openai-key');
      if (!openaiKey) {
        toast({
          title: "Error",
          description: "Por favor, configura tu API key de OpenAI primero en la pestaña 'API Keys'",
          variant: "destructive"
        });
        return;
      }

      // Enviar las conversaciones a OpenAI para analizar la personalidad
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Eres un analista de personalidad y estilo de comunicación. Analiza las siguientes conversaciones y describe el estilo, tono, personalidad y forma de comunicarse de la persona. Sé específico sobre cómo habla, qué palabras usa, cómo estructura sus mensajes, y su actitud general. El resultado debe ser un prompt detallado que pueda usarse para que una IA imite este estilo de comunicación. Incluye ejemplos específicos de frases y expresiones que usa la persona.'
            },
            {
              role: 'user',
              content: `Analiza estas conversaciones y genera un prompt detallado que capture la personalidad y estilo de comunicación:\n\n${conversations}`
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No se pudo generar la personalidad');
      }

      const newPersonality = data.choices[0].message.content;
      
      // Guardar en Supabase
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          ia_persona: newPersonality,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error guardando en Supabase:', error);
        // Fallback a localStorage
        localStorage.setItem('hower-system-prompt', newPersonality);
      } else {
        // También guardar en localStorage para compatibilidad
        localStorage.setItem('hower-system-prompt', newPersonality);
      }
      
      setSavedPersonality(newPersonality);
      setConversations(''); // Limpiar el área de texto
      
      toast({
        title: "¡Personalidad actualizada!",
        description: "La IA ahora imitará tu estilo de comunicación en todas las respuestas automáticas",
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

  const handleResetPersonality = async () => {
    try {
      // Limpiar de Supabase
      await supabase
        .from('user_settings')
        .upsert({ 
          ia_persona: null,
          updated_at: new Date().toISOString()
        });

      // Limpiar de localStorage
      localStorage.removeItem('hower-system-prompt');
      setSavedPersonality('');
      
      toast({
        title: "Personalidad reiniciada",
        description: "La IA volverá a usar su personalidad por defecto",
      });
    } catch (error) {
      console.error('Error reiniciando personalidad:', error);
      // Fallback local
      localStorage.removeItem('hower-system-prompt');
      setSavedPersonality('');
      toast({
        title: "Personalidad reiniciada",
        description: "La IA volverá a usar su personalidad por defecto",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold text-gray-800">Editor de Personalidad</h3>
      </div>

      {/* Mostrar personalidad actual */}
      {savedPersonality && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-medium text-green-800 mb-2">✅ Personalidad Activa</h4>
              <div className="text-sm text-green-700 max-h-32 overflow-y-auto bg-white p-3 rounded border">
                {savedPersonality}
              </div>
            </div>
            <button
              onClick={handleResetPersonality}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Reiniciar
            </button>
          </div>
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Instrucciones</h4>
            <p className="text-sm text-yellow-700">
              1. Copia y pega aquí 3-5 conversaciones completas que hayas tenido con prospectos o clientes.<br />
              2. Incluye tanto tus mensajes como las respuestas.<br />
              3. La IA analizará tu estilo de comunicación y lo usará para sus respuestas automáticas.<br />
              4. Mientras más conversaciones incluyas, mejor será el análisis de tu personalidad.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="conversations" className="block text-sm font-medium text-gray-700 mb-2">
          Pega tus conversaciones aquí:
        </label>
        <textarea
          id="conversations"
          value={conversations}
          onChange={(e) => setConversations(e.target.value)}
          placeholder="Ejemplo:
          
Yo: ¡Hola María! ¿Cómo estás?
Cliente: Hola, muy bien gracias. Me interesa el viaje a Cancún que vi en tu página.
Yo: ¡Qué emocionante! Cancún es uno de mis destinos favoritos. ¿Es para unas vacaciones especiales?
Cliente: Sí, es para mi aniversario de bodas...

(Incluye varias conversaciones similares)"
          className="w-full h-64 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          Mínimo 500 caracteres recomendado para un buen análisis
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSavePersonality}
          disabled={loading || !conversations.trim() || conversations.length < 100}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Analizando...' : 'Generar Personalidad'}
        </button>
      </div>
    </div>
  );
};

export default PersonalityEditor;
