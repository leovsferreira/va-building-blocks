// App.js
import React, { useState, useCallback } from 'react';
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

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [flowData, setFlowData] = useState({ nodes: [], edges: [] });
  const [systemName, setSystemName] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const drawerWidth = 350;

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

  const processJsonData = useCallback((jsonData) => {
    if (!jsonData || !jsonData.HighestLevelBlocks) {
      setJsonError('Invalid JSON structure: Missing HighestLevelBlocks');
      return;
    }
    
    const processedData = processJsonToFlow(jsonData);
    setFlowData(processedData);
    setSystemName(jsonData.SystemName || 'Unnamed System');
    
    // Close drawer after loading
    setDrawerOpen(false);
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#B8C1AA', // Updated navbar color to B8C1AA
          color: 'white', // Changed text color for better contrast
          boxShadow: 'none',
          borderBottom: '1px solid #A0B090' // Slightly darker border
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
            fontSize: '1.1rem' // Increased font size 
          }}
        >
          {systemName || 'VA Building Blocks'}
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
          
          <Typography variant="subtitle1" gutterBottom sx={{ fontSize: '1rem' }}>Or Paste JSON</Typography>
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
              }
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
          
          <Typography variant="subtitle1" gutterBottom>Or Paste JSON</Typography>
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
                fontSize: '0.95rem' // Larger font for the input
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
              fontSize: '0.95rem' // Increased font size
            }}
          >
            Load JSON
          </Button>
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
        
        {flowData.nodes.length > 0 ? (
          <FlowVisualizer nodes={flowData.nodes} edges={flowData.edges} />
        ) : (
          <Box 
            sx={{ 
              display: 'flex', 
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