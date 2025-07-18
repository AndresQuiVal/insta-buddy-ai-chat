import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";

const PricingIncruises = () => {

  const plans = [
    {
      id: "3-months-incruises",
      title: "Plan 3 Meses",
      subtitle: "Comienza tu transformación",
      description: "Perfecto para iniciar tu estrategia de prospección",
      price: 63,
      duration: "3 meses",
      popular: false,
      icon: <Zap className="h-6 w-6" />,
      features: [
        "600 créditos de buscador",
        "800 créditos de Hower Messages IA",
        "Notificador WhatsApp - 2 veces x semana",
        "1 llamada exclusiva con enfoque en:",
        "• Marca personal",
        "• Mensajes de prospección", 
        "• Seguimientos",
        "Acceso temprano a nuevas funcionalidades"
      ],
      bonus: [
        "Hower Assistant (Gratis 1 mes)",
        "Hower WhatsApp (Gratis 1 mes)"
      ],
      savings: "Ahorras 15 días de costo de Hower + 5 NUEVAS herramientas"
    },
    {
      id: "6-months-incruises",
      title: "Plan 6 Meses",
      subtitle: "Acelera tu crecimiento",
      description: "El plan más popular para resultados consistentes",
      price: 125,
      duration: "6 meses",
      popular: true,
      icon: <Check className="h-6 w-6" />,
      features: [
        "1 mes completamente GRATIS de Hower",
        "1,350 créditos de buscador",
        "1,800 créditos de Hower Messages IA",
        "Notificador WhatsApp - 4 veces x semana",
        "3 llamadas exclusivas con Andrés:",
        "• Marca personal",
        "• Mensajes de prospección",
        "• Seguimientos",
        "Acceso temprano a nuevas funcionalidades"
      ],
      bonus: [
        "Hower Assistant (Gratis 3 meses)",
        "Hower WhatsApp (Gratis 3 meses)",
        "Mensajes de prospección de Roberto (actualizados diariamente)",
        "6 mentorías grabadas de Mihail Millet"
      ],
      savings: "1 mes gratis + 8 NUEVOS productos GRATUITOS"
    },
    {
      id: "12-months-incruises",
      title: "Plan 1 Año",
      subtitle: "Domina la prospección",
      description: "La inversión definitiva para transformar tu negocio",
      price: 249.99,
      duration: "12 meses",
      popular: false,
      icon: <Crown className="h-6 w-6" />,
      features: [
        "3,000 créditos de buscador",
        "2 meses GRATUITOS de Hower",
        "Playera EXCLUSIVA personalizada",
        "3,000 créditos Hower Messages IA",
        "Notificador WhatsApp - 4 veces x semana",
        "Fondo de Zoom EXCLUSIVO TOP 1%",
        "7 llamadas exclusivas con Andrés",
        "1 llamada EXCLUSIVA con Curtis Harding (+$1,000 USD valor)",
        "Acceso temprano a nuevas funcionalidades",
        "Mensajes adaptados a tu nicho (Roberto)",
        "6 mentorías de Mihail Millet"
      ],
      bonus: [
        "Hower Assistant (Gratis LIFETIME)",
        "Hower WhatsApp (Gratis LIFETIME)"
      ],
      savings: "Acceso de por vida + mentoría exclusiva de $1,000"
    }
  ];

  const handlePurchase = (planId: string) => {
    const stripeLinks = {
      "3-months-incruises": "https://buy.stripe.com/bJe6oG9gYbJA2eV9p63wQ0A",
      "6-months-incruises": "https://buy.stripe.com/00waEWeBi4h8bPvdFm3wQ0B", 
      "12-months-incruises": "https://buy.stripe.com/28EcN4eBi7tkdXDeJq3wQ0C"
    };
    
    const link = stripeLinks[planId as keyof typeof stripeLinks];
    if (link) {
      window.open(link, '_blank');
    } else {
      console.log(`Plan not found: ${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-hower-primary to-hower-medium text-white">
            Descuento Especial Incruises
          </Badge>
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/c0b3827b-3db7-4c68-b4ed-7745f1a18c28.png" 
              alt="Hower Logo" 
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-hower-primary to-hower-medium bg-clip-text text-transparent">
            Transforma tu Prospección
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Planes exclusivos para miembros de Incruises. Elige el plan perfecto para acelerar tu crecimiento con Hower. Herramientas de IA, mentorías exclusivas y acceso VIP a las mejores estrategias de prospección.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'border-2 border-hower-primary shadow-2xl shadow-hower-primary/20' 
                  : 'border border-border hover:border-hower-primary/50'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-hower-primary to-hower-medium text-white text-center py-2 text-sm font-semibold">
                  MÁS POPULAR
                </div>
              )}
              
              <CardHeader className={`text-center ${plan.popular ? 'pt-12' : 'pt-6'}`}>
                <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-r from-hower-primary to-hower-medium text-white w-fit">
                  {plan.icon}
                </div>
                <CardTitle className="text-2xl font-bold">{plan.title}</CardTitle>
                <CardDescription className="text-base">{plan.subtitle}</CardDescription>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-hower-primary">
                    ${plan.price}
                    <span className="text-lg text-muted-foreground font-normal"> USD</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{plan.duration}</div>
                  <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                    Descuento Incruises
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground text-center">
                  {plan.description}
                </p>

                {/* Features */}
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">Incluye:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-hower-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bonus */}
                <div>
                  <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    BONUS:
                  </h4>
                  <ul className="space-y-2">
                    {plan.bonus.map((bonus, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                        <span className="font-medium text-yellow-600">{bonus}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Savings */}
                <div className="bg-gradient-to-r from-hower-primary/10 to-hower-medium/10 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-hower-primary text-center">
                    {plan.savings}
                  </p>
                </div>

                <Button
                  onClick={() => handlePurchase(plan.id)}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80'
                      : 'bg-primary hover:bg-primary/90'
                  } text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200`}
                  size="lg"
                >
                  Obtener Plan {plan.title.split(' ')[1]}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="text-center mt-16 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-4">
            Más de 1,000 emprendedores ya transformaron su prospección con Hower
          </p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <span className="text-sm">• Garantía de 30 días</span>
            <span className="text-sm">• Soporte 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingIncruises;