
# Plan: Integrar Checkout Integrado de Mercado Pago

## Resumen

Crearemos una página de checkout donde el usuario vea el monto a pagar ($200 MXN) e ingrese los datos de su tarjeta directamente en tu app, sin redirecciones externas. Mercado Pago procesará el pago y el webhook manejará la lógica post-pago.

## Arquitectura

```text
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  /checkout-mercadopago                                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  - Muestra monto: $200 MXN                              │   │
│  │  - Formulario de tarjeta (Checkout Bricks)              │   │
│  │  - SDK: @mercadopago/sdk-react                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Token de tarjeta
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EDGE FUNCTION                                │
│  mercadopago-process-payment                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  - Recibe: token, monto, email, installments            │   │
│  │  - Llama a API Mercado Pago: POST /v1/payments          │   │
│  │  - Retorna: status del pago (approved/rejected)         │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       WEBHOOK                                    │
│  mercadopago-webhook (ya existe)                                │
│  - Recibe notificaciones de pagos                               │
│  - Puede agregar lógica adicional (enviar email, activar plan)  │
└─────────────────────────────────────────────────────────────────┘
```

## Cambios a Implementar

### 1. Instalar dependencia
- Agregar `@mercadopago/sdk-react` al proyecto

### 2. Agregar Secret (Public Key)
- Se requiere `MERCADOPAGO_PUBLIC_KEY` (diferente al Access Token)
- La Public Key es segura para usar en frontend
- Se obtiene del mismo panel de Mercado Pago

### 3. Nueva página: `/checkout-mercadopago`
**Archivo:** `src/pages/CheckoutMercadoPago.tsx`

Contendrá:
- Logo de Hower
- Monto a cobrar: $200 MXN
- Descripción del producto
- Componente `CardPayment` de Mercado Pago Bricks
- Manejo de estados: loading, éxito, error

### 4. Nueva Edge Function: `mercadopago-process-payment`
**Archivo:** `supabase/functions/mercadopago-process-payment/index.ts`

Responsabilidades:
- Recibir token de tarjeta desde el frontend
- Crear el pago llamando a `POST https://api.mercadopago.com/v1/payments`
- Retornar status del pago

### 5. Actualizar rutas
**Archivo:** `src/App.tsx`
- Agregar ruta `/checkout-mercadopago`

### 6. Actualizar webhook existente (opcional)
**Archivo:** `supabase/functions/mercadopago-webhook/index.ts`
- Agregar lógica post-pago (enviar email, activar suscripción, etc.)

## Detalles Técnicos

### Frontend - Componente de Pago
```typescript
// Inicializar SDK con Public Key
initMercadoPago('TU_PUBLIC_KEY');

// Componente CardPayment
<CardPayment
  initialization={{ amount: 200 }}
  onSubmit={async (data) => {
    // Enviar a edge function para procesar
    const response = await supabase.functions.invoke('mercadopago-process-payment', {
      body: {
        token: data.token,
        transaction_amount: 200,
        installments: data.installments,
        payment_method_id: data.payment_method_id,
        payer_email: data.payer.email
      }
    });
  }}
/>
```

### Edge Function - Procesar Pago
```typescript
// POST a la API de Mercado Pago
const payment = await fetch('https://api.mercadopago.com/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'X-Idempotency-Key': crypto.randomUUID()
  },
  body: JSON.stringify({
    transaction_amount: 200,
    token: cardToken,
    description: 'Hower - Plan Personalizado',
    installments: 1,
    payment_method_id: 'visa',
    payer: { email: payerEmail }
  })
});
```

## Requisitos del Usuario

Para continuar necesito que obtengas tu **Public Key** de Mercado Pago:

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.mx/developers/panel/app)
2. Selecciona tu aplicación
3. En "Credenciales de producción" copia la **Public Key**
4. Avísame cuando la tengas lista

La Public Key es diferente al Access Token:
- **Access Token** (ya configurado): Se usa en el backend para procesar pagos
- **Public Key** (necesaria): Se usa en el frontend para tokenizar tarjetas

## Resultado Final

Una página `/checkout-mercadopago` donde:
1. El usuario ve "$200 MXN - Hower Plan Personalizado"
2. Ingresa datos de su tarjeta directamente en el formulario
3. El pago se procesa sin salir de tu app
4. Si es aprobado, se redirige a `/thank-you`
5. El webhook puede ejecutar lógica adicional
