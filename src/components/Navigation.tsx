
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Navigation = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={cn(
      "flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300",
      collapsed ? "w-[70px]" : "w-[250px]"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-primary">Hower</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mx-auto">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex flex-col flex-1 py-4">
        <NavItem
          to="/"
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          collapsed={collapsed}
          active={true}
        />
        <NavItem
          to="/settings"
          icon={<Settings size={20} />}
          label="Configuración"
          collapsed={collapsed}
        />
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  active?: boolean;
}

const NavItem = ({ to, icon, label, collapsed, active }: NavItemProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center px-4 py-3 mb-1 mx-2 rounded-md text-gray-700",
        "hover:bg-gray-100 transition-colors duration-200",
        active && "bg-primary/10 text-primary"
      )}
    >
      <div className="flex items-center justify-center w-6">{icon}</div>
      {!collapsed && <span className="ml-3 font-medium">{label}</span>}
    </Link>
  );
};

export default Navigation;
