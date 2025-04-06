import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardContent, Typography, Collapse, IconButton } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const IntermediateNode = ({ data }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card 
      elevation={3} 
      sx={{ 
        minWidth: 180, 
        maxWidth: 300,
        backgroundColor: '#AAB8C1',
        border: '2px solid #99A7B0',
        borderRadius: '6px',
        '&:hover': {
          boxShadow: '0 3px 10px rgba(0,0,0,0.12)'
        }
      }}
    >
      <CardContent sx={{ padding: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" component="div" sx={{ color: 'white', textShadow: '0px 1px 1px rgba(0,0,0,0.15)' }}>
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
            Contains {data.details.GranularBlocks?.length || 0} granular blocks
          </Typography>
        </Collapse>
      </CardContent>
      
      <Handle 
        type="target" 
        position={Position.Top} 
        id="in" 
        style={{ background: '#99A7B0', width: '8px', height: '8px' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="out" 
        style={{ background: '#99A7B0', width: '8px', height: '8px' }}
      />
    </Card>
  );
};

export default IntermediateNode;