
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Settings, Activity, Bug } from 'lucide-react';
import InstagramMessages from './InstagramMessages';
import InstagramDiagnostic from './InstagramDiagnostic';
import InstagramAdvancedDiagnostic from './InstagramAdvancedDiagnostic';
import InstagramDebug from './InstagramDebug';

const InstagramDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard de Instagram
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tus mensajes y monitorea la conexión con Instagram
          </p>
        </div>

        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Mensajes
            </TabsTrigger>
            <TabsTrigger value="diagnostic" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Diagnóstico
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Diagnóstico Avanzado
            </TabsTrigger>
            <TabsTrigger value="debug" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Debug
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-500" />
                  Conversaciones de Instagram
                </CardTitle>
                <CardDescription>
                  Visualiza y responde a los mensajes recibidos de Instagram
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[600px]">
                <InstagramMessages />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostic" className="space-y-6">
            <InstagramDiagnostic />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <InstagramAdvancedDiagnostic />
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <InstagramDebug />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default InstagramDashboard;
