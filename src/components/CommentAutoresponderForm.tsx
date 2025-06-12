
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, X, MessageCircle, Send, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InstagramPost, truncateCaption } from '@/services/instagramPostsService';

interface CommentAutoresponderFormProps {
  selectedPost: InstagramPost;
  onBack: () => void;
  onSubmit: (config: CommentAutoresponderConfig) => void;
}

export interface CommentAutoresponderConfig {
  post_id: string;
  post_url: string;
  post_caption: string;
  name: string;
  keywords: string[];
  dm_message: string;
  is_active: boolean;
}

const CommentAutoresponderForm = ({ selectedPost, onBack, onSubmit }: CommentAutoresponderFormProps) => {
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [dmMessage, setDmMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const addKeyword = () => {
    const trimmedKeyword = newKeyword.trim().toLowerCase();
    
    if (!trimmedKeyword) {
      toast({
        title: "Palabra clave requerida",
        description: "Ingresa una palabra clave válida",
        variant: "destructive"
      });
      return;
    }
    
    if (keywords.includes(trimmedKeyword)) {
      toast({
        title: "Palabra clave duplicada",
        description: "Esta palabra clave ya existe",
        variant: "destructive"
      });
      return;
    }
    
    setKeywords([...keywords, trimmedKeyword]);
    setNewKeyword('');
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Ingresa un nombre para identificar este autoresponder",
        variant: "destructive"
      });
      return;
    }
    
    if (keywords.length === 0) {
      toast({
        title: "Palabras clave requeridas",
        description: "Agrega al menos una palabra clave",
        variant: "destructive"
      });
      return;
    }
    
    if (!dmMessage.trim()) {
      toast({
        title: "Mensaje requerido",
        description: "Ingresa el mensaje que se enviará por DM",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const config: CommentAutoresponderConfig = {
        post_id: selectedPost.id,
        post_url: selectedPost.permalink,
        post_caption: selectedPost.caption || '',
        name: name.trim(),
        keywords,
        dm_message: dmMessage.trim(),
        is_active: true
      };
      
      onSubmit(config);
    } catch (error) {
      console.error('Error enviando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <CardTitle className="text-purple-900">
              Configurar Autoresponder para Comentarios
            </CardTitle>
            <p className="text-sm text-purple-700 mt-1">
              Configura las palabras clave y el mensaje automático
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Post seleccionado */}
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Post seleccionado:</span>
            </div>
            <p className="text-sm text-purple-700">
              {truncateCaption(selectedPost.caption, 150)}
            </p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre del autoresponder */}
          <div>
            <Label htmlFor="name">Nombre del Autoresponder</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Autoresponder para promoción especial"
              className="mt-1"
            />
          </div>

          {/* Palabras clave */}
          <div>
            <Label>Palabras Clave</Label>
            <p className="text-sm text-gray-600 mb-3">
              Cuando alguien comente alguna de estas palabras, se enviará el DM automáticamente
            </p>
            
            {/* Input para agregar palabra clave */}
            <div className="flex gap-2 mb-3">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Escribe una palabra clave..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              />
              <Button type="button" onClick={addKeyword} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Lista de palabras clave */}
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Mensaje de DM */}
          <div>
            <Label htmlFor="dm-message">Mensaje de DM</Label>
            <p className="text-sm text-gray-600 mb-2">
              Este mensaje se enviará automáticamente por DM a quien comente la palabra clave
            </p>
            <Textarea
              id="dm-message"
              value={dmMessage}
              onChange={(e) => setDmMessage(e.target.value)}
              placeholder="¡Hola! Vi que comentaste en mi post. Te escribo para..."
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Advertencia */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 mb-1">
                  Limitaciones de Instagram
                </p>
                <p className="text-amber-700">
                  Por restricciones de Instagram, <strong>NO podemos responder automáticamente al comentario</strong>, 
                  pero sí enviaremos un DM automático a la persona que comentó con la palabra clave.
                </p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Guardar Autoresponder
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CommentAutoresponderForm;
