import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Map generation constants
const CELL_SIZE = 20;
const WALL = 0;
const FLOOR = 1;
const DOOR = 2;

// Map generation utilities
class MapGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = Array(height).fill().map(() => Array(width).fill(WALL));
    this.rooms = [];
  }

  // Generate a random room that doesn't overlap with existing rooms
  generateRoom(minSize = 4, maxSize = 10) {
    const width = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const height = Math.floor(Math.random() * (maxSize - minSize + 1)) + minSize;
    const x = Math.floor(Math.random() * (this.width - width - 2)) + 1;
    const y = Math.floor(Math.random() * (this.height - height - 2)) + 1;

    // Check if room overlaps with existing rooms
    for (let room of this.rooms) {
      if (x < room.x + room.width + 1 && 
          x + width + 1 > room.x && 
          y < room.y + room.height + 1 && 
          y + height + 1 > room.y) {
        return null; // Overlaps
      }
    }

    return { x, y, width, height };
  }

  // Carve out a room in the grid
  carveRoom(room) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        this.grid[y][x] = FLOOR;
      }
    }
  }

  // Create a corridor between two points
  createCorridor(x1, y1, x2, y2) {
    let currentX = x1;
    let currentY = y1;

    // Move horizontally first
    while (currentX !== x2) {
      this.grid[currentY][currentX] = FLOOR;
      currentX += currentX < x2 ? 1 : -1;
    }

    // Then move vertically
    while (currentY !== y2) {
      this.grid[currentY][currentX] = FLOOR;
      currentY += currentY < y2 ? 1 : -1;
    }
    this.grid[currentY][currentX] = FLOOR;
  }

  // Get center point of a room
  getRoomCenter(room) {
    return {
      x: Math.floor(room.x + room.width / 2),
      y: Math.floor(room.y + room.height / 2)
    };
  }

  // Add doors to room entrances
  addDoors() {
    for (let room of this.rooms) {
      // Check each wall of the room for potential door placement
      const walls = [
        // Top wall
        ...Array(room.width).fill().map((_, i) => ({ x: room.x + i, y: room.y - 1 })),
        // Bottom wall
        ...Array(room.width).fill().map((_, i) => ({ x: room.x + i, y: room.y + room.height })),
        // Left wall
        ...Array(room.height).fill().map((_, i) => ({ x: room.x - 1, y: room.y + i })),
        // Right wall
        ...Array(room.height).fill().map((_, i) => ({ x: room.x + room.width, y: room.y + i }))
      ];

      // Find walls adjacent to corridors and place doors
      for (let wall of walls) {
        if (wall.x >= 0 && wall.x < this.width && wall.y >= 0 && wall.y < this.height) {
          if (this.grid[wall.y][wall.x] === FLOOR) {
            // Place door at room edge
            if (wall.y === room.y - 1) this.grid[room.y][wall.x] = DOOR;
            if (wall.y === room.y + room.height) this.grid[room.y + room.height - 1][wall.x] = DOOR;
            if (wall.x === room.x - 1) this.grid[wall.y][room.x] = DOOR;
            if (wall.x === room.x + room.width) this.grid[wall.y][room.x + room.width - 1] = DOOR;
          }
        }
      }
    }
  }

  // Main generation method
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

    // Connect rooms with corridors
    for (let i = 0; i < this.rooms.length - 1; i++) {
      const room1 = this.getRoomCenter(this.rooms[i]);
      const room2 = this.getRoomCenter(this.rooms[i + 1]);
      this.createCorridor(room1.x, room1.y, room2.x, room2.y);
    }

    // Add some random connections for more interesting layouts
    if (this.rooms.length > 3) {
      for (let i = 0; i < 2; i++) {
        const room1 = this.getRoomCenter(this.rooms[Math.floor(Math.random() * this.rooms.length)]);
        const room2 = this.getRoomCenter(this.rooms[Math.floor(Math.random() * this.rooms.length)]);
        this.createCorridor(room1.x, room1.y, room2.x, room2.y);
      }
    }

    this.addDoors();
    return { grid: this.grid, rooms: this.rooms, width: this.width, height: this.height };
  }
}

// Canvas renderer component
const MapCanvas = ({ mapData }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!mapData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { grid, width, height } = mapData;

    // Set canvas size
    canvas.width = width * CELL_SIZE;
    canvas.height = height * CELL_SIZE;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cellType = grid[y][x];
        const pixelX = x * CELL_SIZE;
        const pixelY = y * CELL_SIZE;

        switch (cellType) {
          case WALL:
            ctx.fillStyle = '#3a3a3a';
            break;
          case FLOOR:
            ctx.fillStyle = '#e8e8e8';
            break;
          case DOOR:
            ctx.fillStyle = '#8b4513';
            break;
          default:
            ctx.fillStyle = '#1a1a1a';
        }

        ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);

        // Draw grid lines
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
      }
    }

    // Draw room numbers
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    mapData.rooms.forEach((room, index) => {
      const centerX = (room.x + room.width / 2) * CELL_SIZE;
      const centerY = (room.y + room.height / 2) * CELL_SIZE + 4;
      ctx.fillText(`R${index + 1}`, centerX, centerY);
    });

  }, [mapData]);

  return (
    <div className="border-2 border-gray-300 inline-block bg-gray-100 p-4 rounded-lg shadow-lg">
      <canvas 
        ref={canvasRef} 
        className="border border-gray-400 rounded"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
};

// Main App component
const App = () => {
  const [mapData, setMapData] = useState(null);
  const [mapWidth, setMapWidth] = useState(40);
  const [mapHeight, setMapHeight] = useState(30);
  const [roomCount, setRoomCount] = useState(8);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMap = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generator = new MapGenerator(mapWidth, mapHeight);
      const newMap = generator.generate(roomCount);
      setMapData(newMap);
      setIsGenerating(false);
    }, 100);
  };

  useEffect(() => {
    generateMap();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wide">
            🐉 D&D Map Generator
          </h1>
          <p className="text-xl text-purple-200 mb-6">
            Generate procedural dungeon maps for your D&D adventures
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Map Width
              </label>
              <input
                type="range"
                min="20"
                max="60"
                value={mapWidth}
                onChange={(e) => setMapWidth(parseInt(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-purple-200 text-sm">{mapWidth} cells</span>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Map Height
              </label>
              <input
                type="range"
                min="20"
                max="50"
                value={mapHeight}
                onChange={(e) => setMapHeight(parseInt(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-purple-200 text-sm">{mapHeight} cells</span>
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Room Count
              </label>
              <input
                type="range"
                min="4"
                max="15"
                value={roomCount}
                onChange={(e) => setRoomCount(parseInt(e.target.value))}
                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-purple-200 text-sm">{roomCount} rooms</span>
            </div>

            <div className="flex items-end">
              <button
                onClick={generateMap}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-lg"
              >
                {isGenerating ? '🎲 Generating...' : '🎲 Generate New Map'}
              </button>
            </div>
          </div>
        </div>

        {/* Map Display */}
        <div className="text-center">
          {mapData ? (
            <div className="inline-block">
              <MapCanvas mapData={mapData} />
              <div className="mt-4 text-white">
                <p className="text-lg">
                  🏰 Generated {mapData.rooms.length} rooms • 
                  📏 {mapData.width}×{mapData.height} grid • 
                  🚪 Gray: Floor, Brown: Doors, Dark: Walls
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-12 border border-white/20">
              <div className="text-white text-xl">🎲 Generating your dungeon...</div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h3 className="text-white text-lg font-semibold mb-4">Map Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 border border-gray-400 rounded"></div>
              <span>Floor (Walkable areas)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-orange-800 border border-gray-400 rounded"></div>
              <span>Doors (Room entrances)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-600 border border-gray-400 rounded"></div>
              <span>Walls (Impassable)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;