
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import InstagramMessages from '@/components/InstagramMessages';
import ProspectCRM from '@/components/ProspectCRM';
import AutoresponderManager from '@/components/AutoresponderManager';
import ProspectTaskList from '@/components/ProspectTaskList';

const MyProspects = () => {
  const [activeTab, setActiveTab] = useState('tasks');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Tareas de Respuesta</TabsTrigger>
          <TabsTrigger value="autoresponder">Autorespondedor</TabsTrigger>
          <TabsTrigger value="prospects" className="hidden">Prospectos</TabsTrigger>
          <TabsTrigger value="messages" className="hidden">Mensajes</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks" className="mt-6">
          <ProspectTaskList />
        </TabsContent>
        <TabsContent value="autoresponder" className="mt-6">
          <AutoresponderManager />
        </TabsContent>
        <TabsContent value="prospects" className="mt-6">
          <ProspectCRM />
        </TabsContent>
        <TabsContent value="messages" className="mt-6">
          <InstagramMessages />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyProspects;
