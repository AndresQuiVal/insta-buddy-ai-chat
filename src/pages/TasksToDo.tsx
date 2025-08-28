import React, { useEffect, useState } from 'react';
import { useInstagramUsers } from '@/hooks/useInstagramUsers';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import HowerService from '@/services/howerService';

const TasksToDo: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, loading: userLoading } = useInstagramUsers();

  // SOLO DEBUG - SIN LÓGICA ADICIONAL
  const [debugInfo, setDebugInfo] = useState('Iniciando...');
  const [renderCount, setRenderCount] = useState(0);
  
  useEffect(() => {
    console.log('🔥 TasksToDo montado - useEffect ejecutado');
    
    const updateDebug = () => {
      const info = {
        timestamp: new Date().toISOString(),
        renderCount: renderCount + 1,
        userLoading,
        currentUser: currentUser ? {
          id: currentUser.id,
          username: currentUser.username,
          instagram_user_id: currentUser.instagram_user_id
        } : 'null',
        localStorage: localStorage.getItem('hower-instagram-user') ? 'presente' : 'ausente',
        howerAuthenticated: HowerService.isAuthenticated(),
        route: window.location.pathname,
        href: window.location.href
      };
      
      console.log('📊 Debug info actualizada:', info);
      setDebugInfo(JSON.stringify(info, null, 2));
      setRenderCount(prev => prev + 1);
    };
    
    updateDebug();
    
    // Actualizar cada 2 segundos para ver cambios
    const interval = setInterval(updateDebug, 2000);
    
    return () => {
      console.log('🔥 TasksToDo desmontado');
      clearInterval(interval);
    };
  }, [currentUser, userLoading, renderCount]);

  console.log('🔥 Renderizando TasksToDo - Render #', renderCount);

  return (
    <div className="min-h-screen bg-red-500 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-black">🐛 DEBUG COMPLETO - TASKS TO DO</h1>
        <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
          <h2 className="text-lg font-semibold mb-4 text-red-600">Estado del Componente:</h2>
          <pre className="text-sm text-black whitespace-pre-wrap font-mono">{debugInfo}</pre>
        </div>
        <div className="mt-4 p-4 bg-blue-100 rounded">
          <p className="text-blue-800">
            <strong>Instrucciones:</strong> Esta página debe quedarse visible. Si desaparece, hay un problema con redirects o desmontaje del componente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TasksToDo;