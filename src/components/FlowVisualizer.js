import React, { useCallback, useRef, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Button, Tooltip } from '@mui/material';
import { CenterFocusStrong, Download } from '@mui/icons-material';

import GranularNode from './NodeTypes/GranularNode';
import RemoveButtonNode from './NodeTypes/RemoveButtonNode';
import DragHandleNode from './NodeTypes/DragHandleNode';
import EdgeLegend from './EdgeLegend';

const customStyles = `
  .react-flow__edge {
    z-index: 9999 !important;
  }
  .react-flow__edge.selected {
    z-index: 10000 !important;
  }
  .react-flow__edge-path {
    z-index: 9999 !important;
  }
  .react-flow__edge.animated .react-flow__edge-path {
    z-index: 9999 !important;
  }
  
  /* Global font size increases */
  .react-flow__node {
    font-size: 14px;
  }
  .react-flow__attribution {
    font-size: 12px;
  }
  .react-flow__controls button {
    font-size: 14px;
  }
  
  /* Only allow system groups to be dragged */
  .react-flow__node-group:not([data-id*="system-group"]) {
    pointer-events: none !important;
  }
  
  /* Allow clicks on content inside non-system groups */
  .react-flow__node-group:not([data-id*="system-group"]) * {
    pointer-events: auto;
  }
  
  /* Hide default handles on non-granular nodes */
  .react-flow__handle {
    opacity: 0;
    pointer-events: none;
  }
  
  /* But keep handles visible for granular nodes */
  .react-flow__node-granularNode .react-flow__handle {
    opacity: 1;
    pointer-events: all;
  }
  
  /* Important fix for the remove button */
  .react-flow__node-removeButton,
  .react-flow__node-dragHandle {
    pointer-events: all !important;
    z-index: 10000 !important;
  }
`;

const nodeTypes = {
  granularNode: GranularNode,
  removeButton: RemoveButtonNode,
  dragHandle: DragHandleNode
};

const FlowVisualizerComponent = ({ nodes: initialNodes, edges: initialEdges, dimensions, onSystemPositionUpdate }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
  const flowInstance = useRef(null);
  
  useEffect(() => {
    if (initialNodes) {
      const filteredNodes = initialNodes.map(node => {
        if (node.type === 'group') {
          return {
            ...node,
            draggable: node.id.includes('system-group')
          };
        }
        return node;
      });
      setNodes(filteredNodes);
    }
    
    if (initialEdges) {
      const processedEdges = initialEdges.map(edge => {
        const sourceNode = initialNodes?.find(node => node.id === edge.source);
        const isInteractionEdge = sourceNode?.data?.highLevelGroup === 'Interaction';
        
        if (isInteractionEdge) {
          const { markerEnd, ...edgeWithoutMarker } = edge;
          return {
            ...edgeWithoutMarker,
            animated: false
          };
        }
        
        return edge;
      });
      
      setEdges(processedEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);
  
  useEffect(() => {
    if (flowInstance.current && nodes.length > 0) {
      setTimeout(() => {
        flowInstance.current.fitView({ padding: 0.2, includeHiddenNodes: true });
      }, 200);
    }
  }, [nodes.length]);

  const [dragState, setDragState] = useState(null);

  const getSystemNodes = useCallback(() => {
    return nodes.filter(node => 
      node.type === 'group' && 
      node.id.includes('system-group')
    );
  }, [nodes]);

  const detectCollision = useCallback((draggingNode, newPos) => {
    if (!draggingNode) return false;
    
    const dragRect = {
      x: newPos.x,
      y: newPos.y,
      width: draggingNode.style.width,
      height: draggingNode.style.height
    };
    
    const otherSystems = getSystemNodes().filter(
      node => node.id !== draggingNode.id
    );
    
    for (const otherSystem of otherSystems) {
      const otherRect = {
        x: otherSystem.position.x,
        y: otherSystem.position.y,
        width: otherSystem.style.width,
        height: otherSystem.style.height
      };
      
      if (
        dragRect.x < otherRect.x + otherRect.width &&
        dragRect.x + dragRect.width > otherRect.x &&
        dragRect.y < otherRect.y + otherRect.height &&
        dragRect.y + dragRect.height > otherRect.y
      ) {
        return true;
      }
    }
    
    return false;
  }, [getSystemNodes]);

  const onNodeDragStart = useCallback((event, node) => {
    if (node.type === 'group' && node.id.includes('system-group')) {
      setDragState({
        id: node.id,
        node: node,
        originalPosition: { ...node.position },
        lastValidPosition: { ...node.position }
      });
    }
  }, []);

  const onNodeDrag = useCallback((event, node, nodes) => {
    if (!dragState || dragState.id !== node.id) return;
    
    const hasCollision = detectCollision(node, node.position);
    
    if (!hasCollision) {
      setDragState(prev => ({
        ...prev,
        lastValidPosition: { ...node.position }
      }));
    }
  }, [dragState, detectCollision]);

  const onNodeDragStop = useCallback((event, node) => {
    if (!dragState || dragState.id !== node.id) return;
    
    const systemId = node.data.systemId;
    if (!systemId) return;
    
    const hasCollision = detectCollision(node, node.position);
    
    if (hasCollision) {
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === node.id 
            ? { ...n, position: { ...dragState.lastValidPosition } }
            : n
        )
      );
      
      if (onSystemPositionUpdate) {
        onSystemPositionUpdate(systemId, dragState.lastValidPosition);
      }
    } else {
      if (onSystemPositionUpdate) {
        onSystemPositionUpdate(systemId, node.position);
      }
    }
    
    setDragState(null);
  }, [dragState, detectCollision, setNodes, onSystemPositionUpdate]);

  const onInit = useCallback((reactFlowInstance) => {
    flowInstance.current = reactFlowInstance;
    
    if (nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.2, includeHiddenNodes: true });
      }, 200);
    }
  }, [nodes.length]);

  const fitView = () => {
    if (flowInstance.current) {
      flowInstance.current.fitView({ padding: 0.2, includeHiddenNodes: true });
    }
  };

  const downloadImage = () => {
    if (flowInstance.current) {
      const dataUrl = flowInstance.current.toImage({
        quality: 1.0, 
        width: dimensions?.width || 2400,
        height: dimensions?.height || 1200,
        backgroundColor: '#fcfcfc',
      });
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'system-diagram.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {/* Inject the custom CSS for edge z-index and font sizes */}
      <style>{customStyles}</style>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onInit={onInit}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        zoomOnScroll={true} 
        panOnScroll={false}
        panOnDrag={true}
        fitView={false} 
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'bezier',
          animated: true,
          style: {
            strokeWidth: 1.5,
            stroke: '#555',
            zIndex: 9999
          },
          zIndex: 9999
        }}
        edgesFocusable={true}
        elevateEdgesOnSelect={true}
      >
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
          nodeColor={(node) => {
            if (node.type === 'group') {
              return 'transparent';
            }
            if (node.data?.level === 'highest') return '#C1B8AA';
            if (node.data?.level === 'intermediate') return '#AAB8C1';
            return '#B8AAC1';
          }}
        />
        <Background variant="dots" gap={15} size={1} color="#aaa" />
        
        <Panel position="top-right">
          <Box sx={{ display: 'flex', gap: 1, backgroundColor: 'white', p: 1, borderRadius: 1, boxShadow: 1 }}>
            <Tooltip title="Fit View">
              <Button 
                variant="outlined" 
                size="small"
                onClick={fitView}
                sx={{ 
                  minWidth: '36px', 
                  p: '4px',
                  borderColor: '#B8C1AA',
                  color: '#B8C1AA',
                  '&:hover': {
                    borderColor: '#A0B090',
                    backgroundColor: 'rgba(184, 193, 170, 0.08)'
                  },
                  fontSize: '0.9rem'
                }}
              >
                <CenterFocusStrong fontSize="small" />
              </Button>
            </Tooltip>
            <Tooltip title="Download as Image">
              <Button 
                variant="outlined" 
                size="small"
                onClick={downloadImage}
                sx={{ 
                  minWidth: '36px', 
                  p: '4px',
                  borderColor: '#B8C1AA',
                  color: '#B8C1AA',
                  '&:hover': {
                    borderColor: '#A0B090',
                    backgroundColor: 'rgba(184, 193, 170, 0.08)'
                  },
                  fontSize: '0.9rem'
                }}
              >
                <Download fontSize="small" />
              </Button>
            </Tooltip>
          </Box>
        </Panel>
        
        {/* Add Edge Legend Panel in the bottom-left corner touching the bottom */}
        <Panel position="bottom-left" style={{ margin: '0 0 0 20px' }}>
          <EdgeLegend />
        </Panel>
      </ReactFlow>
    </Box>
  );
};

const FlowVisualizer = (props) => {
  return (
    <ReactFlowProvider>
      <FlowVisualizerComponent {...props} />
    </ReactFlowProvider>
  );
};

export default FlowVisualizer;