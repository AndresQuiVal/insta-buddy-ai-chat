

interface Trait {
  trait: string;
  enabled: boolean;
}

interface ConversationMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AnalysisResult {
  matchPoints: number;
  metTraits: string[];
  confidence: number;
}

export const analyzeConversationWithAI = async (
  messages: ConversationMessage[], 
  idealTraits: Trait[]
): Promise<AnalysisResult> => {
  console.log("🤖 DEBUG: === ANÁLISIS CON IA - SERVICIO ===");
  console.log("📊 DEBUG: Características recibidas:", idealTraits);
  console.log("💬 DEBUG: Mensajes recibidos:", messages);
  
  const openaiKey = localStorage.getItem('hower-openai-key-demo') || localStorage.getItem('hower-openai-key');
  console.log("🔑 DEBUG: OpenAI Key en servicio:", openaiKey ? 'CONFIGURADA' : 'NO CONFIGURADA');
  
  if (!openaiKey) {
    console.log("⚠️ DEBUG: No hay API Key de OpenAI, usando análisis básico");
    return analyzeWithKeywords(messages, idealTraits);
  }

  const enabledTraits = idealTraits.filter(t => t.enabled);
  console.log("🎯 DEBUG: Características habilitadas para análisis:", enabledTraits);
  
  if (enabledTraits.length === 0) {
    console.log("⚠️ DEBUG: No hay características habilitadas");
    return { matchPoints: 0, metTraits: [], confidence: 0 };
  }

  // Crear texto de conversación
  const conversationText = messages
    .map(msg => `${msg.sender === 'user' ? 'Prospecto' : 'Asistente'}: ${msg.text}`)
    .join('\n');

  console.log("📝 DEBUG: Texto de conversación para IA:", conversationText);

  const prompt = `Analiza esta conversación de Instagram y determina qué características del cliente ideal cumple el prospecto:

CONVERSACIÓN:
${conversationText}

CARACTERÍSTICAS DEL CLIENTE IDEAL:
${enabledTraits.map((trait, i) => `${i + 1}. ${trait.trait}`).join('\n')}

INSTRUCCIONES:
- Analiza SOLO los mensajes del prospecto
- Responde únicamente con un JSON válido
- Formato: {"characteristics": [números de las características que cumple], "confidence": número_entre_0_y_1}
- Ejemplo: {"characteristics": [1, 3], "confidence": 0.8}
- Si no cumple ninguna: {"characteristics": [], "confidence": 0}`;

  console.log("🎯 DEBUG: Prompt para OpenAI:", prompt);

  try {
    console.log("📡 DEBUG: Enviando consulta a OpenAI...");
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto analizador de prospectos. Responde solo con JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    console.log("📨 DEBUG: Respuesta HTTP de OpenAI:", response.status, response.statusText);

    if (!response.ok) {
      console.error("❌ DEBUG: Error HTTP de OpenAI:", response.status);
      throw new Error(`Error OpenAI: ${response.status}`);
    }

    const data = await response.json();
    console.log("📋 DEBUG: Datos completos de OpenAI:", data);
    
    const content = data.choices?.[0]?.message?.content || '';
    console.log("🤖 DEBUG: Contenido de respuesta de OpenAI:", content);

    // Parsear respuesta JSON
    const parsed = JSON.parse(content);
    console.log("🔍 DEBUG: JSON parseado:", parsed);
    
    const characteristicIndices = parsed.characteristics || [];
    const confidence = parsed.confidence || 0;

    console.log("📊 DEBUG: Índices de características detectadas:", characteristicIndices);

    const metTraits = characteristicIndices
      .map((index: number) => enabledTraits[index - 1]?.trait)
      .filter(Boolean);

    console.log("✅ DEBUG: Características finales detectadas:", metTraits);

    const result = {
      matchPoints: metTraits.length,
      metTraits,
      confidence
    };

    console.log("🎯 DEBUG: Resultado final del análisis:", result);
    return result;

  } catch (error) {
    console.error("❌ DEBUG: Error en análisis con IA:", error);
    console.log("🔄 DEBUG: Fallback a análisis por palabras clave");
    return analyzeWithKeywords(messages, idealTraits);
  }
};

// Análisis de respaldo con palabras clave
const analyzeWithKeywords = (messages: ConversationMessage[], idealTraits: Trait[]): AnalysisResult => {
  console.log("🔤 DEBUG: === ANÁLISIS CON PALABRAS CLAVE ===");
  
  const enabledTraits = idealTraits.filter(t => t.enabled);
  const userMessages = messages.filter(msg => msg.sender === 'user');
  const conversationText = userMessages.map(msg => msg.text).join(' ').toLowerCase();

  console.log("📝 DEBUG: Texto de usuario para análisis:", conversationText);

  const keywordMap: Record<string, string[]> = {
    "interesado en nuestros productos o servicios": [
      "interesa", "producto", "servicio", "necesito", "busco", "quiero", "comprar", 
      "cruceros", "viajes", "tours", "vacaciones", "destinos"
    ],
    "tiene presupuesto adecuado para adquirir nuestras soluciones": [
      "presupuesto", "dinero", "pagar", "precio", "cuesta", "inversión", "financiar"
    ],
    "está listo para tomar una decisión de compra": [
      "decidido", "comprar", "ahora", "listo", "cuando", "reservar", "confirmar"
    ],
    "se encuentra en nuestra zona de servicio": [
      "vivo", "ubicado", "ciudad", "país", "zona", "méxico", "españa", "cerca"
    ]
  };

  const metTraits: string[] = [];
  
  enabledTraits.forEach(trait => {
    const keywords = keywordMap[trait.trait.toLowerCase()] || [];
    console.log(`🔍 DEBUG: Verificando característica "${trait.trait}" con palabras:`, keywords);
    
    const hasMatch = keywords.some(keyword => {
      const found = conversationText.includes(keyword);
      if (found) {
        console.log(`✅ DEBUG: Palabra clave encontrada: "${keyword}" en "${trait.trait}"`);
      }
      return found;
    });
    
    if (hasMatch) {
      metTraits.push(trait.trait);
      console.log(`🎯 DEBUG: Característica detectada: ${trait.trait}`);
    }
  });

  const result = {
    matchPoints: metTraits.length,
    metTraits,
    confidence: 0.7
  };

  console.log("🔤 DEBUG: Resultado del análisis por palabras clave:", result);
  return result;
};

export const analyzeAllConversations = async (idealTraits: Trait[]): Promise<void> => {
  console.log("🔍 DEBUG: === ANALIZANDO TODAS LAS CONVERSACIONES ===");
  
  try {
    const conversationsStr = localStorage.getItem('hower-conversations');
    console.log("💾 DEBUG: Conversaciones encontradas:", conversationsStr);
    
    if (!conversationsStr) {
      console.log("⚠️ DEBUG: No hay conversaciones para analizar");
      return;
    }

    const conversations = JSON.parse(conversationsStr);
    console.log("📊 DEBUG: Número de conversaciones a analizar:", conversations.length);
    
    for (const conv of conversations) {
      if (conv.messages && conv.messages.length > 0) {
        console.log(`🔍 DEBUG: Analizando conversación: ${conv.userName} (${conv.messages.length} mensajes)`);
        
        const result = await analyzeConversationWithAI(conv.messages, idealTraits);
        
        // Actualizar la conversación con los resultados
        conv.matchPoints = result.matchPoints;
        conv.metTraits = result.metTraits;
        
        console.log(`✅ DEBUG: ${conv.userName}: ${result.matchPoints} características detectadas:`, result.metTraits);
      } else {
        console.log(`⚠️ DEBUG: Conversación ${conv.userName} sin mensajes`);
      }
    }

    // Guardar conversaciones actualizadas
    localStorage.setItem('hower-conversations', JSON.stringify(conversations));
    console.log("💾 DEBUG: Conversaciones actualizadas guardadas");
    
    // Disparar evento para actualizar UI
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('conversations-updated'));
    
    console.log("✅ DEBUG: ANÁLISIS COMPLETO FINALIZADO");
    
  } catch (error) {
    console.error("❌ DEBUG: Error al analizar conversaciones:", error);
  }
};

