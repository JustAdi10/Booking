import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import RoomGrid from '../components/RoomGrid';
import RoomDetailsModal from '../components/RoomDetailsModal';
import { facilityService } from '../services/facilityService';
import { Facility, RoomWithAvailability } from '../types';

const RoomSelectionPage: React.FC = () => {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [facility, setFacility] = useState<Facility | null>(null);
  const [rooms, setRooms] = useState<RoomWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithAvailability | null>(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);
  
  // Get dates from URL params or default to today and tomorrow
  const startDate = searchParams.get('startDate') || new Date().toISOString().split('T')[0];
  const endDate = searchParams.get('endDate') || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [selectedStartDate, setSelectedStartDate] = useState(startDate);
  const [selectedEndDate, setSelectedEndDate] = useState(endDate);

  useEffect(() => {
    if (facilityId) {
      loadFacilityAndRooms();
    }
  }, [facilityId, selectedStartDate, selectedEndDate]);

  const loadFacilityAndRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load facility details
      const facilityResponse = await facilityService.getFacility(facilityId!);
      if (!facilityResponse.success) {
        throw new Error('Failed to load facility details');
      }
      setFacility(facilityResponse.data);

      // Load rooms with availability
      const roomsResponse = await facilityService.getFacilityRoomsWithAvailability(
        facilityId!,
        selectedStartDate,
        selectedEndDate
      );
      
      if (!roomsResponse.success) {
        throw new Error('Failed to load rooms');
      }
      
      setRooms(roomsResponse.data || []);
    } catch (err) {
      console.error('Error loading facility and rooms:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (room: RoomWithAvailability) => {
    if (!room.isAvailable) {
      return; // Don't allow selection of unavailable rooms
    }

    // Navigate to time slot booking page with room information
    navigate(`/facilities/${facilityId}/rooms/${room.id}/book?startDate=${selectedStartDate}&endDate=${selectedEndDate}`);
  };

  const handleDateChange = () => {
    // Reload rooms with new dates
    loadFacilityAndRooms();
  };

  const handleRoomDetails = (room: RoomWithAvailability) => {
    setSelectedRoom(room);
    setShowRoomDetails(true);
  };

  const handleCloseModal = () => {
    setShowRoomDetails(false);
    setSelectedRoom(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/facilities')}>
            ← Back to Facilities
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold mb-2">Error Loading Rooms</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadFacilityAndRooms}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/facilities')}>
            ← Back to Facilities
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Select Room</h1>
            <p className="text-muted-foreground">
              {facility?.name} - Choose an available room
            </p>
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Dates</CardTitle>
          <CardDescription>
            Select your check-in and check-out dates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium mb-1">Check-in Date</label>
              <input
                type="date"
                value={selectedStartDate}
                onChange={(e) => setSelectedStartDate(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-out Date</label>
              <input
                type="date"
                value={selectedEndDate}
                onChange={(e) => setSelectedEndDate(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
                min={selectedStartDate}
              />
            </div>
            <div className="pt-6">
              <Button onClick={handleDateChange}>
                Update Availability
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Available Rooms</CardTitle>
          <CardDescription>
            Click on an available room to book it. Right-click or click the ℹ️ button for room details. White rooms are available, grey rooms are booked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoomGrid
            rooms={rooms}
            onRoomSelect={handleRoomSelect}
            onRoomDetails={handleRoomDetails}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-green-300 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-400 rounded"></div>
              <span className="text-sm">Booked</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Room Details Modal */}
      <RoomDetailsModal
        room={selectedRoom}
        isOpen={showRoomDetails}
        onClose={handleCloseModal}
        onBook={handleRoomSelect}
      />
    </div>
  );
};

export default RoomSelectionPage;
