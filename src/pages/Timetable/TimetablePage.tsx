import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/Dialog';
import { useAuthStore } from '../../lib/store';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface TimetableEntry {
  _id: string;
  class: {
    _id: string;
    name: string;
    section: string;
    gradeLevel: string;
  };
  subject: string;
  teacher: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Class {
  _id: string;
  name: string;
  section: string;
  gradeLevel: string;
}

interface Child {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class: {
    _id: string;
    name: string;
    section: string;
    gradeLevel: string;
  };
}

// Component for Parent View
const ParentTimetableView: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayOptions = [
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
  ];

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (selectedChild) {
      fetchChildTimetable();
    }
  }, [selectedChild, selectedDay]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const childrenData = await apiFetch<Child[]>('/parent/children');
      setChildren(childrenData);
      if (childrenData.length > 0) {
        setSelectedChild(childrenData[0]._id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to fetch children');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildTimetable = async () => {
    try {
      setLoading(true);
      const selectedChildData = children.find(child => child._id === selectedChild);
      if (!selectedChildData || !selectedChildData.class) {
        setError('Child has no assigned class');
        setTimetableData([]);
        return;
      }

      const classId = selectedChildData.class._id;
      const response = await apiFetch<TimetableEntry[]>(`/timetable/class/${classId}`);
      setTimetableData(response);
      setError(null);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setError('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const currentTimetable = timetableData.filter(entry => entry.dayOfWeek === selectedDay);
  const selectedChildData = children.find(child => child._id === selectedChild);

  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Timetable</h1>
          <p className="text-gray-600">View your children's class schedules</p>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No children found</p>
            <p className="text-sm text-gray-500">Please contact the school administration to link your children to your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Class Timetable</h1>
        <p className="text-gray-600">View your children's class schedules</p>
        {selectedChildData && (
          <p className="text-sm text-gray-500 mt-1">
            {selectedChildData.firstName} {selectedChildData.lastName} - {selectedChildData.class?.name || 'No Class'} {selectedChildData.class?.section || ''}
          </p>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              <Select
                label="Child"
                options={children.map(child => ({
                  value: child._id,
                  label: `${child.firstName} ${child.lastName} - ${child.class?.name || 'No Class'}`
                }))}
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/2">
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
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : currentTimetable.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No timetable entries for this day</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
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
                    <tr key={item._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm text-gray-500 border-r">
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-gray-400" />
                          {item.startTime} - {item.endTime}
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
                          {item.teacher.firstName} {item.teacher.lastName}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Component for Teacher View
const TeacherTimetableView: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayOptions = [
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
  ];

  useEffect(() => {
    fetchTeacherTimetable();
  }, [selectedDay]);

  const fetchTeacherTimetable = async () => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      const response = await apiFetch<TimetableEntry[]>(`/timetable/teacher/${user._id}`);
      setTimetableData(response);
      setError(null);
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
      setError('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const currentTimetable = timetableData.filter(entry => entry.dayOfWeek === selectedDay);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Teaching Schedule</h1>
        <p className="text-gray-600">View your teaching timetable</p>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
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
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : currentTimetable.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No teaching assignments for this day</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTimetable.map((item, index) => (
                    <tr key={item._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm text-gray-500 border-r">
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-gray-400" />
                          {item.startTime} - {item.endTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 border-r">
                        <div className="flex items-center">
                          <Users size={16} className="mr-2 text-teal-500" />
                          {item.class.name} {item.class.section}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <BookOpen size={16} className="mr-2 text-blue-500" />
                          {item.subject}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Timetable Management Component
const AdminTimetableView: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  const [timetableData, setTimetableData] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating new timetable entry
  const [newEntry, setNewEntry] = useState({
    class: '',
    subject: '',
    teacher: '',
    dayOfWeek: 1,
    startTime: '',
    endTime: '',
    academicYear: new Date().getFullYear().toString(),
    term: 'Term 1'
  });
  
  const dayOptions = [
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
  ];

  useEffect(() => {
    // Fetch classes
    const fetchClasses = async () => {
      try {
        const response = await apiFetch<Class[]>('/classes');
        setClasses(response);
        if (response.length > 0) {
          setSelectedClass(response[0]._id);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to fetch classes');
      }
    };

    // Fetch teachers
    const fetchTeachers = async () => {
      try {
        const response = await apiFetch<Teacher[]>('/teachers');
        setTeachers(response);
      } catch (err) {
        console.error('Error fetching teachers:', err);
        setError('Failed to fetch teachers');
      }
    };

    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    const fetchTimetable = async () => {
      if (!selectedClass) return;
      
      setLoading(true);
      try {
        const response = await apiFetch<TimetableEntry[]>(`/timetable/class/${selectedClass}`);
        setTimetableData(response);
        setError(null);
      } catch (err) {
        console.error('Error fetching timetable:', err);
        setError('Failed to fetch timetable');
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [selectedClass]);

  const handleCreateEntry = async () => {
    try {
      // Validate required fields
      const requiredFields = {
        class: 'Class',
        subject: 'Subject',
        teacher: 'Teacher',
        dayOfWeek: 'Day',
        startTime: 'Start Time',
        endTime: 'End Time'
      };

      const missingFields = Object.entries(requiredFields).reduce((acc: string[], [key, label]) => {
        if (!newEntry[key as keyof typeof newEntry]) {
          acc.push(label);
        }
        return acc;
      }, []);

      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Convert time format from "HH:mm" input to "HH:mm" 24-hour format
      const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        return timeStr; // Time input already returns in 24-hour format
      };

      const payload = {
        ...newEntry,
        startTime: formatTime(newEntry.startTime),
        endTime: formatTime(newEntry.endTime),
        dayOfWeek: parseInt(newEntry.dayOfWeek.toString())
      };

      console.log('Creating timetable entry with payload:', payload);

      const response = await apiFetch('/timetable', {
        method: 'POST',
        body: payload
      });
      
      // Refresh timetable data
      const timetableResponse = await apiFetch<TimetableEntry[]>(`/timetable/class/${selectedClass}`);
      setTimetableData(timetableResponse);
      setIsCreateModalOpen(false);
      
      // Reset form
      setNewEntry({
        class: '',
        subject: '',
        teacher: '',
        dayOfWeek: 1,
        startTime: '',
        endTime: '',
        academicYear: new Date().getFullYear().toString(),
        term: 'Term 1'
      });
      
      setError(null);
      toast.success('Timetable entry created successfully');
    } catch (err: any) {
      console.error('Error creating timetable entry:', err);
      console.error('Error details:', err.response?.data);

      // Handle different error types
      const errorData = err.response?.data;
      if (errorData?.error === 'Time conflict detected') {
        const conflict = errorData.details.conflictingEntry;
        setError(
          `Time conflict detected with existing schedule:\n` +
          `Class: ${conflict.class.name} ${conflict.class.section}\n` +
          `Teacher: ${conflict.teacher.firstName} ${conflict.teacher.lastName}\n` +
          `Time: ${conflict.startTime} - ${conflict.endTime}`
        );
      } else if (errorData?.error === 'Validation error') {
        setError(`Validation error: ${Object.values(errorData.details).join(', ')}`);
      } else if (errorData?.error === 'Missing required fields') {
        setError(`Missing fields: ${Object.values(errorData.details).filter(Boolean).join(', ')}`);
      } else {
        setError(errorData?.error || 'Failed to create timetable entry');
      }
    }
  };

  const currentTimetable = timetableData.filter(entry => entry.dayOfWeek === selectedDay);
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class Timetable</h1>
          <p className="text-gray-600">View and manage class schedules</p>
        </div>
        
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus size={16} className="mr-2" />
          Add Timetable Entry
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-1/2">
              <Select
                label="Class"
                options={classes.map(c => ({
                  value: c._id,
                  label: `${c.name} - ${c.section}`
                }))}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                fullWidth
              />
            </div>
            
            <div className="w-full sm:w-1/2">
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
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : currentTimetable.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No timetable entries for this day</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
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
                    <tr key={item._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 text-sm text-gray-500 border-r">
                        <div className="flex items-center">
                          <Clock size={16} className="mr-2 text-gray-400" />
                          {item.startTime} - {item.endTime}
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
                          {item.teacher.firstName} {item.teacher.lastName}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Timetable Entry Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Timetable Entry</DialogTitle>
            <DialogDescription>
              Add a new class schedule to the timetable. Make sure there are no time conflicts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              label="Class"
              options={classes.map(c => ({
                value: c._id,
                label: `${c.name} - ${c.section}`
              }))}
              value={newEntry.class}
              onChange={(e) => setNewEntry({ ...newEntry, class: e.target.value })}
              fullWidth
            />

            <Input
              label="Subject"
              value={newEntry.subject}
              onChange={(e) => setNewEntry({ ...newEntry, subject: e.target.value })}
              fullWidth
            />

            <Select
              label="Teacher"
              options={teachers.map(t => ({
                value: t._id,
                label: `${t.firstName} ${t.lastName}`
              }))}
              value={newEntry.teacher}
              onChange={(e) => setNewEntry({ ...newEntry, teacher: e.target.value })}
              fullWidth
            />

            <Select
              label="Day"
              options={dayOptions}
              value={newEntry.dayOfWeek.toString()}
              onChange={(e) => setNewEntry({ ...newEntry, dayOfWeek: parseInt(e.target.value) })}
              fullWidth
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={newEntry.startTime}
                onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                fullWidth
              />

              <Input
                label="End Time"
                type="time"
                value={newEntry.endTime}
                onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                fullWidth
              />
            </div>

            <Select
              label="Term"
              options={[
                { value: 'Term 1', label: 'Term 1' },
                { value: 'Term 2', label: 'Term 2' },
                { value: 'Term 3', label: 'Term 3' }
              ]}
              value={newEntry.term}
              onChange={(e) => setNewEntry({ ...newEntry, term: e.target.value })}
              fullWidth
            />

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateEntry}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function TimetablePage() {
  const { user } = useAuthStore();

  // Render different views based on user role
  if (user?.role === 'parent') {
    return <ParentTimetableView />;
  } else if (user?.role === 'teacher') {
    return <TeacherTimetableView />;
  } else if (user?.role === 'admin' || user?.role === 'super_admin') {
    return <AdminTimetableView />;
  } else {
    // Fallback for students or unknown roles
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-800">Access Restricted</h1>
        <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
      </div>
    );
  }
}