
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const Settings = () => {
  const navigate = useNavigate();
  const [isOnboarded, setIsOnboarded] = useState(localStorage.getItem('hower-onboarded') === 'true');
  const [settings, setSettings] = useState({
    name: 'Hower',
    personality: 'amigable',
    responseDelay: 10,
    autoRespond: true
  });
  
  // Verificar si el usuario ha completado el onboarding
  useEffect(() => {
    if (!isOnboarded) {
      // Redirigir a la página de onboarding
      window.location.href = '/onboarding';
    }
  }, [isOnboarded]);

  const handleChange = (field: string, value: string | number | boolean) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleSave = () => {
    // Guardar configuración en localStorage o API
    localStorage.setItem('hower-settings', JSON.stringify(settings));
    navigate('/');
  };

  if (!isOnboarded) {
    // Mostrar pantalla de carga mientras redirige
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Sidebar Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <SettingsIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  Configuración
                </h1>
                <p className="text-gray-600 text-sm">Personaliza tu asistente Hower</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-6">
          <Card className="p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Configuración General</h2>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <Label htmlFor="name">Nombre del asistente</Label>
                <Input 
                  id="name"
                  value={settings.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="personality">Personalidad</Label>
                <Input 
                  id="personality"
                  value={settings.personality}
                  onChange={(e) => handleChange('personality', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label htmlFor="responseDelay">Tiempo de respuesta (segundos)</Label>
                  <span className="text-sm text-gray-500">{settings.responseDelay}s</span>
                </div>
                <Slider
                  id="responseDelay"
                  min={1}
                  max={30}
                  step={1}
                  value={[settings.responseDelay]}
                  onValueChange={(value) => handleChange('responseDelay', value[0])}
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoRespond">Respuesta automática</Label>
                <Switch
                  id="autoRespond"
                  checked={settings.autoRespond}
                  onCheckedChange={(checked) => handleChange('autoRespond', checked)}
                />
              </div>
              
              <Button onClick={handleSave} className="w-full">
                Guardar Cambios
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
