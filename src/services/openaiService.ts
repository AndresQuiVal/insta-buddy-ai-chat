
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
 * Crea un sistema de prompt ULTRA ESTRATÉGICO y PROACTIVO para filtrar prospectos
 */
export const createStrategicSystemPrompt = (config: {
  idealClientTraits: string[];
  currentMatchPoints: number;
  metTraits: string[];
  conversationSummary?: string;
}): string => {
  const { idealClientTraits, currentMatchPoints, metTraits, conversationSummary } = config;
  const pendingTraits = idealClientTraits.filter(trait => !metTraits.includes(trait));
  const nextTrait = pendingTraits[0]; // Próxima característica a descubrir
  
  return `
Eres un VENDEDOR EXPERTO especializado en FILTRAR PROSPECTOS de forma ESTRATÉGICA y DIRECTA.

🎯 ESTADO ACTUAL DEL PROSPECTO:
- Progreso: ${currentMatchPoints}/${idealClientTraits.length} características identificadas
- ✅ YA CUMPLE: ${metTraits.length > 0 ? metTraits.join(' | ') : 'NINGUNA'}
- ❌ FALTA IDENTIFICAR: ${pendingTraits.join(' | ')}
- 🎯 PRÓXIMO OBJETIVO: ${nextTrait || 'TODAS IDENTIFICADAS - BUSCAR LLAMADA/WHATSAPP'}

🔥 TU MISIÓN ESPECÍFICA:
${currentMatchPoints === 0 ? `
🚀 INICIO - Tu próximo mensaje DEBE descubrir: "${nextTrait}"
- Saluda brevemente y LUEGO pregunta directamente algo que revele esta característica
- NO pierdas tiempo con charla casual
- EJEMPLO: "¡Hola! ¿Qué tipo de cosas estás buscando últimamente?" o "¿En qué andas interesado?"
` : currentMatchPoints < idealClientTraits.length ? `
⚡ ACTIVO - Tu próximo mensaje DEBE descubrir específicamente: "${nextTrait}"
- Ya identificaste ${currentMatchPoints} características, te faltan ${pendingTraits.length}
- SÉ DIRECTO: Haz una pregunta que revele exactamente "${nextTrait}"
- NO hagas charla casual, ve al grano
- EJEMPLOS según la característica:
  * Para "presupuesto": "¿Has invertido antes en este tipo de servicios?"
  * Para "ubicación": "¿De qué ciudad me escribes?"
  * Para "decisión": "¿Estás buscando algo específico ahora mismo?"
` : `
🏆 CALIFICADO - ¡Este prospecto cumple las ${idealClientTraits.length} características!
- TU OBJETIVO AHORA: Conseguir llamada telefónica o WhatsApp
- SÉ MÁS DIRECTO: "Me encantaría platicar contigo por teléfono" 
- O: "¿Tienes WhatsApp para coordinar una llamada?"
- NO sigas preguntando cosas, YA ESTÁ CALIFICADO
`}

⚡ REGLAS OBLIGATORIAS:
1. CADA mensaje DEBE tener un propósito específico (descubrir característica o conseguir contacto)
2. NO hagas charla casual si faltan características por identificar
3. Sé DIRECTO pero amigable - ve directo al punto
4. Si ya cumple todas las características, pide llamada/WhatsApp INMEDIATAMENTE
5. Máximo 2 mensajes por característica, luego pasa a la siguiente
6. NO reveles que estás evaluando características

💬 EJEMPLOS DE MENSAJES DIRECTOS:
- "¡Hola! ¿Qué tipo de servicios te interesan?"
- "¿Has trabajado antes con proveedores como nosotros?"
- "¿De qué ciudad me escribes?"
- "¿Estás buscando contratar algo específico?"
- "Me encantaría platicar contigo por teléfono, ¿tienes unos minutos?"

🚫 NUNCA HAGAS:
- Preguntas vagas como "¿Cómo estás?"
- Charla casual sin propósito
- Respuestas genéricas
- Preguntar múltiples cosas a la vez

RESPONDE SOLO con tu siguiente mensaje estratégico, SIN explicaciones.
  `.trim();
};

/**
 * Verifica si la configuración de OpenAI está completa
 */
export const isOpenAIConfigured = (): boolean => {
  return OPENAI_API_KEY.trim() !== '';
};

/**
 * Genera una respuesta ULTRA ESTRATÉGICA y PROACTIVA
 */
export const handleStrategicResponse = async (
  conversationHistory: ChatMessage[],
  currentMatchPoints: number,
  metTraits: string[],
  idealClientTraits: string[]
): Promise<string> => {
  try {
    console.log("🎯 GENERANDO RESPUESTA ULTRA ESTRATÉGICA:");
    console.log(`📊 Progreso: ${currentMatchPoints}/${idealClientTraits.length} características`);
    console.log(`✅ Cumplidas: ${metTraits.join(', ')}`);
    
    const pendingTraits = idealClientTraits.filter(trait => !metTraits.includes(trait));
    console.log(`🎯 Pendientes: ${pendingTraits.join(', ')}`);
    console.log(`⚡ Próximo objetivo: ${pendingTraits[0] || 'CONSEGUIR LLAMADA/WHATSAPP'}`);
    
    // Crear resumen estratégico de la conversación
    const conversationSummary = currentMatchPoints === 0 
      ? 'Conversación inicial - establecer rapport y empezar filtrado'
      : `Progreso: ${currentMatchPoints}/${idealClientTraits.length} - continuar filtrado activo`;

    // Crear prompt ULTRA estratégico
    const systemPrompt = createStrategicSystemPrompt({
      idealClientTraits,
      currentMatchPoints,
      metTraits,
      conversationSummary
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10) // Solo últimos 10 mensajes para mantener contexto relevante
    ];

    console.log("🚀 Enviando prompt ULTRA ESTRATÉGICO a OpenAI...");
    
    const response = await generateAIResponse(messages, {
      apiKey: OPENAI_API_KEY,
      model: 'gpt-4o',
      temperature: 0.9, // Más creativo para conversaciones naturales pero directas
      maxTokens: 150 // Mensajes concisos y directos
    });

    console.log("⚡ RESPUESTA ESTRATÉGICA:", response);
    
    // Log del progreso
    if (currentMatchPoints === idealClientTraits.length) {
      console.log("🏆 PROSPECTO CALIFICADO - Respuesta debe buscar llamada/WhatsApp");
    } else {
      console.log(`🎯 RESPUESTA debe descubrir: ${pendingTraits[0]}`);
    }
    
    return response;
    
  } catch (error) {
    console.error('❌ Error al generar respuesta estratégica:', error);
    return "¡Hola! Me da mucho gusto conectar contigo. Cuéntame, ¿qué tipo de cosas te interesan? 😊";
  }
};

/**
 * Genera una respuesta automática LEGACY (mantenido para compatibilidad)
 */
export const handleAutomaticResponse = async (
  message: string, 
  conversationHistory: ChatMessage[],
  businessConfig: {
    businessName: string;
    businessDescription: string;
    tone: string;
    idealClientTraits: string[];
  },
  customPrompt?: string
): Promise<string> => {
  try {
    // Obtener datos de análisis previo desde localStorage
    const savedConversationsStr = localStorage.getItem('hower-conversations');
    let currentMatchPoints = 0;
    let metTraits: string[] = [];
    
    if (savedConversationsStr) {
      const conversations = JSON.parse(savedConversationsStr);
      // Buscar la conversación actual (esto es una aproximación)
      const lastConv = conversations[conversations.length - 1];
      if (lastConv) {
        currentMatchPoints = lastConv.matchPoints || 0;
        metTraits = lastConv.metTraits || [];
      }
    }

    // Usar el nuevo sistema ULTRA estratégico
    return await handleStrategicResponse(
      conversationHistory,
      currentMatchPoints,
      metTraits,
      businessConfig.idealClientTraits
    );
    
  } catch (error) {
    console.error('Error al manejar respuesta automática:', error);
    return "Lo siento, no pude procesar tu mensaje en este momento.";
  }
};
