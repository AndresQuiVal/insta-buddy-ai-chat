import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, Shield, UserCheck, Star } from "lucide-react";
import { useSearchParams } from "react-router-dom";

const PricingMonthly = () => {
  const [searchParams] = useSearchParams();
  const referralUsername = searchParams.get("username");

  const communitySubBullets = [
    "Llamadas 2 veces x semana: Aprender a usar Hower + tips y estrategias del Top 1% networker"
  ];

  const academySubBullets = [
    <>Curso de Marca Personal - impartido por <a href="https://www.instagram.com/mihailmillet" target="_blank" rel="noopener noreferrer" className="underline hover:text-hower-primary">Mihail Millet</a></>,
    "Curso de Mensajes de Prospección efectivos",
    "Curso de cómo responder a prospectos - Seguimientos",
    "Grabaciones de sesiones pasadas"
  ];

  const plans = [
    {
      id: "basic",
      title: "Plan Básico",
      subtitle: "Empieza tu prospección",
      description: "Ideal para quienes comienzan con Hower",
      price: 35,
      duration: "/ mes",
      popular: false,
      icon: <Zap className="h-6 w-6" />,
      features: [
        { text: "Acceso a Hower completo", subBullets: null },
        { text: "Tips por Correo 3 veces x semana c/ tips paso a paso de prospección", subBullets: null },
        { text: "Soporte por email", subBullets: null }
      ]
    },
    {
      id: "intermediate",
      title: "Plan Intermedio",
      subtitle: "Acelera tu crecimiento",
      description: "El plan más popular para resultados consistentes",
      price: 50,
      duration: "/ mes",
      popular: true,
      icon: <Star className="h-6 w-6" />,
      features: [
        { text: "Todo lo del Plan Básico", subBullets: null },
        { text: "Acceso temprano a nuevas funcionalidades", subBullets: null },
        { text: <>3 mentorías grabadas de <a href="https://www.instagram.com/mihailmillet" target="_blank" rel="noopener noreferrer" className="underline hover:text-hower-primary">mihailmillet</a></>, subBullets: null },
        { text: "Comunidad privada con +250 networkers de tu empresa MLM y otras!", subBullets: communitySubBullets },
        { text: "Academia de Hower, aprende los fundamentos de la prospección digital", subBullets: academySubBullets }
      ]
    },
    {
      id: "pro",
      title: "Plan Pro",
      subtitle: "Domina la prospección",
      description: "La inversión definitiva para transformar tu negocio",
      price: 99,
      duration: "/ mes",
      popular: false,
      icon: <Crown className="h-6 w-6" />,
      features: [
        { text: "Todo lo del Plan Intermedio", subBullets: null },
        { text: "Mensajes de prospección de Roberto (actualizados diariamente)", subBullets: null },
        { text: "Mensajes adaptados a tu nicho (Roberto)", subBullets: null },
        { text: "Soporte prioritario 24/7", subBullets: null },
        { text: "Acceso a todas las funcionalidades premium", subBullets: null }
      ]
    }
  ];

  const handlePurchase = (planId: string) => {
    const stripeLinks = {
      "basic": "https://buy.stripe.com/5kAeX678F6jk8bmaF6",
      "intermediate": "https://buy.stripe.com/dR68yI50x8rsdvG3cF",
      "pro": "https://buy.stripe.com/8wM16gakRfTU0IU5kL"
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
          {referralUsername && (
            <div className="flex justify-center mb-4">
              <Badge variant="secondary" className="text-sm px-4 py-2 bg-hower-primary/10 text-hower-primary border border-hower-primary/20">
                <UserCheck className="h-4 w-4 mr-2" />
                Referido por: {referralUsername}
              </Badge>
            </div>
          )}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-hower-primary to-hower-medium bg-clip-text text-transparent">
            Planes Mensuales
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Elige el plan perfecto para acelerar tu crecimiento con Hower. Flexibilidad mensual sin compromisos a largo plazo.
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
                    <span className="text-lg text-muted-foreground font-normal"> USD {plan.duration}</span>
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

                <Button
                  onClick={() => handlePurchase(plan.id)}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80'
                      : 'bg-primary hover:bg-primary/90'
                  } text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200`}
                  size="lg"
                >
                  Obtener {plan.title}
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
            <span className="text-sm">• Cancela cuando quieras</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingMonthly;
