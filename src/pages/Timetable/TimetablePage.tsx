import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen } from 'lucide-react';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../lib/store';

export default function TimetablePage() {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  
  // Simulated class options - would come from the database in a real app
  const classOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Class ${i + 1}`,
  }));
  
  const sectionOptions = [
    { value: 'A', label: 'Section A' },
    { value: 'B', label: 'Section B' },
    { value: 'C', label: 'Section C' },
  ];
  
  const dayOptions = [
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
  ];
  
  // Mock timetable data - In a real app, this would be fetched from Supabase
  const timetableData = {
    periods: [
      { id: 1, startTime: '08:00', endTime: '08:45' },
      { id: 2, startTime: '08:50', endTime: '09:35' },
      { id: 3, startTime: '09:40', endTime: '10:25' },
      { id: 4, startTime: '10:40', endTime: '11:25' },
      { id: 5, startTime: '11:30', endTime: '12:15' },
      { id: 6, startTime: '13:00', endTime: '13:45' },
      { id: 7, startTime: '13:50', endTime: '14:35' },
      { id: 8, startTime: '14:40', endTime: '15:25' },
    ],
    schedule: {
      '5-A-1': [
        { period: 1, subject: 'Mathematics', teacher: 'Mr. Johnson' },
        { period: 2, subject: 'Science', teacher: 'Mrs. Smith' },
        { period: 3, subject: 'English', teacher: 'Ms. Williams' },
        { period: 4, subject: 'Social Studies', teacher: 'Mr. Davis' },
        { period: 5, subject: 'Art', teacher: 'Mrs. Wilson' },
        { period: 6, subject: 'Physical Education', teacher: 'Mr. Brown' },
        { period: 7, subject: 'Music', teacher: 'Ms. Miller' },
        { period: 8, subject: 'Computer Science', teacher: 'Mr. Taylor' },
      ],
      '5-A-2': [
        { period: 1, subject: 'Science', teacher: 'Mrs. Smith' },
        { period: 2, subject: 'Mathematics', teacher: 'Mr. Johnson' },
        { period: 3, subject: 'Art', teacher: 'Mrs. Wilson' },
        { period: 4, subject: 'English', teacher: 'Ms. Williams' },
        { period: 5, subject: 'Computer Science', teacher: 'Mr. Taylor' },
        { period: 6, subject: 'Social Studies', teacher: 'Mr. Davis' },
        { period: 7, subject: 'Physical Education', teacher: 'Mr. Brown' },
        { period: 8, subject: 'Music', teacher: 'Ms. Miller' },
      ],
    }
  };
  
  // Set initial class and section based on user role
  useEffect(() => {
    if (user?.role === 'teacher') {
      // For teachers, we'd fetch their assigned classes
      setSelectedClass('5');
      setSelectedSection('A');
    } else if (user?.role === 'parent') {
      // For parents, we'd fetch their children's classes
      setSelectedClass('5');
      setSelectedSection('A');
    } else {
      // For admin, default to first class
      setSelectedClass('5');
      setSelectedSection('A');
    }
  }, [user]);
  
  const timetableKey = selectedClass && selectedSection && selectedDay 
    ? `${selectedClass}-${selectedSection}-${selectedDay}` 
    : null;
  
  const currentTimetable = timetableKey && timetableData.schedule[timetableKey as keyof typeof timetableData.schedule] 
    ? timetableData.schedule[timetableKey as keyof typeof timetableData.schedule] 
    : timetableData.schedule['5-A-1']; // Default to class 5-A Monday as fallback
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Timetable</h1>
          <p className="text-gray-600">View and manage class schedules</p>
        </div>
        
        {user?.role === 'admin' && (
          <Button variant="primary">
            Edit Timetable
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/3">
              <Select
                label="Class"
                options={classOptions}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/3">
              <Select
                label="Section"
                options={sectionOptions}
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/3">
              <Select
                label="Day"
                options={dayOptions}
                value={selectedDay.toString()}
                onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                fullWidth
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTimetable.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 border-r">
                      Period {item.period}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 border-r">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-gray-400" />
                        {timetableData.periods[item.period - 1].startTime} - {timetableData.periods[item.period - 1].endTime}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 border-r">
                      <div className="flex items-center">
                        <BookOpen size={16} className="mr-2 text-blue-500" />
                        {item.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users size={16} className="mr-2 text-teal-500" />
                        {item.teacher}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              leftIcon={<Calendar size={16} />}
            >
              Download Full Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}