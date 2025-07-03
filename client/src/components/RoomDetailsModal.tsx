import React from 'react';
import { RoomWithAvailability } from '../types';
import Button from './ui/Button';

interface RoomDetailsModalProps {
  room: RoomWithAvailability | null;
  isOpen: boolean;
  onClose: () => void;
  onBook: (room: RoomWithAvailability) => void;
}

const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  room,
  isOpen,
  onClose,
  onBook
}) => {
  if (!isOpen || !room) return null;

  const isAvailable = room.isAvailable !== false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">
              {room.roomNumber || room.name}
            </h2>
            <p className="text-muted-foreground">
              {room.type.replace('_', ' ')} • Floor {room.floorNumber || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`
            p-4 rounded-lg border-l-4 
            ${isAvailable 
              ? 'bg-green-50 border-green-500 text-green-800' 
              : 'bg-red-50 border-red-500 text-red-800'
            }
          `}>
            <div className="flex items-center">
              <div className={`
                w-3 h-3 rounded-full mr-3
                ${isAvailable ? 'bg-green-500' : 'bg-red-500'}
              `} />
              <div>
                <p className="font-medium">
                  {isAvailable ? 'Available' : 'Not Available'}
                </p>
                {room.availabilityNotes && (
                  <p className="text-sm mt-1">{room.availabilityNotes}</p>
                )}
              </div>
            </div>
          </div>

          {/* Room Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Room Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Capacity:</span>
                  <span className="font-medium">👥 {room.capacity} guests</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Room Type:</span>
                  <span className="font-medium">{room.type.replace('_', ' ')}</span>
                </div>
                {room.floorNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Floor:</span>
                    <span className="font-medium">{room.floorNumber}</span>
                  </div>
                )}
                {room.pricePerNight && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price per night:</span>
                    <span className="font-medium text-green-600">
                      ${room.pricePerNight}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Amenities</h3>
              {room.amenities && room.amenities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No amenities listed</p>
              )}
            </div>
          </div>

          {/* Current Bookings */}
          {room.bookings && room.bookings.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Bookings</h3>
              <div className="space-y-2">
                {room.bookings.slice(0, 3).map((booking, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{booking.user?.name || 'Guest'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.startDate).toLocaleDateString()} - 
                        {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`
                      px-2 py-1 text-xs rounded-full
                      ${booking.status === 'CONFIRMED' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                      }
                    `}>
                      {booking.status}
                    </span>
                  </div>
                ))}
                {room.bookings.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center">
                    +{room.bookings.length - 3} more bookings
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Images placeholder */}
          {room.images && room.images.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Images</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.images.slice(0, 6).map((image, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <span className="text-gray-400">📷</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {isAvailable ? (
            <Button onClick={() => onBook(room)}>
              Book This Room
            </Button>
          ) : (
            <Button disabled>
              Room Not Available
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDetailsModal;
