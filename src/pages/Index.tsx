
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

const Index = () => {
  const navigate = useNavigate();
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
  }, []);

  // Escuchar evento de autenticación exitosa
  useEffect(() => {
    const handleAuthSuccess = (event: CustomEvent) => {
      console.log("🎉 Evento de autenticación recibido:", event.detail);
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

  // Verificar si debe mostrar onboarding de autorespondedores
  useEffect(() => {
    if (currentUser && !userLoading) {
      const onboardingCompleted = localStorage.getItem('autoresponder-onboarding-completed');
      if (!onboardingCompleted) {
        navigate('/autoresponder-onboarding');
      }
    }
  }, [currentUser, userLoading, navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/bMLhkc7G/Hower-logo.png"
              alt="Logo Hower"
              className="w-12 h-12 rounded-2xl object-cover"
            />
            <div>
              <h1 className="text-4xl font-light bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Hower <span className="font-bold">Assistant</span>
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
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
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
              onClick={() => setActiveTab("crm")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "crm"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              CRM
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
            <button
              onClick={() => setActiveTab("contenidos_virales")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "contenidos_virales"
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
              style={{ display: 'none' }}
            >
              Contenidos Virales
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">{renderContent()}</div>
      </div>
    </div>
  );
};

export default Index;
