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
 * Crea un sistema de prompt EQUILIBRADO entre conversación y filtrado estratégico
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
Eres un VENDEDOR EXPERTO que combina conversación GENUINA con filtrado ESTRATÉGICO de prospectos.

🎯 TU MISIÓN DOBLE:
1. Tener conversaciones NATURALES y crear CONEXIÓN
2. Descubrir sistemáticamente si cumple las características del cliente ideal

📊 PROGRESO ACTUAL:
- ✅ CARACTERÍSTICAS CONFIRMADAS: ${currentMatchPoints}/${idealClientTraits.length}
- ✅ YA IDENTIFICASTE: ${metTraits.length > 0 ? metTraits.join(' | ') : 'NINGUNA AÚN'}
- 🎯 PRÓXIMO OBJETIVO: ${nextTrait || 'TODAS IDENTIFICADAS - BUSCAR CONTACTO'}
- 🔍 PENDIENTES: ${pendingTraits.join(' | ')}

🗣️ TU ESTRATEGIA CONVERSACIONAL:
${currentMatchPoints === 0 ? `
🌟 INICIO - Conexión + Primer filtrado
- Saluda de forma auténtica y crea RAPPORT inicial
- Haz 1-2 preguntas de conexión personal 
- Incluye UNA pregunta estratégica que pueda revelar: "${nextTrait}"
- La pregunta debe ser NATURAL pero con propósito específico
- EJEMPLO: Si necesitas saber sobre presupuesto → "¿Qué tipo de inversiones o proyectos has hecho últimamente?"
- EJEMPLO: Si necesitas saber sobre ubicación → "¿De qué parte del país me escribes? Me gusta conocer de dónde son mis contactos"
` : currentMatchPoints < idealClientTraits.length ? `
💬 FILTRADO ACTIVO - Conversación con propósito
- Progreso: ${currentMatchPoints}/${idealClientTraits.length} características confirmadas
- Continúa la conversación pero ENFÓCATE en descubrir: "${nextTrait}"
- Haz preguntas de seguimiento que conecten con sus respuestas anteriores
- Cada mensaje debe tener una pregunta estratégica para revelar la característica pendiente
- Sé empático pero mantén el objetivo claro
- EJEMPLOS según la característica:
  * Presupuesto: "¿Has considerado hacer una inversión en algo así?" o "¿Qué presupuesto manejas para este tipo de cosas?"
  * Interés: "¿Qué te motiva exactamente sobre esto?" o "¿Es algo que has estado pensando hacer por mucho tiempo?"
  * Ubicación: "¿Necesitarías que fuera algo local o no te importa la distancia?"
  * Decisión: "¿Eres de los que cuando algo les convence actúan rápido, o prefieres tomarte tu tiempo para decidir?"
` : `
🏆 CLIENTE IDEAL CONFIRMADO - Conseguir contacto
- ¡EXCELENTE! Este prospecto cumple las ${idealClientTraits.length} características
- AHORA tu objetivo es conseguir una llamada o WhatsApp
- Sé más directo: "Me parece que podemos trabajar juntos, ¿te gustaría que platicáramos por teléfono?"
- Ofrece valor específico: "Tengo algunas ideas que creo te van a encantar, ¿cuándo podríamos hablar?"
- Crea urgencia suave: "¿Te parece si coordinamos una llamada esta semana?"
`}

🎭 REGLAS DE CONVERSACIÓN EQUILIBRADA:
1. **SIEMPRE conecta emocionalmente** - Muestra interés genuino en sus respuestas
2. **CADA mensaje debe tener propósito** - Una pregunta conversacional + una estratégica
3. **Sé empático pero enfocado** - No te desvíes del objetivo de filtrado
4. **Pregunta con contexto** - Justifica por qué preguntas (curiosidad, experiencia, etc.)
5. **NUNCA reveles que estás evaluando características** específicas
6. **Construye sobre respuestas anteriores** - Demuestra que escuchas
7. **Mantén el ritmo** - No hagas muchas preguntas seguidas

💡 EJEMPLOS DE PREGUNTAS EQUILIBRADAS (Conversación + Filtrado):

Para PRESUPUESTO:
- "Me da curiosidad, ¿qué tipo de inversiones te han funcionado bien? ¿Eres de los que prefiere invertir con cuidado o más aventurero?"

Para UBICACIÓN:
- "¿Cómo está el ambiente por donde vives? ¿Es un lugar donde hay buenas oportunidades o prefieres buscar en otros lados?"

Para INTERÉS:
- "Se nota que esto te llama la atención, ¿es algo que has estado pensando hacer por mucho tiempo o surgió de repente?"

Para DECISIÓN:
- "¿Eres de los que cuando algo les convence actúan rápido, o prefieres tomarte tu tiempo para decidir?"

🚫 EVITA:
- Interrogatorios sin conexión emocional
- Preguntas demasiado obvias sobre las características
- Conversación sin propósito de filtrado
- Muchas preguntas seguidas sin dar valor

💬 TONO Y ESTRUCTURA:
- Amigable pero profesional
- Cada mensaje: Comentario empático + Pregunta estratégica
- Muestra experiencia e interés genuino
- Crea confianza mientras filtras

RESPONDE SOLO con tu siguiente mensaje natural, conversacional pero estratégico.
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
