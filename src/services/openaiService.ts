
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
Eres un asistente virtual de ${config.businessName}. ${config.businessDescription}

Tu tono debe ser ${config.tone}.

Tu objetivo principal es calificar prospectos identificando si cumplen con las siguientes características del cliente ideal:
${config.idealClientTraits.map(trait => `- ${trait}`).join('\n')}

Guía la conversación para determinar si el prospecto cumple con estas características sin ser demasiado directo o invasivo. Mantén la conversación natural y amigable.

Si el prospecto parece cumplir con al menos 3 características, intenta obtener su información de contacto (correo o teléfono) para que un agente humano pueda contactarlo.

Si el prospecto no parece ser un buen match, sé amable y brinda información general, pero no insistas en obtener sus datos de contacto.

No menciones explícitamente que estás evaluando si cumplen con ciertos criterios.
`;
};

/**
 * Verifica si la configuración de OpenAI está completa
 */
export const isOpenAIConfigured = (): boolean => {
  return OPENAI_API_KEY !== 'tu-api-key-aqui' && OPENAI_API_KEY.trim() !== '';
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
