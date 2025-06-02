
interface Trait {
  trait: string;
  enabled: boolean;
  position: number;
}

interface AnalysisResult {
  matchPoints: number;
  metTraits: string[];
  metTraitIndices: number[];
}

export const analyzeMessage = async (messageText: string, idealTraits: Trait[]): Promise<AnalysisResult> => {
  if (!messageText || idealTraits.length === 0) {
    return { matchPoints: 0, metTraits: [], metTraitIndices: [] };
  }

  console.log("🔍 ANALIZANDO MENSAJE COMPLETO:", messageText.substring(0, 200) + "...");
  
  const enabledTraits = idealTraits.filter(t => t.enabled);
  if (enabledTraits.length === 0) {
    return { matchPoints: 0, metTraits: [], metTraitIndices: [] };
  }

  // Normalizar texto para análisis - MÁS SIMPLE Y EFECTIVO
  const conversationText = messageText.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .trim();
  
  console.log("📝 Texto normalizado para análisis:", conversationText);
  
  // Mapa de palabras clave MEJORADO - MÁS ESPECÍFICO Y DIRECTO
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      // Expresiones de interés directo
      "me interesa", "me interesan", "interesa", "interesan", "interesado", "interesada",
      "me gusta", "me gustan", "me encanta", "me encantan",
      "quiero", "quisiera", "necesito", "busco", "requiero",
      "producto", "servicio", "oferta", "promocion", "paquete",
      "precio", "costo", "cotizacion", "presupuesto",
      "comprar", "adquirir", "contratar",
      // Productos específicos
      "crucero", "cruceros", "viaje", "viajes", "tour", "tours",
      "excursion", "excursiones", "vacaciones", "destino", "destinos",
      "turismo", "aventura",
      // Frases completas
      "me interesan los cruceros", "quiero un crucero", "busco cruceros"
    ],
    "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
      "presupuesto", "dinero", "pago", "pagar", "precio", "costo",
      "puedo pagar", "tengo dinero", "dispongo", "cuento con",
      "tarjeta", "efectivo", "financiamiento",
      "mil", "pesos", "dolares", "euros",
      "cuanto cuesta", "cuanto vale", "costoso", "caro", "barato",
      "meses", "cuotas", "mensualidades", "contado"
    ],
    "Está listo para tomar una decisión de compra": [
      "decidido", "decidida", "listo", "lista", "preparado", "preparada",
      "comprar", "reservar", "apartar", "confirmar",
      "ahora", "hoy", "ya", "pronto", "inmediato",
      "cuando", "fecha", "programar", "agendar",
      "perfecto", "de acuerdo", "acepto", "si", "claro", "ok"
    ],
    "Se encuentra en nuestra zona de servicio": [
      "vivo", "estoy", "me encuentro", "ubicado", "radico",
      "direccion", "ciudad", "estado", "zona", "region",
      "mexico", "españa", "guadalajara", "madrid", "barcelona",
      "envio", "entrega", "domicilio", "cerca", "lejos"
    ]
  };
  
  const metTraits: string[] = [];
  const metTraitIndices: number[] = [];
  
  enabledTraits.forEach((trait, idx) => {
    const keywords = keywordMap[trait.trait] || [];
    
    console.log(`🎯 Analizando característica: "${trait.trait}"`);
    console.log(`   Palabras clave: ${keywords.join(', ')}`);
    
    let matchFound = false;
    const foundKeywords: string[] = [];
    
    // BÚSQUEDA MÁS SIMPLE Y DIRECTA
    for (const keyword of keywords) {
      // Simplemente verificar si la palabra clave está contenida en el texto
      if (conversationText.includes(keyword)) {
        matchFound = true;
        foundKeywords.push(keyword);
        console.log(`   ✅ COINCIDENCIA ENCONTRADA: "${keyword}"`);
      }
    }
    
    console.log(`   Palabras encontradas: ${foundKeywords.join(', ')}`);
    console.log(`   ¿Coincidencia?: ${matchFound ? '✅ SÍ' : '❌ NO'}`);
    
    if (matchFound) {
      metTraits.push(trait.trait);
      metTraitIndices.push(idx);
      console.log(`✅ CARACTERÍSTICA CUMPLIDA: ${trait.trait}`);
    }
  });
  
  const matchPoints = metTraits.length;
  
  console.log("📊 RESULTADO FINAL DEL ANÁLISIS:");
  console.log(`   Características detectadas: ${metTraits.length}/${enabledTraits.length}`);
  console.log(`   Puntos de compatibilidad: ${matchPoints}`);
  console.log(`   Características cumplidas: ${metTraits.join(', ')}`);
  
  return { matchPoints, metTraits, metTraitIndices };
};
