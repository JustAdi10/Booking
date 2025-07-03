import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const FacilitiesPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  const handleBookNow = (facility: any) => {
    if (facility.type === 'BUILDING') {
      // Navigate to room selection for buildings
      navigate(`/facilities/${facility.id}/rooms`);
    } else {
      // For grounds, navigate directly to time slot booking
      navigate(`/facilities/${facility.id}/book`);
    }
  };

  const facilities = [
    {
      id: '1',
      name: 'Cricket Ground A',
      type: 'GROUND',
      location: 'Pondicherry',
      capacity: 50,
      amenities: ['Parking', 'Lighting', 'Scoreboard'],
      status: 'Available',
      image: '🏟️'
    },
    {
      id: '2',
      name: 'Main Building',
      type: 'BUILDING',
      location: 'Pondicherry',
      rooms: 12,
      amenities: ['AC', 'WiFi', 'Cafeteria'],
      status: 'Available',
      image: '🏢'
    },
    {
      id: '3',
      name: 'Practice Ground B',
      type: 'GROUND',
      location: 'Chennai',
      capacity: 30,
      amenities: ['Nets', 'Equipment Storage'],
      status: 'Occupied',
      image: '🏟️'
    },
    {
      id: '4',
      name: 'Guest House',
      type: 'BUILDING',
      location: 'Chennai',
      rooms: 8,
      amenities: ['Kitchen', 'Laundry', 'Garden'],
      status: 'Available',
      image: '🏠'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Facilities</h1>
          <p className="text-muted-foreground">
            Manage cricket grounds and buildings
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex border rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'list' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-accent'
              }`}
            >
              List
            </button>
          </div>
          <Button>
            ➕ Add Facility
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <select className="px-3 py-2 border rounded-md bg-background">
              <option value="">All Types</option>
              <option value="GROUND">Grounds</option>
              <option value="BUILDING">Buildings</option>
            </select>
            <select className="px-3 py-2 border rounded-md bg-background">
              <option value="">All Locations</option>
              <option value="Pondicherry">Pondicherry</option>
              <option value="Chennai">Chennai</option>
              <option value="Bangalore">Bangalore</option>
            </select>
            <select className="px-3 py-2 border rounded-md bg-background">
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            <input
              type="text"
              placeholder="Search facilities..."
              className="px-3 py-2 border rounded-md bg-background flex-1 min-w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Facilities Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-4xl">{facility.image}</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    facility.status === 'Available' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {facility.status}
                  </span>
                </div>
                <CardTitle className="text-lg">{facility.name}</CardTitle>
                <CardDescription>
                  {facility.type} • {facility.location}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {facility.type === 'GROUND' ? 'Capacity' : 'Rooms'}:
                    </span>
                    <span>
                      {facility.type === 'GROUND' ? facility.capacity : facility.rooms}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Amenities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {facility.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-accent text-xs rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button size="sm" onClick={() => handleBookNow(facility)}>
                    Book Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left p-4">Facility</th>
                    <th className="text-left p-4">Type</th>
                    <th className="text-left p-4">Location</th>
                    <th className="text-left p-4">Capacity/Rooms</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((facility) => (
                    <tr key={facility.id} className="border-b hover:bg-accent/50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{facility.image}</span>
                          <div>
                            <div className="font-medium">{facility.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {facility.amenities.slice(0, 2).join(', ')}
                              {facility.amenities.length > 2 && '...'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-accent text-xs rounded">
                          {facility.type}
                        </span>
                      </td>
                      <td className="p-4">{facility.location}</td>
                      <td className="p-4">
                        {facility.type === 'GROUND' ? facility.capacity : facility.rooms}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          facility.status === 'Available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {facility.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                          <Button size="sm" onClick={() => handleBookNow(facility)}>
                            Book
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <span className="px-3 py-2 text-sm">Page 1 of 1</span>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FacilitiesPage;
