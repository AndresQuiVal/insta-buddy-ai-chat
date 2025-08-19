import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DreamCustomerRadar from '@/components/DreamCustomerRadar';

const DreamCustomerRadarGame: React.FC = () => {
  const navigate = useNavigate();

  // SEO
  useEffect(() => {
    document.title = 'Dream Customer Radar - Juego ICP | Hower Assistant';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Define tu Cliente Ideal (ICP) con el Dream Customer Radar. Analiza WHO, WHERE, BAIT y RESULT para obtener palabras de búsqueda precisas para prospección.';
      document.head.appendChild(m);
    } else {
      metaDesc.setAttribute('content', 'Define tu Cliente Ideal (ICP) con el Dream Customer Radar. Analiza WHO, WHERE, BAIT y RESULT para obtener palabras de búsqueda precisas para prospección.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <DreamCustomerRadar onBack={() => navigate('/dream-customer-radar-guide')} />
      </div>
    </div>
  );
};

export default DreamCustomerRadarGame;