import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Gift, Shield, UserCheck, Sparkles, Clock } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";

const PricingV2Discount = () => {
  const [searchParams] = useSearchParams();
  const referralUsername = searchParams.get("username");

  // Countdown timer - ends Monday January 20, 2025 at 23:59:59
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const endDate = new Date('2026-01-27T00:00:00');
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = endDate.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const communitySubBullets = [
    "Llamadas 2 veces x semana: Aprender a usar Hower + tips y estrategias del Top 1% networker"
  ];

  const academySubBullets = [
    "Curso de Marca Personal",
    "Curso de Mensajes de Prospección efectivos",
    "Curso de cómo responder a prospectos - Seguimientos",
    "Grabaciones de sesiones pasadas"
  ];

  const callSubBullets = [
    "Mensajes de prospección",
    "Estrategia de prospección personalizada a tu negocio"
  ];

  const plans = [
    {
      id: "3-months",
      title: "Plan 3 Meses",
      subtitle: "Comienza tu transformación",
      description: "Perfecto para iniciar tu estrategia de prospección",
      originalPrice: 88,
      discountedPrice: 68,
      duration: "3 meses",
      popular: false,
      icon: <Zap className="h-6 w-6" />,
      features: [
        { text: "Acceso temprano a nuevas funcionalidades", subBullets: null },
        { text: "3 mentorías grabadas", subBullets: null },
        { text: "Comunidad privada con +250 networkers de tu empresa MLM y otras!", subBullets: communitySubBullets },
        { text: "Tips por Correo 3 veces x semana c/ tips paso a paso de prospección", subBullets: null },
        { text: "Academia de Hower, aprende los fundamentos de la prospección digital", subBullets: academySubBullets }
      ],
      bonus: [
        { text: "1 llamada exclusiva con enfoque en:", subBullets: callSubBullets },
        { text: "50+ Plantillas de prospección (probadas en mercado)", subBullets: null },
        { text: "Video de 9 pasos para agendar llamadas (infalible)", subBullets: null },
        { text: "Guía Anti-Baneos Instagram (evita bloqueos al prospectar)", subBullets: null },
        { text: "Video: Bio magnética que atrae prospectos", subBullets: null },
        { text: "Lista de objeciones + IA entrenada para resolverlas", subBullets: null }
      ],
      savings: "Ahorras $20 USD + 6 bonuses extra (+387 networkers lograron 50+ prospectos en 2 semanas)"
    },
    {
      id: "6-months",
      title: "Plan 6 Meses",
      subtitle: "Acelera tu crecimiento",
      description: "El plan más popular para resultados consistentes",
      originalPrice: 175,
      discountedPrice: 130,
      duration: "6 meses",
      popular: true,
      icon: <Check className="h-6 w-6" />,
      features: [
        { text: "1 mes completamente GRATIS de Hower", subBullets: null },
        { text: "Acceso temprano a nuevas funcionalidades", subBullets: null },
        { text: "Mensajes de prospección de Roberto (actualizados diariamente)", subBullets: null },
        { text: "3 mentorías grabadas", subBullets: null },
        { text: "Comunidad privada con +250 networkers de tu empresa MLM y otras!", subBullets: communitySubBullets },
        { text: "Tips por Correo 3 veces x semana c/ tips paso a paso de prospección", subBullets: null },
        { text: "Academia de Hower, aprende los fundamentos de la prospección digital", subBullets: academySubBullets }
      ],
      bonus: [
        { text: "3 llamadas exclusivas:", subBullets: callSubBullets },
        { text: "50+ Plantillas de prospección (probadas en mercado)", subBullets: null },
        { text: "Video de 9 pasos para agendar llamadas (infalible)", subBullets: null },
        { text: "Guía Anti-Baneos Instagram (evita bloqueos al prospectar)", subBullets: null },
        { text: "Video: Bio magnética que atrae prospectos", subBullets: null },
        { text: "Lista de objeciones + IA entrenada para resolverlas", subBullets: null }
      ],
      savings: "Ahorras $40 USD + 8 bonuses extra (+241 networkers lograron 100+ prospectos en 1 mes)"
    },
    {
      id: "12-months",
      title: "Plan 1 Año",
      subtitle: "Domina la prospección",
      description: "La inversión definitiva para transformar tu negocio",
      originalPrice: 349.99,
      discountedPrice: 203,
      duration: "12 meses",
      popular: false,
      icon: <Crown className="h-6 w-6" />,
      features: [
        { text: "2 meses GRATUITOS de Hower", subBullets: null },
        { text: "Playera EXCLUSIVA personalizada", subBullets: null },
        { text: "Fondo de Zoom EXCLUSIVO TOP 1%", subBullets: null },
        
        { text: "Acceso temprano a nuevas funcionalidades", subBullets: null },
        { text: "Mensajes adaptados a tu nicho (Roberto)", subBullets: null },
        { text: "3 mentorías grabadas", subBullets: null },
        { text: "Comunidad privada con +250 networkers de tu empresa MLM y otras!", subBullets: communitySubBullets },
        { text: "Tips por Correo 3 veces x semana c/ tips paso a paso de prospección", subBullets: null },
        { text: "Academia de Hower, aprende los fundamentos de la prospección digital", subBullets: academySubBullets }
      ],
      bonus: [
        { text: "7 llamadas exclusivas:", subBullets: callSubBullets },
        { text: "50+ Plantillas de prospección (probadas en mercado)", subBullets: null },
        { text: "Video de 9 pasos para agendar llamadas (infalible)", subBullets: null },
        { text: "Guía Anti-Baneos Instagram (evita bloqueos al prospectar)", subBullets: null },
        { text: "Video: Bio magnética que atrae prospectos", subBullets: null },
        { text: "Lista de objeciones + IA entrenada para resolverlas", subBullets: null }
      ],
      savings: "Ahorras $82 USD"
    }
  ];

  const handlePurchase = (planId: string) => {
    const stripeLinks = {
      "3-months": "https://buy.stripe.com/bJe6oG9gYbJA2eV9p63wQ0A",
      "6-months": "https://buy.stripe.com/00w7sK1Ow9BsaLr44M3wQ0D", 
      "12-months": "https://buy.stripe.com/28EcN4eBi7tkdXDeJq3wQ0C"
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
          <div className="flex justify-center mb-6">
            <img 
              src="/lovable-uploads/c0b3827b-3db7-4c68-b4ed-7745f1a18c28.png" 
              alt="Hower Logo" 
              className="h-16 w-auto"
            />
          </div>
          
          {/* Discount Banner */}
          <div className="flex justify-center mb-6">
            <Badge className="text-lg px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-lg animate-pulse">
              E Legacy 🤝 Hower
            </Badge>
          </div>

          {/* Countdown Timer */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-4 shadow-2xl">
              <div className="flex items-center gap-2 text-white mb-2 justify-center">
                <Clock className="h-5 w-5" />
                <span className="text-sm font-semibold">¡Oferta termina en!</span>
              </div>
              <div className="flex gap-3 text-white">
                <div className="flex flex-col items-center bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-3xl font-bold">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-xs uppercase">Días</span>
                </div>
                <div className="flex flex-col items-center bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-3xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-xs uppercase">Horas</span>
                </div>
                <div className="flex flex-col items-center bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-3xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-xs uppercase">Min</span>
                </div>
                <div className="flex flex-col items-center bg-white/20 rounded-lg px-4 py-2">
                  <span className="text-3xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-xs uppercase">Seg</span>
                </div>
              </div>
            </div>
          </div>

          {referralUsername && (
            <div className="flex justify-center mb-4">
              <Badge variant="secondary" className="text-sm px-4 py-2 bg-hower-primary/10 text-hower-primary border border-hower-primary/20">
                <UserCheck className="h-4 w-4 mr-2" />
                Referido por: {referralUsername}
              </Badge>
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-hower-primary to-hower-medium bg-clip-text text-transparent">
            Transforma tu Prospección
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Elige el plan perfecto para acelerar tu crecimiento con Hower. Herramientas de IA, mentorías exclusivas y acceso VIP a las mejores estrategias de prospección.
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
                  {/* Original Price - Crossed out */}
                  <div className="text-xl text-muted-foreground line-through">
                    ${plan.originalPrice} USD
                  </div>
                  {/* Discounted Price */}
                  <div className="text-4xl font-bold text-hower-primary">
                    ${plan.discountedPrice}
                    <span className="text-lg text-muted-foreground font-normal"> USD</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{plan.duration}</div>
                  {/* Discount Badge */}
                  <Badge className="mt-2 bg-red-500/10 text-red-600 border-red-500/20">
                    Ahorras ${(plan.originalPrice - plan.discountedPrice).toFixed(0)} USD
                  </Badge>
                  {/* Months saved badge */}
                  <div className="mt-2">
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      {plan.id === "3-months" && "🎁 Ahorras casi 1 mes"}
                      {plan.id === "6-months" && "🎁 Ahorras casi 2 meses"}
                      {plan.id === "12-months" && "🎁 Ahorras 3 meses"}
                    </Badge>
                  </div>
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
                      <li key={i}>
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-hower-primary shrink-0 mt-0.5" />
                          <span>{feature.text}</span>
                        </div>
                        {feature.subBullets && (
                          <ul className="ml-6 mt-1 space-y-1">
                            {feature.subBullets.map((sub, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <span className="text-hower-primary">•</span>
                                <span>{sub}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bonus */}
                <div>
                  <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Gift className="h-4 w-4 text-yellow-500" />
                    BONUS:
                  </h4>
                  <ul className="space-y-2">
                    {plan.bonus.map((bonus, i) => (
                      <li key={i}>
                        <div className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-yellow-600">{bonus.text}</span>
                        </div>
                        {bonus.subBullets && (
                          <ul className="ml-6 mt-1 space-y-1">
                            {bonus.subBullets.map((sub, j) => (
                              <li key={j} className="flex items-start gap-2 text-xs text-yellow-600/80">
                                <span className="text-yellow-500">•</span>
                                <span>{sub}</span>
                              </li>
                            ))}
                          </ul>
                        )}
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

        {/* Guarantee Section */}
        <div className="max-w-3xl mx-auto mt-16 animate-fade-in">
          <Card className="border-2 border-green-500/30 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-green-700 dark:text-green-400 mb-4">
                ✅ Garantía Completa
              </h3>
              <p className="text-lg text-muted-foreground mb-4">
                Si no consigues una respuesta en 7 días, <strong className="text-green-600">te devolvemos tu dinero.</strong>
              </p>
              <p className="text-base text-muted-foreground mb-4">
                Además, ya tienes <strong>3 meses de acceso gratuito</strong> incluidos.
              </p>
              <a 
                href="https://www.howersoftware.io/clients/refund-policy/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-700 underline"
              >
                Ver políticas de garantía
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Trust indicators */}
        <div className="text-center mt-16 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-4">
            Más de 1,000 emprendedores ya transformaron su prospección con Hower
          </p>
          <div className="flex justify-center items-center gap-8 opacity-60">
            <span className="text-sm">• Garantía de 7 días</span>
            <span className="text-sm">• Soporte 24/7</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingV2Discount;
