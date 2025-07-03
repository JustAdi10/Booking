import React from 'react';
import { RoomWithAvailability } from '../types';

interface RoomGridProps {
  rooms: RoomWithAvailability[];
  onRoomSelect: (room: RoomWithAvailability) => void;
  onRoomDetails?: (room: RoomWithAvailability) => void;
  loading?: boolean;
}

const RoomGrid: React.FC<RoomGridProps> = ({ rooms, onRoomSelect, onRoomDetails, loading = false }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            className="relative p-4 rounded-lg border-2 border-gray-200 animate-pulse"
          >
            <div className="text-center">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🏠</div>
        <h3 className="text-lg font-semibold mb-2">No Rooms Found</h3>
        <p className="text-muted-foreground">
          This facility doesn't have any rooms configured.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onSelect={() => onRoomSelect(room)}
          onDetails={onRoomDetails ? () => onRoomDetails(room) : undefined}
        />
      ))}
    </div>
  );
};

interface RoomCardProps {
  room: RoomWithAvailability;
  onSelect: () => void;
  onDetails?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect, onDetails }) => {
  const isAvailable = room.isAvailable !== false; // Default to available if undefined

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDetails) {
      onDetails();
    }
  };

  return (
    <div
      onClick={isAvailable ? onSelect : undefined}
      onContextMenu={handleRightClick}
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200 group
        ${isAvailable
          ? 'bg-white border-green-300 hover:border-green-500 hover:shadow-lg hover:scale-105 cursor-pointer'
          : 'bg-gray-200 border-gray-400 cursor-not-allowed opacity-75'
        }
      `}
    >
      {/* Room Content */}
      <div className="text-center">
        <div className="text-lg font-bold mb-1 text-gray-900">
          {room.roomNumber || room.name}
        </div>
        <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">
          {room.type.replace('_', ' ')}
        </div>
        <div className="text-xs text-gray-600">
          👥 {room.capacity} guests
        </div>
        {room.pricePerNight && (
          <div className="text-xs font-medium mt-1 text-green-600">
            ${room.pricePerNight}/night
          </div>
        )}
        
        {/* Amenities preview */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {room.amenities.slice(0, 2).join(', ')}
            {room.amenities.length > 2 && '...'}
          </div>
        )}
      </div>
      
      {/* Status indicator */}
      <div className={`
        absolute top-2 right-2 w-3 h-3 rounded-full border border-white shadow-sm
        ${isAvailable ? 'bg-green-500' : 'bg-red-500'}
      `} />
      
      {/* Floor indicator */}
      {room.floorNumber && (
        <div className="absolute top-2 left-2 text-xs bg-gray-100 px-1 rounded text-gray-600">
          Floor {room.floorNumber}
        </div>
      )}

      {/* Info button */}
      {onDetails && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDetails();
          }}
          className="absolute bottom-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full text-xs hover:bg-blue-600 transition-colors flex items-center justify-center"
          title="View room details"
        >
          ℹ️
        </button>
      )}
      
      {/* Hover overlay for available rooms */}
      {isAvailable && (
        <div className="absolute inset-0 bg-green-500 bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
            Select Room
          </div>
        </div>
      )}
      
      {/* Unavailable tooltip */}
      {!isAvailable && room.availabilityNotes && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          {room.availabilityNotes}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
      
      {/* Booking count indicator */}
      {room.bookings && room.bookings.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-red-500 text-white text-xs px-1 rounded-full">
          {room.bookings.length}
        </div>
      )}
    </div>
  );
};

export default RoomGrid;
