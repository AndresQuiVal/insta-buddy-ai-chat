
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Clock, RotateCcw, AlertCircle } from 'lucide-react';
import { getAutoResetHours, updateAutoResetHours, runAutoReset, getAutoResetStats } from '@/services/autoResetService';
import { toast } from '@/hooks/use-toast';

const AutoResetConfig: React.FC = () => {
  const [resetHours, setResetHours] = useState<number>(48);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    resetHours: 48,
    inactiveCount: 0,
    cutoffTime: ''
  });

  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const hours = await getAutoResetHours();
      setResetHours(hours);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getAutoResetStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleSaveConfig = async () => {
    if (resetHours < 1 || resetHours > 168) {
      toast({
        title: "Valor inválido",
        description: "Las horas deben estar entre 1 y 168 (7 días)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateAutoResetHours(resetHours);
      await loadStats(); // Recargar estadísticas
    } catch (error) {
      console.error('Error guardando configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualReset = async () => {
    setLoading(true);
    try {
      const resetCount = await runAutoReset();
      await loadStats(); // Recargar estadísticas
      
      if (resetCount === 0) {
        toast({
          title: "Sin cambios",
          description: "No hay prospectos inactivos para reiniciar",
        });
      }
    } catch (error) {
      console.error('Error en reinicio manual:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCutoffTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString();
    } catch {
      return 'No disponible';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          Reinicio Automático de Características
        </CardTitle>
        <CardDescription>
          Configura cuándo se reinician automáticamente las características de los prospectos por inactividad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuración de horas */}
        <div className="space-y-2">
          <Label htmlFor="reset-hours" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horas de inactividad para reinicio
          </Label>
          <div className="flex gap-2">
            <Input
              id="reset-hours"
              type="number"
              min="1"
              max="168"
              value={resetHours}
              onChange={(e) => setResetHours(parseInt(e.target.value) || 48)}
              className="w-32"
            />
            <Button 
              onClick={handleSaveConfig}
              disabled={loading}
              variant="outline"
            >
              Guardar
            </Button>
          </div>
          <p className="text-sm text-gray-600">
            Si un prospecto no envía mensajes por {resetHours} horas, sus características se reiniciarán automáticamente
          </p>
        </div>

        {/* Estadísticas */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Estado Actual
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Configuración actual:</span>
              <p className="text-gray-600">{stats.resetHours} horas</p>
            </div>
            
            <div>
              <span className="font-medium">Prospectos inactivos:</span>
              <p className="text-gray-600">
                {stats.inactiveCount} prospectos serían reiniciados
              </p>
            </div>
          </div>

          <div>
            <span className="font-medium text-sm">Límite de actividad:</span>
            <p className="text-gray-600 text-sm">
              {formatCutoffTime(stats.cutoffTime)}
            </p>
          </div>
        </div>

        {/* Reinicio manual */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Reinicio Manual</h4>
              <p className="text-sm text-gray-600">
                Ejecutar reinicio inmediato de características inactivas
              </p>
            </div>
            <Button 
              onClick={handleManualReset}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Ejecutar Ahora
            </Button>
          </div>
        </div>

        {/* Información adicional */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Cómo funciona</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• El sistema verifica automáticamente la actividad de los prospectos</li>
            <li>• Si no hay mensajes por el tiempo configurado, se reinician las características</li>
            <li>• Esto permite una evaluación "fresca" cuando el prospecto vuelva a contactar</li>
            <li>• Puedes ejecutar el reinicio manualmente en cualquier momento</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoResetConfig;
