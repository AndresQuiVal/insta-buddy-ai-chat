
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

  // Normalizar texto para análisis
  const conversationText = messageText.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^\w\s]/g, ' ') // Reemplazar puntuación con espacios
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();
  
  console.log("📝 Texto normalizado para análisis:", conversationText.substring(0, 200) + "...");
  
  // Mapa de palabras clave MEJORADO y más específico
  const keywordMap: Record<string, string[]> = {
    "Interesado en nuestros productos o servicios": [
      // Interés directo
      "interesa", "intereso", "me interesa", "estoy interesado", "interesado", "interesada",
      "quiero", "quisiera", "necesito", "busco", "requiero", "solicito",
      "producto", "servicio", "oferta", "promocion", "paquete", "plan",
      "informacion", "info", "detalles", "conocer", "saber",
      "precio", "costo", "cotizacion", "presupuesto", "tarifa",
      "comprar", "adquirir", "contratar", "obtener",
      // Productos específicos
      "cruceros", "crucero", "viajes", "viaje", "tours", "tour", 
      "excursiones", "excursion", "vacaciones", "destinos", "destino",
      "paquetes turisticos", "turismo", "aventura",
      // Expresiones de interés
      "me gusta", "me encanta", "me fascina", "amo", "adoro",
      "cuéntame", "dime", "explícame", "háblame", "mándame", "envía", "envia",
      "perfecto", "excelente", "genial", "buenísimo", "increíble", "maravilloso",
      "tiene", "tienen", "ofrecen", "manejan", "disponible", "opciones"
    ],
    "Tiene presupuesto adecuado para adquirir nuestras soluciones": [
      // Presupuesto directo
      "presupuesto", "dinero", "efectivo", "pago", "pagar", "pagos",
      "precio", "costo", "cuesta", "vale", "valor", "inversion",
      "puedo pagar", "dispongo", "tengo para", "cuento con",
      "tarjeta", "credito", "financiamiento", "credito", "prestamo",
      // Cantidades y monedas
      "mil", "miles", "pesos", "dolares", "euros", "usd", "mxn",
      "cuanto", "cuánto", "costoso", "caro", "barato", "economico",
      "accesible", "asequible", "vale la pena", "inversion",
      // Modalidades de pago
      "meses", "cuotas", "mensualidades", "abonos", "plazos",
      "contado", "una sola exhibicion", "financiar"
    ],
    "Está listo para tomar una decisión de compra": [
      // Decisión inmediata
      "decidido", "decidida", "listo", "lista", "preparado", "preparada",
      "comprar", "adquirir", "contratar", "reservar", "apartar",
      "ahora", "ya", "hoy", "inmediato", "pronto", "rapido",
      "cuando", "fecha", "programar", "agendar", "confirmar",
      // Urgencia
      "urgente", "necesito ya", "lo antes posible", "cuanto antes",
      "este mes", "esta semana", "mañana", "siguiente",
      // Confirmación
      "perfecto", "de acuerdo", "acepto", "si", "sí", "claro",
      "por supuesto", "esta bien", "está bien", "okay", "ok",
      "adelante", "hagamos", "vamos", "proceder", "seguir"
    ],
    "Se encuentra en nuestra zona de servicio": [
      // Ubicación
      "vivo", "vivo en", "estoy en", "me encuentro", "ubicado", "radico",
      "direccion", "domicilio", "casa", "oficina", "trabajo",
      "ciudad", "estado", "pais", "zona", "region", "area",
      "cerca", "lejos", "distancia", "ubicacion",
      // Lugares específicos
      "mexico", "méxico", "cdmx", "ciudad de mexico", "df",
      "guadalajara", "monterrey", "puebla", "cancun", "merida",
      "tijuana", "leon", "queretaro", "toluca", "aguascalientes",
      "morelia", "saltillo", "hermosillo", "culiacan", "chihuahua",
      // Servicios de ubicación
      "envio", "entrega", "domicilio", "envío a", "llegan a",
      "calle", "avenida", "colonia", "fraccionamiento", "municipio",
      "delegacion", "alcaldia", "codigo postal", "cp"
    ]
  };
  
  const metTraits: string[] = [];
  const metTraitIndices: number[] = [];
  
  enabledTraits.forEach((trait, idx) => {
    const keywords = keywordMap[trait.trait] || [];
    
    console.log(`🎯 Analizando característica: "${trait.trait}"`);
    console.log(`   Palabras clave a buscar: ${keywords.slice(0, 10).join(', ')}...`);
    
    // Buscar coincidencias más inteligentes
    let matchFound = false;
    const foundKeywords: string[] = [];
    
    for (const keyword of keywords) {
      // Buscar palabra completa o como parte de una palabra más larga
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (regex.test(conversationText) || conversationText.includes(keyword.toLowerCase())) {
        matchFound = true;
        foundKeywords.push(keyword);
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
