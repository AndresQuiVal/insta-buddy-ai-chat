import React from 'react';

const TasksToDo: React.FC = () => {
  return (
    <div className="min-h-screen bg-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <h1 className="text-2xl font-bold text-center mb-4">
            🎯 Tasks To Do - VERSIÓN SIMPLE
          </h1>
          
          <div className="bg-green-100 border border-green-400 rounded p-4 mb-4">
            <p className="text-green-800 font-medium">
              ✅ Esta página SÍ está funcionando
            </p>
            <p className="text-sm text-green-700 mt-2">
              Si ves esto, significa que el problema estaba en el código anterior
            </p>
          </div>
          
          <div className="bg-blue-50 rounded p-4">
            <h2 className="font-bold mb-2">Próximos pasos:</h2>
            <ul className="text-sm space-y-1">
              <li>• Confirmar que esta página se ve bien</li>
              <li>• Agregar funcionalidad paso a paso</li>
              <li>• Mantener el diseño original</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksToDo;