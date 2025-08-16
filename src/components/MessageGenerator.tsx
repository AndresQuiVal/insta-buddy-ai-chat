import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMessageGenerator } from '@/hooks/useMessageGenerator';
import { toast } from 'sonner';
import { Copy, Wand2 } from 'lucide-react';

export const MessageGenerator: React.FC = () => {
  const [messageLimit, setMessageLimit] = useState(5);
  const [username, setUsername] = useState('');
  const [tema, setTema] = useState('');
  const [typeOfProspection, setTypeOfProspection] = useState<'followers' | 'comments'>('followers');
  const [followObservationText, setFollowObservationText] = useState('');
  const [generatedMessages, setGeneratedMessages] = useState<string[]>([]);

  const { generateMessages, isGenerating } = useMessageGenerator();

  const handleGenerate = async () => {
    if (!username || !tema) {
      toast.error('Username y tema son obligatorios');
      return;
    }

    console.log('🎯 Iniciando generación de mensajes...');
    try {
      const result = await generateMessages({
        messageLimit,
        username,
        tema,
        typeOfProspection,
        followObservationText
      });

      console.log('📝 Resultado obtenido:', result);
      setGeneratedMessages(result.messages);
      toast.success(`${result.messages.length} mensajes generados exitosamente`);
    } catch (error: any) {
      console.error('❌ Error en handleGenerate:', error);
      const errorMessage = error?.message || error?.toString() || 'Error desconocido';
      console.error('❌ Mensaje de error:', errorMessage);
      toast.error(`Error generando mensaje: ${errorMessage}`);
    }
  };

  const copyMessage = (message: string) => {
    navigator.clipboard.writeText(message);
    toast.success('Mensaje copiado al portapapeles');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Generador de Mensajes IA
          </CardTitle>
          <CardDescription>
            Genera mensajes de prospección personalizados usando inteligencia artificial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username (sin @)</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ejemplo: fitness_coach"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tema">Tema</Label>
              <Input
                id="tema"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="fitness, nutrición, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="messageLimit">Número de mensajes</Label>
              <Input
                id="messageLimit"
                type="number"
                min="1"
                max="10"
                value={messageLimit}
                onChange={(e) => setMessageLimit(parseInt(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="typeOfProspection">Tipo de prospección</Label>
              <Select value={typeOfProspection} onValueChange={(value: 'followers' | 'comments') => setTypeOfProspection(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="followers">Followers</SelectItem>
                  <SelectItem value="comments">Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="followObservationText">Texto de observación (opcional)</Label>
            <Textarea
              id="followObservationText"
              value={followObservationText}
              onChange={(e) => setFollowObservationText(e.target.value)}
              placeholder="sigues a @fitness_coach y compartes contenido de ejercicios..."
              rows={2}
            />
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !username || !tema}
            className="w-full"
          >
            {isGenerating ? 'Generando...' : 'Generar Mensajes'}
          </Button>
        </CardContent>
      </Card>

      {generatedMessages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mensajes Generados ({generatedMessages.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedMessages.map((message, index) => (
              <div key={index} className="relative group">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">Mensaje {index + 1}</p>
                      <p className="text-sm leading-relaxed">{message}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};