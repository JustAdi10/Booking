import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { facilityService } from '../services/facilityService';
import { Facility, Room } from '../types';

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: string;
  price?: number;
}

interface DaySchedule {
  date: string;
  dayName: string;
  timeSlots: TimeSlot[];
}

const BookingPage: React.FC = () => {
  const { facilityId, roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [facility, setFacility] = useState<Facility | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [bookingType, setBookingType] = useState<'GROUND' | 'ROOM'>('GROUND');

  // Generate time slots for a day (6 AM to 10 PM in 2-hour slots)
  const generateTimeSlots = (date: string): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 6; // 6 AM
    const endHour = 22; // 10 PM
    const slotDuration = 2; // 2 hours

    for (let hour = startHour; hour < endHour; hour += slotDuration) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + slotDuration).toString().padStart(2, '0')}:00`;
      
      // Mock some bookings for demonstration
      const isBooked = Math.random() < 0.3; // 30% chance of being booked
      
      slots.push({
        id: `${date}-${startTime}-${endTime}`,
        startTime,
        endTime,
        isBooked,
        bookedBy: isBooked ? 'John Doe' : undefined,
        price: bookingType === 'GROUND' ? 500 : 200
      });
    }

    return slots;
  };

  // Generate schedule for the next 7 days
  const generateSchedule = () => {
    const days: DaySchedule[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      days.push({
        date: dateString,
        dayName,
        timeSlots: generateTimeSlots(dateString)
      });
    }

    setSchedule(days);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (facilityId) {
          // Load facility data
          const facilityData = await facilityService.getFacilityById(facilityId);
          setFacility(facilityData);
          
          if (roomId) {
            // Load room data if booking a specific room
            const roomData = await facilityService.getRoomById(roomId);
            setRoom(roomData);
            setBookingType('ROOM');
          } else {
            // Ground booking
            setBookingType('GROUND');
          }
        }

        generateSchedule();
      } catch (error) {
        console.error('Error loading booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [facilityId, roomId]);

  const handleTimeSlotToggle = (slotId: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlots([]); // Clear selected slots when changing date
  };

  const handleBooking = () => {
    if (selectedTimeSlots.length === 0) {
      alert('Please select at least one time slot');
      return;
    }

    // Calculate total price
    const selectedSlots = schedule
      .find(day => day.date === selectedDate)
      ?.timeSlots.filter(slot => selectedTimeSlots.includes(slot.id)) || [];
    
    const totalPrice = selectedSlots.reduce((sum, slot) => sum + (slot.price || 0), 0);

    // For now, just show confirmation
    const confirmation = confirm(
      `Confirm booking for ${selectedSlots.length} time slot(s) on ${selectedDate}?\n` +
      `Total: ₹${totalPrice}\n` +
      `Slots: ${selectedSlots.map(s => `${s.startTime}-${s.endTime}`).join(', ')}`
    );

    if (confirmation) {
      alert('Booking confirmed! (This is a demo)');
      navigate('/bookings'); // Navigate to bookings list
    }
  };

  const selectedDaySchedule = schedule.find(day => day.date === selectedDate);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading booking information...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          ← Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">
          Book {bookingType === 'ROOM' ? 'Room' : 'Ground'}
        </h1>
        
        <div className="text-lg text-muted-foreground">
          {facility?.name}
          {room && ` - ${room.name || room.roomNumber}`}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>Choose a date for your booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {schedule.map((day) => (
                <button
                  key={day.date}
                  onClick={() => handleDateChange(day.date)}
                  className={`
                    w-full p-3 text-left rounded-lg border transition-colors
                    ${selectedDate === day.date 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="font-medium">{day.dayName}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {day.timeSlots.filter(slot => !slot.isBooked).length} slots available
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Slots */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Available Time Slots</CardTitle>
            <CardDescription>
              Select your preferred time slots for {selectedDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDaySchedule ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedDaySchedule.timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => !slot.isBooked && handleTimeSlotToggle(slot.id)}
                    disabled={slot.isBooked}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-200 text-left
                      ${slot.isBooked 
                        ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed' 
                        : selectedTimeSlots.includes(slot.id)
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                      }
                    `}
                  >
                    <div className="font-medium">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="text-sm mt-1">
                      {slot.isBooked ? (
                        <span className="text-red-500">Booked by {slot.bookedBy}</span>
                      ) : (
                        <span className="text-green-600">₹{slot.price}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select a date to view available time slots
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Booking Summary */}
      {selectedTimeSlots.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Selected Slots:</h4>
                  <div className="space-y-1">
                    {selectedTimeSlots.map(slotId => {
                      const slot = selectedDaySchedule?.timeSlots.find(s => s.id === slotId);
                      return slot ? (
                        <div key={slotId} className="text-sm">
                          {slot.startTime} - {slot.endTime} (₹{slot.price})
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Total Cost:</h4>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{selectedDaySchedule?.timeSlots
                      .filter(slot => selectedTimeSlots.includes(slot.id))
                      .reduce((sum, slot) => sum + (slot.price || 0), 0) || 0}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedTimeSlots([])}
                >
                  Clear Selection
                </Button>
                <Button onClick={handleBooking}>
                  Confirm Booking
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingPage;
