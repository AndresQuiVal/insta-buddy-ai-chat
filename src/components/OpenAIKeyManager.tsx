
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Key, Eye, EyeOff, AlertCircle } from 'lucide-react';

const OpenAIKeyManager = () => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('hower-openai-key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setIsEditing(true); // Si no hay key guardada, abrir modo edición
    }
  }, []);

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Por favor, ingresa tu API key de OpenAI",
        variant: "destructive"
      });
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      toast({
        title: "Error",
        description: "La API key debe comenzar con 'sk-'",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('hower-openai-key', apiKey);
    setIsEditing(false);
    toast({
      title: "✅ API Key guardada",
      description: "Tu clave de OpenAI se guardó de forma segura en tu navegador",
    });
  };

  const handleClearKey = () => {
    localStorage.removeItem('hower-openai-key');
    setApiKey('');
    setIsEditing(true);
    toast({
      title: "API Key eliminada",
      description: "Deberás ingresar una nueva clave para usar las funciones de IA",
      variant: "destructive"
    });
  };

  const maskedKey = apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : '';

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="w-5 h-5" />
          API Key de OpenAI
        </CardTitle>
        <CardDescription>
          Tu clave se guarda de forma segura en tu navegador y nunca se sube a GitHub
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEditing && apiKey ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">
                API Key configurada: {showKey ? apiKey : maskedKey}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="ml-auto"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Cambiar Key
              </Button>
              <Button onClick={handleClearKey} variant="destructive">
                Eliminar Key
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">¿Cómo obtener tu API Key?</p>
                <p>1. Ve a <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></p>
                <p>2. Crea una nueva API key</p>
                <p>3. Cópiala y pégala aquí</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveKey} className="flex-1">
                Guardar API Key
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OpenAIKeyManager;
