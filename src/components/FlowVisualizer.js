// components/FlowVisualizer.js
import React, { useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { CenterFocusStrong, Download } from '@mui/icons-material';

// Import custom node types
import GranularNode from './NodeTypes/GranularNode';
import RemoveButtonNode from './NodeTypes/RemoveButtonNode';

// Custom styling to ensure edges are always on top and increase font size globally
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
  .react-flow__node-removeButton {
    pointer-events: all !important;
    z-index: 10000 !important;
  }
`;

const nodeTypes = {
  granularNode: GranularNode,
  removeButton: RemoveButtonNode
};

const FlowVisualizerComponent = ({ nodes: initialNodes, edges: initialEdges, dimensions }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);
  const flowInstance = useRef(null);
  
  // If nodes or edges change from props, update the internal state
  useEffect(() => {
    if (initialNodes) setNodes(initialNodes);
    if (initialEdges) setEdges(initialEdges);
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
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        selectNodesOnDrag={false}
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
            stroke: '#555',
            zIndex: 9999 // High z-index for edges
          },
          markerEnd: {
            type: 'arrowclosed',
            color: '#555',
            width: 12,
            height: 12
          },
          zIndex: 9999 // High z-index for edges
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