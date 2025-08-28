import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TasksHamburgerMenuProps {
}

const TasksHamburgerMenu: React.FC<TasksHamburgerMenuProps> = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'icp', label: 'Editar mi ICP' },
    { id: 'autoresponder', label: 'Autoresponder' },
    { id: 'whatsapp', label: 'Configurar WhatsApp' },
    { id: 'prospector', label: 'Prospector' },
    { id: 'configuracion', label: 'Configuración' },
  ];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
      >
        <Menu className="w-6 h-6 text-purple-600" />
      </button>

      <div
        className={cn(
          "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-purple-100 transition-all duration-200",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'icp') {
                navigate('/icp-editor');
              } else if (item.id === 'autoresponder') {
                navigate('/');
              } else if (item.id === 'whatsapp') {
                navigate('/whatsapp-config');
              } else if (item.id === 'prospector') {
                navigate('/hower-prospector');
              } else if (item.id === 'configuracion') {
                navigate('/configuracion');
              }
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-purple-50 transition-colors text-gray-700"
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TasksHamburgerMenu;