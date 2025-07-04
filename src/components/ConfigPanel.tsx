
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bot, Target, Clock } from 'lucide-react';
import PersonalityEditor from './PersonalityEditor';
import IdealClientTraits from './IdealClientTraits';
import AutoResetConfig from './AutoResetConfig';
import OpenAIKeyManager from './OpenAIKeyManager';

const ConfigPanel = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="traits" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traits" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Cliente Ideal
          </TabsTrigger>
          <TabsTrigger value="personality" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            Personalidad IA
          </TabsTrigger>
          <TabsTrigger value="auto-reset" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Reinicio Auto
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Características del Cliente Ideal
              </CardTitle>
              <CardDescription>
                Define las características que debe tener tu cliente ideal para que la IA las identifique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IdealClientTraits />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Personalidad de la IA
              </CardTitle>
              <CardDescription>
                Personaliza cómo se comporta y responde tu asistente de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PersonalityEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auto-reset" className="space-y-4">
          <AutoResetConfig />
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración de API
              </CardTitle>
              <CardDescription>
                Configura las claves de API necesarias para el funcionamiento del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OpenAIKeyManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigPanel;
