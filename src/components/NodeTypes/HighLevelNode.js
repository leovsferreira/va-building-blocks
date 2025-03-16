import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, Typography, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const HighLevelNode = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card 
      elevation={4} 
      sx={{ 
        minWidth: 220, 
        maxWidth: 350,
        backgroundColor: '#C1B8AA', // High level color
        border: '2px solid #B0A799',
        borderRadius: '8px',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      }}
    >
      <CardContent sx={{ padding: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ color: 'white', textShadow: '0px 1px 2px rgba(0,0,0,0.2)' }}>
            {data.label}
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            sx={{ color: 'white' }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </div>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255,255,255,0.9)' }}>
            Contains {data.details.IntermediateBlocks?.length || 0} intermediate blocks
          </Typography>
        </Collapse>
      </CardContent>
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="out" 
        style={{ background: '#B0A799', width: '8px', height: '8px' }}
      />
    </Card>
  );
};

export default HighLevelNode;