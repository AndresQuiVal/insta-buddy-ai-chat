
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, MessageSquare } from 'lucide-react';

interface AutoresponderTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: 'comments' | 'messages') => void;
}

const AutoresponderTypeDialog = ({ open, onOpenChange, onSelectType }: AutoresponderTypeDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Selecciona el tipo de autoresponder
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Elige dónde quieres que se active tu respuesta automática
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Comentarios de Post */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-purple-300"
            onClick={() => onSelectType('comments')}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Comentarios de Post
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Responde automáticamente a usuarios que comenten en tus publicaciones de Instagram
              </p>
              <div className="mt-4 px-4 py-2 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-700 font-medium">
                  Próximamente disponible
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mensajes Directos / Stories */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 border-2 hover:border-green-300"
            onClick={() => onSelectType('messages')}
          >
            <CardContent className="p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">
                Mensajes Directos / Stories
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Responde automáticamente a mensajes directos y respuestas a tus historias
              </p>
              <div className="mt-4 px-4 py-2 bg-green-50 rounded-lg">
                <p className="text-xs text-green-700 font-medium">
                  ✅ Disponible ahora
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AutoresponderTypeDialog;
