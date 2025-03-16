// components/NodeTypes/TitleNode.js
import React from 'react';
import { Typography } from '@mui/material';

const TitleNode = ({ data }) => {
  const isHighest = data.level === 'highest';
  const color = data.color || '#333';
  
  return (
    <div style={{ 
      position: 'absolute',
      top: 0,
      left: 0,
      padding: isHighest ? '8px 16px' : '6px 12px',
      borderTopLeftRadius: isHighest ? '8px' : '6px',
      borderBottomRightRadius: isHighest ? '8px' : '6px',
      backgroundColor: color,
      zIndex: 5000, // Much higher z-index to ensure visibility
      boxShadow: '1px 1px 3px rgba(0,0,0,0.2)',
      transform: 'translate(0, 0)', // No negative transform
      pointerEvents: 'none', // Ensure it doesn't interfere with interactions
      minWidth: '120px'
    }}>
      <Typography 
        variant={isHighest ? "subtitle1" : "subtitle2"} 
        component="div"
        sx={{ 
          fontWeight: isHighest ? 600 : 500,
          color: 'white',
          fontSize: isHighest ? '0.95rem' : '0.85rem',
          textShadow: '0px 1px 2px rgba(0,0,0,0.2)'
        }}
      >
        {data.label}
      </Typography>
    </div>
  );
};

export default TitleNode;