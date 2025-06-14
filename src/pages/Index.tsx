
import React, { useState, useEffect } from "react";
import InstagramDashboard, {
  DashboardDebugPanel,
} from "@/components/InstagramDashboard";
import InstagramMessages from "@/components/InstagramMessages";
import InstagramDiagnostic from "@/components/InstagramDiagnostic";
import AdvancedMetrics from "@/components/AdvancedMetrics";
import InstagramProspect from "@/components/InstagramProspect";
import HamburgerMenu from "@/components/HamburgerMenu";
import InstagramLogin from "@/components/InstagramLogin";
import InstagramAccountDiagnostic from "@/components/InstagramAccountDiagnostic";
import ConfigPanel from "@/components/ConfigPanel";
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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [accessToken, setAccessToken] = useState("");
  const [isTokenSaved, setIsTokenSaved] = useState(false);
  const { toast } = useToast();
  const [showDebug, setShowDebug] = useState(false);
  const [openaiKey, setOpenaiKey] = useState("");
  
  const { currentUser, loading: userLoading, checkCurrentUser } = useInstagramUsers();

  // Verificar si hay usuario conectado
  useEffect(() => {
    checkCurrentUser();
  }, []);

  // Escuchar evento de autenticación exitosa
  useEffect(() => {
    const handleAuthSuccess = (event: CustomEvent) => {
      console.log("🎉 Usuario autenticado exitosamente:", event.detail);
      // Recargar el usuario actual
      checkCurrentUser();
    };

    window.addEventListener('instagram-auth-success', handleAuthSuccess as EventListener);
    
    return () => {
      window.removeEventListener('instagram-auth-success', handleAuthSuccess as EventListener);
    };
  }, [checkCurrentUser]);

  // Si está cargando, mostrar loading
  if (userLoading) {
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
    return <InstagramLogin />;
  }

  const handleSaveToken = () => {
    if (!accessToken.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un token válido",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem("instagram_access_token", accessToken);
    setIsTokenSaved(true);
    setAccessToken("");

    toast({
      title: "¡Token guardado!",
      description: "Tu token de Instagram se ha configurado correctamente",
    });
  };

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
      case "dashboard":
        return (
          <InstagramDashboard onShowAnalysis={() => setActiveTab("analysis")} />
        );
      case "my_prospects":
        return <MyProspects />;
      case "messages":
        return <InstagramMessages />;
      case "prospect":
        return <InstagramProspect />;
      case "analysis":
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <Button
                onClick={() => setActiveTab("dashboard")}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700"
                variant="ghost"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Análisis Detallado
            </h1>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <AdvancedMetrics />
            </div>
          </div>
        );
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
        return (
          <InstagramDashboard onShowAnalysis={() => setActiveTab("analysis")} />
        );
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

        {/* Main Content */}
        <div className="space-y-6">{renderContent()}</div>
      </div>
    </div>
  );
};

export default Index;
