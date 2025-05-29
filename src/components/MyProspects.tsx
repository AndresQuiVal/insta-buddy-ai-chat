import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InstagramMessages from '@/components/InstagramMessages';
import ProspectList from '@/components/ProspectList';

const MyProspects = () => {
  const [activeTab, setActiveTab] = useState('prospects');

  return (
    <div className="space-y-6">
      <Tabs defaultValue="prospects" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="prospects">Mis Prospectos</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
        </TabsList>
        <TabsContent value="prospects" className="mt-6">
          <ProspectList />
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <InstagramMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProspects; 