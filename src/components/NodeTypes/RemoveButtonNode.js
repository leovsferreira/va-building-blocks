import React from 'react';

const RemoveButtonNode = ({ data }) => {
  const handleRemoveSystem = () => {
    if (data.onRemove && typeof data.onRemove === 'function') {
      if (window.confirm(`Are you sure you want to remove this system?`)) {
        data.onRemove(data.systemId); // Pass the system ID
      }
    }
  };
  
  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: '#ff3333',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '18px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.4)',
        transition: 'all 0.2s ease',
        position: 'absolute',
        top: '0px',
        right: '0px',
        zIndex: 10000,
        pointerEvents: 'all'
      }}
      onClick={handleRemoveSystem}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#ff5555';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#ff3333';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      ×
    </div>
  );
};

export default RemoveButtonNode;