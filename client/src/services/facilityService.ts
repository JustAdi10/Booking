import { apiService } from './api';
import { ApiResponse, PaginatedResponse, Facility, Room, RoomWithAvailability, CreateFacilityForm, CreateRoomForm } from '../types';

export const facilityService = {
  // Facilities
  getFacilities: async (params?: any): Promise<ApiResponse<PaginatedResponse<Facility>>> => {
    return apiService.get('/api/facilities', params);
  },

  getFacility: async (id: string): Promise<ApiResponse<Facility>> => {
    return apiService.get(`/api/facilities/${id}`);
  },

  createFacility: async (data: CreateFacilityForm): Promise<ApiResponse<Facility>> => {
    return apiService.post('/api/facilities', data);
  },

  updateFacility: async (id: string, data: Partial<CreateFacilityForm>): Promise<ApiResponse<Facility>> => {
    return apiService.put(`/api/facilities/${id}`, data);
  },

  deleteFacility: async (id: string): Promise<ApiResponse> => {
    return apiService.delete(`/api/facilities/${id}`);
  },

  checkFacilityAvailability: async (id: string, startDate: string, endDate: string): Promise<ApiResponse> => {
    return apiService.get(`/api/facilities/${id}/availability`, { startDate, endDate });
  },

  // Rooms
  getFacilityRooms: async (facilityId: string): Promise<ApiResponse<Room[]>> => {
    return apiService.get(`/api/facilities/${facilityId}/rooms`);
  },

  createRoom: async (facilityId: string, data: CreateRoomForm): Promise<ApiResponse<Room>> => {
    return apiService.post(`/api/facilities/${facilityId}/rooms`, data);
  },

  getRoom: async (id: string): Promise<ApiResponse<Room>> => {
    return apiService.get(`/api/rooms/${id}`);
  },

  updateRoom: async (id: string, data: Partial<CreateRoomForm>): Promise<ApiResponse<Room>> => {
    return apiService.put(`/api/rooms/${id}`, data);
  },

  deleteRoom: async (id: string): Promise<ApiResponse> => {
    return apiService.delete(`/api/rooms/${id}`);
  },

  checkRoomAvailability: async (id: string, startDate: string, endDate: string): Promise<ApiResponse> => {
    return apiService.get(`/api/rooms/${id}/availability`, { startDate, endDate });
  },

  // Get rooms with availability status for a facility
  getFacilityRoomsWithAvailability: async (facilityId: string, startDate: string, endDate: string): Promise<ApiResponse<RoomWithAvailability[]>> => {
    const roomsResponse = await apiService.get(`/api/facilities/${facilityId}/rooms`);

    if (!roomsResponse.success || !roomsResponse.data) {
      return roomsResponse;
    }

    // Get availability for each room
    const roomsWithAvailability = await Promise.all(
      roomsResponse.data.map(async (room: Room) => {
        try {
          const availabilityResponse = await apiService.get(`/api/rooms/${room.id}/availability`, { startDate, endDate });
          return {
            ...room,
            isAvailable: availabilityResponse.success && availabilityResponse.data?.isAvailable,
            availabilityNotes: availabilityResponse.data?.availabilityNotes || '',
            bookings: availabilityResponse.data?.bookings || []
          };
        } catch (error) {
          console.error(`Error checking availability for room ${room.id}:`, error);
          return {
            ...room,
            isAvailable: false,
            availabilityNotes: 'Unable to check availability',
            bookings: []
          };
        }
      })
    );

    return {
      success: true,
      data: roomsWithAvailability
    };
  },

  // Get facility by ID
  getFacilityById: async (facilityId: string): Promise<Facility> => {
    try {
      const response = await apiService.get(`/api/facilities/${facilityId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Facility not found');
    } catch (error) {
      // Fallback to mock data if API fails
      const mockFacilities = [
        {
          id: '1',
          name: 'Cricket Ground A',
          type: 'GROUND',
          location: 'Pondicherry',
          description: 'Professional cricket ground with modern facilities',
          amenities: ['Floodlights', 'Pavilion', 'Scoreboard'],
          capacity: 50,
          isActive: true
        },
        {
          id: '2',
          name: 'Guest House Building A',
          type: 'BUILDING',
          location: 'Pondicherry',
          description: 'Modern guest house with comfortable rooms',
          amenities: ['WiFi', 'AC', 'Restaurant'],
          capacity: 100,
          isActive: true
        }
      ];
      const facility = mockFacilities.find(f => f.id === facilityId);
      if (!facility) {
        throw new Error('Facility not found');
      }
      return facility as Facility;
    }
  },

  // Get room by ID
  getRoomById: async (roomId: string): Promise<Room> => {
    try {
      const response = await apiService.get(`/api/rooms/${roomId}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Room not found');
    } catch (error) {
      // Fallback to mock data if API fails
      const mockRooms = [
        {
          id: 'room-1',
          facilityId: '2',
          name: 'Deluxe Room 101',
          roomNumber: '101',
          type: 'DOUBLE',
          capacity: 2,
          floorNumber: 1,
          amenities: ['AC', 'TV', 'WiFi', 'Mini Fridge'],
          pricePerNight: 2500,
          isActive: true
        },
        {
          id: 'room-2',
          facilityId: '2',
          name: 'Standard Room 102',
          roomNumber: '102',
          type: 'SINGLE',
          capacity: 1,
          floorNumber: 1,
          amenities: ['AC', 'TV', 'WiFi'],
          pricePerNight: 1800,
          isActive: true
        }
      ];

      const room = mockRooms.find(r => r.id === roomId);
      if (!room) {
        throw new Error('Room not found');
      }
      return room as Room;
    }
  }
};
