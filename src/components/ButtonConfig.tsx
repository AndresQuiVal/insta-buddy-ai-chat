
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ExternalLink, MessageSquare } from 'lucide-react';

interface ButtonData {
  type: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
  action_type?: 'message' | 'url_redirect';
  action_data?: any;
}

interface ButtonConfigProps {
  useButtons: boolean;
  onUseButtosChange: (value: boolean) => void;
  buttons: ButtonData[];
  onButtonsChange: (buttons: ButtonData[]) => void;
}

const ButtonConfig: React.FC<ButtonConfigProps> = ({
  useButtons,
  onUseButtosChange,
  buttons,
  onButtonsChange
}) => {
  const addButton = () => {
    if (buttons.length >= 3) return; // Máximo 3 botones según Instagram API
    
    const newButton: ButtonData = {
      type: 'web_url',
      title: '',
      url: ''
    };
    
    onButtonsChange([...buttons, newButton]);
  };

  const removeButton = (index: number) => {
    const updatedButtons = buttons.filter((_, i) => i !== index);
    onButtonsChange(updatedButtons);
  };

  const updateButton = (index: number, field: keyof ButtonData, value: any) => {
    const updatedButtons = buttons.map((button, i) => {
      if (i === index) {
        const updatedButton = { ...button, [field]: value };
        
        // Limpiar campos según el tipo
        if (field === 'type') {
          if (value === 'web_url') {
            delete updatedButton.payload;
            delete updatedButton.action_type;
            delete updatedButton.action_data;
            updatedButton.url = updatedButton.url || '';
          } else if (value === 'postback') {
            delete updatedButton.url;
            updatedButton.payload = updatedButton.payload || `button_${Date.now()}`;
            updatedButton.action_type = updatedButton.action_type || 'message';
          }
        }
        
        return updatedButton;
      }
      return button;
    });
    
    onButtonsChange(updatedButtons);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="useButtons"
          checked={useButtons}
          onCheckedChange={onUseButtosChange}
        />
        <Label htmlFor="useButtons">Agregar botones interactivos al mensaje</Label>
      </div>

      {useButtons && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Configuración de Botones</CardTitle>
            <p className="text-xs text-gray-500">
              Máximo 3 botones. Los botones aparecerán debajo del mensaje.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {buttons.map((button, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Botón {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeButton(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Tipo de botón</Label>
                    <Select
                      value={button.type}
                      onValueChange={(value: 'web_url' | 'postback') => 
                        updateButton(index, 'type', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web_url">
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Abrir URL
                          </div>
                        </SelectItem>
                        <SelectItem value="postback">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Acción/Respuesta
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Texto del botón</Label>
                    <Input
                      value={button.title}
                      onChange={(e) => updateButton(index, 'title', e.target.value)}
                      placeholder="Ej: Ver más info"
                      maxLength={20}
                    />
                  </div>
                </div>

                {button.type === 'web_url' && (
                  <div>
                    <Label className="text-xs">URL a abrir</Label>
                    <Input
                      value={button.url || ''}
                      onChange={(e) => updateButton(index, 'url', e.target.value)}
                      placeholder="https://ejemplo.com"
                      type="url"
                    />
                  </div>
                )}

                {button.type === 'postback' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">ID único del botón (payload)</Label>
                      <Input
                        value={button.payload || ''}
                        onChange={(e) => updateButton(index, 'payload', e.target.value)}
                        placeholder="Ej: solicitar_info"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Identificador único para reconocer qué botón fue presionado
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs">Qué hacer cuando presionen el botón</Label>
                      <Select
                        value={button.action_type || 'message'}
                        onValueChange={(value: 'message' | 'url_redirect') => 
                          updateButton(index, 'action_type', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="message">Enviar mensaje automático</SelectItem>
                          <SelectItem value="url_redirect">Redirigir a URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {button.action_type === 'message' && (
                      <div>
                        <Label className="text-xs">Mensaje a enviar</Label>
                        <Input
                          value={button.action_data?.message || ''}
                          onChange={(e) => updateButton(index, 'action_data', { 
                            ...button.action_data, 
                            message: e.target.value 
                          })}
                          placeholder="Mensaje que se enviará automáticamente"
                        />
                      </div>
                    )}

                    {button.action_type === 'url_redirect' && (
                      <div>
                        <Label className="text-xs">URL de redirección</Label>
                        <Input
                          value={button.action_data?.url || ''}
                          onChange={(e) => updateButton(index, 'action_data', { 
                            ...button.action_data, 
                            url: e.target.value 
                          })}
                          placeholder="https://ejemplo.com"
                          type="url"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {buttons.length < 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={addButton}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Botón ({buttons.length}/3)
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ButtonConfig;
