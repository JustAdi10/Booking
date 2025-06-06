import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-3xl mr-3">🏏</span>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cricket Ground & Room Booking
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              ) : (
                <Link to="/login">
                  <Button>Login</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Book Cricket Grounds & Rooms
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Complete facility management system with booking, housekeeping, meal planning, 
            and comprehensive reporting for cricket associations.
          </p>
          {!user && (
            <Link to="/login">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Comprehensive Features
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Facility Management */}
            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">🏟️</div>
                <CardTitle>Facility Management</CardTitle>
                <CardDescription>
                  Manage cricket grounds and buildings with rooms, amenities, and availability tracking.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Booking System */}
            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">📅</div>
                <CardTitle>Advanced Booking</CardTitle>
                <CardDescription>
                  Real-time availability checking with conflict detection and calendar views.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Housekeeping */}
            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">🧹</div>
                <CardTitle>Housekeeping</CardTitle>
                <CardDescription>
                  Task assignment, progress tracking, and image documentation for maintenance.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Meal Planning */}
            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">🍽️</div>
                <CardTitle>Meal Planning</CardTitle>
                <CardDescription>
                  Auto-generate meal plans based on occupancy with cost tracking and budgeting.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* User Management */}
            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">👥</div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Role-based access control for admins, housekeeping staff, and end users.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Reports */}
            <Card className="text-center">
              <CardHeader>
                <div className="text-4xl mb-4">📊</div>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>
                  Comprehensive reporting with usage analytics and export capabilities.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 bg-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl font-bold text-primary-foreground mb-6">
              Ready to Get Started?
            </h3>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Join cricket associations already using our comprehensive booking system.
            </p>
            <Link to="/login">
              <Button variant="secondary" size="lg">
                Start Booking Today
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🏏</span>
                <span className="text-xl font-bold">Cricket Booking</span>
              </div>
              <p className="text-gray-400">
                Professional facility management system for cricket associations.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Facility Management</li>
                <li>Booking System</li>
                <li>Housekeeping</li>
                <li>Meal Planning</li>
                <li>Reports & Analytics</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Documentation</li>
                <li>API Reference</li>
                <li>System Status</li>
                <li>Contact Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Cricket Ground & Room Booking System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
