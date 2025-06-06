import { apiService } from './api';
import { ApiResponse, PaginatedResponse, Facility, Room, CreateFacilityForm, CreateRoomForm } from '../types';

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
  }
};
