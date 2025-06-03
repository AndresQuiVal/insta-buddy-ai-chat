
import { useState, useCallback } from 'react';

interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

interface AnalysisResult {
  matchPoints: number;
  metTraits: string[];
  metTraitIndices?: number[];
}

interface ProspectData {
  id: string;
  senderId: string;
  userName: string;
  matchPoints: number;
  metTraits: string[];
  metTraitIndices?: number[];
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

async function analyzeWithOpenAI(conversationText: string, idealTraits: Trait[]): Promise<{matchPoints: number, metTraits: string[], metTraitIndices: number[]}> {
  const openaiKey = localStorage.getItem('hower-openai-key-demo') || localStorage.getItem('hower-openai-key');
  if (!openaiKey) throw new Error('No hay API Key de OpenAI configurada.');
  if (!conversationText.trim() || idealTraits.length === 0) return { matchPoints: 0, metTraits: [], metTraitIndices: [] };

  const prompt = `Analiza TODA esta conversación completa de Instagram:
"""
${conversationText}
"""

Características del cliente ideal (evalúa cada una):
${idealTraits.map((t, i) => `${i + 1}. ${t.trait}`).join('\n')}

INSTRUCCIONES:
- Lee TODA la conversación completa, no solo partes
- Busca evidencia de CADA característica en TODO el texto
- Si encuentras evidencia clara de una característica, inclúyela
- Responde SOLO con un array JSON de números de las características detectadas
- Ejemplo: [1,3,4] si detectas las características 1, 3 y 4
- Si no detectas ninguna, responde []`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Eres un experto analizando conversaciones completas para detectar características de clientes ideales. Debes leer TODO el contenido proporcionado.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.1,
    }),
  });
  
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '';
  
  console.log("🤖 RESPUESTA OPENAI COMPLETA:", content);
  
  let indices: number[] = [];
  try {
    indices = JSON.parse(content.trim());
    if (!Array.isArray(indices)) indices = [];
  } catch {
    // Intentar extraer números del texto si no es JSON válido
    const matches = content.match(/\d+/g);
    indices = matches ? matches.map(n => parseInt(n)).filter(n => n >= 1 && n <= idealTraits.length) : [];
  }
  
  const metTraits = indices.map(idx => idealTraits[idx - 1]?.trait).filter(Boolean);
  const metTraitIndices = indices.map(idx => idx - 1).filter(idx => idx >= 0 && idx < idealTraits.length);
  
  console.log("✅ ANÁLISIS OPENAI COMPLETO:", { indices, metTraits, metTraitIndices });
  
  return { matchPoints: metTraits.length, metTraits, metTraitIndices };
}

function analyzeWithKeywords(conversationText: string, idealTraits: Trait[]): AnalysisResult {
  if (!conversationText || idealTraits.length === 0) {
    return { matchPoints: 0, metTraits: [], metTraitIndices: [] };
  }

  console.log("🔍 ANALIZANDO CON PALABRAS CLAVE TODO EL TEXTO:", conversationText.substring(0, 200) + "...");
  
  const enabledTraits = idealTraits.filter(t => t.enabled);
  if (enabledTraits.length === 0) {
    return { matchPoints: 0, metTraits: [], metTraitIndices: [] };
  }

  // Normalizar TODA la conversación
  const fullText = conversationText.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();
  
  console.log("📝 TEXTO COMPLETO NORMALIZADO:", fullText.substring(0, 300) + "...");
  
  // Palabras clave mejoradas
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      "me interesa", "me interesan", "interesa", "interesan", "interesado", "interesada",
      "me gusta", "me gustan", "me encanta", "me encantan", "me fascina",
      "quiero", "quisiera", "necesito", "busco", "requiero", "deseo",
      "producto", "servicio", "oferta", "promocion", "paquete", "plan",
      "precio", "costo", "cotizacion", "presupuesto", "tarifa",
      "comprar", "adquirir", "contratar", "obtener",
      "crucero", "cruceros", "viaje", "viajes", "tour", "tours",
      "excursion", "excursiones", "vacaciones", "destino", "destinos",
      "turismo", "aventura", "experiencia", "paquete turistico",
      "informacion", "detalles", "opciones", "disponibilidad"
    ],
    "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
      "presupuesto", "dinero", "pago", "pagar", "precio", "costo", "inversion",
      "puedo pagar", "tengo dinero", "dispongo", "cuento con", "tengo para",
      "tarjeta", "efectivo", "financiamiento", "credito", "prestamo",
      "mil", "miles", "pesos", "dolares", "euros", "dinero disponible",
      "cuanto cuesta", "cuanto vale", "costoso", "caro", "barato", "economico",
      "meses", "cuotas", "mensualidades", "contado", "financiar",
      "vale la pena", "inversion", "invertir", "gastar", "desembolso"
    ],
    "Está listo para tomar una decisión de compra": [
      "decidido", "decidida", "listo", "lista", "preparado", "preparada",
      "comprar", "reservar", "apartar", "confirmar", "proceder",
      "ahora", "hoy", "ya", "pronto", "inmediato", "urgente",
      "cuando", "fecha", "programar", "agendar", "coordinar",
      "perfecto", "de acuerdo", "acepto", "si", "claro", "ok", "bien",
      "adelante", "vamos", "hagamoslo", "listo para", "cuando empezamos",
      "como procedo", "siguiente paso", "que sigue", "como continuo"
    ],
    "Se encuentra en nuestra zona de servicio": [
      "vivo", "estoy", "me encuentro", "ubicado", "radico", "resido",
      "direccion", "ciudad", "estado", "zona", "region", "area",
      "mexico", "guadalajara", "monterrey", "cdmx", "ciudad de mexico",
      "españa", "madrid", "barcelona", "valencia", "sevilla",
      "envio", "entrega", "domicilio", "cerca", "lejos", "distancia",
      "local", "nacional", "internacional", "cobertura", "servicio en"
    ]
  };
  
  const metTraits: string[] = [];
  const metTraitIndices: number[] = [];
  
  enabledTraits.forEach((trait, idx) => {
    const keywords = keywordMap[trait.trait] || [];
    
    console.log(`🎯 Analizando: "${trait.trait}"`);
    console.log(`   Palabras clave: ${keywords.slice(0, 10).join(', ')}...`);
    
    let matchFound = false;
    const foundKeywords: string[] = [];
    
    // Buscar en TODO el texto
    for (const keyword of keywords) {
      if (fullText.includes(keyword)) {
        matchFound = true;
        foundKeywords.push(keyword);
      }
    }
    
    console.log(`   Encontradas: ${foundKeywords.join(', ')}`);
    console.log(`   ¿Match?: ${matchFound ? '✅ SÍ' : '❌ NO'}`);
    
    if (matchFound) {
      metTraits.push(trait.trait);
      metTraitIndices.push(idx);
    }
  });
  
  const matchPoints = metTraits.length;
  
  console.log("📊 RESULTADO ANÁLISIS PALABRAS CLAVE:");
  console.log(`   Características detectadas: ${metTraits.length}/${enabledTraits.length}`);
  console.log(`   Características: ${metTraits.join(', ')}`);
  
  return { matchPoints, metTraits, metTraitIndices };
}

export const useTraitAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMessage = useCallback(async (messageText: string, idealTraits: Trait[]): Promise<AnalysisResult> => {
    console.log("🔍 INICIANDO ANÁLISIS COMPLETO DE CONVERSACIÓN");
    console.log("📝 Texto a analizar (primeros 500 chars):", messageText.substring(0, 500));
    console.log("🎯 Características a evaluar:", idealTraits.map(t => t.trait));
    
    // Intentar con OpenAI primero si hay API key
    const openaiKey = localStorage.getItem('hower-openai-key-demo') || localStorage.getItem('hower-openai-key');
    if (openaiKey) {
      try {
        console.log("🤖 Usando análisis con OpenAI...");
        const result = await analyzeWithOpenAI(messageText, idealTraits);
        console.log("✅ Análisis OpenAI completado:", result);
        return result;
      } catch (e) {
        console.error('❌ Error con OpenAI, usando palabras clave:', e);
      }
    }
    
    // Fallback a palabras clave
    console.log("🔤 Usando análisis con palabras clave...");
    const result = analyzeWithKeywords(messageText, idealTraits);
    console.log("✅ Análisis palabras clave completado:", result);
    return result;
  }, []);

  const updateProspectInStorage = useCallback((
    senderId: string,
    userName: string,
    matchPoints: number,
    metTraits: string[],
    messageText: string,
    metTraitIndices?: number[]
  ) => {
    try {
      console.log("💾 ACTUALIZANDO PROSPECTO EN STORAGE:", {
        senderId: senderId.slice(-6),
        userName,
        matchPoints,
        metTraits: metTraits.length,
        metTraitIndices: metTraitIndices?.length || 0
      });
      
      const savedConversationsStr = localStorage.getItem('hower-conversations');
      let conversations: ProspectData[] = [];
      
      if (savedConversationsStr) {
        conversations = JSON.parse(savedConversationsStr);
      }
      
      const existingIndex = conversations.findIndex(conv => 
        conv.id === senderId || 
        conv.senderId === senderId ||
        conv.userName === userName
      );
      
      if (existingIndex !== -1) {
        // Actualizar - MANTENER características detectadas previamente
        const existing = conversations[existingIndex];
        const allTraits = [...new Set([...(existing.metTraits || []), ...metTraits])];
        const allIndices = [...new Set([...(existing.metTraitIndices || []), ...(metTraitIndices || [])])];
        
        conversations[existingIndex] = {
          ...existing,
          matchPoints: allTraits.length,
          metTraits: allTraits,
          metTraitIndices: allIndices,
          lastMessage: messageText.substring(0, 100),
          timestamp: '1m'
        };
        
        console.log("✅ PROSPECTO ACTUALIZADO (ACUMULATIVO):", {
          usuario: userName,
          caracteristicasTotal: allTraits.length,
          caracteristicas: allTraits
        });
      } else {
        // Crear nuevo
        const newConversation: ProspectData = {
          id: senderId,
          senderId,
          userName: userName || `Usuario ${senderId.slice(-4)}`,
          matchPoints,
          metTraits,
          metTraitIndices: metTraitIndices || [],
          lastMessage: messageText.substring(0, 100),
          timestamp: '1m',
          unread: true
        };
        
        conversations.push(newConversation);
        
        console.log("✅ PROSPECTO CREADO:", {
          usuario: userName,
          caracteristicas: matchPoints,
          traits: metTraits
        });
      }
      
      localStorage.setItem('hower-conversations', JSON.stringify(conversations));
      
      // Forzar actualización de UI
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('conversations-updated', { 
        detail: { senderId, matchPoints, metTraits, metTraitIndices }
      }));
      
      console.log("💾 DATOS GUARDADOS CORRECTAMENTE EN LOCALSTORAGE");
      
    } catch (error) {
      console.error("❌ Error al actualizar prospecto:", error);
    }
  }, []);

  const analyzeAndUpdateProspect = useCallback(async (
    senderId: string,
    userName: string,
    allMessagesText: string, // TODA la conversación
    idealTraits: Trait[]
  ): Promise<AnalysisResult> => {
    console.log("🔍 ANÁLISIS COMPLETO DE PROSPECTO INICIADO");
    console.log(`👤 Usuario: ${userName}`);
    console.log(`📝 Texto completo (${allMessagesText.length} caracteres):`, allMessagesText.substring(0, 300) + "...");
    console.log(`🎯 Evaluando ${idealTraits.filter(t => t.enabled).length} características`);
    
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeMessage(allMessagesText, idealTraits);
      
      console.log("📊 RESULTADO FINAL:", {
        matchPoints: result.matchPoints,
        metTraits: result.metTraits.length,
        características: result.metTraits
      });
      
      if (result.matchPoints > 0) {
        updateProspectInStorage(senderId, userName, result.matchPoints, result.metTraits, allMessagesText, result.metTraitIndices);
      }
      
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeMessage, updateProspectInStorage]);

  return {
    isAnalyzing,
    analyzeMessage,
    analyzeAndUpdateProspect
  };
};
