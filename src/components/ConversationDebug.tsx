import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Bot, User, Clock, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  raw_data?: any;
}

interface ConversationDebugProps {
  messages: Message[];
  onClose: () => void;
}

const ConversationDebug: React.FC<ConversationDebugProps> = ({ messages, onClose }) => {
  const [showRawData, setShowRawData] = useState(false);

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

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold">Debug de Conversación</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowRawData(!showRawData)}
            >
              {showRawData ? 'Ver Mensajes' : 'Ver Datos Raw'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 w-full rounded-md">
          <div className="space-y-4 pr-4">
            {showRawData ? (
              <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(messages, null, 2)}
              </pre>
            ) : (
              sortedMessages.map((msg, index) => (
                <Card key={msg.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${msg.sender === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
                      {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {msg.sender === 'user' ? 'Usuario' : 'Bot'}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-500">
                          (Mensaje #{index + 1})
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap break-words">{msg.text}</p>
                      
                      <details className="mt-2">
                        <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                          Ver detalles técnicos
                        </summary>
                        <div className="mt-2 text-sm bg-gray-50 p-3 rounded">
                          <p><strong>ID:</strong> {msg.id}</p>
                          <p><strong>Timestamp:</strong> {new Date(msg.timestamp).toLocaleString()}</p>
                          {msg.raw_data && (
                            <>
                              <p className="mt-2"><strong>Datos Raw:</strong></p>
                              <pre className="text-xs mt-1 overflow-x-auto">
                                {JSON.stringify(msg.raw_data, null, 2)}
                              </pre>
                            </>
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-500">
            Total mensajes: {messages.length}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Recargar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationDebug; 