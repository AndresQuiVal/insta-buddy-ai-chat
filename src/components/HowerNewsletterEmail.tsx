import React from 'react';

interface HowerNewsletterEmailProps {
  recipientName?: string;
}

export const HowerNewsletterEmail: React.FC<HowerNewsletterEmailProps> = ({ 
  recipientName = "Usuario"
}) => {
  return (
    <html>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>¡Hower 1.5 Ya Está Aquí!</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#f8f9fa', fontFamily: 'Arial, sans-serif' }}>
        <table role="presentation" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tr>
            <td style={{ padding: '40px 20px' }}>
              <table role="presentation" style={{ 
                width: '100%', 
                maxWidth: '600px', 
                margin: '0 auto', 
                backgroundColor: '#ffffff', 
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(122, 96, 255, 0.1)'
              }}>
                
                {/* Header */}
                <tr>
                  <td style={{
                    background: 'linear-gradient(135deg, #7a60ff, #8e1efc)',
                    borderRadius: '16px 16px 0 0',
                    padding: '40px 30px',
                    textAlign: 'center'
                  }}>
                    <img 
                      src="/lovable-uploads/5393044d-68a0-4393-ba08-5df3f3adda61.png" 
                      alt="Hower Logo" 
                      style={{ height: '50px', marginBottom: '20px' }}
                    />
                    <h1 style={{
                      color: '#ffffff',
                      fontSize: '36px',
                      fontWeight: 'bold',
                      margin: '0 0 10px 0',
                      lineHeight: '1.2'
                    }}>
                      ¡Hower <span style={{
                        backgroundColor: '#ffffff',
                        color: '#7a60ff',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        display: 'inline-block'
                      }}>1.5</span> Ya Está Aquí!
                    </h1>
                    <p style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '18px',
                      margin: '0',
                      lineHeight: '1.5'
                    }}>
                      La evolución de la prospección inteligente
                    </p>
                  </td>
                </tr>

                {/* Content */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    <h2 style={{
                      color: '#333333',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      margin: '0 0 20px 0',
                      textAlign: 'center'
                    }}>
                      Hola {recipientName},
                    </h2>
                    
                    <p style={{
                      color: '#666666',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 30px 0'
                    }}>
                      Estamos emocionados de presentarte <strong>Hower 1.5</strong>, la actualización más grande que hemos lanzado hasta ahora. 
                      Hemos renovado completamente la experiencia de prospección con nuevas funcionalidades impulsadas por inteligencia artificial.
                    </p>

                    {/* Features Grid */}
                    <table role="presentation" style={{ width: '100%', marginBottom: '30px' }}>
                      <tr>
                        <td style={{ width: '50%', padding: '0 10px 20px 0' }}>
                          <div style={{
                            backgroundColor: '#f8f9ff',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '2px solid #e8e3ff'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#7a60ff',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '15px'
                            }}>
                              🔍
                            </div>
                            <h3 style={{
                              color: '#7a60ff',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              margin: '0 0 8px 0'
                            }}>
                              Nuevo Buscador
                            </h3>
                            <p style={{
                              color: '#666666',
                              fontSize: '14px',
                              margin: '0',
                              lineHeight: '1.4'
                            }}>
                              Encuentra más prospectos con IA que categoriza los mejores resultados
                            </p>
                          </div>
                        </td>
                        <td style={{ width: '50%', padding: '0 0 20px 10px' }}>
                          <div style={{
                            backgroundColor: '#f8f9ff',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '2px solid #e8e3ff'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#8e1efc',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '15px'
                            }}>
                              🤖
                            </div>
                            <h3 style={{
                              color: '#8e1efc',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              margin: '0 0 8px 0'
                            }}>
                              Mensajes con IA
                            </h3>
                            <p style={{
                              color: '#666666',
                              fontSize: '14px',
                              margin: '0',
                              lineHeight: '1.4'
                            }}>
                              IA que crea mensajes únicos analizando cada perfil individual
                            </p>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ width: '50%', padding: '0 10px 0 0' }}>
                          <div style={{
                            backgroundColor: '#f8f9ff',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '2px solid #e8e3ff'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#957fff',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '15px'
                            }}>
                              ✨
                            </div>
                            <h3 style={{
                              color: '#957fff',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              margin: '0 0 8px 0'
                            }}>
                              Ideas de Mensaje
                            </h3>
                            <p style={{
                              color: '#666666',
                              fontSize: '14px',
                              margin: '0',
                              lineHeight: '1.4'
                            }}>
                              Propuestas de IA que puedes editar antes de enviar
                            </p>
                          </div>
                        </td>
                        <td style={{ width: '50%', padding: '0 0 0 10px' }}>
                          <div style={{
                            backgroundColor: '#f8f9ff',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '2px solid #e8e3ff'
                          }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#5f0099',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '15px'
                            }}>
                              📱
                            </div>
                            <h3 style={{
                              color: '#5f0099',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              margin: '0 0 8px 0'
                            }}>
                              Interfaz Renovada
                            </h3>
                            <p style={{
                              color: '#666666',
                              fontSize: '14px',
                              margin: '0',
                              lineHeight: '1.4'
                            }}>
                              10 veces más fácil de usar con diseño completamente nuevo
                            </p>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style={{
                      backgroundColor: '#7a60ff',
                      background: 'linear-gradient(135deg, #7a60ff, #8e1efc)',
                      padding: '25px',
                      borderRadius: '12px',
                      textAlign: 'center',
                      marginBottom: '30px'
                    }}>
                      <h3 style={{
                        color: '#ffffff',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        margin: '0 0 10px 0'
                      }}>
                        ¡Disponible Ahora Mismo!
                      </h3>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '16px',
                        margin: '0 0 20px 0'
                      }}>
                        Todas estas funcionalidades ya están en tu Hower. Si aún no lo tienes, instálalo ahora.
                      </p>
                      <a 
                        href="https://chromewebstore.google.com/detail/hower-social-media-assist/fmjcnabglbobncbckgclmhnffljmjppi?authuser=0&hl=es-419"
                        style={{
                          backgroundColor: '#ffffff',
                          color: '#7a60ff',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          display: 'inline-block',
                          marginRight: '15px'
                        }}
                      >
                        Instalar Hower
                      </a>
                      <a 
                        href="#"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#ffffff',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 'bold',
                          fontSize: '16px',
                          display: 'inline-block',
                          border: '2px solid rgba(255, 255, 255, 0.3)'
                        }}
                      >
                        Ver Funcionalidades
                      </a>
                    </div>

                    <p style={{
                      color: '#666666',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0 0 20px 0'
                    }}>
                      Esta actualización representa meses de trabajo para hacer que tu prospección sea más eficiente, inteligente y exitosa. 
                      <strong>Nunca ha sido tan fácil encontrar y conectar con tus prospectos ideales.</strong>
                    </p>

                    <p style={{
                      color: '#666666',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      margin: '0'
                    }}>
                      ¡Esperamos que disfrutes todas las nuevas funcionalidades!
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{
                    backgroundColor: '#f8f9fa',
                    padding: '30px',
                    borderRadius: '0 0 16px 16px',
                    textAlign: 'center'
                  }}>
                    <p style={{
                      color: '#999999',
                      fontSize: '14px',
                      margin: '0 0 10px 0'
                    }}>
                      Con cariño, el equipo de Hower 💜
                    </p>
                    <p style={{
                      color: '#cccccc',
                      fontSize: '12px',
                      margin: '0'
                    }}>
                      Hower - Tu asistente inteligente para Instagram
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
};

export default HowerNewsletterEmail;