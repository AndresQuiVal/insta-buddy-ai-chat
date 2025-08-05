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
      </div>

      {/* SOON Message */}
      <Card className="border-dashed border-2 border-orange-200 bg-orange-50">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-orange-500 text-white px-8 py-4 rounded-lg text-2xl font-bold mb-4">
            SOON
          </div>
          <Clock className="w-12 h-12 text-orange-400 mb-4" />
          <h3 className="text-lg font-medium text-orange-800 mb-2">
            Follow-ups Automáticos
          </h3>
          <p className="text-orange-700 max-w-md">
            Esta funcionalidad estará disponible próximamente. Podrás configurar mensajes de seguimiento automático para mejorar tus conversiones.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FollowUpConfig;