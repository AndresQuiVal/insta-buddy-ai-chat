import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationDebugProps {
  messages: any[];
  onClose: () => void;
}

const ConversationDebug: React.FC<ConversationDebugProps> = ({ messages, onClose }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <h2 className="text-xl font-bold mb-4">Debug de Conversación</h2>
          <p className="text-gray-500">No hay mensajes en esta conversación.</p>
          <Button onClick={onClose} className="mt-4">Cerrar</Button>
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Debug de Conversación</h2>
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {sortedMessages.map((msg, index) => (
              <div 
                key={msg.id} 
                className={`p-4 rounded-lg ${
                  msg.message_type === 'received' 
                    ? 'bg-blue-50 border border-blue-100' 
                    : 'bg-green-50 border border-green-100'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">
                    {msg.message_type === 'received' ? '👤 USUARIO' : '🤖 BOT'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(msg.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700">{msg.message_text}</p>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">
                      Ver detalles técnicos
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                      {JSON.stringify({
                        id: msg.id,
                        instagram_message_id: msg.instagram_message_id,
                        sender_id: msg.sender_id,
                        recipient_id: msg.recipient_id,
                        raw_data: msg.raw_data
                      }, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default ConversationDebug; 