
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  MessageCircle, 
  Users, 
  Settings,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InstagramDashboard from '@/components/InstagramDashboard';
import MyProspects from '@/components/MyProspects';
import InstagramProspect from '@/components/InstagramProspect';
import ConfigPanel from '@/components/ConfigPanel';

const Dashboard = () => {
  const { section } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(section || 'dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (section) {
      setActiveTab(section);
    }
  }, [section]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    navigate(`/dashboard/${tab}`);
    setMobileMenuOpen(false);
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3,
      description: 'Métricas y estadísticas generales'
    },
    { 
      id: 'my_prospects', 
      label: 'Mis Prospectos', 
      icon: Users,
      description: 'CRM y gestión de prospectos'
    },
    { 
      id: 'prospect', 
      label: 'Prospecta', 
      icon: Users,
      description: 'Herramientas de prospección'
    },
    { 
      id: 'settings', 
      label: 'Configuración', 
      icon: Settings,
      description: 'Ajustes y personalización'
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <InstagramDashboard />;
      case 'my_prospects':
        return <MyProspects />;
      case 'prospect':
        return <InstagramProspect />;
      case 'settings':
        return <ConfigPanel />;
      default:
        return <InstagramDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] bg-clip-text text-transparent">
                Hower Dashboard
              </h1>
              <p className="text-muted-foreground">
                {menuItems.find(item => item.id === activeTab)?.description}
              </p>
            </div>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="outline"
            size="sm"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className={cn(
            "w-full md:w-64 space-y-2",
            mobileMenuOpen ? "block" : "hidden md:block"
          )}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Navegación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeTab === item.id ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start h-auto p-3",
                        activeTab === item.id && "bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] text-white"
                      )}
                      onClick={() => handleTabChange(item.id)}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {item.description}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
