import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Map generation constants
const CELL_SIZE = 20;
const WALL = 0;
const FLOOR = 1;
const DOOR = 2;
const TREASURE = 3;
const TRAP = 4;
const MONSTER = 5;

// Map themes configuration
const MAP_THEMES = {
  dungeon: {
    name: '🏰 Dungeon',
    colors: {
      wall: '#2d3748',
      floor: '#e2e8f0',
      door: '#8b4513',
      treasure: '#ffd700',
      trap: '#dc2626',
      monster: '#7c2d12',
      background: '#1a202c'
    },
    roomStyle: 'rectangular',
    description: 'Classic stone dungeon'
  },
  cave: {
    name: '🕳️ Cave',
    colors: {
      wall: '#4a5568',
      floor: '#f7fafc',
      door: '#a0aec0',
      treasure: '#ffd700',
      trap: '#e53e3e',
      monster: '#744210',
      background: '#2d3748'
    },
    roomStyle: 'irregular',
    description: 'Natural cave system'
  },
  castle: {
    name: '🏯 Castle',
    colors: {
      wall: '#4a5568',
      floor: '#f1f5f9',
      door: '#92400e',
      treasure: '#f59e0b',
      trap: '#dc2626',
      monster: '#991b1b',
      background: '#374151'
    },
    roomStyle: 'formal',
    description: 'Medieval fortress'
  },
  camp: {
    name: '🏕️ Outdoor Camp',
    colors: {
      wall: '#065f46',
      floor: '#ecfdf5',
      door: '#059669',
      treasure: '#fbbf24',
      trap: '#dc2626',
      monster: '#7c2d12',
      background: '#064e3b'
    },
    roomStyle: 'organic',
    description: 'Wilderness campsite'
  }
};

// Enhanced Map generation utilities
class MapGenerator {
  constructor(width, height, theme = 'dungeon') {
    this.width = width;
    this.height = height;
    this.theme = theme;
    this.grid = Array(height).fill().map(() => Array(width).fill(WALL));
    this.rooms = [];
    this.interactiveElements = [];
  }

  // Generate room with theme-specific shapes
  generateRoom(minSize = 4, maxSize = 10) {
    const themeConfig = MAP_THEMES[this.theme];
    let width, height, x, y;

    switch (themeConfig.roomStyle) {
      case 'irregular':
        // Cave-style irregular rooms
        width = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        height = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        break;
      case 'formal':
        // Castle-style formal rooms (more rectangular)
        width = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize + 2;
        height = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        break;
      case 'organic':
        // Camp-style organic shapes
        width = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        height = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        break;
      default:
        // Standard rectangular
        width = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
        height = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    }

    x = Math.floor(Math.random() * (this.width - width - 2)) + 1;
    y = Math.floor(Math.random() * (this.height - height - 2)) + 1;

    // Check overlaps
    for (let room of this.rooms) {
      if (x < room.x + room.width + 1 && 
          x + width + 1 > room.x && 
          y < room.y + room.height + 1 && 
          y + height + 1 > room.y) {
        return null;
      }
    }

    return { x, y, width, height };
  }

  // Enhanced room carving with theme variations and advanced shapes
  carveRoom(room) {
    const themeConfig = MAP_THEMES[this.theme];
    
    if (themeConfig.roomStyle === 'irregular') {
      // Cave-style irregular carving with more organic shapes
      this.carveIrregularRoom(room);
    } else if (themeConfig.roomStyle === 'formal') {
      // Castle-style with possible circular rooms
      if (Math.random() > 0.7 && room.width >= 6 && room.height >= 6) {
        this.carveCircularRoom(room);
      } else {
        this.carveStandardRoom(room);
      }
    } else if (themeConfig.roomStyle === 'organic') {
      // Camp-style with organic shapes
      this.carveOrganicRoom(room);
    } else {
      // Standard rectangular carving
      this.carveStandardRoom(room);
    }
  }

  carveStandardRoom(room) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        this.grid[y][x] = FLOOR;
      }
    }
  }

  carveIrregularRoom(room) {
    const centerX = room.x + room.width / 2;
    const centerY = room.y + room.height / 2;
    const maxRadius = Math.min(room.width, room.height) / 2;
    
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const noise = (Math.random() - 0.5) * 2; // Random noise for irregular edges
        if (distance <= maxRadius + noise) {
          this.grid[y][x] = FLOOR;
        }
      }
    }
  }

  carveCircularRoom(room) {
    const centerX = room.x + room.width / 2;
    const centerY = room.y + room.height / 2;
    const radius = Math.min(room.width, room.height) / 2 - 1;
    
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (distance <= radius) {
          this.grid[y][x] = FLOOR;
        }
      }
    }
  }

  carveOrganicRoom(room) {
    // Organic shape with rounded corners
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        const isCorner = (x === room.x || x === room.x + room.width - 1) && 
                        (y === room.y || y === room.y + room.height - 1);
        
        if (!isCorner || Math.random() > 0.6) {
          this.grid[y][x] = FLOOR;
        }
      }
    }
  }

  // Enhanced corridor creation
  createCorridor(x1, y1, x2, y2) {
    const themeConfig = MAP_THEMES[this.theme];
    let currentX = x1;
    let currentY = y1;

    if (themeConfig.roomStyle === 'organic') {
      // Organic/winding corridors for camps
      while (currentX !== x2 || currentY !== y2) {
        this.grid[currentY][currentX] = FLOOR;
        
        // More organic movement
        if (Math.abs(currentX - x2) > Math.abs(currentY - y2)) {
          currentX += currentX < x2 ? 1 : -1;
        } else {
          currentY += currentY < y2 ? 1 : -1;
        }
      }
    } else {
      // Standard L-shaped corridors
      while (currentX !== x2) {
        this.grid[currentY][currentX] = FLOOR;
        currentX += currentX < x2 ? 1 : -1;
      }
      while (currentY !== y2) {
        this.grid[currentY][currentX] = FLOOR;
        currentY += currentY < y2 ? 1 : -1;
      }
    }
    this.grid[currentY][currentX] = FLOOR;
  }

  getRoomCenter(room) {
    return {
      x: Math.floor(room.x + room.width / 2),
      y: Math.floor(room.y + room.height / 2)
    };
  }

  addDoors() {
    for (let room of this.rooms) {
      const walls = [
        ...Array(room.width).fill().map((_, i) => ({ x: room.x + i, y: room.y - 1 })),
        ...Array(room.width).fill().map((_, i) => ({ x: room.x + i, y: room.y + room.height })),
        ...Array(room.height).fill().map((_, i) => ({ x: room.x - 1, y: room.y + i })),
        ...Array(room.height).fill().map((_, i) => ({ x: room.x + room.width, y: room.y + i }))
      ];

      for (let wall of walls) {
        if (wall.x >= 0 && wall.x < this.width && wall.y >= 0 && wall.y < this.height) {
          if (this.grid[wall.y][wall.x] === FLOOR) {
            if (wall.y === room.y - 1) this.grid[room.y][wall.x] = DOOR;
            if (wall.y === room.y + room.height) this.grid[room.y + room.height - 1][wall.x] = DOOR;
            if (wall.x === room.x - 1) this.grid[wall.y][room.x] = DOOR;
            if (wall.x === room.x + room.width) this.grid[wall.y][room.x + room.width - 1] = DOOR;
          }
        }
      }
    }
  }

  // Add interactive elements
  addInteractiveElement(type, x, y) {
    if (this.grid[y] && this.grid[y][x] === FLOOR) {
      this.interactiveElements.push({ type, x, y, id: Date.now() + Math.random() });
      return true;
    }
    return false;
  }

  removeInteractiveElement(x, y) {
    this.interactiveElements = this.interactiveElements.filter(
      element => !(element.x === x && element.y === y)
    );
  }

  generate(roomCount = 8) {
    // Generate rooms
    let attempts = 0;
    while (this.rooms.length < roomCount && attempts < 100) {
      const room = this.generateRoom();
      if (room) {
        this.rooms.push(room);
        this.carveRoom(room);
      }
      attempts++;
    }

    // Connect rooms
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const room1 = this.getRoomCenter(this.rooms[i]);
      const room2 = this.getRoomCenter(this.rooms[i + 1]);
      this.createCorridor(room1.x, room1.y, room2.x, room2.y);
    }

    // Add random connections
    if (this.rooms.length > 3) {
      for (let i = 0; i < 2; i++) {
        const room1 = this.getRoomCenter(this.rooms[Math.floor(Math.random() * this.rooms.length)]);
        const room2 = this.getRoomCenter(this.rooms[Math.floor(Math.random() * this.rooms.length)]);
        this.createCorridor(room1.x, room1.y, room2.x, room2.y);
      }
    }

    this.addDoors();
    return { 
      grid: this.grid, 
      rooms: this.rooms, 
      width: this.width, 
      height: this.height, 
      interactiveElements: this.interactiveElements,
      theme: this.theme 
    };
  }
}

// Enhanced Canvas renderer component with mobile support
const MapCanvas = React.forwardRef(({ mapData, onCanvasClick, selectedTool }, ref) => {
  const canvasRef = ref || useRef(null);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!mapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { grid, width, height, interactiveElements, theme } = mapData;
    const colors = MAP_THEMES[theme].colors;

    canvas.width = width * CELL_SIZE;
    canvas.height = height * CELL_SIZE;

    // Clear and apply transformations
    ctx.save();
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.translate(panX, panY);
    ctx.scale(scale, scale);

    // Draw grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellType = grid[y][x];
        const pixelX = x * CELL_SIZE;
        const pixelY = y * CELL_SIZE;

        switch (cellType) {
          case WALL:
            ctx.fillStyle = colors.wall;
            break;
          case FLOOR:
            ctx.fillStyle = colors.floor;
            break;
          case DOOR:
            ctx.fillStyle = colors.door;
            break;
          default:
            ctx.fillStyle = colors.background;
        }

        ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);

        // Draw grid lines
        ctx.strokeStyle = theme === 'cave' ? '#60779560' : '#55555560';
        ctx.lineWidth = 0.5 / scale; // Adjust line width for scale
        ctx.strokeRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw interactive elements
    interactiveElements.forEach(element => {
      const pixelX = element.x * CELL_SIZE;
      const pixelY = element.y * CELL_SIZE;
      
      ctx.fillStyle = colors[element.type] || colors.treasure;
      ctx.beginPath();
      ctx.arc(pixelX + CELL_SIZE/2, pixelY + CELL_SIZE/2, CELL_SIZE/3, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add symbol
      ctx.fillStyle = 'white';
      ctx.font = `${12/scale}px Arial`; // Adjust font size for scale
      ctx.textAlign = 'center';
      const symbols = { treasure: '💰', trap: '⚠️', monster: '👹' };
      ctx.fillText(symbols[element.type] || '?', pixelX + CELL_SIZE/2, pixelY + CELL_SIZE/2 + 4/scale);
    });

    // Draw room numbers
    ctx.fillStyle = theme === 'cave' ? '#94a3b8' : '#666';
    ctx.font = `${12/scale}px Arial`;
    ctx.textAlign = 'center';
    mapData.rooms.forEach((room, index) => {
      const centerX = (room.x + room.width / 2) * CELL_SIZE;
      const centerY = (room.y + room.height / 2) * CELL_SIZE + 4/scale;
      ctx.fillText(`R${index + 1}`, centerX, centerY);
    });

    ctx.restore();
  }, [mapData, scale, panX, panY]);

  const getEventCoordinates = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const clientX = event.clientX || (event.touches && event.touches[0]?.clientX) || 0;
    const clientY = event.clientY || (event.touches && event.touches[0]?.clientY) || 0;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor(((clientX - rect.left) * scaleX - panX) / (CELL_SIZE * scale));
    const y = Math.floor(((clientY - rect.top) * scaleY - panY) / (CELL_SIZE * scale));
    
    return { x, y };
  };

  const handleInteraction = (event) => {
    if (!onCanvasClick || !selectedTool || isDragging) return;
    
    const { x, y } = getEventCoordinates(event);
    onCanvasClick(x, y);
  };

  // Touch event handlers for mobile
  const handleTouchStart = (event) => {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      setLastTouch({ x: touch.clientX, y: touch.clientY });
      setIsDragging(false);
    }
  };

  const handleTouchMove = (event) => {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const deltaX = touch.clientX - lastTouch.x;
      const deltaY = touch.clientY - lastTouch.y;
      
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        setIsDragging(true);
        setPanX(prev => prev + deltaX);
        setPanY(prev => prev + deltaY);
      }
      
      setLastTouch({ x: touch.clientX, y: touch.clientY });
    } else if (event.touches.length === 2) {
      // Pinch to zoom
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (!handleTouchMove.lastDistance) {
        handleTouchMove.lastDistance = distance;
      } else {
        const scaleChange = distance / handleTouchMove.lastDistance;
        setScale(prev => Math.max(0.5, Math.min(3, prev * scaleChange)));
        handleTouchMove.lastDistance = distance;
      }
    }
  };

  const handleTouchEnd = (event) => {
    event.preventDefault();
    handleTouchMove.lastDistance = null;
    
    if (!isDragging && event.changedTouches.length === 1) {
      // This was a tap, not a drag
      setTimeout(() => handleInteraction(event.changedTouches[0]), 50);
    }
    
    setTimeout(() => setIsDragging(false), 100);
  };

  // Mouse event handlers for desktop
  const handleMouseDown = (event) => {
    setLastTouch({ x: event.clientX, y: event.clientY });
    setIsDragging(false);
  };

  const handleMouseMove = (event) => {
    if (event.buttons === 1) { // Left mouse button held
      const deltaX = event.clientX - lastTouch.x;
      const deltaY = event.clientY - lastTouch.y;
      
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setIsDragging(true);
        setPanX(prev => prev + deltaX);
        setPanY(prev => prev + deltaY);
      }
      
      setLastTouch({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = (event) => {
    if (!isDragging) {
      handleInteraction(event);
    }
    setTimeout(() => setIsDragging(false), 50);
  };

  const handleWheel = (event) => {
    event.preventDefault();
    const scaleChange = event.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev * scaleChange)));
  };

  const resetView = () => {
    setScale(1);
    setPanX(0);
    setPanY(0);
  };

  return (
    <div className="border-2 border-gray-300 inline-block bg-gray-100 p-4 rounded-lg shadow-lg">
      <div className="mb-2 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Zoom: {Math.round(scale * 100)}% | {window.innerWidth <= 768 ? 'Touch to pan/zoom' : 'Click/drag to pan, scroll to zoom'}
        </span>
        <button
          onClick={resetView}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition"
        >
          Reset View
        </button>
      </div>
      <canvas 
        ref={canvasRef}
        onClick={handleMouseUp}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="border border-gray-400 rounded cursor-pointer touch-none"
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          touchAction: 'none' // Prevent default touch behaviors
        }}
      />
    </div>
  );
});

// Export functionality
const useMapExport = () => {
  const exportToPNG = (canvasRef, filename = 'dnd-map') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png', 1.0);
  };

  const exportToPDF = async (canvasRef, filename = 'dnd-map') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    try {
      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF export failed, falling back to PNG:', error);
      alert('PDF export unavailable, downloading PNG instead');
      exportToPNG(canvasRef, filename);
    }
  };

  return { exportToPNG, exportToPDF };
};

// Main App component
const App = () => {
  const [mapData, setMapData] = useState(null);
  const [mapWidth, setMapWidth] = useState(40);
  const [mapHeight, setMapHeight] = useState(30);
  const [roomCount, setRoomCount] = useState(8);
  const [selectedTheme, setSelectedTheme] = useState('dungeon');
  const [selectedTool, setSelectedTool] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const canvasRef = useRef(null);
  const { exportToPNG, exportToPDF } = useMapExport();

  const generateMap = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generator = new MapGenerator(mapWidth, mapHeight, selectedTheme);
      const newMap = generator.generate(roomCount);
      setMapData(newMap);
      setIsGenerating(false);
    }, 100);
  };

  const handleCanvasClick = (x, y) => {
    if (!selectedTool || !mapData) return;
    
    const generator = new MapGenerator(mapData.width, mapData.height, mapData.theme);
    generator.grid = mapData.grid.map(row => [...row]);
    generator.rooms = [...mapData.rooms];
    generator.interactiveElements = [...mapData.interactiveElements];
    
    if (selectedTool === 'remove') {
      generator.removeInteractiveElement(x, y);
    } else {
      generator.addInteractiveElement(selectedTool, x, y);
    }
    
    setMapData({
      ...mapData,
      interactiveElements: generator.interactiveElements
    });
  };

  useEffect(() => {
    generateMap();
  }, []);

  useEffect(() => {
    generateMap();
  }, [selectedTheme]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wide">
            🐉 D&D Map Generator Pro
          </h1>
          <p className="text-xl text-purple-200 mb-6">
            Generate procedural maps with themes, interactive elements, and export capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <div className="xl:col-span-1 space-y-6">
            {/* Theme Selection */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">🎨 Map Theme</h3>
              <div className="space-y-2">
                {Object.entries(MAP_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTheme(key)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedTheme === key 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white/20 text-purple-200 hover:bg-white/30'
                    }`}
                  >
                    <div className="font-medium">{theme.name}</div>
                    <div className="text-sm opacity-75">{theme.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Tools */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">🛠️ Interactive Tools</h3>
              <div className="space-y-2">
                {[
                  { key: 'treasure', label: '💰 Add Treasure', color: 'yellow' },
                  { key: 'trap', label: '⚠️ Add Trap', color: 'red' },
                  { key: 'monster', label: '👹 Add Monster', color: 'orange' },
                  { key: 'remove', label: '🗑️ Remove Element', color: 'gray' }
                ].map(tool => (
                  <button
                    key={tool.key}
                    onClick={() => setSelectedTool(selectedTool === tool.key ? null : tool.key)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedTool === tool.key 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white/20 text-purple-200 hover:bg-white/30'
                    }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
              {selectedTool && (
                <p className="text-purple-200 text-sm mt-2">
                  Click on the map to {selectedTool === 'remove' ? 'remove elements' : `add ${selectedTool}`}
                </p>
              )}
            </div>

            {/* Generation Controls */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">⚙️ Generation</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Map Width: {mapWidth} cells
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={mapWidth}
                    onChange={(e) => setMapWidth(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Map Height: {mapHeight} cells
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="50"
                    value={mapHeight}
                    onChange={(e) => setMapHeight(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Room Count: {roomCount} rooms
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="15"
                    value={roomCount}
                    onChange={(e) => setRoomCount(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <button
                  onClick={generateMap}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg"
                >
                  {isGenerating ? '🎲 Generating...' : '🎲 Generate New Map'}
                </button>
              </div>
            </div>

            {/* Export Controls */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-white text-lg font-semibold mb-4">💾 Export Map</h3>
              <div className="space-y-2">
                <button
                  onClick={() => exportToPNG(canvasRef, `dnd-map-${selectedTheme}`)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  📸 Export PNG
                </button>
                <button
                  onClick={() => exportToPDF(canvasRef, `dnd-map-${selectedTheme}`)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  📄 Export PDF
                </button>
              </div>
            </div>
          </div>

          {/* Map Display */}
          <div className="xl:col-span-3">
            <div className="text-center">
              {mapData ? (
                <div className="inline-block">
                  <MapCanvas 
                    mapData={mapData} 
                    onCanvasClick={handleCanvasClick}
                    selectedTool={selectedTool}
                    ref={canvasRef}
                  />
                  <div className="mt-4 text-white">
                    <p className="text-lg">
                      🏰 {MAP_THEMES[selectedTheme].name} • 
                      📏 {mapData.width}×{mapData.height} grid • 
                      🏠 {mapData.rooms.length} rooms • 
                      ⭐ {mapData.interactiveElements.length} elements
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 border border-white/20">
                  <div className="text-white text-xl">🎲 Generating your {MAP_THEMES[selectedTheme].name.toLowerCase()}...</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-white text-lg font-semibold mb-4">📋 Map Legend</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border border-gray-400 rounded" style={{backgroundColor: MAP_THEMES[selectedTheme].colors.floor}}></div>
              <span>Floor</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border border-gray-400 rounded" style={{backgroundColor: MAP_THEMES[selectedTheme].colors.door}}></div>
              <span>Doors</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border border-gray-400 rounded" style={{backgroundColor: MAP_THEMES[selectedTheme].colors.wall}}></div>
              <span>Walls</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-yellow-500 border border-gray-400 rounded"></div>
              <span>💰 Treasure</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-600 border border-gray-400 rounded"></div>
              <span>⚠️ Traps</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-orange-800 border border-gray-400 rounded"></div>
              <span>👹 Monsters</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;