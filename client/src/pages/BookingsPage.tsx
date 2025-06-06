import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const BookingsPage: React.FC = () => {
  const bookings = [
    {
      id: '1',
      facility: 'Cricket Ground A',
      type: 'GROUND',
      startDate: '2025-06-10',
      endDate: '2025-06-10',
      startTime: '09:00',
      endTime: '17:00',
      guests: 25,
      status: 'CONFIRMED',
      amount: 5000
    },
    {
      id: '2',
      facility: 'Conference Room B',
      type: 'ROOM',
      startDate: '2025-06-12',
      endDate: '2025-06-14',
      guests: 8,
      status: 'PENDING',
      amount: 3000
    },
    {
      id: '3',
      facility: 'Practice Ground',
      type: 'GROUND',
      startDate: '2025-06-15',
      endDate: '2025-06-15',
      startTime: '14:00',
      endTime: '18:00',
      guests: 15,
      status: 'CANCELLED',
      amount: 2500
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">
            Manage your facility and room bookings
          </p>
        </div>
        <Button>
          ➕ New Booking
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">12</div>
            <p className="text-sm text-muted-foreground">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">8</div>
            <p className="text-sm text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">₹25,000</div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <select className="px-3 py-2 border rounded-md bg-background">
              <option value="">All Status</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select className="px-3 py-2 border rounded-md bg-background">
              <option value="">All Types</option>
              <option value="GROUND">Ground Bookings</option>
              <option value="ROOM">Room Bookings</option>
            </select>
            <input
              type="date"
              className="px-3 py-2 border rounded-md bg-background"
            />
            <input
              type="text"
              placeholder="Search bookings..."
              className="px-3 py-2 border rounded-md bg-background flex-1 min-w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold">{booking.facility}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className="px-2 py-1 bg-accent text-xs rounded">
                      {booking.type}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <div className="font-medium">
                        {booking.startDate === booking.endDate 
                          ? booking.startDate 
                          : `${booking.startDate} - ${booking.endDate}`
                        }
                      </div>
                    </div>
                    
                    {booking.startTime && (
                      <div>
                        <span className="text-muted-foreground">Time:</span>
                        <div className="font-medium">
                          {booking.startTime} - {booking.endTime}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-muted-foreground">Guests:</span>
                      <div className="font-medium">{booking.guests} people</div>
                    </div>
                  </div>
                  
                  {booking.amount && (
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">Amount:</span>
                      <span className="font-semibold text-lg ml-2">₹{booking.amount.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {booking.status === 'PENDING' && (
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                  {booking.status !== 'CANCELLED' && (
                    <Button variant="destructive" size="sm">
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendar View Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
          <CardDescription>
            View your bookings in calendar format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-4">📅</div>
            <p>Calendar view will be implemented here</p>
            <p className="text-sm">Shows all bookings in a monthly/weekly calendar format</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingsPage;
