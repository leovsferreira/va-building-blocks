// utils/jsonToFlow.js
const processJsonToFlow = (jsonData) => {
    if (!jsonData || !jsonData.HighestLevelBlocks) {
      return { nodes: [], edges: [] };
    }
  
    const nodes = [];
    const edges = [];
    
    // Base colors
    const colors = {
      highLevel: '#C1B8AA', // Higher level block color
      intermediate: '#AAB8C1', // Intermediate block color
      granular: '#B8AAC1' // Granular block color
    };
    
    // Calculate darker colors for titles
    const getDarkerColor = (colorHex, amount = 30) => {
      const hex = colorHex.replace(/^#/, '');
      const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
      const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
      const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };
    
    // Darker colors for title backgrounds
    const titleColors = {
      highLevel: getDarkerColor(colors.highLevel, 20),
      intermediate: getDarkerColor(colors.intermediate, 20),
      granular: getDarkerColor(colors.granular, 20)
    };
    
    // Even darker colors for borders
    const borderColors = {
      highLevel: getDarkerColor(colors.highLevel, 40),
      intermediate: getDarkerColor(colors.intermediate, 40),
      granular: getDarkerColor(colors.granular, 40)
    };
    
    // Create a map of all granular blocks for reference
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
          borderWidth: 4, // Thicker border for higher level groups
          borderStyle: 'dashed',
          borderRadius: 8,
          padding: 0
        },
        data: { 
          label: highBlock.HighestLevelBlockName,
          level: 'highest'
        }
      });
      
      // Add title node for high level block with darker color - remove handles
      nodes.push({
        id: `high-label-${highIndex}`,
        type: 'default',
        position: { x: 0, y: 0 },
        parentNode: highLevelGroupId,
        selectable: false,
        draggable: false,
        connectable: false, // Prevent connecting to this node
        style: {
          backgroundColor: titleColors.highLevel, // Darker shade of the high level color
          color: 'white',
          padding: '8px 16px',
          borderBottomRightRadius: '8px',
          borderTopLeftRadius: '8px',
          borderRight: `2px solid ${borderColors.highLevel}`, // Darker border
          borderBottom: `2px solid ${borderColors.highLevel}`, // Darker border
          fontWeight: 'bold',
          width: 'auto',
          minWidth: '150px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 999,
          fontSize: '0.95rem' // Increased font size
        },
        data: {
          label: highBlock.HighestLevelBlockName
        },
        // Hide all handles
        sourcePosition: null,
        targetPosition: null
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
          
          // Add title node for intermediate block with darker color - remove handles
          nodes.push({
            id: `int-label-${highIndex}-${intIndex}`,
            type: 'default',
            position: { x: 0, y: 0 },
            parentNode: intermediateGroupId,
            selectable: false,
            draggable: false,
            connectable: false, // Prevent connecting to this node
            style: {
              backgroundColor: titleColors.intermediate, // Darker shade of intermediate color
              color: 'white',
              padding: '6px 12px',
              borderBottomRightRadius: '6px',
              borderTopLeftRadius: '6px',
              borderRight: `2px solid ${borderColors.intermediate}`, // Darker border
              borderBottom: `2px solid ${borderColors.intermediate}`, // Darker border
              fontWeight: 'bold',
              width: 'auto',
              minWidth: '120px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 999,
              fontSize: '0.9rem' // Increased font size
            },
            data: {
              label: intBlock.IntermediateBlockName
            },
            // Hide all handles
            sourcePosition: null,
            targetPosition: null
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
                      style: { 
                        stroke: '#555', 
                        strokeWidth: 1.5,
                        zIndex: 9999 // Very high z-index for edges
                      },
                      markerEnd: {
                        type: 'arrowclosed',
                        color: '#555',
                        width: 10, // Smaller arrows
                        height: 10  // Smaller arrows
                      },
                      zIndex: 9999 // Very high z-index for edges
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