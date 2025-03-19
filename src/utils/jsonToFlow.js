// utils/jsonToFlow.js
const processJsonToFlow = (jsonData, onRemoveSystem, position = { x: 0, y: 0 }, systemId = 'system') => {
  if (!jsonData || !jsonData.HighestLevelBlocks) {
    return { nodes: [], edges: [], width: 0, height: 0 };
  }

  console.log(`Processing system ${systemId} with offset:`, position);

  const nodes = [];
  const edges = [];
  
  // Base colors
  const colors = {
    system: '#B8C1AA', // System color (same as navbar)
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
    system: getDarkerColor(colors.system, 20),
    highLevel: getDarkerColor(colors.highLevel, 20),
    intermediate: getDarkerColor(colors.intermediate, 20),
    granular: getDarkerColor(colors.granular, 20)
  };
  
  // Even darker colors for borders
  const borderColors = {
    system: getDarkerColor(colors.system, 40),
    highLevel: getDarkerColor(colors.highLevel, 40),
    intermediate: getDarkerColor(colors.intermediate, 40),
    granular: getDarkerColor(colors.granular, 40)
  };
  
  // Helper to prefix IDs with systemId to prevent collisions between multiple systems
  const prefixId = (id) => `${systemId}-${id}`;
  
  // Create a map of all granular blocks for reference
  const allGranularBlocks = new Map();
  jsonData.HighestLevelBlocks.forEach(highBlock => {
    highBlock.IntermediateBlocks?.forEach(intBlock => {
      intBlock.GranularBlocks?.forEach(granBlock => {
        allGranularBlocks.set(granBlock.ID, granBlock);
      });
    });
  });
  
  // Analyze all blocks first to determine the overall size needed for the system group
  let totalSystemWidth = 0;
  let totalSystemHeight = 0;
  const highLevelDetails = [];
  
  // Starting positions for the highest level blocks - used for calculations first
  let highestLevelXPosition = 50;
  const highestLevelYPosition = 50;
  const highestLevelXGap = 150; // Gap between highest level blocks
  
  // First pass - calculate sizes of all blocks to determine system group size
  jsonData.HighestLevelBlocks.forEach((highBlock) => {
    const intermediateDetails = [];
    
    if (highBlock.IntermediateBlocks) {
      highBlock.IntermediateBlocks.forEach((intBlock) => {
        const granularBlockCount = intBlock.GranularBlocks?.length || 0;
        
        // Add data for each intermediate block
        intermediateDetails.push({
          granularCount: granularBlockCount,
          height: granularBlockCount === 0 ? 120 : (granularBlockCount * 130 + 60),
          width: 250
        });
      });
    }
    
    // Calculate high level dimensions
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
    
    // Move position for next block calculation
    highestLevelXPosition += highLevelWidth + highestLevelXGap;
  });
  
  // Calculate total system size - find the rightmost edge and bottom edge
  if (highLevelDetails.length > 0) {
    const lastHighLevelBlock = highLevelDetails[highLevelDetails.length - 1];
    totalSystemWidth = lastHighLevelBlock.xPosition + lastHighLevelBlock.width + 50; // Add padding
    totalSystemHeight = Math.max(...highLevelDetails.map(d => d.height)) + highestLevelYPosition + 50; // Add padding
  } else {
    totalSystemWidth = 500; // Default size if no blocks
    totalSystemHeight = 300;
  }
  
  // Create the system group that encompasses everything
  // Apply the position offset directly to the system group
  const systemGroupId = prefixId('system-group');
  nodes.push({
    id: systemGroupId,
    type: 'group',
    position: position, // Use the provided position directly
    style: { 
      width: totalSystemWidth, 
      height: totalSystemHeight,
      backgroundColor: 'transparent',
      borderColor: colors.system,
      borderWidth: 5, // 1px thicker than high level groups (4px)
      borderStyle: 'solid', // Straight lines, not dashed
      borderRadius: 10,
      padding: 0
    },
    data: { 
      label: jsonData.SystemName || 'System',
      level: 'system',
      systemId: systemId
    },
    draggable: true, // Make only system groups draggable
  });
  
  // Add title for the system group
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
      fontSize: '1rem' // Slightly larger than high level blocks
    },
    data: {
      label: jsonData.SystemName || 'System'
    },
    sourcePosition: null,
    targetPosition: null
  });
  
  // Add remove button at the top right with direct reference to callback
  nodes.push({
    id: prefixId('remove-system-button'),
    type: 'removeButton', // Custom node type
    position: { x: totalSystemWidth - 45, y: 10 }, // Position at top right, with some margin
    parentNode: systemGroupId,
    selectable: false,
    draggable: false,
    connectable: false,
    data: {
      label: '×',
      onRemove: onRemoveSystem, // Directly pass the callback function
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
  
  // Add drag handle at the top left
  nodes.push({
    id: prefixId('drag-handle'),
    type: 'dragHandle', // Custom node type
    position: { x: 0, y: 0 }, // Position at top left corner
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
  
  // Reset the position for actual creation of high level blocks
  highestLevelXPosition = 50;
  
  // Process all highest level blocks
  jsonData.HighestLevelBlocks.forEach((highBlock, highIndex) => {
    // Store high level block name for reference
    const highLevelGroupName = highBlock.HighestLevelBlockName;
    const isInteractionGroup = highLevelGroupName === 'Interaction';
    
    // First, analyze intermediate blocks for better sizing
    const intermediateDetails = [];
    
    if (highBlock.IntermediateBlocks) {
      highBlock.IntermediateBlocks.forEach((intBlock) => {
        const granularBlockCount = intBlock.GranularBlocks?.length || 0;
        
        // Add data for each intermediate block
        intermediateDetails.push({
          granularCount: granularBlockCount,
          height: granularBlockCount === 0 ? 120 : (granularBlockCount * 130 + 60),
          width: 250
        });
      });
    }
    
    // Calculate high level dimensions based on intermediates
    const highLevelWidth = intermediateDetails.length > 0 
      ? Math.max(350, ...intermediateDetails.map(d => d.width)) + 80 
      : 350;
    
    // Calculate total height needed for intermediate blocks with minimal spacing
    const totalHeight = intermediateDetails.reduce((sum, detail) => sum + detail.height + 30, 0);
    const highLevelHeight = Math.max(180, totalHeight + 60);
    
    // Add group for highest level block - now a child of the system group
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
        borderWidth: 4, // Thicker border for higher level groups
        borderStyle: 'dashed',
        borderRadius: 8,
        padding: 0
      },
      draggable: false, // Explicitly set high level blocks to be non-draggable
      parentNode: systemGroupId, // Make it a child of the system group
      data: { 
        label: highLevelGroupName,
        level: 'highest',
        systemId: systemId
      }
    });
    
    // Add title node for high level block with darker color - remove handles
    nodes.push({
      id: prefixId(`high-label-${highIndex}`),
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
        label: highLevelGroupName,
        systemId: systemId
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
        const intermediateGroupId = prefixId(`int-group-${highIndex}-${intIndex}`);
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
            level: 'intermediate',
            systemId: systemId,
            highLevelGroup: highLevelGroupName
          }
        });
        
        // Add title node for intermediate block with darker color - remove handles
        nodes.push({
          id: prefixId(`int-label-${highIndex}-${intIndex}`),
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
            label: intBlock.IntermediateBlockName,
            systemId: systemId,
            highLevelGroup: highLevelGroupName
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
            
            const granularNodeId = prefixId(`gran-${block.ID}`);
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
                color: colors.granular,
                systemId: systemId,
                highLevelGroup: highLevelGroupName // Add high-level group name to data
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
                  // Apply different styling for edges coming from Interaction group
                  // Create the edge with appropriate styling
                  let edgeConfig = {
                    id: prefixId(`edge-${block.ID}-${targetId}`),
                    source: granularNodeId,
                    target: prefixId(`gran-${targetId}`),
                    type: 'bezier', // Use bezier for all lines
                    animated: isInteractionGroup ? false : true, // No animation for Interaction edges
                    style: { 
                      stroke: '#555', 
                      strokeWidth: 1.5
                    },
                    data: {
                      systemId: systemId,
                      highLevelGroup: highLevelGroupName, // Add high-level group name to edge data
                      isInteractionEdge: isInteractionGroup // Flag to identify interaction edges
                    },
                    zIndex: isInteractionGroup ? 500 : 1000 // Lower z-index for Interaction edges, higher for arrows
                  };
                  
                  // Only add arrow marker for non-Interaction edges
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
        
        // Update y position for next intermediate block with minimal spacing
        intermediateYPosition += intermediateBlockHeight + 30;
      });
    }
    
    // Move to the next highest level block position
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