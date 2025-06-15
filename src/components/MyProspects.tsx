
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InstagramMessages from '@/components/InstagramMessages';
import ProspectList from '@/components/ProspectList';
import AutoresponderManager from '@/components/AutoresponderManager';
import OpenAIKeyConfig from '@/components/OpenAIKeyConfig';

const MyProspects = () => {
  const [activeTab, setActiveTab] = useState('prospects');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mis Prospectos</h1>
        <OpenAIKeyConfig />
      </div>
      
      <Tabs defaultValue="prospects" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="prospects">Prospectos</TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="autoresponder">Autoresponder</TabsTrigger>
        </TabsList>
        <TabsContent value="prospects" className="mt-6">
          <ProspectList />
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
