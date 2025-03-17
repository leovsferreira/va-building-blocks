// components/NodeTypes/GranularNode.js
import React, { useState, useCallback } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { Typography, Popover, Paper, Box } from '@mui/material';

const GranularNode = ({ data, id }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const reactFlowInstance = useReactFlow();
  const details = data.details;
  const color = '#B8AAC1'; // Granular node color
  const systemId = data.systemId; // Get system ID for filtering
  const hasInputs = details.Inputs && details.Inputs.length > 0;
  const hasOutputs = details.Outputs && details.Outputs.length > 0;
  const feedsInto = details.FeedsInto && details.FeedsInto.length > 0;

  // Calculate a darker shade for border
  const darkerColor = color.replace(/^#/, '');
  const r = parseInt(darkerColor.substr(0, 2), 16);
  const g = parseInt(darkerColor.substr(2, 2), 16);
  const b = parseInt(darkerColor.substr(4, 2), 16);
  const borderColor = `#${Math.max(0, r - 30).toString(16).padStart(2, '0')}${Math.max(0, g - 30).toString(16).padStart(2, '0')}${Math.max(0, b - 30).toString(16).padStart(2, '0')}`;

  const open = Boolean(anchorEl);

  // Function to handle hover (highlight connections)
  const handleMouseEnter = useCallback(() => {
    // Get all edges and nodes
    const edges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();
    
    // Get connected edges (incoming and outgoing)
    const connectedEdges = edges.filter(
      edge => edge.source === id || edge.target === id
    );
    
    // Get connected node IDs
    const connectedNodeIds = new Set();
    connectedEdges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    
    // Filter edges to only show those from this system
    const systemEdges = edges.map(edge => {
      if (connectedEdges.some(connectedEdge => connectedEdge.id === edge.id)) {
        // Highlight connected edge
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: '#ff0072',
            strokeWidth: 3,
            opacity: 1,
            zIndex: 10000
          },
          animated: true
        };
      }
      
      // Only show edges from this system
      if (edge.data?.systemId === systemId) {
        return {
          ...edge,
          style: {
            ...edge.style,
            opacity: 0, // Hide edges in this system
            zIndex: 1
          },
          animated: false
        };
      }
      
      // Keep other system edges as they are
      return edge;
    });
    
    reactFlowInstance.setEdges(systemEdges);
    
    // Also highlight connected nodes, but only in this system
    reactFlowInstance.setNodes(
      nodes.map(node => {
        // Only modify nodes in this system
        if (node.data?.systemId === systemId) {
          if (node.id === id || (node.type === 'granularNode' && connectedNodeIds.has(node.id))) {
            // This is either the current node or a connected node
            return {
              ...node,
              style: {
                ...node.style,
                opacity: 1,
                zIndex: 1000
              }
            };
          }
          
          if (node.type === 'granularNode') {
            // Dim other granular nodes that aren't connected
            return {
              ...node,
              style: {
                ...node.style,
                opacity: 0.5
              }
            };
          }
        }
        
        // Don't change other node types or nodes from other systems
        return node;
      })
    );
  }, [id, reactFlowInstance, systemId]);

  // Function to handle mouse leave (reset edge styles)
  const handleMouseLeave = useCallback(() => {
    // Get all edges and nodes
    const edges = reactFlowInstance.getEdges();
    const nodes = reactFlowInstance.getNodes();
    
    // Reset all edges to original style
    reactFlowInstance.setEdges(
      edges.map(edge => ({
        ...edge,
        style: {
          stroke: '#555',
          strokeWidth: 1.5,
          opacity: 1,
          zIndex: 9999
        },
        animated: true
      }))
    );
    
    // Reset all nodes
    reactFlowInstance.setNodes(
      nodes.map(node => {
        if (node.type === 'granularNode') {
          return {
            ...node,
            style: {
              ...node.style,
              opacity: 1
            }
          };
        }
        return node;
      })
    );
  }, [reactFlowInstance]);

  // Function to handle click (show tooltip)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Function to close tooltip
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <div 
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '15px'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Circle Node */}
        <div 
          style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            backgroundColor: color,
            border: `2px solid ${borderColor}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '5px',
            textAlign: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
            position: 'relative',
            zIndex: 1,
            cursor: 'pointer'
          }}
        >
          <Typography 
            variant="body2" 
            component="div" 
            sx={{ 
              fontWeight: 600, 
              color: '#333',
              fontSize: '0.85rem', // Increased font size
              lineHeight: 1.2,
              wordBreak: 'break-word',
              padding: '0 5px'
            }}
          >
            {data.label}
          </Typography>
          
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.75rem', // Increased font size
              color: '#555',
              position: 'absolute',
              bottom: '8px'
            }}
          >
            ID: {details.ID}
          </Typography>
        </div>
      </div>
      
      {/* Tooltip (shown on click) */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{ 
          '& .MuiPopover-paper': {
            maxWidth: 350,
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }
        }}
      >
        <Paper sx={{ 
          p: 2.5, 
          borderLeft: `4px solid ${color}`,
          borderRadius: '8px',
        }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: '#333', fontSize: '1rem' }}>
            {data.label} <Typography component="span" variant="body2" sx={{ ml: 1, color: '#666', fontSize: '0.85rem' }}>(ID: {details.ID})</Typography>
          </Typography>
          
          {details.PaperDescription && (
            <Typography variant="body2" sx={{ mb: 1.5, color: '#444', lineHeight: 1.5, fontSize: '0.85rem' }}>
              {details.PaperDescription}
            </Typography>
          )}
          
          {hasInputs && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#333', mb: 0.5, fontSize: '0.85rem' }}>Inputs:</Typography>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {details.Inputs.map((input, idx) => (
                  <li key={idx}>
                    <Typography variant="body2" sx={{ color: '#444', fontSize: '0.85rem' }}>{input}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
          
          {hasOutputs && (
            <Box sx={{ mb: 1.5 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#333', mb: 0.5, fontSize: '0.85rem' }}>Outputs:</Typography>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {details.Outputs.map((output, idx) => (
                  <li key={idx}>
                    <Typography variant="body2" sx={{ color: '#444', fontSize: '0.85rem' }}>{output}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          )}
          
          {feedsInto && (
            <Box>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#333', mb: 0.5, fontSize: '0.85rem' }}>Feeds into:</Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ color: '#444', fontSize: '0.85rem' }}>
                  Block IDs: {details.FeedsInto.join(', ')}
                </Typography>
              </Box>
            </Box>
          )}
          
          {details.ReferenceCitation && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="body2" fontWeight={600} sx={{ color: '#333', mb: 0.5, fontSize: '0.85rem' }}>Reference Citation:</Typography>
              <Box sx={{ backgroundColor: '#f8f8f8', p: 1, borderRadius: '4px', borderLeft: '3px solid #ddd' }}>
                <Typography variant="body2" sx={{ color: '#444', fontSize: '0.85rem', fontStyle: 'italic' }}>
                  {details.ReferenceCitation}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Popover>
      
      <Handle 
        type="source" 
        position={Position.Right} 
        id="out" 
        style={{ 
          background: '#555', 
          width: '8px', // Smaller handle
          height: '8px', // Smaller handle
          border: '2px solid #fff',
          zIndex: 10
        }}
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="in" 
        style={{ 
          background: '#555', 
          width: '8px', // Smaller handle
          height: '8px', // Smaller handle
          border: '2px solid #fff',
          zIndex: 10
        }}
      />
    </>
  );
};

export default GranularNode;