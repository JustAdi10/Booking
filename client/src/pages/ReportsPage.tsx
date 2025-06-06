import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and data analysis
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            📊 Generate Report
          </Button>
          <Button>
            📤 Export Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">₹2,45,000</div>
            <p className="text-sm text-muted-foreground">Total Revenue (This Month)</p>
            <p className="text-xs text-green-600">↗ +12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">156</div>
            <p className="text-sm text-muted-foreground">Total Bookings</p>
            <p className="text-xs text-green-600">↗ +8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">85%</div>
            <p className="text-sm text-muted-foreground">Occupancy Rate</p>
            <p className="text-xs text-red-600">↘ -3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">4.8</div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
            <p className="text-xs text-green-600">↗ +0.2 from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="text-4xl mb-2">📈</div>
            <CardTitle>Booking Reports</CardTitle>
            <CardDescription>
              Analyze booking trends, revenue, and occupancy rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>This Month:</span>
                <span className="font-medium">156 bookings</span>
              </div>
              <div className="flex justify-between">
                <span>Revenue:</span>
                <span className="font-medium">₹2,45,000</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Booking Value:</span>
                <span className="font-medium">₹1,571</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              View Detailed Report
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="text-4xl mb-2">🏟️</div>
            <CardTitle>Facility Usage</CardTitle>
            <CardDescription>
              Track facility utilization and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Most Popular:</span>
                <span className="font-medium">Cricket Ground A</span>
              </div>
              <div className="flex justify-between">
                <span>Utilization:</span>
                <span className="font-medium">85%</span>
              </div>
              <div className="flex justify-between">
                <span>Total Facilities:</span>
                <span className="font-medium">12 active</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              View Usage Report
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="text-4xl mb-2">🧹</div>
            <CardTitle>Housekeeping Performance</CardTitle>
            <CardDescription>
              Monitor cleaning efficiency and task completion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Completion Rate:</span>
                <span className="font-medium">94%</span>
              </div>
              <div className="flex justify-between">
                <span>Avg. Task Time:</span>
                <span className="font-medium">2.5 hours</span>
              </div>
              <div className="flex justify-between">
                <span>Tasks This Month:</span>
                <span className="font-medium">248 completed</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              View Performance Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>
              Monthly revenue over the past year
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">📊</div>
                <p>Revenue Chart</p>
                <p className="text-sm">Chart component will be implemented here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Distribution</CardTitle>
            <CardDescription>
              Bookings by facility type and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
              <div className="text-center text-muted-foreground">
                <div className="text-4xl mb-2">🥧</div>
                <p>Pie Chart</p>
                <p className="text-sm">Chart component will be implemented here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>
            Previously generated reports and exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Monthly Booking Report - May 2025</p>
                <p className="text-sm text-muted-foreground">Generated on June 1, 2025</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  📄 View
                </Button>
                <Button variant="outline" size="sm">
                  📥 Download
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Facility Usage Analysis - Q1 2025</p>
                <p className="text-sm text-muted-foreground">Generated on April 5, 2025</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  📄 View
                </Button>
                <Button variant="outline" size="sm">
                  📥 Download
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Housekeeping Performance Report - May 2025</p>
                <p className="text-sm text-muted-foreground">Generated on June 2, 2025</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  📄 View
                </Button>
                <Button variant="outline" size="sm">
                  📥 Download
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>
            Export data in various formats for external analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium mb-2">Excel Export</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Export data in Excel format for spreadsheet analysis
              </p>
              <Button variant="outline" size="sm">
                Export to Excel
              </Button>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl mb-2">📄</div>
              <h4 className="font-medium mb-2">PDF Report</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Generate comprehensive PDF reports with charts
              </p>
              <Button variant="outline" size="sm">
                Generate PDF
              </Button>
            </div>

            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl mb-2">💾</div>
              <h4 className="font-medium mb-2">CSV Export</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Export raw data in CSV format for custom analysis
              </p>
              <Button variant="outline" size="sm">
                Export to CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
