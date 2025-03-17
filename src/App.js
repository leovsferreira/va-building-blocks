// App.js
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Drawer,
  IconButton,
  Button,
  Paper,
  Divider,
  CssBaseline,
  TextField
} from '@mui/material';
import { Menu, Upload, Close } from '@mui/icons-material';
import FlowVisualizer from './components/FlowVisualizer';
import processJsonToFlow from './utils/jsonToFlow';

// Create a unique ID without requiring uuid package
const generateId = () => `id-${Math.random().toString(36).substring(2, 9)}`;

// Constants for system layout
const SYSTEM_PADDING_Y = 200; // Padding between systems vertically
const SYSTEM_START_X = 50;
const SYSTEM_START_Y = 50;

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [systems, setSystems] = useState([]); // Array of systems
  const [jsonError, setJsonError] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const drawerWidth = 350;
  
  // Store the overall canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: 2000,
    height: 2000
  });

  // Combined nodes and edges from all systems for visualization
  const [combinedFlow, setCombinedFlow] = useState({ nodes: [], edges: [] });

  // Update combined flow whenever systems change
  useEffect(() => {
    console.log("Systems updated:", systems.length);
    
    if (systems.length === 0) {
      setCombinedFlow({ nodes: [], edges: [] });
      return;
    }
    
    // Calculate new canvas dimensions based on all systems
    let maxWidth = 0;
    let totalHeight = SYSTEM_START_Y;
    
    // First gather all nodes and edges and update canvas dimensions
    const allNodes = [];
    const allEdges = [];
    
    systems.forEach((system, index) => {
      console.log(`System ${system.id} at position:`, system.position);
      
      // Map positions of all nodes before adding them
      const mappedNodes = system.nodes.map(node => {
        // Make a copy of the node to avoid modifying the original
        return { ...node };
      });
      
      allNodes.push(...mappedNodes);
      allEdges.push(...system.edges);
      
      // Update canvas dimensions
      maxWidth = Math.max(maxWidth, system.position.x + system.width);
      totalHeight = system.position.y + system.height + SYSTEM_PADDING_Y;
    });
    
    setCombinedFlow({
      nodes: allNodes,
      edges: allEdges
    });
    
    // Update canvas dimensions
    setCanvasDimensions({
      width: Math.max(2000, maxWidth + 200), // Add some margin
      height: Math.max(2000, totalHeight)    // Add some margin
    });
    
  }, [systems]);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        processJsonData(jsonData);
        setJsonError('');
      } catch (error) {
        setJsonError('Error parsing JSON file: ' + error.message);
      }
    };
    reader.onerror = () => {
      setJsonError('Error reading file');
    };
    reader.readAsText(file);
  };

  const handleJsonInputChange = (event) => {
    setJsonInput(event.target.value);
    setJsonError('');
  };

  const handleLoadJsonFromInput = () => {
    try {
      const jsonData = JSON.parse(jsonInput);
      processJsonData(jsonData);
      setJsonError('');
    } catch (error) {
      setJsonError('Error parsing JSON: ' + error.message);
    }
  };

  // Calculate position for a new system based on existing systems
  const calculateSystemPosition = () => {
    if (systems.length === 0) {
      return { x: SYSTEM_START_X, y: SYSTEM_START_Y };
    }
    
    // Find the bottom-most system
    let maxBottom = 0;
    systems.forEach(system => {
      const bottom = system.position.y + system.height;
      if (bottom > maxBottom) {
        maxBottom = bottom;
      }
    });
    
    // Position the new system below the bottom-most existing system
    return { 
      x: SYSTEM_START_X, 
      y: maxBottom + SYSTEM_PADDING_Y 
    };
  };

  // Function to clear a specific system
  const clearSystem = useCallback((systemId) => {
    console.log('Clearing system', systemId);
    
    // Remove the specified system
    setSystems(prevSystems => {
      const filteredSystems = prevSystems.filter(system => system.id !== systemId);
      
      // If we still have systems, reposition them from the top down
      if (filteredSystems.length > 0) {
        let currentY = SYSTEM_START_Y;
        
        return filteredSystems.map(system => {
          // Create new position for this system
          const newPosition = { x: SYSTEM_START_X, y: currentY };
          
          // Update position for nodes
          const updatedNodes = system.nodes.map(node => {
            if (node.id.endsWith('system-group')) {
              // For the system group, update its position directly
              return {
                ...node,
                position: newPosition
              };
            }
            return node;
          });
          
          // Update current Y for next system
          currentY += system.height + SYSTEM_PADDING_Y;
          
          // Return updated system
          return {
            ...system,
            position: newPosition,
            nodes: updatedNodes
          };
        });
      }
      
      return filteredSystems;
    });
  }, []);
  
  // Handler for system position updates from drag and drop
  const handleSystemPositionUpdate = useCallback((systemId, newPosition) => {
    console.log(`Updating system ${systemId} position to:`, newPosition);
    
    setSystems(prevSystems => 
      prevSystems.map(system => {
        if (system.id !== systemId) return system;
        
        // Update the system position
        const updatedNodes = system.nodes.map(node => {
          if (node.id.endsWith('system-group')) {
            // Update system group node position
            return {
              ...node,
              position: newPosition
            };
          }
          return node;
        });
        
        // Return updated system
        return {
          ...system,
          position: newPosition,
          nodes: updatedNodes
        };
      })
    );
  }, []);

  const processJsonData = useCallback((jsonData) => {
    if (!jsonData || !jsonData.HighestLevelBlocks) {
      setJsonError('Invalid JSON structure: Missing HighestLevelBlocks');
      return;
    }
    
    // Create a unique ID for this system
    const systemId = generateId();
    
    // Calculate position for the new system
    const position = calculateSystemPosition();
    console.log(`Calculated position for new system: (${position.x}, ${position.y})`);
    
    // Process the JSON with the position
    const processedData = processJsonToFlow(jsonData, () => clearSystem(systemId), position, systemId);
    
    // Add the new system to our list
    setSystems(prevSystems => [
      ...prevSystems, 
      {
        id: systemId,
        name: jsonData.SystemName || 'Unnamed System',
        nodes: processedData.nodes,
        edges: processedData.edges,
        position,
        width: processedData.width,
        height: processedData.height
      }
    ]);
    
    // Clear input and close drawer
    setJsonInput('');
    setDrawerOpen(false);
  }, [clearSystem, systems]);

  // Get a combined name from all systems
  const getCombinedSystemName = () => {
    if (systems.length === 0) return 'System Visualizer';
    if (systems.length === 1) return systems[0].name;
    return `${systems[0].name} + ${systems.length - 1} more`;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#B8C1AA',
          color: 'white',
          boxShadow: 'none',
          borderBottom: '1px solid #A0B090'
        }}
      >
        <Toolbar variant="dense">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <Menu />
          </IconButton>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontSize: '1.1rem'
            }}
          >
            {getCombinedSystemName()} {systems.length > 0 && `(${systems.length} loaded)`}
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            zIndex: (theme) => theme.zIndex.drawer + 2
          },
        }}
        variant="temporary"
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Toolbar variant="dense" />
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>Load JSON Data</Typography>
            <IconButton onClick={toggleDrawer} size="small">
              <Close />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="subtitle1" gutterBottom>Upload JSON File</Typography>
          <Button
            variant="outlined"
            component="label"
            startIcon={<Upload />}
            fullWidth
            sx={{ 
              mb: 3,
              borderColor: '#B8C1AA',
              color: '#B8C1AA',
              '&:hover': {
                borderColor: '#A0B090',
                backgroundColor: 'rgba(184, 193, 170, 0.08)'
              },
              fontSize: '0.95rem'
            }}
          >
            Select JSON File
            <input
              type="file"
              accept=".json"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '1rem' }}>Or Paste JSON</Typography>
          <TextField
            label="Paste JSON here"
            multiline
            rows={10}
            value={jsonInput}
            onChange={handleJsonInputChange}
            fullWidth
            sx={{ 
              mb: 2,
              '& .MuiInputBase-input': {
                fontSize: '0.95rem'
              }
            }}
          />
          
          {jsonError && (
            <Typography color="error" variant="body2" sx={{ mb: 2, fontSize: '0.9rem' }}>
              {jsonError}
            </Typography>
          )}
          
          <Button 
            variant="contained" 
            onClick={handleLoadJsonFromInput}
            fullWidth
            sx={{
              backgroundColor: '#B8C1AA',
              '&:hover': {
                backgroundColor: '#A0B090'
              },
              fontSize: '0.95rem'
            }}
          >
            Load JSON
          </Button>
          
          {systems.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontSize: '0.9rem', mb: 1 }}>
                Loaded Systems:
              </Typography>
              {systems.map((system, index) => (
                <Box key={system.id} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 0.5,
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: '#f5f5f5'
                }}>
                  <Typography variant="body2">
                    {index + 1}. {system.name} ({system.position.x}, {system.position.y})
                  </Typography>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => clearSystem(system.id)}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Drawer>
      
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 0,
          height: '100vh',
          width: '100%',
          backgroundColor: '#fcfcfc',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Toolbar variant="dense" />
        
        {combinedFlow.nodes.length > 0 ? (
          <FlowVisualizer
            nodes={combinedFlow.nodes}
            edges={combinedFlow.edges}
            dimensions={canvasDimensions}
            onSystemPositionUpdate={handleSystemPositionUpdate}
          />
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 'calc(100vh - 48px)' 
            }}
          >
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', maxWidth: 400, backgroundColor: 'transparent' }}>
              <Typography variant="h5" gutterBottom sx={{ fontSize: '1.3rem' }}>No Data Loaded</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                Click the menu icon in the top left to open the side panel and load a JSON file.
              </Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default App;