const processJsonToFlow = (jsonData, onRemoveSystem, position = { x: 0, y: 0 }, systemId = 'system') => {
  if (!jsonData || (!jsonData.HighestLevelBlocks && !jsonData.HighBlocks)) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  console.log(`Processing system ${systemId} with offset:`, position);

  const nodes = [];
  const edges = [];
  
  const colors = {
    system: '#B8C1AA',
    highLevel: '#C1B8AA',
    intermediate: '#AAB8C1',
    granular: '#B8AAC1'
  };
  
  const getDarkerColor = (colorHex, amount = 30) => {
    const hex = colorHex.replace(/^#/, '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  const titleColors = {
    system: getDarkerColor(colors.system, 20),
    highLevel: getDarkerColor(colors.highLevel, 20),
    intermediate: getDarkerColor(colors.intermediate, 20),
    granular: getDarkerColor(colors.granular, 20)
  };
  
  const borderColors = {
    system: getDarkerColor(colors.system, 40),
    highLevel: getDarkerColor(colors.highLevel, 40),
    intermediate: getDarkerColor(colors.intermediate, 40),
    granular: getDarkerColor(colors.granular, 40)
  };
  
  const prefixId = (id) => `${systemId}-${id}`;
  
  const highestLevelBlocks = jsonData.HighestLevelBlocks || jsonData.HighBlocks;
  
  const allGranularBlocks = new Map();
  highestLevelBlocks.forEach(highBlock => {
    const intBlocksKey = 'IntermediateBlocks';
    highBlock[intBlocksKey]?.forEach(intBlock => {
      intBlock.GranularBlocks?.forEach(granBlock => {
        allGranularBlocks.set(granBlock.ID, granBlock);
      });
    });
  });
  
  let totalSystemWidth = 0;
  let totalSystemHeight = 0;
  const highLevelDetails = [];
  
  let highestLevelXPosition = 50;
  const highestLevelYPosition = 50;
  const highestLevelXGap = 150;
  
  highestLevelBlocks.forEach((highBlock) => {
    const intermediateDetails = [];
    
    if (highBlock.IntermediateBlocks) {
      highBlock.IntermediateBlocks.forEach((intBlock) => {
        const granularBlockCount = intBlock.GranularBlocks?.length || 0;
        
        intermediateDetails.push({
          granularCount: granularBlockCount,
          height: granularBlockCount === 0 ? 120 : (granularBlockCount * 130 + 60),
          width: 250
        });
      });
    }
    
    const highLevelWidth = intermediateDetails.length > 0 
      ? Math.max(350, ...intermediateDetails.map(d => d.width)) + 80 
      : 350;
    
    const totalHeight = intermediateDetails.reduce((sum, detail) => sum + detail.height + 30, 0);
    const highLevelHeight = Math.max(180, totalHeight + 60);
    
    highLevelDetails.push({
      width: highLevelWidth,
      height: highLevelHeight,
      xPosition: highestLevelXPosition
    });
    
    highestLevelXPosition += highLevelWidth + highestLevelXGap;
  });
  
  if (highLevelDetails.length > 0) {
    const lastHighLevelBlock = highLevelDetails[highLevelDetails.length - 1];
    totalSystemWidth = lastHighLevelBlock.xPosition + lastHighLevelBlock.width + 50;
    totalSystemHeight = Math.max(...highLevelDetails.map(d => d.height)) + highestLevelYPosition + 50;
  } else {
    totalSystemWidth = 500;
    totalSystemHeight = 300;
  }
  
  const systemGroupId = prefixId('system-group');
  nodes.push({
    id: systemGroupId,
    type: 'group',
    position: position,
    style: { 
      width: totalSystemWidth, 
      height: totalSystemHeight,
      backgroundColor: 'transparent',
      borderColor: colors.system,
      borderWidth: 5,
      borderStyle: 'solid',
      borderRadius: 10,
      padding: 0
    },
    data: { 
      label: jsonData.SystemName || jsonData.PaperTitle || 'System',
      level: 'system',
      systemId: systemId
    },
    draggable: true,
  });
  
  nodes.push({
    id: prefixId('system-label'),
    type: 'default',
    position: { x: 0, y: 0 },
    parentNode: systemGroupId,
    selectable: false,
    draggable: false,
    connectable: false,
    style: {
      backgroundColor: titleColors.system,
      color: 'white',
      padding: '8px 16px',
      borderBottomRightRadius: '8px',
      borderTopLeftRadius: '10px',
      borderRight: `2px solid ${borderColors.system}`,
      borderBottom: `2px solid ${borderColors.system}`,
      fontWeight: 'bold',
      width: 'auto',
      minWidth: '180px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      zIndex: 999,
      fontSize: '1rem' 
    },
    data: {
      label: jsonData.SystemName || jsonData.PaperTitle || 'System'
    },
    sourcePosition: null,
    targetPosition: null
  });
  
  nodes.push({
    id: prefixId('remove-system-button'),
    type: 'removeButton',
    position: { x: totalSystemWidth - 45, y: 10 },
    parentNode: systemGroupId,
    selectable: false,
    draggable: false,
    connectable: false,
    data: {
      label: '×',
      onRemove: onRemoveSystem,
      systemId: systemId
    },
    style: {
      width: 36,
      height: 36,
      zIndex: 10000,
      pointerEvents: 'all'
    },
    sourcePosition: null,
    targetPosition: null
  });
  
  nodes.push({
    id: prefixId('drag-handle'),
    type: 'dragHandle',
    position: { x: 0, y: 0 },
    parentNode: systemGroupId,
    selectable: false,
    draggable: false,
    connectable: false,
    data: {
      systemId: systemId
    },
    style: {
      zIndex: 10000,
      pointerEvents: 'all'
    },
    sourcePosition: null,
    targetPosition: null
  });
  
  highestLevelXPosition = 50;
  
  highestLevelBlocks.forEach((highBlock, highIndex) => {
    const highLevelGroupName = highBlock.HighestLevelBlockName || highBlock.HighBlockName;
    const isInteractionGroup = highLevelGroupName === 'Interaction';
    
    const intermediateDetails = [];
    
    if (highBlock.IntermediateBlocks) {
      highBlock.IntermediateBlocks.forEach((intBlock) => {
        const granularBlockCount = intBlock.GranularBlocks?.length || 0;
        
        intermediateDetails.push({
          granularCount: granularBlockCount,
          height: granularBlockCount === 0 ? 120 : (granularBlockCount * 130 + 60),
          width: 250
        });
      });
    }
    
    const highLevelWidth = intermediateDetails.length > 0 
      ? Math.max(350, ...intermediateDetails.map(d => d.width)) + 80 
      : 350;
    
    const totalHeight = intermediateDetails.reduce((sum, detail) => sum + detail.height + 30, 0);
    const highLevelHeight = Math.max(180, totalHeight + 60);
    
    const highLevelGroupId = prefixId(`high-group-${highIndex}`);
    nodes.push({
      id: highLevelGroupId,
      type: 'group',
      position: { x: highestLevelXPosition, y: highestLevelYPosition },
      style: { 
        width: highLevelWidth, 
        height: highLevelHeight,
        backgroundColor: 'transparent',
        borderColor: colors.highLevel,
        borderWidth: 4,
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 0
      },
      draggable: false,
      parentNode: systemGroupId,
      data: { 
        label: highLevelGroupName,
        level: 'highest',
        systemId: systemId
      }
    });
    
    nodes.push({
      id: prefixId(`high-label-${highIndex}`),
      type: 'default',
      position: { x: 0, y: 0 },
      parentNode: highLevelGroupId,
      selectable: false,
      draggable: false,
      connectable: false,
      style: {
        backgroundColor: titleColors.highLevel,
        color: 'white',
        padding: '8px 16px',
        borderBottomRightRadius: '8px',
        borderTopLeftRadius: '8px',
        borderRight: `2px solid ${borderColors.highLevel}`,
        borderBottom: `2px solid ${borderColors.highLevel}`,
        fontWeight: 'bold',
        width: 'auto',
        minWidth: '150px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 999,
        fontSize: '0.95rem' 
      },
      data: {
        label: highLevelGroupName,
        systemId: systemId
      },
      sourcePosition: null,
      targetPosition: null
    });
    
    if (highBlock.IntermediateBlocks && highBlock.IntermediateBlocks.length > 0) {
      let intermediateYPosition = 50; 
      
      highBlock.IntermediateBlocks.forEach((intBlock, intIndex) => {
        const intermediateDetail = intermediateDetails[intIndex];
        const intermediateBlockHeight = intermediateDetail.height;
        const intermediateBlockWidth = intermediateDetail.width;
        
        const intermediateGroupId = prefixId(`int-group-${highIndex}-${intIndex}`);
        nodes.push({
          id: intermediateGroupId,
          type: 'group',
          position: { 
            x: (highLevelWidth - intermediateBlockWidth) / 2, 
            y: intermediateYPosition 
          },
          style: { 
            width: intermediateBlockWidth, 
            height: intermediateBlockHeight,
            backgroundColor: `${colors.intermediate}B3`,
            borderColor: colors.intermediate,
            borderWidth: 2,
            borderStyle: 'solid',
            borderRadius: 6,
            padding: 0
          },
          parentNode: highLevelGroupId,
          draggable: false,
          selectable: false,
          data: { 
            label: intBlock.IntermediateBlockName,
            level: 'intermediate',
            systemId: systemId,
            highLevelGroup: highLevelGroupName
          }
        });
        
        nodes.push({
          id: prefixId(`int-label-${highIndex}-${intIndex}`),
          type: 'default',
          position: { x: 0, y: 0 },
          parentNode: intermediateGroupId,
          selectable: false,
          draggable: false,
          connectable: false,
          style: {
            backgroundColor: titleColors.intermediate, 
            color: 'white',
            padding: '6px 12px',
            borderBottomRightRadius: '6px',
            borderTopLeftRadius: '6px',
            borderRight: `2px solid ${borderColors.intermediate}`,
            borderBottom: `2px solid ${borderColors.intermediate}`,
            fontWeight: 'bold',
            width: 'auto',
            minWidth: '120px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 999,
            fontSize: '0.9rem'
          },
          data: {
            label: intBlock.IntermediateBlockName,
            systemId: systemId,
            highLevelGroup: highLevelGroupName
          },
          sourcePosition: null,
          targetPosition: null
        });
        
        if (intBlock.GranularBlocks && intBlock.GranularBlocks.length > 0 && Array.isArray(intBlock.GranularBlocks)) {
          const granularSpacing = 130;
          const startY = 50;
          const centerX = intermediateBlockWidth / 2;
          
          intBlock.GranularBlocks.forEach((block, blockIndex) => {
            const verticalPosition = startY + (blockIndex * granularSpacing);
            
            const granularNodeId = prefixId(`gran-${block.ID}`);
            nodes.push({
              id: granularNodeId,
              type: 'granularNode',
              position: { 
                x: centerX - 55,
                y: verticalPosition 
              },
              parentNode: intermediateGroupId,
              draggable: false,
              data: { 
                label: block.GranularBlockName,
                id: block.ID,
                details: block,
                color: colors.granular,
                systemId: systemId,
                highLevelGroup: highLevelGroupName 
              },
              style: {
                width: 110
              }
            });
            
            if (block.FeedsInto && Array.isArray(block.FeedsInto) && block.FeedsInto.length > 0) {
              block.FeedsInto.forEach(targetId => {
                if (allGranularBlocks.has(targetId)) {
                  let edgeConfig = {
                    id: prefixId(`edge-${block.ID}-${targetId}`),
                    source: granularNodeId,
                    target: prefixId(`gran-${targetId}`),
                    type: 'bezier',
                    animated: isInteractionGroup ? false : true,
                    style: { 
                      stroke: '#555', 
                      strokeWidth: 1.5
                    },
                    data: {
                      systemId: systemId,
                      highLevelGroup: highLevelGroupName,
                      isInteractionEdge: isInteractionGroup
                    },
                    zIndex: isInteractionGroup ? 500 : 1000 
                  };
                  
                  if (!isInteractionGroup) {
                    edgeConfig.markerEnd = {
                      type: 'arrowclosed',
                      color: '#555',
                      width: 10,
                      height: 10
                    };
                  }
                  
                  edges.push(edgeConfig);
                }
              });
            }
          });
        }
        
        intermediateYPosition += intermediateBlockHeight + 30;
      });
    }
    
    highestLevelXPosition += highLevelWidth + highestLevelXGap;
  });
  
  return { 
    nodes, 
    edges, 
    width: totalSystemWidth, 
    height: totalSystemHeight 
  };
};

export default processJsonToFlow;