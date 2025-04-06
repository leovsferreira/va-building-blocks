const processJsonToFlow = (jsonData) => {
    if (!jsonData || !jsonData.HighestLevelBlocks) {
      return { nodes: [], edges: [] };
    }
  
    const nodes = [];
    const edges = [];
    
    const colors = {
      highLevel: '#C1B8AA',
      intermediate: '#AAB8C1',
      granular: '#B8AAC1'
    };
    
    const allGranularBlocks = new Map();
    jsonData.HighestLevelBlocks.forEach(highBlock => {
      highBlock.IntermediateBlocks?.forEach(intBlock => {
        intBlock.GranularBlocks?.forEach(granBlock => {
          allGranularBlocks.set(granBlock.ID, granBlock);
        });
      });
    });
    
    let highestLevelXPosition = 50;
    const highestLevelYPosition = 50;
    const highestLevelXGap = 150;
    
    jsonData.HighestLevelBlocks.forEach((highBlock, highIndex) => {
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
      
      const highLevelGroupId = `high-group-${highIndex}`;
      nodes.push({
        id: highLevelGroupId,
        type: 'group',
        position: { x: highestLevelXPosition, y: highestLevelYPosition },
        style: { 
          width: highLevelWidth, 
          height: highLevelHeight,
          backgroundColor: 'transparent',
          borderColor: colors.highLevel,
          borderWidth: 2,
          borderStyle: 'dashed',
          borderRadius: 8,
          padding: 0
        },
        data: { 
          label: highBlock.HighestLevelBlockName,
          level: 'highest'
        }
      });
      
      nodes.push({
        id: `high-label-${highIndex}`,
        type: 'default',
        position: { x: 0, y: 0 },
        parentNode: highLevelGroupId,
        selectable: false,
        draggable: false,
        style: {
          backgroundColor: colors.highLevel,
          color: 'white',
          padding: '8px 16px',
          borderBottomRightRadius: '8px',
          borderTopLeftRadius: '8px',
          fontWeight: 'bold',
          width: 'auto',
          minWidth: '150px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 999,
          border: 'none'
        },
        data: {
          label: highBlock.HighestLevelBlockName
        }
      });
      
      if (highBlock.IntermediateBlocks && highBlock.IntermediateBlocks.length > 0) {
        let intermediateYPosition = 50; 
        
        highBlock.IntermediateBlocks.forEach((intBlock, intIndex) => {
          const intermediateDetail = intermediateDetails[intIndex];
          const intermediateBlockHeight = intermediateDetail.height;
          const intermediateBlockWidth = intermediateDetail.width;
          
          const intermediateGroupId = `int-group-${highIndex}-${intIndex}`;
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
              level: 'intermediate'
            }
          });
          
          nodes.push({
            id: `int-label-${highIndex}-${intIndex}`,
            type: 'default',
            position: { x: 0, y: 0 },
            parentNode: intermediateGroupId,
            selectable: false,
            draggable: false,
            style: {
              backgroundColor: colors.intermediate,
              color: 'white',
              padding: '6px 12px',
              borderBottomRightRadius: '6px',
              borderTopLeftRadius: '6px',
              fontWeight: 'bold',
              width: 'auto',
              minWidth: '120px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 999,
              border: 'none'
            },
            data: {
              label: intBlock.IntermediateBlockName
            }
          });
          
          if (intBlock.GranularBlocks && intBlock.GranularBlocks.length > 0 && Array.isArray(intBlock.GranularBlocks)) {
            const granularSpacing = 130;
            const startY = 50;
            const centerX = intermediateBlockWidth / 2;
            
            intBlock.GranularBlocks.forEach((block, blockIndex) => {
              const verticalPosition = startY + (blockIndex * granularSpacing);
              
              const granularNodeId = `gran-${block.ID}`;
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
                  color: colors.granular
                },
                style: {
                  width: 110
                }
              });
              
              if (block.FeedsInto && Array.isArray(block.FeedsInto) && block.FeedsInto.length > 0) {
                block.FeedsInto.forEach(targetId => {
                  if (allGranularBlocks.has(targetId)) {
                    edges.push({
                      id: `edge-${block.ID}-${targetId}`,
                      source: granularNodeId,
                      target: `gran-${targetId}`,
                      type: 'bezier',
                      animated: true,
                      style: { stroke: '#555', strokeWidth: 1.5 },
                      markerEnd: {
                        type: 'arrowclosed',
                        color: '#555',
                        width: 10,
                        height: 10 
                      }
                    });
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
    
    return { nodes, edges };
  };
  
  export default processJsonToFlow;