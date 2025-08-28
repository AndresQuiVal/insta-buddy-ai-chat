import React from 'react';

const TasksToDo: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-4">
      <h1 className="text-2xl font-bold text-black mb-4">Tareas de Hoy</h1>
      <p className="text-black">Esta página funciona correctamente.</p>
      
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-bold mb-2">Test básico</h2>
        <p>Si puedes ver este texto, el componente se está renderizando.</p>
      </div>
    </div>
  );
};

export default TasksToDo;