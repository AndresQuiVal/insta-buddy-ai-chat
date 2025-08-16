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
      const { data, error } = await supabase.functions.invoke('generate-prospect-messages', {
        body: params
      });

      if (error) {
        throw new Error(error.message);
      }

      return data as MessageGeneratorResponse;
    } catch (error) {
      console.error('Error generating messages:', error);
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