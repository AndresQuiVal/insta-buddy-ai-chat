
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

  console.log("🔍 ANALIZANDO MENSAJE:", messageText.substring(0, 100));
  
  const enabledTraits = idealTraits.filter(t => t.enabled);
  if (enabledTraits.length === 0) {
    return { matchPoints: 0, metTraits: [], metTraitIndices: [] };
  }

  const conversationText = messageText.toLowerCase();
  console.log("📝 Texto normalizado:", conversationText.substring(0, 100));
  
  // Mapa de palabras clave mejorado y más específico para detectar interés
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      "interesa", "intereso", "producto", "servicio", "necesito", "busco", "quiero", "comprar", 
      "tienen", "ofrecen", "información", "info", "conocer", "saber", "precio", "cotización", 
      "propuesta", "me gusta", "me interesa", "quisiera", "podría", "puedo", 
      "disponible", "opciones", "planes", "paquetes", "ofertas", "promociones",
      "cruceros", "crucero", "viajes", "viaje", "tours", "tour", "excursiones", "excursión", 
      "vacaciones", "destinos", "destino", "gustan", "encantan", "fascinan", "amo", "adoro", 
      "interesan", "cuéntame", "dime", "háblame", "explícame", "mándame", "envía", "envíame",
      "perfecto", "excelente", "genial", "buenísimo", "increíble", "maravilloso"
    ],
    "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
      "presupuesto", "dispongo", "puedo pagar", "cuesta", "precio", "inversión", 
      "económico", "financiar", "pago", "costo", "dinero", "gastar", "pagar", 
      "efectivo", "tarjeta", "recursos", "vale la pena", "cuánto", "valor",
      "accesible", "costoso", "barato", "caro", "asequible", "financiamiento",
      "mil", "pesos", "dólares", "euros", "meses", "pagos", "cuotas"
    ],
    "Está listo para tomar una decisión de compra": [
      "decidido", "comprar", "adquirir", "cuando", "ahora", "inmediato", "listo", 
      "proceder", "compra", "ya", "hoy", "pronto", "mañana", "semana", "momento", 
      "urgente", "necesito ya", "reservar", "apartar", "confirmar", "programar",
      "adelante", "hagamos", "vamos", "perfecto", "de acuerdo", "sí", "si", 
      "claro", "por supuesto", "acepto", "está bien", "okay", "ok"
    ],
    "Se encuentra en nuestra zona de servicio": [
      "vivo", "ubicado", "dirección", "ciudad", "zona", "región", "local", 
      "envío", "entrega", "domicilio", "casa", "oficina", "trabajo", "calle", 
      "avenida", "país", "área", "cerca", "lejos", "distancia", "lugar",
      "méxico", "cdmx", "guadalajara", "monterrey", "puebla", "cancún",
      "estado", "colonia", "municipio", "delegación"
    ]
  };
  
  const metTraits: string[] = [];
  const metTraitIndices: number[] = [];
  
  enabledTraits.forEach((trait, idx) => {
    const keywords = keywordMap[trait.trait] || [];
    
    // Buscar coincidencias (incluye palabras parciales y completas)
    const matchFound = keywords.some(keyword => {
      return conversationText.includes(keyword.toLowerCase());
    });
    
    console.log(`🎯 Característica "${trait.trait}"`);
    console.log(`   Palabras clave: ${keywords.slice(0, 5).join(', ')}...`);
    console.log(`   Coincidencia: ${matchFound}`);
    
    if (matchFound) {
      metTraits.push(trait.trait);
      metTraitIndices.push(idx);
      console.log(`✅ CARACTERÍSTICA DETECTADA: ${trait.trait}`);
    }
  });
  
  const matchPoints = metTraits.length;
  
  console.log("📊 RESULTADO DEL ANÁLISIS:");
  console.log(`   Características detectadas: ${metTraits.length}`);
  console.log(`   Puntos de compatibilidad: ${matchPoints}/${enabledTraits.length}`);
  
  return { matchPoints, metTraits, metTraitIndices };
};
