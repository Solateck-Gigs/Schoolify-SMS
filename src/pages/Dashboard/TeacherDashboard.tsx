import React from 'react';
import { GraduationCap, BookOpen, Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';

export default function TeacherDashboard() {
  // This would be fetched from Supabase in a real application
  const stats = [
    { title: 'My Classes', value: 4, icon: <BookOpen size={24} />, color: 'bg-blue-100 text-blue-800' },
    { title: 'Total Students', value: 120, icon: <GraduationCap size={24} />, color: 'bg-teal-100 text-teal-800' },
    { title: 'Classes Today', value: 3, icon: <Calendar size={24} />, color: 'bg-purple-100 text-purple-800' },
    { title: 'Next Class', value: '10:30 AM', icon: <Clock size={24} />, color: 'bg-amber-100 text-amber-800' },
  ];

  const upcomingClasses = [
    { id: 1, class: 'Class 5A', subject: 'Mathematics', time: '10:30 - 11:30', room: 'Room 102' },
    { id: 2, class: 'Class 6B', subject: 'Science', time: '12:00 - 13:00', room: 'Room 204' },
    { id: 3, class: 'Class 5A', subject: 'Mathematics', time: '14:15 - 15:15', room: 'Room 102' },
  ];

  const pendingTasks = [
    { id: 1, task: 'Grade Class 6B Math Quiz', dueDate: '2023-05-20', priority: 'high' },
    { id: 2, task: 'Prepare Science Lesson Plan', dueDate: '2023-05-22', priority: 'medium' },
    { id: 3, task: 'Submit Monthly Progress Report', dueDate: '2023-05-30', priority: 'medium' },
    { id: 4, task: 'Parent-Teacher Meeting Preparation', dueDate: '2023-06-02', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's your teaching schedule and tasks.</p>
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
            <h2 className="text-lg font-medium text-gray-900">Today's Classes</h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Class</TableHeader>
                  <TableHeader>Subject</TableHeader>
                  <TableHeader>Time</TableHeader>
                  <TableHeader>Room</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {upcomingClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium text-gray-900">{cls.class}</TableCell>
                    <TableCell>{cls.subject}</TableCell>
                    <TableCell>{cls.time}</TableCell>
                    <TableCell>{cls.room}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Pending Tasks</h2>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Task</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Priority</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium text-gray-900">{task.task}</TableCell>
                    <TableCell>{task.dueDate}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        task.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : task.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </TableCell>
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