import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, MessageCircle, Zap, Target, TrendingUp, Users, Bot } from "lucide-react";
import accountSearchFollowers from "@/assets/account-search-followers.gif";
import messageIdeas from "@/assets/message-ideas.gif";

const Hower15 = () => {
  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Buscador de Cuentas Renovado",
      subtitle: "Encuentra los mejores prospectos con IA",
      description: "Nuevo buscador totalmente renovado que te ofrece más resultados categorizados por inteligencia artificial. Los mejores resultados aparecen primero, incluyendo cuentas para prospectar y publicaciones donde puedes contactar a quienes comentan.",
      features: [
        "Resultados categorizados por IA",
        "Más cuentas disponibles para prospectar",
        "Publicaciones con mayor engagement",
        "Botón directo para prospectar",
        "Todo en un solo lugar"
      ],
      gifUrl: "https://s14.gifyu.com/images/bKN44.gif",
      badge: "Nuevo"
    },
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Interfaz de Mensajes Renovada",
      subtitle: "10 veces más fácil de usar",
      description: "Interfaz completamente rediseñada para generar mensajes de prospección. Más intuitiva, más rápida y con IA integrada para crear mensajes precisos sin escribir mensaje por mensaje.",
      features: [
        "Interfaz 10x más intuitiva",
        "IA integrada para velocidad",
        "Sin escribir mensaje por mensaje",
        "Diseño más limpio y moderno"
      ],
      gifUrl: "https://s14.gifyu.com/images/bKN45.gif",
      badge: "Mejorado"
    },
    {
      icon: <Bot className="h-8 w-8" />,
      title: "Mensajes 100% Personalizados",
      subtitle: "IA que lee perfiles completos",
      description: "La IA analiza fotos, biografía y contenido de cada prospecto para crear mensajes únicos y específicos. Si ve un gatito en las fotos, mencionará el gatito. Mensajes de conexión, no de venta.",
      features: [
        "Análisis completo del perfil",
        "Mensajes únicos por prospecto",
        "Enfoque en conexión genuina",
        "Generación automática",
        "Sin edición manual necesaria"
      ],
      gifUrl: "https://s14.gifyu.com/images/bKN41.gif",
      badge: "IA Avanzada"
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Generador de Ideas de Mensaje",
      subtitle: "Ideas editables con IA",
      description: "La IA genera propuestas de mensajes que puedes editar antes de enviar. Perfecta combinación entre automatización y control personal para adaptar el mensaje a tu estilo.",
      features: [
        "Ideas generadas por IA",
        "100% editables",
        "Control total del contenido",
        "Adaptable a tu estilo",
        "Eficiencia y personalización"
      ],
      gifUrl: messageIdeas,
      badge: "Flexible"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--hower-primary)/0.1),hsl(var(--hower-medium)/0.1))]" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] text-white border-0 px-6 py-2 text-lg">
              Nueva Versión Disponible
            </Badge>
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] bg-clip-text text-transparent">
              Hower 1.5
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              La evolución de la prospección inteligente. Nuevas funcionalidades impulsadas por IA 
              para encontrar y conectar con tus prospectos ideales de manera más eficiente que nunca.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] hover:opacity-90 text-white px-8 py-3 text-lg">
                <Sparkles className="mr-2 h-5 w-5" />
                Explorar Funcionalidades
              </Button>
              <Button variant="outline" size="lg" className="border-[hsl(var(--hower-primary))] text-[hsl(var(--hower-primary))] hover:bg-[hsl(var(--hower-primary)/0.1)] px-8 py-3 text-lg">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: <Target className="h-8 w-8" />, title: "Más Precisión", value: "10x" },
            { icon: <TrendingUp className="h-8 w-8" />, title: "Mejor Conversión", value: "+300%" },
            { icon: <Users className="h-8 w-8" />, title: "Más Prospectos", value: "∞" },
            { icon: <Zap className="h-8 w-8" />, title: "Más Rápido", value: "5x" }
          ].map((stat, index) => (
            <Card key={index} className="text-center border-2 hover:border-[hsl(var(--hower-primary))] transition-colors">
              <CardContent className="pt-8 pb-6">
                <div className="text-[hsl(var(--hower-primary))] mb-4 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-[hsl(var(--hower-primary))] mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">
                  {stat.title}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Nuevas Funcionalidades
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubre las innovaciones que transformarán tu manera de hacer prospección en Instagram
          </p>
        </div>

        <div className="space-y-24">
          {features.map((feature, index) => (
            <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}>
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="text-[hsl(var(--hower-primary))]">
                    {feature.icon}
                  </div>
                  <Badge className="bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] text-white">
                    {feature.badge}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-3xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-xl text-[hsl(var(--hower-primary))] mb-4">{feature.subtitle}</p>
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>
                <div className="space-y-3">
                  {feature.features.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))]" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <Card className="overflow-hidden border-2 hover:border-[hsl(var(--hower-primary))] transition-colors">
                  <CardContent className="p-0">
                    <img 
                      src={feature.gifUrl} 
                      alt={feature.title}
                      className="w-full h-auto rounded-lg"
                      style={{ maxHeight: '500px', objectFit: 'cover' }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] border-0 text-white">
          <CardContent className="text-center py-16 px-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para la Nueva Era de Prospección?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Únete a miles de usuarios que ya están aprovechando el poder de Hower 1.5 
              para conseguir más prospectos y mejores resultados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-[hsl(var(--hower-primary))] hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                Comenzar Ahora
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white/10 px-8 py-3 text-lg"
              >
                Conocer Más
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Hower15;