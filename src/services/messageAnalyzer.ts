import { generateAIResponse, ChatMessage } from './openaiService';

export type ProspectState = 
  | 'first_message_sent'
  | 'reactivation_sent'
  | 'no_response'
  | 'invited'
  | 'presented'
  | 'closed';

export interface MessageAnalysis {
  state: ProspectState;
  confidence: number;
  reason: string;
}

export function detectWhatsAppNumber(message: string): boolean {
  // Patrones para números de teléfono y WhatsApp
  const phonePatterns = [
    /\b\d{10}\b/, // 10 dígitos
    /\b\d{11}\b/, // 11 dígitos
    /\b\+?\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Formato internacional
    /\bwhatsapp\s*:?\s*\d+\b/i, // "whatsapp: 1234567890"
    /\bwa\s*:?\s*\d+\b/i, // "wa: 1234567890"
    /\bw\.a\s*:?\s*\d+\b/i, // "w.a: 1234567890"
  ];

  return phonePatterns.some(pattern => pattern.test(message));
}

export function detectMeetingLink(message: string): boolean {
  const meetingPatterns = [
    /https?:\/\/meet\.google\.com\/[a-z0-9-]+/i, // Google Meet
    /https?:\/\/zoom\.us\/j\/\d+/i, // Zoom
    /https?:\/\/us\d+\.web\.zoom\.us\/j\/\d+/i, // Zoom alternativo
    /https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[a-zA-Z0-9%]+/i, // Microsoft Teams
    /https?:\/\/meet\.jitsi\.si\/[a-zA-Z0-9-]+/i, // Jitsi
    /https?:\/\/app\.gather\.town\/[a-zA-Z0-9-]+/i, // Gather Town
    /https?:\/\/whereby\.com\/[a-zA-Z0-9-]+/i, // Whereby
    /https?:\/\/calendly\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-]+/i, // Calendly
  ];

  return meetingPatterns.some(pattern => pattern.test(message));
}

export function detectConfirmation(message: string): boolean {
  const confirmationPhrases = [
    'sí', 'si', 'claro', 'por supuesto', 'me interesa', 'cuéntame más',
    'me gustaría', 'quiero', 'dime más', 'información', 'cómo funciona',
    'precio', 'costo', 'inversión', 'cuánto', 'dónde', 'cuándo',
    'horario', 'duración', 'modalidad', 'online', 'presencial', 'híbrido',
    'requisitos', 'necesito', 'busco', 'estoy interesado'
  ];

  const normalizedMessage = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return confirmationPhrases.some(phrase => normalizedMessage.includes(phrase));
}

export async function analyzeMessage(message: string, conversationHistory: ChatMessage[]): Promise<MessageAnalysis> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `Eres un asistente especializado en analizar mensajes de Instagram para determinar el estado de un prospecto.
      Los estados posibles son:
      - first_message_sent: Cuando se envía el primer mensaje al prospecto
      - reactivation_sent: Cuando se envía un mensaje de reactivación después de no respuesta
      - no_response: Cuando el prospecto no ha respondido
      - invited: Cuando el prospecto comparte su número de WhatsApp o se programa una reunión
      - presented: Cuando se ha hecho una presentación formal del servicio
      - closed: Cuando el prospecto confirma su participación o inscripción

      Analiza el mensaje y el historial de conversación para determinar el estado actual.
      Responde en formato JSON con:
      {
        "state": "estado_detectado",
        "confidence": número_entre_0_y_1,
        "reason": "explicación_del_estado"
      }`
    },
    ...conversationHistory,
    {
      role: 'user',
      content: message
    }
  ];

  const response = await generateAIResponse(messages);
  const analysis = JSON.parse(response) as MessageAnalysis;

  // Verificar si el mensaje contiene un número de WhatsApp o enlace de reunión
  if (detectWhatsAppNumber(message) || detectMeetingLink(message)) {
    return {
      state: 'invited',
      confidence: 0.95,
      reason: 'Se detectó un número de WhatsApp o enlace de reunión en el mensaje'
    };
  }

  return analysis;
}
