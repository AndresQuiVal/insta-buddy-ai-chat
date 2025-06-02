
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
  console.log("🤖 INICIANDO ANÁLISIS CON IA...");
  
  const openaiKey = localStorage.getItem('hower-openai-key-demo') || localStorage.getItem('hower-openai-key');
  
  if (!openaiKey) {
    console.log("⚠️ No hay API Key de OpenAI, usando análisis básico");
    return analyzeWithKeywords(messages, idealTraits);
  }

  const enabledTraits = idealTraits.filter(t => t.enabled);
  if (enabledTraits.length === 0) {
    console.log("⚠️ No hay características habilitadas");
    return { matchPoints: 0, metTraits: [], confidence: 0 };
  }

  // Crear texto de conversación
  const conversationText = messages
    .map(msg => `${msg.sender === 'user' ? 'Prospecto' : 'Asistente'}: ${msg.text}`)
    .join('\n');

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

  try {
    console.log("📡 Enviando consulta a OpenAI...");
    
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

    if (!response.ok) {
      throw new Error(`Error OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log("🤖 Respuesta de OpenAI:", content);

    // Parsear respuesta JSON
    const parsed = JSON.parse(content);
    const characteristicIndices = parsed.characteristics || [];
    const confidence = parsed.confidence || 0;

    const metTraits = characteristicIndices
      .map((index: number) => enabledTraits[index - 1]?.trait)
      .filter(Boolean);

    const result = {
      matchPoints: metTraits.length,
      metTraits,
      confidence
    };

    console.log("✅ Análisis completado:", result);
    return result;

  } catch (error) {
    console.error("❌ Error en análisis con IA:", error);
    return analyzeWithKeywords(messages, idealTraits);
  }
};

// Análisis de respaldo con palabras clave
const analyzeWithKeywords = (messages: ConversationMessage[], idealTraits: Trait[]): AnalysisResult => {
  console.log("🔤 Usando análisis con palabras clave como respaldo");
  
  const enabledTraits = idealTraits.filter(t => t.enabled);
  const userMessages = messages.filter(msg => msg.sender === 'user');
  const conversationText = userMessages.map(msg => msg.text).join(' ').toLowerCase();

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
    const hasMatch = keywords.some(keyword => conversationText.includes(keyword));
    
    if (hasMatch) {
      metTraits.push(trait.trait);
    }
  });

  return {
    matchPoints: metTraits.length,
    metTraits,
    confidence: 0.7
  };
};

export const analyzeAllConversations = async (idealTraits: Trait[]): Promise<void> => {
  console.log("🔍 ANALIZANDO TODAS LAS CONVERSACIONES...");
  
  try {
    const conversationsStr = localStorage.getItem('hower-conversations');
    if (!conversationsStr) {
      console.log("⚠️ No hay conversaciones para analizar");
      return;
    }

    const conversations = JSON.parse(conversationsStr);
    
    for (const conv of conversations) {
      if (conv.messages && conv.messages.length > 0) {
        console.log(`🔍 Analizando conversación: ${conv.userName}`);
        
        const result = await analyzeConversationWithAI(conv.messages, idealTraits);
        
        // Actualizar la conversación con los resultados
        conv.matchPoints = result.matchPoints;
        conv.metTraits = result.metTraits;
        
        console.log(`✅ ${conv.userName}: ${result.matchPoints} características detectadas`);
      }
    }

    // Guardar conversaciones actualizadas
    localStorage.setItem('hower-conversations', JSON.stringify(conversations));
    
    // Disparar evento para actualizar UI
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('conversations-updated'));
    
    console.log("✅ ANÁLISIS COMPLETO FINALIZADO");
    
  } catch (error) {
    console.error("❌ Error al analizar conversaciones:", error);
  }
};
