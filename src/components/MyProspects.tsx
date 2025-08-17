
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InstagramMessages from '@/components/InstagramMessages';
import ProspectCRM from '@/components/ProspectCRM';
import AutoresponderManager from '@/components/AutoresponderManager';

const MyProspects = () => {
  const [activeTab, setActiveTab] = useState('autoresponder');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="prospects" className="hidden">Prospectos</TabsTrigger>
          <TabsTrigger value="messages" className="hidden">Mensajes</TabsTrigger>
          <TabsTrigger value="autoresponder">Autorespondedor</TabsTrigger>
        </TabsList>
        <TabsContent value="prospects" className="mt-6">
          <ProspectCRM />
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <InstagramMessages />
        </TabsContent>
        <TabsContent value="autoresponder" className="mt-6">
          <AutoresponderManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProspects;
