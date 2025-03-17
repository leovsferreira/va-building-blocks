// components/NodeTypes/DragHandleNode.js
import React from 'react';
import { useReactFlow } from 'reactflow';

const DragHandleNode = ({ data }) => {
  const reactFlowInstance = useReactFlow();
  
  return (
    <div
      style={{
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#f0f0f0',
        color: '#666',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'grab',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        border: '1px solid rgba(0,0,0,0.1)',
        position: 'absolute',
        top: '-12px', // Half of height to align with the corner
        left: '-12px', // Half of width to align with the corner
        zIndex: 10000,
        pointerEvents: 'all' // Force pointer events to be enabled
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = '#e8e8e8';
        e.currentTarget.style.color = '#333';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = '#f0f0f0';
        e.currentTarget.style.color = '#666';
      }}
      className="drag-handle"
    >
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '10px',
        lineHeight: 1
      }}>
        <div>↕</div>
        <div>↔</div>
      </div>
    </div>
  );
};

export default DragHandleNode;