import React, { useState } from 'react';
import { Menu, BarChart3, MessageCircle, Users, Settings, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExportDialog from './ExportDialog';

interface HamburgerMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ activeTab, onTabChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const menuItems = [
    { id: 'autoresponder', label: 'Autorespondedor', icon: MessageCircle },
    { id: 'prospecta', label: 'Prospecta', icon: Users },
    { id: 'export', label: 'Exportar', icon: Download },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
      >
        <Menu className="w-6 h-6 text-white" />
      </button>

      <div
        className={cn(
          "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-purple-100 transition-all duration-200",
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
        )}
      >
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'export') {
                  setShowExportDialog(true);
                } else {
                  onTabChange(item.id);
                }
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-purple-50 transition-colors",
                activeTab === item.id ? "bg-purple-50 text-purple-600" : "text-gray-700"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <ExportDialog 
        open={showExportDialog} 
        onOpenChange={setShowExportDialog} 
      />
    </div>
  );
};

export default HamburgerMenu; 