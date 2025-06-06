import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Bookings',
      value: '24',
      description: 'This month',
      icon: '📅',
      color: 'text-blue-600'
    },
    {
      title: 'Active Facilities',
      value: '8',
      description: 'Available now',
      icon: '🏟️',
      color: 'text-green-600'
    },
    {
      title: 'Pending Tasks',
      value: '12',
      description: 'Housekeeping',
      icon: '🧹',
      color: 'text-orange-600'
    },
    {
      title: 'Revenue',
      value: '₹45,000',
      description: 'This month',
      icon: '💰',
      color: 'text-purple-600'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'booking',
      message: 'New booking for Cricket Ground A',
      time: '2 hours ago',
      icon: '📅'
    },
    {
      id: 2,
      type: 'housekeeping',
      message: 'Room 101 cleaning completed',
      time: '4 hours ago',
      icon: '🧹'
    },
    {
      id: 3,
      type: 'meal',
      message: 'Meal plan generated for tomorrow',
      time: '6 hours ago',
      icon: '🍽️'
    },
    {
      id: 4,
      type: 'booking',
      message: 'Booking confirmed for Conference Room B',
      time: '1 day ago',
      icon: '📅'
    }
  ];

  const quickActions = [
    {
      title: 'New Booking',
      description: 'Create a new facility booking',
      icon: '➕',
      href: '/bookings',
      color: 'bg-blue-500'
    },
    {
      title: 'View Facilities',
      description: 'Manage grounds and rooms',
      icon: '🏟️',
      href: '/facilities',
      color: 'bg-green-500'
    },
    {
      title: 'Housekeeping Tasks',
      description: 'Assign and track tasks',
      icon: '🧹',
      href: '/housekeeping',
      color: 'bg-orange-500'
    },
    {
      title: 'Meal Planning',
      description: 'Plan meals and menus',
      icon: '🍽️',
      href: '/meals',
      color: 'bg-purple-500'
    }
  ];

  const getRoleBasedWelcome = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Welcome to your admin dashboard. You have full access to all system features.';
      case 'HOUSEKEEPING':
        return 'Welcome to your housekeeping dashboard. Manage your assigned tasks and track progress.';
      case 'USER':
        return 'Welcome to your booking dashboard. Browse facilities and manage your bookings.';
      default:
        return 'Welcome to the Cricket Ground & Room Booking System.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          {getRoleBasedWelcome()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => window.location.href = action.href}
                >
                  <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center text-white mb-2`}>
                    {action.icon}
                  </div>
                  <h4 className="font-medium text-sm">{action.title}</h4>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest updates and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <span className="text-lg">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific sections */}
      {user?.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Tools</CardTitle>
            <CardDescription>
              Administrative functions and system management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => window.location.href = '/reports'}>
                📊 View Reports
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/users'}>
                👥 Manage Users
              </Button>
              <Button variant="outline">
                ⚙️ System Settings
              </Button>
              <Button variant="outline">
                📤 Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {user?.role === 'HOUSEKEEPING' && (
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
            <CardDescription>
              Your assigned housekeeping tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Clean Room 101</p>
                  <p className="text-sm text-muted-foreground">Due: Today 2:00 PM</p>
                </div>
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Pending
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Inspect Conference Room A</p>
                  <p className="text-sm text-muted-foreground">Due: Tomorrow 10:00 AM</p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Scheduled
                </span>
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={() => window.location.href = '/housekeeping'}>
                View All Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardPage;
