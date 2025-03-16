// utils/jsonToFlow.js
const processJsonToFlow = (jsonData) => {
    if (!jsonData || !jsonData.HighestLevelBlocks) {
      return { nodes: [], edges: [] };
    }
  
    const nodes = [];
    const edges = [];
    
    // Corrected colors according to requirements
    const colors = {
      highLevel: '#C1B8AA', // Higher level block color
      intermediate: '#AAB8C1', // Intermediate block color
      granular: '#B8AAC1' // Granular block color
    };
    
    // Create a map of all granular blocks for reference (to handle edges between blocks in different groups)
    const allGranularBlocks = new Map();
    jsonData.HighestLevelBlocks.forEach(highBlock => {
      highBlock.IntermediateBlocks?.forEach(intBlock => {
        intBlock.GranularBlocks?.forEach(granBlock => {
          allGranularBlocks.set(granBlock.ID, granBlock);
        });
      });
    });
    
    // Starting positions for the highest level blocks
    let highestLevelXPosition = 50;
    const highestLevelYPosition = 50;
    const highestLevelXGap = 150; // Gap between highest level blocks
    
    // Process all highest level blocks
    jsonData.HighestLevelBlocks.forEach((highBlock, highIndex) => {
      // First, analyze intermediate blocks for better sizing
      const intermediateDetails = [];
      
      if (highBlock.IntermediateBlocks) {
        highBlock.IntermediateBlocks.forEach((intBlock) => {
          const granularBlockCount = intBlock.GranularBlocks?.length || 0;
          
          // Add data for each intermediate block
          intermediateDetails.push({
            granularCount: granularBlockCount,
            // More compact sizing: Each granular block only needs ~130px vertical space
            height: granularBlockCount === 0 ? 120 : (granularBlockCount * 130 + 60),
            // More compact width
            width: 250
          });
        });
      }
      
      // Calculate high level dimensions based on intermediates
      // Width is based on intermediate width + padding
      const highLevelWidth = intermediateDetails.length > 0 
        ? Math.max(350, ...intermediateDetails.map(d => d.width)) + 80 
        : 350;
      
      // Calculate total height needed for intermediate blocks with minimal spacing
      const totalHeight = intermediateDetails.reduce((sum, detail) => sum + detail.height + 30, 0);
      const highLevelHeight = Math.max(180, totalHeight + 60);
      
      // Add group for highest level block
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
      
      // Add direct label node for high level block (not using titleNode type)
      nodes.push({
        id: `high-label-${highIndex}`,
        // Use default node type with custom styling instead of titleNode
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
      
      // Process intermediate blocks
      if (highBlock.IntermediateBlocks && highBlock.IntermediateBlocks.length > 0) {
        // Less initial spacing from the top
        let intermediateYPosition = 50; 
        
        highBlock.IntermediateBlocks.forEach((intBlock, intIndex) => {
          // Get dimensions from our pre-calculated details
          const intermediateDetail = intermediateDetails[intIndex];
          const intermediateBlockHeight = intermediateDetail.height;
          const intermediateBlockWidth = intermediateDetail.width;
          
          // Add group for intermediate block - more centered
          const intermediateGroupId = `int-group-${highIndex}-${intIndex}`;
          nodes.push({
            id: intermediateGroupId,
            type: 'group',
            position: { 
              x: (highLevelWidth - intermediateBlockWidth) / 2, // Center horizontally
              y: intermediateYPosition 
            },
            style: { 
              width: intermediateBlockWidth, 
              height: intermediateBlockHeight,
              backgroundColor: `${colors.intermediate}B3`, // 70% opacity
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
          
          // Add direct label node for intermediate block (not using titleNode type)
          nodes.push({
            id: `int-label-${highIndex}-${intIndex}`,
            // Use default node type with custom styling instead of titleNode
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
          
          // Process granular blocks with strict VERTICAL layout
          if (intBlock.GranularBlocks && intBlock.GranularBlocks.length > 0 && Array.isArray(intBlock.GranularBlocks)) {
            // Vertical stacking of granular blocks
            const granularSpacing = 130; // Space between granular nodes
            const startY = 50; // Start after the title
            const centerX = intermediateBlockWidth / 2; // Center horizontally
            
            intBlock.GranularBlocks.forEach((block, blockIndex) => {
              const verticalPosition = startY + (blockIndex * granularSpacing);
              
              const granularNodeId = `gran-${block.ID}`;
              nodes.push({
                id: granularNodeId,
                type: 'granularNode',
                position: { 
                  x: centerX - 55, // Centered (110px node width / 2)
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
                  width: 110 // Fixed width for circles
                }
              });
              
              // Add edges between granular blocks based on FeedsInto property
              if (block.FeedsInto && Array.isArray(block.FeedsInto) && block.FeedsInto.length > 0) {
                block.FeedsInto.forEach(targetId => {
                  // Check if the target exists in our blocks
                  if (allGranularBlocks.has(targetId)) {
                    edges.push({
                      id: `edge-${block.ID}-${targetId}`,
                      source: granularNodeId,
                      target: `gran-${targetId}`,
                      type: 'bezier',
                      animated: true,
                      style: { stroke: '#555', strokeWidth: 1.5 }, // Thinner edges
                      markerEnd: {
                        type: 'arrowclosed',
                        color: '#555',
                        width: 10, // Smaller arrows
                        height: 10  // Smaller arrows
                      }
                    });
                  }
                });
              }
            });
          }
          
          // Update y position for next intermediate block with minimal spacing
          intermediateYPosition += intermediateBlockHeight + 30;
        });
      }
      
      // Move to the next highest level block position
      highestLevelXPosition += highLevelWidth + highestLevelXGap;
    });
    
    return { nodes, edges };
  };
  
  export default processJsonToFlow;