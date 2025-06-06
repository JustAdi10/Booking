import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const HousekeepingPage: React.FC = () => {
  const tasks = [
    {
      id: '1',
      room: 'Room 101',
      facility: 'Main Building',
      type: 'CLEANING',
      priority: 'HIGH',
      status: 'PENDING',
      assignedTo: 'John Doe',
      deadline: '2025-06-07 14:00',
      description: 'Deep cleaning after checkout'
    },
    {
      id: '2',
      room: 'Conference Room A',
      facility: 'Main Building',
      type: 'INSPECTION',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      assignedTo: 'Jane Smith',
      deadline: '2025-06-07 16:00',
      description: 'Pre-event inspection and setup'
    },
    {
      id: '3',
      room: 'Room 205',
      facility: 'Guest House',
      type: 'MAINTENANCE',
      priority: 'URGENT',
      status: 'NEEDS_REPAIR',
      assignedTo: 'Mike Johnson',
      deadline: '2025-06-06 12:00',
      description: 'AC unit not working properly'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'NEEDS_REPAIR': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Housekeeping</h1>
          <p className="text-muted-foreground">
            Manage cleaning and maintenance tasks
          </p>
        </div>
        <Button>
          ➕ New Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">5</div>
            <p className="text-sm text-muted-foreground">Pending Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">3</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-sm text-muted-foreground">Completed Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">2</div>
            <p className="text-sm text-muted-foreground">Need Repair</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <select className="px-3 py-2 border rounded-md bg-background">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="NEEDS_REPAIR">Needs Repair</option>
            </select>
            <select className="px-3 py-2 border rounded-md bg-background">
              <option value="">All Types</option>
              <option value="CLEANING">Cleaning</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INSPECTION">Inspection</option>
            </select>
            <select className="px-3 py-2 border rounded-md bg-background">
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
            <input
              type="text"
              placeholder="Search tasks..."
              className="px-3 py-2 border rounded-md bg-background flex-1 min-w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold">{task.room}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className="px-2 py-1 bg-accent text-xs rounded">
                      {task.type}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-muted-foreground">Facility:</span>
                      <div className="font-medium">{task.facility}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Assigned to:</span>
                      <div className="font-medium">{task.assignedTo}</div>
                    </div>
                    
                    <div>
                      <span className="text-muted-foreground">Deadline:</span>
                      <div className="font-medium">{task.deadline}</div>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1">{task.description}</p>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {task.status !== 'COMPLETED' && (
                    <Button size="sm">
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common housekeeping operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                📋 Create Cleaning Checklist
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📸 Upload Task Photos
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🔧 Report Maintenance Issue
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📊 View Performance Report
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>
              Your tasks for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Room 101 - Deep Clean</p>
                  <p className="text-sm text-muted-foreground">2:00 PM - 4:00 PM</p>
                </div>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Conference Room A - Setup</p>
                  <p className="text-sm text-muted-foreground">4:00 PM - 5:00 PM</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  In Progress
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HousekeepingPage;
