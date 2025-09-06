
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HamburgerMenu from "@/components/HamburgerMenu";
import InstagramLogin from "@/components/InstagramLogin";
import InstagramAccountDiagnostic from "@/components/InstagramAccountDiagnostic";
import ConfigPanel from "@/components/ConfigPanel";
import ProspectaTab from "@/components/ProspectaTab";
import ContenidosViralesTab from "@/components/ContenidosViralesTab";
import AutoresponderManager from "@/components/AutoresponderManager";
import ProspectCRM from "@/components/ProspectCRM";
import {
  BarChart3,
  MessageCircle,
  Settings,
  Instagram,
  CheckCircle,
  AlertCircle,
  Key,
  Brain,
  LogOut,
  Bug,
  Users,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import MyProspects from "@/components/MyProspects";
import { useInstagramUsers } from "@/hooks/useInstagramUsers";
import { supabase } from "@/integrations/supabase/client";
import TestUserWebhookFix from "@/components/TestUserWebhookFix";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("autoresponder");
  const [accessToken, setAccessToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const { toast } = useToast();
  const [showDebug, setShowDebug] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  
  const { currentUser, loading: userLoading, checkCurrentUser } = useInstagramUsers();

  // Verificar si hay usuario conectado al inicializar
  useEffect(() => {
    console.log('🚀 Inicializando Index, verificando usuario...');
    checkCurrentUser();
    
    // Verificar si se debe abrir configuración automáticamente
    const tab = searchParams.get('tab');
    if (tab === 'settings') {
      setActiveTab('settings');
      // Limpiar el parámetro de la URL
      setSearchParams({});
    }
  }, [searchParams]);

  // Escuchar evento de autenticación exitosa
  useEffect(() => {
    const handleAuthSuccess = (event: CustomEvent) => {
      console.log("🎉 Evento de autenticación recibido:", event.detail);
      
      // Marcar que acabamos de autenticar
      sessionStorage.setItem('just-authenticated', 'true');
      
      // Dar un pequeño delay para que se guarde en localStorage
      setTimeout(() => {
        console.log("🔄 Recargando usuario después de autenticación...");
        checkCurrentUser();
      }, 500);
    };

    console.log('👂 Configurando listener para instagram-auth-success');
    window.addEventListener('instagram-auth-success', handleAuthSuccess as EventListener);
    
    return () => {
      console.log('🚮 Limpiando listener para instagram-auth-success');
      window.removeEventListener('instagram-auth-success', handleAuthSuccess as EventListener);
    };
  }, [checkCurrentUser]);

  // Debug: mostrar estado actual
  useEffect(() => {
    console.log('📊 Estado actual:', { 
      userLoading, 
      currentUser: currentUser ? 'Usuario encontrado' : 'No hay usuario',
      username: currentUser?.username 
    });
  }, [userLoading, currentUser]);

  // Redirección automática después del login
  useEffect(() => {
    if (!userLoading && currentUser) {
      console.log('🎯 Usuario detectado, verificando si debe redirigir...');
      
      // Verificar si viene del welcome con intención específica de usar autoresponder
      const tabParam = searchParams.get('tab');
      if (tabParam === 'autoresponder') {
        console.log('🎯 Usuario viene de welcome queriendo usar autoresponder, verificando autoresponders...');
        // Limpiar el parámetro de la URL
        setSearchParams({});
        // Verificar si tiene autoresponders configurados y redirigir a onboarding si no los tiene
        checkAutoresponderOnboardingStatus(true); // Pasar true para indicar que viene de welcome
        return;
      }
      
      // Verificar si viene de login reciente
      const justLoggedIn = localStorage.getItem('just-logged-in');
      
      if (justLoggedIn) {
        console.log('🚀 Usuario recién logueado, redirigiendo a hower-auth');
        localStorage.removeItem('just-logged-in');
        navigate('/hower-auth', { replace: true });
        return;
      }
      
      // REMOVIDO: No verificar autoresponders automáticamente aquí
      // Esto causaba bucles de redirección
      // checkAutoresponderOnboardingStatus();
    }
  }, [currentUser, userLoading, navigate, searchParams, setSearchParams]);

  // Verificar si debe mostrar autoresponder onboarding
  const checkAutoresponderOnboardingStatus = async (fromWelcome = false) => {
    if (currentUser && !userLoading) {
      // Verificar si el usuario tiene autorespondedores configurados
      const { data: autoresponders, error } = await supabase
        .from('autoresponder_messages')
        .select('id')
        .eq('instagram_user_id_ref', currentUser.instagram_user_id)
        .limit(1);

      const { data: generalAutoresponders, error: generalError } = await supabase
        .from('general_comment_autoresponders')
        .select('id')
        .eq('user_id', currentUser.instagram_user_id)
        .limit(1);

      const { data: commentAutoresponders, error: commentError } = await supabase
        .from('comment_autoresponders')
        .select('id')
        .eq('user_id', currentUser.instagram_user_id)
        .limit(1);

      // Si no tiene ningún autorespondedor configurado, mostrar onboarding
      const hasAutoresponders = (autoresponders && autoresponders.length > 0) ||
                               (generalAutoresponders && generalAutoresponders.length > 0) ||
                               (commentAutoresponders && commentAutoresponders.length > 0);

      if (!hasAutoresponders) {
        if (fromWelcome) {
          console.log('🔍 DEBUG Index - No autoresponders found, usuario viene de welcome, navegando a /autoresponder-onboarding/');
          navigate('/autoresponder-onboarding/');
        } else {
          console.log('🔍 DEBUG Index - No autoresponders found, navigating to /hower-auth');
          navigate('/hower-auth');
        }
      }
    }
  };

  // Si está cargando, mostrar loading
  if (userLoading) {
    console.log('⏳ Mostrando pantalla de carga...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando conexión...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario conectado, mostrar login de Instagram
  if (!currentUser) {
    console.log('👤 No hay usuario, mostrando login...');
    return <InstagramLogin />;
  }

  console.log('✅ Usuario autenticado, mostrando dashboard...');

  const handleLogout = () => {
    localStorage.removeItem("instagram_access_token");
    localStorage.removeItem("hower-instagram-user");
    localStorage.removeItem("hower-instagram-token");
    setIsTokenSaved(false);
    window.location.reload(); // Recargar para resetear el estado
    toast({
      title: "¡Sesión cerrada!",
      description: "Tu sesión se ha cerrado correctamente",
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "autoresponder":
        return <AutoresponderManager />;
      case "crm":
        return <ProspectCRM />;
      case "prospecta":
        return <ProspectaTab />;
      case "contenidos_virales":
        return <ContenidosViralesTab />;
      case "settings":
        return (
          <div className="space-y-6">
            {/* Diagnóstico de cuenta Instagram */}
            <InstagramAccountDiagnostic />

            {/* Panel de configuración con tabs */}
            <ConfigPanel />
          </div>
        );
      default:
        return <AutoresponderManager />;
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      {/* Hamburger Menu - positioned at top left */}
      <div className="absolute top-6 left-6 z-50">
        <HamburgerMenu activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      
      {/* White Content Container with rounded top */}
      <div className="min-h-screen bg-white rounded-t-[32px] mt-16 px-6 py-8">
        <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
              alt="Logo Hower"
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Hower <span className="font-bold text-purple-400">Assistant</span>
              </h1>
              {currentUser && (
                <p className="text-sm text-gray-600">
                  Conectado como @{currentUser.username}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => {
                if (!currentUser) {
                  toast({
                    title: "Error",
                    description: "Sesión no válida, reconectando...",
                    variant: "destructive"
                  });
                  handleLogout();
                  return;
                }
                navigate('/tasks-to-do');
              }} 
              variant="default" 
              size="sm" 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-light shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="font-bold text-purple-100">Volver a</span> CRM
            </Button>
            <HamburgerMenu activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setActiveTab("autoresponder")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "autoresponder"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Autorespondedor
            </button>
            <button
              onClick={() => setActiveTab("prospecta")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "prospecta"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Prospecta
            </button>
          </div>
        </div>

        {/* Temporary Webhook Fix for @t3stus3r_1 */}
        <div className="mb-6">
          <TestUserWebhookFix />
        </div>

        {/* Main Content */}
        <div className="space-y-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default Index;
