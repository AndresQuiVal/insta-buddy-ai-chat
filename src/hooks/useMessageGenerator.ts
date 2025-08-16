import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MessageGeneratorParams {
  messageLimit: number;
  username: string;
  tema: string;
  typeOfProspection: 'followers' | 'comments';
  followObservationText?: string;
}

interface MessageGeneratorResponse {
  messages: string[];
  rawContent: string;
}

export const useMessageGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMessages = async (params: MessageGeneratorParams): Promise<MessageGeneratorResponse> => {
    setIsGenerating(true);
    
    try {
      console.log('🚀 Invocando función generate-prospect-messages con params:', params);
      
      const { data, error } = await supabase.functions.invoke('generate-prospect-messages', {
        body: params
      });

      console.log('📋 Respuesta de supabase:', { data, error });

      if (error) {
        console.error('❌ Error de supabase function:', error);
        throw new Error(error.message || 'Error desconocido');
      }

      if (!data) {
        console.error('❌ No se recibieron datos');
        throw new Error('No se recibieron datos de la función');
      }

      console.log('✅ Mensajes generados exitosamente:', data);
      return data as MessageGeneratorResponse;
    } catch (error) {
      console.error('❌ Error completo generating messages:', error);
      console.error('❌ Error stack:', (error as Error).stack);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateMessages,
    isGenerating
  };
};