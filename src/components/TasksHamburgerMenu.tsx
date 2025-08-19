import React, { useState } from 'react';
import { Menu, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TasksHamburgerMenuProps {
  onMenuClick: (option: string) => void;
}

const TasksHamburgerMenu: React.FC<TasksHamburgerMenuProps> = ({ onMenuClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { 
      id: 'icp', 
      label: 'ICP', 
      icon: Target,
      description: 'Dream Customer Radar'
    }
  ];

  const handleItemClick = (itemId: string) => {
    onMenuClick(itemId);
    setIsOpen(false);
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        aria-label="Menu de opciones"
      >
        <Menu className="w-6 h-6 text-gray-700" />
      </button>

      <div
        className={cn(
          "absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 transition-all duration-200",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0"
            >
              <Icon className="w-5 h-5 text-primary" />
              <div>
                <div className="font-medium text-gray-900">{item.label}</div>
                <div className="text-sm text-gray-500">{item.description}</div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Overlay para cerrar el menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default TasksHamburgerMenu;