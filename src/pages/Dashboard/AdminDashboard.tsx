import React from 'react';
import { Users, GraduationCap, DollarSign, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

export default function AdminDashboard() {
  // This would be fetched from Supabase in a real application
  const stats = [
    { title: 'Total Students', value: 320, icon: <GraduationCap size={24} />, color: 'bg-blue-100 text-blue-800' },
    { title: 'Total Teachers', value: 28, icon: <Users size={24} />, color: 'bg-green-100 text-green-800' },
    { title: 'Fees Collected', value: '$42,500', icon: <DollarSign size={24} />, color: 'bg-amber-100 text-amber-800' },
    { title: 'Pending Fees', value: '$8,250', icon: <AlertCircle size={24} />, color: 'bg-red-100 text-red-800' },
  ];

  const recentFees = [
    { id: 1, student: 'Emma Johnson', class: 'Class 4', amount: '$350', date: '2023-05-15', status: 'paid' },
    { id: 2, student: 'Michael Chen', class: 'Class 6', amount: '$450', date: '2023-05-14', status: 'paid' },
    { id: 3, student: 'Sofia Rodriguez', class: 'Class 2', amount: '$250', date: '2023-05-12', status: 'paid' },
    { id: 4, student: 'Liam Patel', class: 'Class 5', amount: '$400', date: '2023-05-10', status: 'paid' },
  ];

  const newStudents = [
    { id: 1, name: 'Noah Wilson', class: 'Class 1', enrollDate: '2023-05-01' },
    { id: 2, name: 'Ava Thompson', class: 'Class 3', enrollDate: '2023-05-03' },
    { id: 3, name: 'Ethan Brown', class: 'Class 2', enrollDate: '2023-05-05' },
    { id: 4, name: 'Isabella Garcia', class: 'Class 4', enrollDate: '2023-05-08' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your school today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center p-6">
              <div className={`p-3 rounded-full mr-4 ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Recent Fee Payments</h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Student</TableHeader>
                  <TableHeader>Class</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium text-gray-900">{fee.student}</TableCell>
                    <TableCell>{fee.class}</TableCell>
                    <TableCell>{fee.amount}</TableCell>
                    <TableCell>{fee.date}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {fee.status}
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
            <h2 className="text-lg font-medium text-gray-900">New Students</h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Class</TableHeader>
                  <TableHeader>Enrollment Date</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {newStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium text-gray-900">{student.name}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.enrollDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}