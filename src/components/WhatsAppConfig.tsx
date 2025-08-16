import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Clock, Calendar, Loader2 } from 'lucide-react';

interface WhatsAppSettings {
  enabled: boolean;
  notification_time: string;
  notification_days: number[];
  timezone: string;
}

interface WhatsAppConfigProps {
  instagramUserId: string;
}

const timeOptions = [
  { value: '08:00:00', label: '8:00 AM' },
  { value: '09:00:00', label: '9:00 AM' },
  { value: '10:00:00', label: '10:00 AM' },
  { value: '11:00:00', label: '11:00 AM' },
  { value: '12:00:00', label: '12:00 PM' },
  { value: '13:00:00', label: '1:00 PM' },
  { value: '14:00:00', label: '2:00 PM' },
  { value: '15:00:00', label: '3:00 PM' },
  { value: '16:00:00', label: '4:00 PM' },
  { value: '17:00:00', label: '5:00 PM' },
  { value: '18:00:00', label: '6:00 PM' },
  { value: '19:00:00', label: '7:00 PM' },
  { value: '20:00:00', label: '8:00 PM' },
];

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function WhatsAppConfig({ instagramUserId }: WhatsAppConfigProps) {
  const [settings, setSettings] = useState<WhatsAppSettings>({
    enabled: true,
    notification_time: '09:00:00',
    notification_days: [1, 2, 3, 4, 5], // Lunes a viernes por defecto
    timezone: 'America/Mexico_City'
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Cargar configuración existente
  useEffect(() => {
    loadSettings();
  }, [instagramUserId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_notification_settings')
        .select('*')
        .eq('instagram_user_id', instagramUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading WhatsApp settings:', error);
        return;
      }

      if (data) {
        setSettings({
          enabled: data.enabled,
          notification_time: data.notification_time,
          notification_days: data.notification_days || [1, 2, 3, 4, 5],
          timezone: data.timezone || 'America/Mexico_City'
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      // Intentar insertar, si falla por constraint único, actualizar
      const { error: insertError } = await supabase
        .from('whatsapp_notification_settings')
        .insert({
          instagram_user_id: instagramUserId,
          ...settings
        });

      if (insertError) {
        if (insertError.code === '23505') { // Constraint único violado
          const { error: updateError } = await supabase
            .from('whatsapp_notification_settings')
            .update(settings)
            .eq('instagram_user_id', instagramUserId);

          if (updateError) {
            throw updateError;
          }
        } else {
          throw insertError;
        }
      }

      toast.success('Configuración de WhatsApp guardada exitosamente');

    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (dayIndex: number) => {
    setSettings(prev => ({
      ...prev,
      notification_days: prev.notification_days.includes(dayIndex)
        ? prev.notification_days.filter(d => d !== dayIndex)
        : [...prev.notification_days, dayIndex].sort()
    }));
  };

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Cargando configuración...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Configurar Conexión a WhatsApp
        </CardTitle>
        <CardDescription>
          Recibe recordatorios diarios sobre tus prospectos pendientes
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Habilitar/Deshabilitar */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enabled">Notificaciones de WhatsApp</Label>
            <p className="text-sm text-muted-foreground">
              Recibe recordatorios diarios sobre tus prospectos
            </p>
          </div>
          <Switch
            id="enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Hora de notificación */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora de notificación
              </Label>
              <Select
                value={settings.notification_time}
                onValueChange={(time) => setSettings(prev => ({ ...prev, notification_time: time }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Hora en la que recibirás el recordatorio diario
              </p>
            </div>

            {/* Días de la semana */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Días de notificación
              </Label>
              
              <div className="grid grid-cols-7 gap-2">
                {dayNames.map((day, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={settings.notification_days.includes(index) ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => toggleDay(index)}
                  >
                    {day.slice(0, 3)}
                  </Button>
                ))}
              </div>
              
              <p className="text-sm text-muted-foreground">
                Selecciona los días en los que quieres recibir recordatorios
              </p>
            </div>

            {/* Mensaje de ejemplo */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Ejemplo de mensaje:</h4>
              <p className="text-sm text-muted-foreground">
                "Hola hola [Tu Nombre]! oye, recuerda que tienes:<br/>
                - 3 prospectos que debes dar seguimiento<br/>
                - 2 prospectos que no has respondido<br/>
                - 5 prospectos nuevos a contactar hoy<br/>
                - 1 prospectos que han comentado tus anuncios<br/><br/>
                Para atender estos leads y que no se te enfrien, accede aquí: howertech.com/tasks-to-do/ y atiéndelos ahora!<br/><br/>
                ¡Cada prospecto es una oportunidad de oro! 💪"
              </p>
            </div>
          </>
        )}

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
}