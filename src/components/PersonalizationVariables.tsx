
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, User, Clock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PersonalizationVariablesProps {
  onVariableClick?: (variable: string) => void;
}

const PersonalizationVariables = ({ onVariableClick }: PersonalizationVariablesProps) => {
  const { toast } = useToast();

  const variables = [
    {
      variable: '{NOMBRE}',
      description: 'Primer nombre del usuario',
      example: 'Juan',
      icon: <User className="w-3 h-3" />
    },
    {
      variable: '{NOMBRE_COMPLETO}',
      description: 'Nombre completo del usuario',
      example: 'Juan Pérez',
      icon: <User className="w-3 h-3" />
    },
    {
      variable: '{USERNAME}',
      description: 'Nombre de usuario de Instagram',
      example: '@juanperez',
      icon: <User className="w-3 h-3" />
    },
    {
      variable: '{HORA}',
      description: 'Hora actual',
      example: '14:30',
      icon: <Clock className="w-3 h-3" />
    },
    {
      variable: '{DIA}',
      description: 'Día de la semana actual',
      example: 'lunes',
      icon: <Calendar className="w-3 h-3" />
    }
  ];

  const copyToClipboard = (variable: string) => {
    navigator.clipboard.writeText(variable);
    toast({
      title: "¡Copiado!",
      description: `Variable ${variable} copiada al portapapeles`,
    });
  };

  const handleVariableClick = (variable: string) => {
    if (onVariableClick) {
      onVariableClick(variable);
    } else {
      copyToClipboard(variable);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
          ✨ Variables de Personalización
        </CardTitle>
        <p className="text-xs text-blue-700">
          Haz clic en una variable para {onVariableClick ? 'insertarla' : 'copiarla'}
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {variables.map(({ variable, description, example, icon }) => (
          <div
            key={variable}
            onClick={() => handleVariableClick(variable)}
            className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-2 flex-1">
              <div className="text-blue-600">
                {icon}
              </div>
              <div className="flex-1">
                <Badge 
                  variant="secondary" 
                  className="text-xs font-mono bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                  {variable}
                </Badge>
                <p className="text-xs text-gray-600 mt-1">{description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 italic">ej: {example}</span>
              <Copy className="w-3 h-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
        ))}
        
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800 font-medium">💡 Ejemplo de uso:</p>
          <p className="text-xs text-yellow-700 mt-1 font-mono bg-yellow-100 p-1 rounded">
            "¡Hola {'{NOMBRE}'}! Gracias por contactarnos en {'{DIA}'} a las {'{HORA}'}. Te ayudo con tu consulta."
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizationVariables;
