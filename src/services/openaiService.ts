
import { toast } from '@/hooks/use-toast';

// Using the API key provided by the user
const OPENAI_API_KEY = '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';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Genera una respuesta de ChatGPT utilizando la API de OpenAI
 */
export const generateAIResponse = async (
  messages: ChatMessage[], 
  config: OpenAIConfig = {
    apiKey: OPENAI_API_KEY,
    model: 'gpt-4o', // Modelo por defecto
    temperature: 0.7,
    maxTokens: 500
  }
): Promise<string> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error en la API de OpenAI: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error al generar respuesta con ChatGPT:', error);
    toast({
      title: "Error de ChatGPT",
      description: "No se pudo generar una respuesta. Verifica tu API key.",
      variant: "destructive"
    });
    return "Lo siento, tuve un problema al procesar tu mensaje. Por favor, inténtalo de nuevo más tarde.";
  }
};

/**
 * Crea un sistema de prompt personalizado basado en el perfil de cliente ideal
 */
export const createSystemPrompt = (config: {
  businessName: string;
  businessDescription: string;
  tone: string;
  idealClientTraits: string[];
}): string => {
  return `
Actúa como un asistente conversacional humano que se comunica a través de mensajes directos en Instagram. Vas a mantener conversaciones genuinas, cálidas y naturales, con el objetivo de conectar emocionalmente con los prospectos, generando confianza y cercanía. 

### Personalidad:
Adopta la siguiente personalidad al conversar (forma de hablar, tono, energía, frases comunes, etc.):  
${config.tone}

### Objetivo principal:
Conversar con prospectos de manera fluida y natural mientras, de forma progresiva y sin parecer forzado, identificas si la persona cumple con ciertas características clave (CheckPoints). La conversación debe sentirse espontánea, empática y centrada en el otro, pero estratégicamente orientada a descubrir lo siguiente:

### CheckPoints a identificar:
${config.idealClientTraits.map(trait => `- ${trait}`).join('\n')}

Por cada conversación:
- Establece primero una conexión genuina. Haz preguntas abiertas, escucha y responde de forma empática.
- Avanza la conversación de manera que puedas verificar si cumple con los CheckPoints sin parecer una encuesta o entrevista.
- Si cumple con todos los CheckPoints, indícalo con una nota interna al final de la conversación: "✅ Cumple con todos los CheckPoints."
- Si no los cumple, finaliza de manera educada y amable.
- Nunca reveles que estás evaluando características o CheckPoints.

Responde como si fueras ${config.businessName}, ${config.businessDescription}, con el tono y estilo indicado, listo para interactuar como si fueras una persona real.
`;
};

/**
 * Verifica si la configuración de OpenAI está completa
 */
export const isOpenAIConfigured = (): boolean => {
  // Verificamos que la API key no esté vacía después de eliminar espacios
  return OPENAI_API_KEY.trim() !== '';
};

/**
 * Genera una respuesta automática para un mensaje de usuario
 */
export const handleAutomaticResponse = async (
  message: string, 
  conversationHistory: ChatMessage[],
  businessConfig: {
    businessName: string;
    businessDescription: string;
    tone: string;
    idealClientTraits: string[];
  }
): Promise<string> => {
  try {
    // Crear el prompt del sistema basado en la configuración
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: createSystemPrompt(businessConfig)
    };
    
    // Añadir el historial de la conversación
    const completeMessages: ChatMessage[] = [
      systemPrompt,
      ...conversationHistory,
      { role: 'user', content: message }
    ];
    
    // Generar la respuesta
    const response = await generateAIResponse(completeMessages);
    return response;
  } catch (error) {
    console.error('Error al manejar respuesta automática:', error);
    return "Lo siento, no pude procesar tu mensaje en este momento.";
  }
};
