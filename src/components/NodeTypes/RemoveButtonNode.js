// components/NodeTypes/RemoveButtonNode.js
import React from 'react';

const RemoveButtonNode = ({ data }) => {
  // Directly call the provided callback function on click
  const handleRemoveSystem = () => {
    if (data.onRemove && typeof data.onRemove === 'function') {
      if (window.confirm('Are you sure you want to remove the current system?')) {
        data.onRemove();
      }
    }
  };
  
  return (
    <div
      style={{
        width: '36px', // Larger button
        height: '36px', // Larger button
        borderRadius: '50%',
        backgroundColor: '#ff3333', // Red by default
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '18px', // Larger font
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.4)',
        transition: 'all 0.2s ease',
        position: 'absolute', // Ensure absolute positioning
        top: '0px',
        right: '0px',
        zIndex: 10000, // Very high z-index to ensure it's on top
        pointerEvents: 'all' // Force pointer events to be enabled
      }}
      onClick={handleRemoveSystem}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#ff5555'; // Lighter red on hover
        e.currentTarget.style.transform = 'scale(1.1)'; // Slightly grow on hover
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#ff3333'; // Back to original red
        e.currentTarget.style.transform = 'scale(1)'; // Reset size
      }}
    >
      ×
    </div>
  );
};

export default RemoveButtonNode;