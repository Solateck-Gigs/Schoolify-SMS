import React from 'react';
import { Users, BookOpen, DollarSign, CalendarClock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

export default function ParentDashboard() {
  // This would be fetched from Supabase in a real application
  const children = [
    { id: 1, name: 'Alex Johnson', class: 'Class 3A', attendance: '95%', feesStatus: 'Paid' },
    { id: 2, name: 'Emma Johnson', class: 'Class 1B', attendance: '98%', feesStatus: 'Paid' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Parent-Teacher Meeting', date: '2023-05-25', time: '16:00 - 18:00' },
    { id: 2, title: 'Annual Sports Day', date: '2023-06-10', time: '09:00 - 14:00' },
    { id: 3, title: 'School Exhibition', date: '2023-06-15', time: '11:00 - 15:00' },
  ];

  const recentGrades = [
    { id: 1, child: 'Alex Johnson', subject: 'Mathematics', grade: 'A', score: '92/100', date: '2023-05-10' },
    { id: 2, child: 'Alex Johnson', subject: 'Science', grade: 'B+', score: '88/100', date: '2023-05-08' },
    { id: 3, child: 'Emma Johnson', subject: 'English', grade: 'A+', score: '96/100', date: '2023-05-12' },
    { id: 4, child: 'Emma Johnson', subject: 'Art', grade: 'A', score: '90/100', date: '2023-05-05' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Parent Dashboard</h1>
        <p className="text-gray-600">Welcome! Here's information about your children's academic progress.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">My Children</h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Class</TableHeader>
                  <TableHeader>Attendance</TableHeader>
                  <TableHeader>Fees Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {children.map((child) => (
                  <TableRow key={child.id}>
                    <TableCell className="font-medium text-gray-900">{child.name}</TableCell>
                    <TableCell>{child.class}</TableCell>
                    <TableCell>{child.attendance}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {child.feesStatus}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Upcoming Events</h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Event</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Time</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium text-gray-900">{event.title}</TableCell>
                    <TableCell>{event.date}</TableCell>
                    <TableCell>{event.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Recent Grades</h2>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Child</TableHeader>
                <TableHeader>Subject</TableHeader>
                <TableHeader>Grade</TableHeader>
                <TableHeader>Score</TableHeader>
                <TableHeader>Date</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentGrades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell className="font-medium text-gray-900">{grade.child}</TableCell>
                  <TableCell>{grade.subject}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      grade.grade.startsWith('A') 
                        ? 'bg-green-100 text-green-800' 
                        : grade.grade.startsWith('B')
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                    }`}>
                      {grade.grade}
                    </span>
                  </TableCell>
                  <TableCell>{grade.score}</TableCell>
                  <TableCell>{grade.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}