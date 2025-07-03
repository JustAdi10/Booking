// Mock data service for testing without database
export const mockFacilities = [
  {
    id: "facility-1",
    name: "Main Cricket Ground",
    type: "GROUND",
    description: "Professional cricket ground with modern facilities",
    location: "Central Sports Complex",
    state: "Maharashtra",
    city: "Mumbai",
    address: "123 Sports Avenue, Mumbai",
    capacity: 50,
    amenities: ["Floodlights", "Pavilion", "Scoreboard", "Parking"],
    images: ["ground1.jpg", "ground2.jpg"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    rooms: [],
    _count: {
      rooms: 0,
      bookings: 5
    }
  },
  {
    id: "facility-2", 
    name: "Guest House Building A",
    type: "BUILDING",
    description: "Modern guest house with comfortable rooms",
    location: "Sports Complex North Wing",
    state: "Maharashtra", 
    city: "Mumbai",
    address: "456 Accommodation Lane, Mumbai",
    capacity: 100,
    amenities: ["WiFi", "AC", "Restaurant", "Gym"],
    images: ["building1.jpg", "building2.jpg"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    rooms: [
      {
        id: "room-1",
        facilityId: "facility-2",
        name: "Deluxe Room 101",
        roomNumber: "101",
        type: "DOUBLE",
        capacity: 2,
        floorNumber: 1,
        amenities: ["AC", "TV", "WiFi", "Mini Fridge"],
        images: ["room101-1.jpg", "room101-2.jpg"],
        pricePerNight: 2500,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      },
      {
        id: "room-2",
        facilityId: "facility-2", 
        name: "Standard Room 102",
        roomNumber: "102",
        type: "SINGLE",
        capacity: 1,
        floorNumber: 1,
        amenities: ["AC", "TV", "WiFi"],
        images: ["room102-1.jpg"],
        pricePerNight: 1800,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      },
      {
        id: "room-3",
        facilityId: "facility-2",
        name: "Suite 201", 
        roomNumber: "201",
        type: "SUITE",
        capacity: 4,
        floorNumber: 2,
        amenities: ["AC", "TV", "WiFi", "Mini Fridge", "Balcony", "Sofa"],
        images: ["room201-1.jpg", "room201-2.jpg", "room201-3.jpg"],
        pricePerNight: 4500,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      },
      {
        id: "room-4",
        facilityId: "facility-2",
        name: "Standard Room 202",
        roomNumber: "202", 
        type: "DOUBLE",
        capacity: 2,
        floorNumber: 2,
        amenities: ["AC", "TV", "WiFi"],
        images: ["room202-1.jpg"],
        pricePerNight: 2200,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      },
      {
        id: "room-5",
        facilityId: "facility-2",
        name: "Dormitory 301",
        roomNumber: "301",
        type: "DORMITORY", 
        capacity: 8,
        floorNumber: 3,
        amenities: ["AC", "Shared Bathroom", "WiFi", "Lockers"],
        images: ["room301-1.jpg"],
        pricePerNight: 800,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      },
      {
        id: "room-6",
        facilityId: "facility-2",
        name: "Standard Room 302",
        roomNumber: "302",
        type: "SINGLE",
        capacity: 1,
        floorNumber: 3,
        amenities: ["AC", "TV", "WiFi"],
        images: ["room302-1.jpg"],
        pricePerNight: 1800,
        isActive: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01")
      }
    ],
    _count: {
      rooms: 6,
      bookings: 12
    }
  },
  {
    id: "facility-3",
    name: "Practice Ground B", 
    type: "GROUND",
    description: "Smaller practice ground for training sessions",
    location: "Sports Complex South Wing",
    state: "Maharashtra",
    city: "Mumbai", 
    address: "789 Training Ground Road, Mumbai",
    capacity: 25,
    amenities: ["Net Practice", "Bowling Machine", "Seating"],
    images: ["practice1.jpg"],
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    rooms: [],
    _count: {
      rooms: 0,
      bookings: 8
    }
  }
];

export const mockBookings = [
  {
    id: "booking-1",
    userId: "user-1",
    facilityId: "facility-2",
    roomId: "room-1",
    bookingType: "ROOM",
    startDate: new Date("2024-07-05"),
    endDate: new Date("2024-07-07"),
    startTime: null,
    endTime: null,
    guestsCount: 2,
    totalAmount: 5000,
    status: "CONFIRMED",
    specialRequests: null,
    createdAt: new Date("2024-07-01"),
    updatedAt: new Date("2024-07-01"),
    user: {
      id: "user-1",
      name: "John Doe",
      email: "john@example.com"
    }
  },
  {
    id: "booking-2", 
    userId: "user-2",
    facilityId: "facility-2",
    roomId: "room-3",
    bookingType: "ROOM",
    startDate: new Date("2024-07-04"),
    endDate: new Date("2024-07-06"),
    startTime: null,
    endTime: null,
    guestsCount: 3,
    totalAmount: 9000,
    status: "CONFIRMED",
    specialRequests: "Late checkout requested",
    createdAt: new Date("2024-06-30"),
    updatedAt: new Date("2024-06-30"),
    user: {
      id: "user-2",
      name: "Jane Smith", 
      email: "jane@example.com"
    }
  }
];

// Helper function to get rooms with availability
export const getRoomsWithAvailability = (facilityId: string, startDate?: Date, endDate?: Date) => {
  const facility = mockFacilities.find(f => f.id === facilityId);
  if (!facility || !facility.rooms) return [];

  return facility.rooms.map(room => {
    // Check if room has any conflicting bookings
    const conflictingBookings = mockBookings.filter(booking => 
      booking.roomId === room.id &&
      booking.status === "CONFIRMED" &&
      startDate && endDate &&
      (
        (new Date(booking.startDate) <= endDate && new Date(booking.endDate) >= startDate)
      )
    );

    const isAvailable = conflictingBookings.length === 0;
    
    return {
      ...room,
      isAvailable,
      availabilityNotes: isAvailable ? null : "Room is booked for selected dates",
      bookings: conflictingBookings
    };
  });
};
