import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2, CreditCard, Shield } from "lucide-react";
import howerLogo from "@/assets/hower-logo.png";

// TODO: Replace with your actual Mercado Pago Public Key
// Get it from: https://www.mercadopago.com.mx/developers/panel/app -> Credentials -> Public Key
const MERCADOPAGO_PUBLIC_KEY = "YOUR_PUBLIC_KEY_HERE";

type PaymentStatus = "idle" | "loading_sdk" | "ready" | "processing" | "approved" | "rejected" | "error";

declare global {
  interface Window {
    MercadoPago: any;
    cardPaymentBrickController: any;
  }
}

const CheckoutMercadoPago = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("loading_sdk");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const brickContainerRef = useRef<HTMLDivElement>(null);
  const brickInitialized = useRef(false);

  const AMOUNT = 200;
  const PRODUCT_TITLE = "Hower - Plan Personalizado";
  const PRODUCT_DESCRIPTION = "Acceso completo a Hower Software para automatizar tu prospección en Instagram";

  useEffect(() => {
    // Load Mercado Pago SDK script
    const loadMercadoPagoSDK = async () => {
      if (window.MercadoPago) {
        initializeBrick();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.mercadopago.com/js/v2";
      script.async = true;
      script.onload = () => {
        initializeBrick();
      };
      script.onerror = () => {
        setPaymentStatus("error");
        setErrorMessage("Error al cargar el SDK de Mercado Pago");
      };
      document.body.appendChild(script);
    };

    loadMercadoPagoSDK();

    return () => {
      // Cleanup brick on unmount
      if (window.cardPaymentBrickController) {
        window.cardPaymentBrickController.unmount();
      }
    };
  }, []);

  const initializeBrick = async () => {
    if (brickInitialized.current || !brickContainerRef.current) return;
    
    if (MERCADOPAGO_PUBLIC_KEY === "YOUR_PUBLIC_KEY_HERE") {
      setPaymentStatus("error");
      setErrorMessage("Falta configurar la Public Key de Mercado Pago");
      return;
    }

    try {
      brickInitialized.current = true;
      const mp = new window.MercadoPago(MERCADOPAGO_PUBLIC_KEY, {
        locale: "es-MX"
      });

      const bricksBuilder = mp.bricks();
      
      window.cardPaymentBrickController = await bricksBuilder.create(
        "cardPayment",
        "cardPaymentBrick_container",
        {
          initialization: {
            amount: AMOUNT,
          },
          customization: {
            paymentMethods: {
              maxInstallments: 12,
            },
            visual: {
              style: {
                theme: "default",
              },
            },
          },
          callbacks: {
            onReady: () => {
              setPaymentStatus("ready");
            },
            onSubmit: async (cardFormData: any) => {
              await handlePaymentSubmit(cardFormData);
            },
            onError: (error: any) => {
              console.error("Brick error:", error);
              toast({
                title: "Error",
                description: "Error en el formulario de pago",
                variant: "destructive",
              });
            },
          },
        }
      );
    } catch (error) {
      console.error("Error initializing brick:", error);
      setPaymentStatus("error");
      setErrorMessage("Error al inicializar el formulario de pago");
    }
  };

  const handlePaymentSubmit = async (formData: any) => {
    console.log("Payment form submitted:", formData);
    setPaymentStatus("processing");
    setErrorMessage("");

    try {
      const { data, error } = await supabase.functions.invoke("mercadopago-process-payment", {
        body: {
          token: formData.token,
          transaction_amount: AMOUNT,
          installments: formData.installments || 1,
          payment_method_id: formData.payment_method_id,
          payer_email: formData.payer?.email || "cliente@hower.app",
          description: PRODUCT_TITLE
        }
      });

      console.log("Payment response:", data, error);

      if (error) {
        throw new Error(error.message || "Error al procesar el pago");
      }

      if (data.success && data.status === "approved") {
        setPaymentStatus("approved");
        toast({
          title: "¡Pago exitoso!",
          description: "Tu pago ha sido procesado correctamente.",
        });
        setTimeout(() => {
          navigate("/thank-you");
        }, 2000);
      } else if (data.status === "rejected" || data.status === "cancelled") {
        setPaymentStatus("rejected");
        setErrorMessage(getStatusMessage(data.status_detail));
        toast({
          title: "Pago rechazado",
          description: getStatusMessage(data.status_detail),
          variant: "destructive",
        });
      } else {
        setPaymentStatus("ready");
        toast({
          title: "Pago pendiente",
          description: "Tu pago está siendo procesado.",
        });
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      setPaymentStatus("error");
      setErrorMessage(err.message || "Error al procesar el pago");
      toast({
        title: "Error",
        description: err.message || "Error al procesar el pago",
        variant: "destructive",
      });
    }
  };

  const getStatusMessage = (statusDetail: string): string => {
    const messages: Record<string, string> = {
      cc_rejected_bad_filled_card_number: "Número de tarjeta incorrecto",
      cc_rejected_bad_filled_date: "Fecha de vencimiento incorrecta",
      cc_rejected_bad_filled_other: "Datos de tarjeta incorrectos",
      cc_rejected_bad_filled_security_code: "Código de seguridad incorrecto",
      cc_rejected_blacklist: "Tu tarjeta no puede ser utilizada",
      cc_rejected_call_for_authorize: "Debes autorizar el pago con tu banco",
      cc_rejected_card_disabled: "Tu tarjeta está deshabilitada",
      cc_rejected_card_error: "Tu tarjeta no pudo procesar el pago",
      cc_rejected_duplicated_payment: "Ya realizaste un pago similar",
      cc_rejected_high_risk: "Tu pago fue rechazado por seguridad",
      cc_rejected_insufficient_amount: "Tu tarjeta no tiene fondos suficientes",
      cc_rejected_invalid_installments: "Tu tarjeta no permite esta cantidad de cuotas",
      cc_rejected_max_attempts: "Llegaste al límite de intentos permitidos",
      cc_rejected_other_reason: "Tu tarjeta no pudo procesar el pago",
    };
    return messages[statusDetail] || "Tu pago fue rechazado. Por favor intenta con otra tarjeta.";
  };

  const resetPayment = () => {
    setPaymentStatus("loading_sdk");
    setErrorMessage("");
    brickInitialized.current = false;
    if (window.cardPaymentBrickController) {
      window.cardPaymentBrickController.unmount();
    }
    setTimeout(() => {
      initializeBrick();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={howerLogo} alt="Hower" className="h-12" />
        </div>

        {/* Payment Card */}
        <Card className="border-2 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
              <CreditCard className="h-6 w-6 text-primary" />
              Checkout Seguro
            </CardTitle>
            <CardDescription className="text-base">
              {PRODUCT_DESCRIPTION}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Amount Display */}
            <div className="bg-primary/5 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total a pagar</p>
              <p className="text-4xl font-bold text-primary">${AMOUNT} MXN</p>
              <p className="text-sm text-muted-foreground mt-1">{PRODUCT_TITLE}</p>
            </div>

            {/* Loading SDK */}
            {paymentStatus === "loading_sdk" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Cargando formulario de pago...</p>
              </div>
            )}

            {/* Processing Payment */}
            {paymentStatus === "processing" && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg font-medium">Procesando tu pago...</p>
                <p className="text-sm text-muted-foreground">Por favor espera, no cierres esta página.</p>
              </div>
            )}

            {/* Payment Approved */}
            {paymentStatus === "approved" && (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <p className="text-xl font-bold text-green-600">¡Pago Exitoso!</p>
                <p className="text-sm text-muted-foreground mt-2">Redirigiendo...</p>
              </div>
            )}

            {/* Payment Rejected/Error */}
            {(paymentStatus === "rejected" || paymentStatus === "error") && (
              <div className="flex flex-col items-center justify-center py-6">
                <XCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-bold text-destructive">
                  {paymentStatus === "rejected" ? "Pago Rechazado" : "Error"}
                </p>
                <p className="text-sm text-muted-foreground text-center mt-2 mb-4">{errorMessage}</p>
                <Button onClick={resetPayment} variant="outline">
                  Intentar de nuevo
                </Button>
              </div>
            )}

            {/* Mercado Pago Card Payment Brick Container */}
            <div 
              id="cardPaymentBrick_container" 
              ref={brickContainerRef}
              className={paymentStatus === "ready" || paymentStatus === "loading_sdk" ? "" : "hidden"}
            />

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Pago seguro procesado por Mercado Pago</span>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-4">
          <Button variant="link" onClick={() => navigate(-1)} className="text-muted-foreground">
            ← Volver
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutMercadoPago;
