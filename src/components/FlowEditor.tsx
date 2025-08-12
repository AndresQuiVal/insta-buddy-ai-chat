import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Handle,
  Position,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { MessageCircle, MousePointer, GitBranch, Send, Trash2, Instagram } from 'lucide-react';

// Custom Node Types
const AutoresponderNode = ({ data, id }: { data: any; id: string }) => {
  const { deleteElements } = useReactFlow();
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <Card className="min-w-[250px] shadow-lg border-2 border-primary/20 group relative">
      {id !== '1' && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full"
          onClick={handleDelete}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Mensaje Automático {id === '1' && '(Inicial)'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground mb-2">
          {data.message?.substring(0, 50) || 'Nuevo mensaje'}...
        </div>
        <div className="flex justify-between text-xs">
          <span>Keywords: {data.keywords?.length || 0}</span>
          <span className={`px-2 py-1 rounded ${data.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {data.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const ButtonNode = ({ data, id }: { data: any; id: string }) => {
  const { deleteElements } = useReactFlow();
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <Card className="min-w-[200px] shadow-lg border-2 border-blue-500/20 group relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full"
        onClick={handleDelete}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <MousePointer className="w-4 h-4" />
          Botón Interactivo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs mb-2">
          <strong>Texto:</strong> {data.buttonText || 'Nuevo botón'}
        </div>
        <div className="text-xs">
          <strong>Tipo:</strong> {data.buttonType === 'url' ? 'URL' : 'Respuesta'}
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const ConditionNode = ({ data, id }: { data: any; id: string }) => {
  const { deleteElements } = useReactFlow();
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <Card className="min-w-[200px] shadow-lg border-2 border-yellow-500/20 group relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full"
        onClick={handleDelete}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Condición
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs mb-2">
          <strong>Tipo:</strong> {data.conditionType === 'keyword' ? 'Palabra Clave' : data.conditionType === 'random' ? 'Aleatorio' : 'Palabra Clave'}
        </div>
        {(data.conditionType === 'keyword' || !data.conditionType) && data.conditionKeywords && (
          <div className="text-xs text-muted-foreground mb-2">
            <strong>Palabras:</strong> {data.conditionKeywords.substring(0, 30)}...
          </div>
        )}
        {data.condition && !data.conditionType && (
          <div className="text-xs text-muted-foreground mb-2">
            {data.condition.substring(0, 40)}...
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-xs text-green-600">✓ Sí</span>
          <span className="text-xs text-red-600">✗ No</span>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Left} id="yes" />
      <Handle type="source" position={Position.Right} id="no" />
    </Card>
  );
};

const InstagramMessageNode = ({ data, id }: { data: any; id: string }) => {
  const { deleteElements } = useReactFlow();
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <Card className="min-w-[200px] shadow-lg border-2 border-purple-500/20 group relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full"
        onClick={handleDelete}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Instagram className="w-4 h-4" />
          Mensaje Instagram
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs text-muted-foreground mb-2">
          {data.message?.substring(0, 40) || 'Nuevo mensaje de Instagram'}...
        </div>
        <div className="text-xs">
          <span className={`px-2 py-1 rounded ${data.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {data.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const ActionNode = ({ data, id }: { data: any; id: string }) => {
  const { deleteElements } = useReactFlow();
  
  const handleDelete = () => {
    deleteElements({ nodes: [{ id }] });
  };

  return (
    <Card className="min-w-[200px] shadow-lg border-2 border-green-500/20 group relative">
      <Button
        variant="ghost"
        size="sm"
        className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-full"
        onClick={handleDelete}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Send className="w-4 h-4" />
          Acción
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-xs">
          {data.actionType || 'Nueva acción'}
        </div>
      </CardContent>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

const nodeTypes: NodeTypes = {
  autoresponder: AutoresponderNode,
  button: ButtonNode,
  condition: ConditionNode,
  action: ActionNode,
  instagramMessage: InstagramMessageNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'autoresponder',
    position: { x: 250, y: 50 },
    data: {
      message: 'Hola! Gracias por contactarnos. ¿En qué podemos ayudarte?',
      keywords: ['hola', 'ayuda', 'info'],
      active: true
    },
  },
];

const initialEdges: Edge[] = [];

interface FlowEditorProps {
  isOpen: boolean;
  onClose: () => void;
  autoresponderData?: any;
  onSave: (flowData: any) => void;
}

export const FlowEditor: React.FC<FlowEditorProps> = ({
  isOpen,
  onClose,
  autoresponderData,
  onSave
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeType, setSelectedNodeType] = useState<string>('autoresponder');

  // Node configuration dialogs
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [configNodeData, setConfigNodeData] = useState<any>(null);
  const [configNodeId, setConfigNodeId] = useState<string>('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: selectedNodeType,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: getDefaultNodeData(selectedNodeType),
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes.length, selectedNodeType, setNodes]);

  const getDefaultNodeData = (type: string) => {
    switch (type) {
      case 'autoresponder':
        return {
          message: 'Nuevo mensaje automático',
          keywords: [],
          active: true
        };
      case 'button':
        return {
          buttonText: 'Botón',
          buttonType: 'postback',
          buttonUrl: '',
          postbackPayload: 'BUTTON_CLICKED'
        };
      case 'condition':
        return {
          condition: 'Nueva condición',
          conditionType: 'keyword',
          conditionKeywords: ''
        };
      case 'instagramMessage':
        return {
          message: 'Nuevo mensaje de Instagram',
          active: true
        };
      case 'action':
        return {
          actionType: 'Enviar mensaje'
        };
      default:
        return {};
    }
  };

  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setConfigNodeId(node.id);
    setConfigNodeData({ ...node.data });
    setIsConfigDialogOpen(true);
  }, []);

  const saveNodeConfig = () => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === configNodeId) {
          return {
            ...node,
            data: configNodeData,
          };
        }
        return node;
      })
    );
    setIsConfigDialogOpen(false);
    setConfigNodeData(null);
    setConfigNodeId('');
  };

  const handleSaveFlow = () => {
    const flowData = {
      nodes,
      edges,
      autoresponderData
    };
    onSave(flowData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
        <div className="flex h-full">
          {/* Toolbar */}
          <div className="w-64 bg-gray-50 p-4 border-r overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle>Editor de Flujos</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Agregar Elementos</Label>
                <div className="grid grid-cols-1 gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeType('autoresponder');
                      addNode();
                    }}
                    className="justify-start"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Autoresponder
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeType('button');
                      addNode();
                    }}
                    className="justify-start"
                  >
                    <MousePointer className="w-4 h-4 mr-2" />
                    Botón
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeType('condition');
                      addNode();
                    }}
                    className="justify-start"
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Condición
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeType('instagramMessage');
                      addNode();
                    }}
                    className="justify-start"
                  >
                    <Instagram className="w-4 h-4 mr-2" />
                    Mensaje Instagram
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedNodeType('action');
                      addNode();
                    }}
                    className="justify-start"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Acción
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-2">
                  💡 Haz doble clic en cualquier elemento para configurarlo
                </p>
                <p className="text-xs text-muted-foreground">
                  🔗 Arrastra desde los puntos de conexión para unir elementos
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t space-y-2">
              <Button onClick={handleSaveFlow} className="w-full">
                Guardar Flujo
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                Cancelar
              </Button>
            </div>
          </div>

          {/* Flow Canvas */}
          <div className="flex-1 bg-white">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDoubleClick={handleNodeDoubleClick}
              nodeTypes={nodeTypes}
              fitView
              style={{ backgroundColor: "#F7F9FB" }}
            >
              <Controls />
              <MiniMap />
              <Background gap={12} size={1} />
            </ReactFlow>
          </div>
        </div>

        {/* Configuration Dialog */}
        <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configurar Elemento</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Instagram Message Node Configuration */}
              {(configNodeData?.message !== undefined && configNodeData?.active !== undefined && configNodeData?.keywords === undefined) && (
                <>
                  <div>
                    <Label htmlFor="instagramMessage">Mensaje de Instagram</Label>
                    <Textarea
                      id="instagramMessage"
                      value={configNodeData.message || ''}
                      onChange={(e) => setConfigNodeData({...configNodeData, message: e.target.value})}
                      placeholder="Escribe el mensaje de Instagram..."
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="instagramActive"
                      checked={configNodeData.active || false}
                      onChange={(e) => setConfigNodeData({...configNodeData, active: e.target.checked})}
                    />
                    <Label htmlFor="instagramActive">Activo</Label>
                  </div>
                </>
              )}

              {/* Autoresponder Node Configuration */}
              {(configNodeData?.message !== undefined && configNodeData?.keywords !== undefined) && (
                <>
                  <div>
                    <Label htmlFor="message">Mensaje</Label>
                    <Textarea
                      id="message"
                      value={configNodeData.message || ''}
                      onChange={(e) => setConfigNodeData({...configNodeData, message: e.target.value})}
                      placeholder="Escribe tu mensaje automático..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="keywords">Palabras Clave (separadas por coma)</Label>
                    <Input
                      id="keywords"
                      value={configNodeData.keywords?.join(', ') || ''}
                      onChange={(e) => setConfigNodeData({...configNodeData, keywords: e.target.value.split(',').map((k: string) => k.trim())})}
                      placeholder="hola, info, ayuda"
                    />
                  </div>
                </>
              )}
              
              {configNodeData?.buttonText !== undefined && (
                <>
                  <div>
                    <Label htmlFor="buttonText">Texto del Botón</Label>
                    <Input
                      id="buttonText"
                      value={configNodeData.buttonText || ''}
                      onChange={(e) => setConfigNodeData({...configNodeData, buttonText: e.target.value})}
                      placeholder="Texto del botón"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buttonType">Tipo de Botón</Label>
                    <Select
                      value={configNodeData.buttonType || 'postback'}
                      onValueChange={(value) => setConfigNodeData({...configNodeData, buttonType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postback">Respuesta Automática</SelectItem>
                        <SelectItem value="url">URL Externa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {configNodeData.buttonType === 'url' && (
                    <div>
                      <Label htmlFor="buttonUrl">URL del Botón</Label>
                      <Input
                        id="buttonUrl"
                        value={configNodeData.buttonUrl || ''}
                        onChange={(e) => setConfigNodeData({...configNodeData, buttonUrl: e.target.value})}
                        placeholder="https://ejemplo.com"
                      />
                    </div>
                  )}
                </>
              )}

              {configNodeData?.condition !== undefined && (
                <>
                  <div>
                    <Label htmlFor="conditionType">Tipo de Condición</Label>
                    <Select
                      value={configNodeData.conditionType || 'keyword'}
                      onValueChange={(value) => setConfigNodeData({...configNodeData, conditionType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo de condición" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keyword">Por Palabra Clave</SelectItem>
                        <SelectItem value="random">Aleatorio (50/50)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {configNodeData.conditionType === 'keyword' && (
                    <div>
                      <Label htmlFor="keywords">Palabras Clave (separadas por coma)</Label>
                      <Input
                        id="keywords"
                        value={configNodeData.conditionKeywords || ''}
                        onChange={(e) => setConfigNodeData({...configNodeData, conditionKeywords: e.target.value})}
                        placeholder="sí, ok, acepto, continuar"
                      />
                    </div>
                  )}
                  {configNodeData.conditionType === 'random' && (
                    <div className="text-sm text-muted-foreground">
                      Esta condición dividirá aleatoriamente las respuestas 50/50 entre las dos salidas.
                    </div>
                  )}
                </>
              )}

              {configNodeData?.actionType !== undefined && (
                <>
                  <div>
                    <Label htmlFor="actionType">Tipo de Acción</Label>
                    <Select
                      value={configNodeData.actionType || 'send_message'}
                      onValueChange={(value) => setConfigNodeData({...configNodeData, actionType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar acción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="send_message">Enviar Mensaje</SelectItem>
                        <SelectItem value="add_tag">Agregar Etiqueta</SelectItem>
                        <SelectItem value="remove_tag">Quitar Etiqueta</SelectItem>
                        <SelectItem value="notify_human">Notificar Humano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {configNodeData.actionType === 'send_message' && (
                    <div>
                      <Label htmlFor="actionMessage">Mensaje a Enviar</Label>
                      <Textarea
                        id="actionMessage"
                        value={configNodeData.actionMessage || ''}
                        onChange={(e) => setConfigNodeData({...configNodeData, actionMessage: e.target.value})}
                        placeholder="Escribe el mensaje..."
                        rows={3}
                      />
                    </div>
                  )}
                  {(configNodeData.actionType === 'add_tag' || configNodeData.actionType === 'remove_tag') && (
                    <div>
                      <Label htmlFor="tagName">Nombre de la Etiqueta</Label>
                      <Input
                        id="tagName"
                        value={configNodeData.tagName || ''}
                        onChange={(e) => setConfigNodeData({...configNodeData, tagName: e.target.value})}
                        placeholder="nombre-etiqueta"
                      />
                    </div>
                  )}
                </>
              )}

            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveNodeConfig}>
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};