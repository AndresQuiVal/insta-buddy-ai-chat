
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

  // Crear texto de conversación SOLO del usuario
  const userMessages = messages.filter(msg => msg.sender === 'user');
  const conversationText = userMessages.map(msg => msg.text).join('\n');

  console.log("📝 DEBUG: Texto del usuario para IA:", conversationText);

  // PROMPT MEJORADO Y MÁS ESPECÍFICO
  const prompt = `Analiza este mensaje del prospecto y determina qué características cumple de la lista proporcionada.

MENSAJE DEL PROSPECTO:
"${conversationText}"

CARACTERÍSTICAS DEL CLIENTE IDEAL A EVALUAR:
${enabledTraits.map((trait, i) => `${i + 1}. ${trait.trait}`).join('\n')}

INSTRUCCIONES:
- Analiza ÚNICAMENTE el contenido del mensaje del prospecto
- Determina si el mensaje indica que el prospecto cumple con alguna de las características listadas
- Busca indicadores directos o indirectos de cada característica
- Sé estricto pero razonable en la evaluación

RESPUESTA REQUERIDA:
Responde SOLO con JSON válido en este formato exacto (sin markdown, sin \`\`\`json):
{"characteristics": [números de características que SÍ cumple], "confidence": 0.8}

Ejemplo: Si cumple las características 1 y 3: {"characteristics": [1, 3], "confidence": 0.9}
Si NO cumple ninguna: {"characteristics": [], "confidence": 0}`;

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
            content: 'Eres un experto analizador de prospectos de ventas. Tu trabajo es identificar si un mensaje cumple características específicas del cliente ideal. Responde ÚNICAMENTE con JSON válido, sin markdown ni bloques de código.'
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
    
    let content = data.choices?.[0]?.message?.content || '';
    console.log("🤖 DEBUG: Contenido de respuesta de OpenAI:", content);

    // LIMPIAR EL CONTENIDO DE MARKDOWN SI EXISTE
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log("🧹 DEBUG: Contenido limpio para parseo:", content);

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

// ANÁLISIS CON PALABRAS CLAVE COMO FALLBACK
const analyzeWithKeywords = (messages: ConversationMessage[], idealTraits: Trait[]): AnalysisResult => {
  console.log("🔤 DEBUG: === ANÁLISIS CON PALABRAS CLAVE ===");
  
  const enabledTraits = idealTraits.filter(t => t.enabled);
  const userMessages = messages.filter(msg => msg.sender === 'user');
  const conversationText = userMessages.map(msg => msg.text).join(' ').toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Quitar acentos

  console.log("📝 DEBUG: Texto normalizado para análisis:", conversationText);

  const metTraits: string[] = [];
  
  enabledTraits.forEach(trait => {
    const traitLower = trait.trait.toLowerCase();
    console.log(`🔍 DEBUG: Analizando característica: "${trait.trait}"`);
    
    // Extraer palabras clave de la característica misma
    const keywords = traitLower.split(' ').filter(word => word.length > 2);
    
    console.log(`   Palabras clave a buscar:`, keywords);
    
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
    } else {
      console.log(`❌ DEBUG: NO detectada: ${trait.trait}`);
    }
  });

  const result = {
    matchPoints: metTraits.length,
    metTraits,
    confidence: 0.8
  };

  console.log("🔤 DEBUG: Resultado del análisis por palabras clave:", result);
  return result;
};

export const analyzeAllConversations = async (idealTraits: Trait[]): Promise<void> => {
  console.log("🔍 DEBUG: === ANALIZANDO TODAS LAS CONVERSACIONES ===");
  console.log("🎯 DEBUG: Características del cliente ideal:", idealTraits);
  
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
      console.log(`🔍 DEBUG: Analizando conversación: ${conv.userName || conv.id}`);
      console.log(`📝 DEBUG: lastMessage: "${conv.lastMessage}"`);
      
      let messagesToAnalyze: ConversationMessage[] = [];
      
      // Si hay mensajes estructurados, usarlos
      if (conv.messages && conv.messages.length > 0) {
        messagesToAnalyze = conv.messages.map((msg: any) => ({
          id: msg.id || '1',
          text: msg.message_text || msg.text || '',
          sender: msg.message_type === 'received' ? 'user' as const : 'ai' as const,
          timestamp: new Date(msg.timestamp || Date.now())
        }));
        console.log(`✅ DEBUG: Usando ${messagesToAnalyze.length} mensajes estructurados`);
      } 
      // Si no hay mensajes estructurados pero hay lastMessage, crear un mensaje artificial
      else if (conv.lastMessage && conv.lastMessage.trim()) {
        messagesToAnalyze = [{
          id: '1',
          text: conv.lastMessage,
          sender: 'user' as const,
          timestamp: new Date()
        }];
        console.log(`🔄 DEBUG: Creando mensaje artificial desde lastMessage: "${conv.lastMessage}"`);
      } else {
        console.log(`⚠️ DEBUG: Conversación ${conv.userName || conv.id} sin contenido para analizar`);
        continue;
      }
      
      console.log(`🤖 DEBUG: Analizando ${messagesToAnalyze.length} mensajes para ${conv.userName || conv.id}`);
      
      const result = await analyzeConversationWithAI(messagesToAnalyze, idealTraits);
      
      // Actualizar la conversación con los resultados
      conv.matchPoints = result.matchPoints;
      conv.metTraits = result.metTraits;
      
      console.log(`✅ DEBUG: ${conv.userName || conv.id}: ${result.matchPoints} características detectadas:`, result.metTraits);
    }

    // Guardar conversaciones actualizadas
    localStorage.setItem('hower-conversations', JSON.stringify(conversations));
    console.log("💾 DEBUG: Conversaciones actualizadas guardadas");
    
    // Mostrar resumen final
    const totalMatches = conversations.reduce((sum: number, conv: any) => sum + (conv.matchPoints || 0), 0);
    const totalTraits = conversations.reduce((sum: number, conv: any) => sum + (conv.metTraits?.length || 0), 0);
    
    console.log("🎯 DEBUG: RESUMEN FINAL:");
    console.log(`📊 Conversaciones analizadas: ${conversations.length}`);
    console.log(`⭐ Total match points: ${totalMatches}`);
    console.log(`🏷️ Total met traits: ${totalTraits}`);
    
    conversations.forEach((conv: any) => {
      if (conv.matchPoints > 0) {
        console.log(`✅ ${conv.userName || conv.id}: ${conv.matchPoints} puntos, características: ${conv.metTraits?.join(', ') || 'ninguna'}`);
      }
    });
    
    // Disparar evento para actualizar UI
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('conversations-updated'));
    
    console.log("✅ DEBUG: ANÁLISIS COMPLETO FINALIZADO");
    
  } catch (error) {
    console.error("❌ DEBUG: Error al analizar conversaciones:", error);
  }
};
