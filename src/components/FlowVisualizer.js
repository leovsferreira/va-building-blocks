// components/FlowVisualizer.js
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

// Import custom node types
import GranularNode from './NodeTypes/GranularNode';
import RemoveButtonNode from './NodeTypes/RemoveButtonNode';
import DragHandleNode from './NodeTypes/DragHandleNode';

// Custom styling to ensure edges are always on top and increase font size globally
const customStyles = `
  /* Selected edges should be above all */
  .react-flow__edge.selected {
    z-index: 10000 !important;
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
  
  // Filter nodes that shouldn't be draggable directly and process edge styling
  useEffect(() => {
    if (initialNodes) {
      // Make sure only system-group nodes are draggable, not the inner components
      const filteredNodes = initialNodes.map(node => {
        // Only system groups should be draggable
        if (node.type === 'group') {
          // Only make system-group nodes draggable
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
      // Process edges to ensure Interaction edges have correct styling
      const processedEdges = initialEdges.map(edge => {
        // Find source node to determine if this is an Interaction edge
        const sourceNode = initialNodes?.find(node => node.id === edge.source);
        const isInteractionEdge = sourceNode?.data?.highLevelGroup === 'Interaction';
        
        if (isInteractionEdge) {
          // For Interaction edges, completely remove the markerEnd property
          const { markerEnd, ...edgeWithoutMarker } = edge;
          return {
            ...edgeWithoutMarker,
            animated: false,
            zIndex: 500 // Lower z-index for Interaction edges
          };
        }
        
        // For other edges, ensure they have a higher z-index
        return {
          ...edge,
          zIndex: 1000 // Higher z-index for arrows
        };
      });
      
      setEdges(processedEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);
  
  // Fit view when nodes change (including when a new system is loaded)
  useEffect(() => {
    if (flowInstance.current && nodes.length > 0) {
      // Slight delay to ensure rendering is complete
      setTimeout(() => {
        flowInstance.current.fitView({ padding: 0.2, includeHiddenNodes: true });
      }, 200);
    }
  }, [nodes.length]);

  // Store dragging state
  const [dragState, setDragState] = useState(null);

  // Get all system group nodes
  const getSystemNodes = useCallback(() => {
    return nodes.filter(node => 
      node.type === 'group' && 
      node.id.includes('system-group')
    );
  }, [nodes]);

  // Detect if a system would overlap with another system
  const detectCollision = useCallback((draggingNode, newPos) => {
    if (!draggingNode) return false;
    
    // Calculate the potential new bounding box for the dragging system
    const dragRect = {
      x: newPos.x,
      y: newPos.y,
      width: draggingNode.style.width,
      height: draggingNode.style.height
    };
    
    // Get all other system nodes
    const otherSystems = getSystemNodes().filter(
      node => node.id !== draggingNode.id
    );
    
    // Check for collisions with each other system
    for (const otherSystem of otherSystems) {
      const otherRect = {
        x: otherSystem.position.x,
        y: otherSystem.position.y,
        width: otherSystem.style.width,
        height: otherSystem.style.height
      };
      
      // Simple rectangle-rectangle collision detection
      if (
        dragRect.x < otherRect.x + otherRect.width &&
        dragRect.x + dragRect.width > otherRect.x &&
        dragRect.y < otherRect.y + otherRect.height &&
        dragRect.y + dragRect.height > otherRect.y
      ) {
        return true; // Collision detected
      }
    }
    
    return false; // No collision
  }, [getSystemNodes]);

  // Handle node drag start
  const onNodeDragStart = useCallback((event, node) => {
    // Only track drag state for system group nodes (not high-level or intermediate groups)
    if (node.type === 'group' && node.id.includes('system-group')) {
      setDragState({
        id: node.id,
        node: node,
        originalPosition: { ...node.position },
        lastValidPosition: { ...node.position }
      });
    }
  }, []);

  // Handle node dragging
  const onNodeDrag = useCallback((event, node, nodes) => {
    if (!dragState || dragState.id !== node.id) return;
    
    // Check if new position would cause collision
    const hasCollision = detectCollision(node, node.position);
    
    // If no collision, update the last valid position
    if (!hasCollision) {
      setDragState(prev => ({
        ...prev,
        lastValidPosition: { ...node.position }
      }));
    }
  }, [dragState, detectCollision]);

  // Handle node drag end
  const onNodeDragStop = useCallback((event, node) => {
    if (!dragState || dragState.id !== node.id) return;
    
    const systemId = node.data.systemId;
    if (!systemId) return;
    
    // Check final position for collision
    const hasCollision = detectCollision(node, node.position);
    
    if (hasCollision) {
      // Revert to last valid position if collision occurred
      setNodes(prevNodes => 
        prevNodes.map(n => 
          n.id === node.id 
            ? { ...n, position: { ...dragState.lastValidPosition } }
            : n
        )
      );
      
      // Notify App component with the last valid position
      if (onSystemPositionUpdate) {
        onSystemPositionUpdate(systemId, dragState.lastValidPosition);
      }
    } else {
      // Notify App component with the new position
      if (onSystemPositionUpdate) {
        onSystemPositionUpdate(systemId, node.position);
      }
    }
    
    // Clear drag state
    setDragState(null);
  }, [dragState, detectCollision, setNodes, onSystemPositionUpdate]);

  const onInit = useCallback((reactFlowInstance) => {
    flowInstance.current = reactFlowInstance;
    
    // Wait a bit for the nodes to render and then fit view
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
      
      // Create a link element to download the image
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
        fitView={false} // Don't automatically fit view, we'll do it in useEffect
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'bezier',
          animated: true,
          style: {
            strokeWidth: 1.5,
            stroke: '#555'
          }
          // No zIndex property here - we set it per edge
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
            if (node.data?.level === 'highest') return '#C1B8AA'; // Higher level color
            if (node.data?.level === 'intermediate') return '#AAB8C1'; // Intermediate color
            return '#B8AAC1'; // Granular color
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
      </ReactFlow>
    </Box>
  );
};

// Wrap component with the ReactFlowProvider
const FlowVisualizer = (props) => {
  return (
    <ReactFlowProvider>
      <FlowVisualizerComponent {...props} />
    </ReactFlowProvider>
  );
};

export default FlowVisualizer;