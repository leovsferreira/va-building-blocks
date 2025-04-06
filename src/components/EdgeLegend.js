import React, { useState } from 'react';
import { Box, Paper, Typography, Tooltip, IconButton, Fade } from '@mui/material';
import { Help, ExpandMore, ExpandLess } from '@mui/icons-material';

const EdgeLegend = () => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: 2,
        width: 340,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        transition: 'all 0.3s ease',
        marginBottom: 10,
        position: 'relative',
        zIndex: 1000
      }}
    >
      {/* Header with title and toggle */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          px: 2,
          py: 1,
          backgroundColor: '#B8C1AA',
          color: 'white',
          borderBottom: expanded ? '1px solid #A0B090' : 'none',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Edge Types
          </Typography>
          <Tooltip title="Edge types explain the relationships between components">
            <IconButton size="small" sx={{ ml: 0.5, color: 'white' }}>
              <Help fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <IconButton 
          size="small" 
          onClick={() => setExpanded(!expanded)}
          sx={{ color: 'white' }}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>
      
      {/* Legend content */}
      <Fade in={expanded}>
        <Box sx={{ p: 2, display: expanded ? 'block' : 'none' }}>
          {/* Data dependency edge */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                sx={{ 
                  position: 'relative',
                  width: 60, 
                  height: 20,
                  mr: 1.5,
                  flexShrink: 0
                }}
              >
                {/* Animated dashed line with arrow */}
                <Box sx={{ 
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: 'transparent',
                  borderTop: '2px dashed #555',
                  animation: 'dashmove 10s infinite linear',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    right: 0,
                    top: -5,
                    width: 0,
                    height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderLeft: '8px solid #555',
                  }
                }} />
              </Box>
              <Typography variant="subtitle2" fontWeight={600} color="#333">
                Data Dependency
              </Typography>
            </Box>
            <Typography variant="body2" color="#555" sx={{ ml: 9.5, lineHeight: 1.5 }}>
              Defines how data flows through the system as a result of computations (output of one component used as input by another).
            </Typography>
          </Box>
          
          {/* Interaction dependency edge */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box 
                sx={{ 
                  position: 'relative',
                  width: 60, 
                  height: 20,
                  mr: 1.5,
                  flexShrink: 0
                }}
              >
                {/* Solid line without arrow */}
                <Box sx={{ 
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  right: 0,
                  height: 2,
                  backgroundColor: '#555',
                }} />
              </Box>
              <Typography variant="subtitle2" fontWeight={600} color="#333">
                Interaction Dependency
              </Typography>
            </Box>
            <Typography variant="body2" color="#555" sx={{ ml: 9.5, lineHeight: 1.5 }}>
              Defines how user-driven interactions affect downstream components by passing restrictions or filters rather than raw data.
            </Typography>
          </Box>
        </Box>
      </Fade>
      
      {/* Keyframe animation for dashed line movement */}
      <style>
        {`
          @keyframes dashmove {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 100px 0;
            }
          }
        `}
      </style>
    </Paper>
  );
};

export default EdgeLegend;