import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Clock } from 'lucide-react';

export interface FollowUp {
  id: string;
  delay_hours: number;
  message_text: string;
  is_active: boolean;
}

interface FollowUpConfigProps {
  followUps: FollowUp[];
  onChange: (followUps: FollowUp[]) => void;
  maxFollowUps?: number;
}

const FollowUpConfig = ({ followUps, onChange, maxFollowUps = 4 }: FollowUpConfigProps) => {
  const [localFollowUps, setLocalFollowUps] = useState<FollowUp[]>(followUps);

  useEffect(() => {
    setLocalFollowUps(followUps);
  }, [followUps]);

  const addFollowUp = () => {
    if (localFollowUps.length >= maxFollowUps) return;

    const newFollowUp: FollowUp = {
      id: `temp-${Date.now()}`,
      delay_hours: 1,
      message_text: '',
      is_active: true
    };

    const updated = [...localFollowUps, newFollowUp];
    setLocalFollowUps(updated);
    onChange(updated);
  };

  const removeFollowUp = (index: number) => {
    const updated = localFollowUps.filter((_, i) => i !== index);
    setLocalFollowUps(updated);
    onChange(updated);
  };

  const updateFollowUp = (index: number, field: keyof FollowUp, value: any) => {
    const updated = localFollowUps.map((followUp, i) => {
      if (i === index) {
        return { ...followUp, [field]: value };
      }
      return followUp;
    });
    setLocalFollowUps(updated);
    onChange(updated);
  };

  const getDelayOptions = () => {
    const options = [];
    // Cada hora del 1 al 23
    for (let i = 1; i <= 23; i++) {
      options.push({
        value: i,
        label: i === 1 ? '1 hora' : `${i} horas`
      });
    }
    return options;
  };

  const calculateTotalTime = (upToIndex: number) => {
    let total = 0;
    for (let i = 0; i <= upToIndex; i++) {
      total += localFollowUps[i]?.delay_hours || 0;
    }
    return total;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-medium">Secuencia de Follow-ups</Label>
          <p className="text-sm text-gray-500 mt-1">
            Configura hasta {maxFollowUps} mensajes de seguimiento automático (máximo 23 horas entre cada uno)
          </p>
        </div>
        {localFollowUps.length < maxFollowUps && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addFollowUp}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar Follow-up
          </Button>
        )}
      </div>

      {localFollowUps.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-500 mb-4">
              No hay follow-ups configurados
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={addFollowUp}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear primer follow-up
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {localFollowUps.map((followUp, index) => (
            <Card key={followUp.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    Follow-up {index + 1}
                    {index > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Total: {calculateTotalTime(index)} horas después del mensaje inicial)
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={followUp.is_active}
                      onCheckedChange={(checked) => updateFollowUp(index, 'is_active', checked)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFollowUp(index)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`delay-${index}`}>
                    Enviar después de
                    {index > 0 ? ' (desde el follow-up anterior)' : ' (desde el mensaje inicial)'}
                  </Label>
                  <Select
                    value={followUp.delay_hours.toString()}
                    onValueChange={(value) => updateFollowUp(index, 'delay_hours', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getDelayOptions().map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`message-${index}`}>Mensaje del follow-up</Label>
                  <Textarea
                    id={`message-${index}`}
                    value={followUp.message_text}
                    onChange={(e) => updateFollowUp(index, 'message_text', e.target.value)}
                    placeholder="Escribe el mensaje de seguimiento..."
                    rows={3}
                    maxLength={1000}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {followUp.message_text.length}/1000 caracteres
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {localFollowUps.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Vista previa de la secuencia:</h4>
          <div className="space-y-2 text-sm">
            <div className="text-blue-800">
              <strong>Mensaje inicial:</strong> Se envía inmediatamente cuando alguien comenta
            </div>
            {localFollowUps
              .filter(f => f.is_active && f.message_text.trim())
              .map((followUp, index) => (
                <div key={followUp.id} className="text-blue-700">
                  <strong>Follow-up {index + 1}:</strong> Se envía {calculateTotalTime(index)} horas después del mensaje inicial
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowUpConfig;