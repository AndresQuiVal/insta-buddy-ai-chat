import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import HowerLiteOnboardingForm from '@/components/HowerLiteOnboardingForm';
import WhatsAppConfig from '@/components/WhatsAppConfig';
import { supabase } from '@/integrations/supabase/client';
import { useEffect as useReactEffect } from 'react';
import { Loader2, CheckCircle, Settings, MessageCircle, User, ArrowRight } from 'lucide-react';

export default function HowerLiteSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState(null);
  const [whatsappSettings, setWhatsappSettings] = useState(null);
  const [instagramUser, setInstagramUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useReactEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      // Obtener usuario de Instagram activo
      const { data: igUser, error: igError } = await supabase
        .from('instagram_users')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (igError || !igUser) {
        console.log('No hay usuario de Instagram conectado');
        setLoading(false);
        return;
      }

      setInstagramUser(igUser);

      // Verificar si ya tiene perfil de Hower Lite
      const { data: profileData, error: profileError } = await supabase
        .from('hower_lite_profiles')
        .select('*')
        .eq('instagram_user_id', igUser.instagram_user_id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        setCurrentStep(2);
      }

      // Verificar configuración de WhatsApp
      const { data: whatsappData, error: whatsappError } = await supabase
        .from('whatsapp_notification_settings')
        .select('*')
        .eq('instagram_user_id', igUser.instagram_user_id)
        .maybeSingle();

      if (whatsappData) {
        setWhatsappSettings(whatsappData);
        if (profileData) {
          setCurrentStep(3); // Setup completo
        }
      }

    } catch (error) {
      console.error('Error checking setup status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = (data: any) => {
    setProfile(data);
    setCurrentStep(2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Cargando configuración...</span>
        </div>
      </div>
    );
  }

  if (!instagramUser) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Conecta tu Instagram</CardTitle>
            <CardDescription>
              Primero necesitas conectar tu cuenta de Instagram para continuar con Hower Lite
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/instagram-callback'} className="w-full">
              Conectar Instagram
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Configurar Hower Lite</h1>
          <p className="text-muted-foreground">
            Configura tu perfil y notificaciones de WhatsApp para maximizar tu prospección
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {profile ? <CheckCircle className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm">Perfil</span>
            </div>
            
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {whatsappSettings ? <CheckCircle className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
              </div>
              <span className="ml-2 text-sm">WhatsApp</span>
            </div>
            
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Settings className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm">Completo</span>
            </div>
          </div>
        </div>

        <Tabs value={`step${currentStep}`} onValueChange={(value) => setCurrentStep(parseInt(value.replace('step', '')))}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="step1" disabled={!instagramUser}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Configurar Perfil
                {profile && <Badge variant="secondary" className="text-xs">✓</Badge>}
              </div>
            </TabsTrigger>
            <TabsTrigger value="step2" disabled={!profile}>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
                {whatsappSettings && <Badge variant="secondary" className="text-xs">✓</Badge>}
              </div>
            </TabsTrigger>
            <TabsTrigger value="step3" disabled={!whatsappSettings}>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Finalizar
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="step1" className="mt-6">
            <HowerLiteOnboardingForm 
              onComplete={handleProfileComplete}
              instagramUserId={instagramUser?.instagram_user_id}
            />
          </TabsContent>

          <TabsContent value="step2" className="mt-6">
            <WhatsAppConfig instagramUserId={instagramUser?.instagram_user_id} />
            
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setCurrentStep(3)}>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="step3" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  ¡Configuración Completa!
                </CardTitle>
                <CardDescription>
                  Tu Hower Lite está listo para usar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Perfil Configurado</h4>
                    <p className="text-sm text-muted-foreground">
                      {profile?.name} - {profile?.niche}
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">WhatsApp Activo</h4>
                    <p className="text-sm text-muted-foreground">
                      Notificaciones a las {whatsappSettings?.notification_time}
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">¿Qué sigue?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Recibirás notificaciones diarias de WhatsApp con tus prospectos pendientes</li>
                    <li>• Ve a Tasks To Do para ver tu dashboard actualizado en tiempo real</li>
                    <li>• Los estados de tus prospectos se actualizarán automáticamente</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => window.location.href = '/tasks-to-do'} className="flex-1">
                    Ir a Tasks To Do
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Editar Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}