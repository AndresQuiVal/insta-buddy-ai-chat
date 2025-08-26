import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageCircle, Bot } from 'lucide-react';

interface ProspectActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  prospectUsername: string;
  onViewConversation: () => void;
  onAISuggestion: () => void;
}

const ProspectActionDialog = ({
  isOpen,
  onClose,
  prospectUsername,
  onViewConversation,
  onAISuggestion
}: ProspectActionDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-800">
            ¿Hacia qué <span className="text-primary">prospectos</span> contactar?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {/* Ver conversación */}
          <div 
            onClick={onViewConversation}
            className="flex items-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-primary/30 cursor-pointer transition-all duration-200 hover:shadow-lg group"
          >
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-105 transition-transform">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Ver conversación
              </h3>
              <p className="text-sm text-gray-600">
                Ir directo al chat de Instagram
              </p>
            </div>
          </div>

          {/* Mensaje sugerido con IA */}
          <div 
            onClick={onAISuggestion}
            className="flex items-center p-6 bg-white rounded-2xl border border-gray-200 hover:border-primary/30 cursor-pointer transition-all duration-200 hover:shadow-lg group"
          >
            <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mr-6 group-hover:scale-105 transition-transform">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">
                Mensaje sugerido con I.A.
              </h3>
              <p className="text-sm text-gray-600">
                Generar mensaje inteligente
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProspectActionDialog;