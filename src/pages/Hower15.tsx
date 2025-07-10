import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Search, MessageCircle, Zap, Target, TrendingUp, Users, Bot, ChevronDown, Plus } from "lucide-react";
import accountSearchFollowers from "@/assets/account-search-followers.gif";
import messageIdeas from "@/assets/message-ideas.gif";

const Hower15 = () => {
  const searchFeatures = [
    {
      title: "Buscador General",
      description: "Encuentra cuentas y publicaciones categorizadas por IA.",
      features: ["Resultados categorizados", "Más opciones disponibles", "Todo en un lugar"],
      gifUrl: "https://s14.gifyu.com/images/bKN4g.gif"
    },
    {
      title: "Buscar Seguidores", 
      description: "Encuentra cuentas específicas para prospectar sus seguidores.",
      features: ["Seguidores de cuentas relevantes", "Filtros inteligentes", "Acceso directo"],
      gifUrl: "https://s14.gifyu.com/images/bKN44.gif"
    },
    {
      title: "Buscar Comentarios",
      description: "Encuentra publicaciones para prospectar a quienes comentan.",
      features: ["Posts con más engagement", "Comentarios recientes", "Mejor conversión"],
      gifUrl: accountSearchFollowers
    }
  ];

  const messageFeatures = [
    {
      icon: <Bot className="h-8 w-8" />,
      title: "Mensajes Personalizados",
      subtitle: "IA que analiza perfiles",
      description: "La IA lee cada perfil y crea mensajes únicos. Menciona detalles específicos como fotos o intereses.",
      features: ["Análisis completo", "Mensajes únicos", "Conexión genuina"],
      gifUrl: "https://s14.gifyu.com/images/bKN41.gif",
      badge: "IA Avanzada"
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Ideas de Mensaje",
      subtitle: "Propuestas editables",
      description: "La IA genera ideas que puedes personalizar antes de enviar.",
      features: ["Ideas por IA", "100% editables", "Tu estilo personal"],
      gifUrl: messageIdeas,
      badge: "Flexible"
    }
  ];

  const manualMessageFeatures = [
    {
      icon: <MessageCircle className="h-8 w-8" />,
      title: "Mensajes Manuales",
      subtitle: "Interfaz renovada",
      description: "Nueva interfaz 10 veces más fácil para escribir tus mensajes personalizados.",
      features: ["Interfaz mejorada", "Más intuitiva", "Control total"],
      gifUrl: "https://s14.gifyu.com/images/bKN45.gif",
      badge: "Renovado"
    }
  ];

  useEffect(() => {
    // Load Wistia player script
    const playerScript = document.createElement('script');
    playerScript.src = 'https://fast.wistia.com/player.js';
    playerScript.async = true;
    document.head.appendChild(playerScript);

    // Load specific video scripts
    const videoScripts = [
      'https://fast.wistia.com/embed/uuiky8ycjs.js',
      'https://fast.wistia.com/embed/zgp1z14vbe.js', 
      'https://fast.wistia.com/embed/sdigf5ug4q.js'
    ];

    videoScripts.forEach(src => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.type = 'module';
      document.head.appendChild(script);
    });

    return () => {
      // Cleanup scripts on unmount
      const scripts = document.querySelectorAll('script[src*="wistia"]');
      scripts.forEach(script => script.remove());
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--hower-primary)/0.1),hsl(var(--hower-medium)/0.1))]" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-8">
              <img 
                src="/lovable-uploads/5393044d-68a0-4393-ba08-5df3f3adda61.png" 
                alt="Hower Logo" 
                className="h-16 mx-auto"
              />
            </div>

            <Badge className="mb-6 bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] text-white border-0 px-6 py-2 text-lg">
              Nueva Versión Disponible
            </Badge>
            
            <div className="mb-6">
              <span className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] bg-clip-text text-transparent">
                Hower{" "}
              </span>
              <span className="inline-block bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] text-white px-4 py-2 rounded-lg text-6xl md:text-7xl font-bold">
                1.5
              </span>
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              La evolución de la prospección inteligente. Nuevas funcionalidades impulsadas por IA 
              para encontrar y conectar con tus prospectos ideales de manera más eficiente que nunca.
            </p>

            {/* General Video - Large */}
            <div className="mb-8 max-w-2xl mx-auto">
              <wistia-player media-id="uuiky8ycjs" aspect="0.5787781350482315" style={{ width: '100%', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}></wistia-player>
            </div>
            
            <Button size="lg" className="bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] hover:opacity-90 text-white px-8 py-3 text-lg">
              <ChevronDown className="mr-2 h-5 w-5" />
              Ve las funcionalidades aquí abajo
            </Button>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Tres Funcionalidades Clave</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Search className="h-8 w-8" />, title: "Nuevo Buscador", subtitle: "Más Preciso" },
            { icon: <MessageCircle className="h-8 w-8" />, title: "Generar Mensajes", subtitle: "Con IA Avanzada" },
            { icon: <Plus className="h-8 w-8" />, title: "Y Más", subtitle: "Nuevas Cosas" }
          ].map((feature, index) => (
            <Card key={index} className="text-center border-2 hover:border-[hsl(var(--hower-primary))] transition-colors">
              <CardContent className="pt-8 pb-6">
                <div className="text-[hsl(var(--hower-primary))] mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <div className="text-2xl font-bold text-[hsl(var(--hower-primary))] mb-2">
                  {feature.title}
                </div>
                <div className="text-muted-foreground font-medium">
                  {feature.subtitle}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Search Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Nuevo Buscador de Cuentas
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Encuentra los mejores prospectos con inteligencia artificial
          </p>

          {/* Buscador Video - Small */}
          <div className="mt-8 max-w-lg mx-auto">
            <wistia-player media-id="zgp1z14vbe" aspect="0.5787781350482315" style={{ width: '100%', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}></wistia-player>
          </div>
        </div>

        <div className="space-y-16">
          {searchFeatures.map((feature, index) => (
            <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}>
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
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
                      style={{ maxHeight: '420px', objectFit: 'contain' }}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Nueva Manera de Crear Mensajes de Prospección
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Interfaz completamente renovada con nuevas funcionalidades inteligentes
          </p>
        </div>

        {/* Generación con IA Subsection */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Generación de Mensajes con IA</h3>
            <p className="text-lg text-muted-foreground">Dos formas inteligentes de crear mensajes perfectos</p>

            {/* Mensajes Video - Small */}
            <div className="mt-8 max-w-lg mx-auto">
              <wistia-player media-id="sdigf5ug4q" aspect="0.5787781350482315" style={{ width: '100%', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}></wistia-player>
            </div>
          </div>
          
          <div className="space-y-16">
            {messageFeatures.map((feature, index) => (
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
                    <h4 className="text-2xl font-bold mb-2">{feature.title}</h4>
                    <p className="text-lg text-[hsl(var(--hower-primary))] mb-4">{feature.subtitle}</p>
                    <p className="text-md text-muted-foreground leading-relaxed mb-6">
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
                        style={{ maxHeight: '420px', objectFit: 'contain' }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes Manuales Subsection */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Mensajes Manuales</h3>
            <p className="text-lg text-muted-foreground">Interfaz completamente renovada para mayor control</p>
          </div>
          
          <div className="space-y-16">
            {manualMessageFeatures.map((feature, index) => (
              <div key={index} className="flex flex-col lg:flex-row gap-12 items-center">
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
                    <h4 className="text-2xl font-bold mb-2">{feature.title}</h4>
                    <p className="text-lg text-[hsl(var(--hower-primary))] mb-4">{feature.subtitle}</p>
                    <p className="text-md text-muted-foreground leading-relaxed mb-6">
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
                        style={{ maxHeight: '420px', objectFit: 'contain' }}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-[hsl(var(--hower-primary))] to-[hsl(var(--hower-medium))] border-0 text-white">
          <CardContent className="text-center py-16 px-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Disponible Ya Mismo en tu Hower
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Todas estas funcionalidades ya están instaladas en tu aplicación. 
              Si aún no tienes Hower, puedes instalarlo ahora mismo.
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-white text-[hsl(var(--hower-primary))] hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
                onClick={() => window.open('https://chromewebstore.google.com/detail/hower-social-media-assist/fmjcnabglbobncbckgclmhnffljmjppi?authuser=0&hl=es-419', '_blank')}
              >
                Instalar Ahora
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Hower15;