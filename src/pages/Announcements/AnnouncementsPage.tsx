import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  description: string;
  created_at: string;
  class_id: string | null;
  // Add any other relevant fields from your announcements table
}

const AnnouncementsPage = () => {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setError(null);

      let query = supabase.from('announcements').select('*');

      // Implement role-based filtering similar to full-stack-school example
      if (user?.role === 'teacher') {
        // Fetch announcements relevant to the teacher's classes
        // This would require joining with the classes table and filtering by teacher_id
        // For now, fetch all public announcements and those linked to classes they supervise
         query = query.or('class_id.is.null');
         // TODO: Implement more specific filtering based on teacher's classes

      } else if (user?.role === 'parent') {
        // Fetch announcements relevant to the parent's children's classes
        // This would require joining with students and classes tables
        // For now, fetch all public announcements
         query = query.or('class_id.is.null');
         // TODO: Implement more specific filtering based on parent's children's classes

      } else if (user?.role === 'student') {
         // Fetch announcements relevant to the student's class
         // This would require joining with classes table
         // For now, fetch all public announcements
          query = query.or('class_id.is.null');
          // TODO: Implement more specific filtering based on student's class
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
        setError('Failed to load announcements.');
        setAnnouncements([]);
        toast.error('Failed to load announcements.');
      } else {
        setAnnouncements(data || []);
      }

      setLoading(false);
    };

    fetchAnnouncements();
  }, [user]);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Announcements</h2>
        </CardHeader>
        <CardContent>
          {loading && <p>Loading announcements...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && announcements.length === 0 && (
            <p>No announcements found.</p>
          )}
          {!loading && !error && announcements.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  {/* Add Class column if needed */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell>{announcement.description}</TableCell>
                    <TableCell>{new Date(announcement.created_at).toLocaleDateString()}</TableCell>
                    {/* Add Class Cell if needed */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementsPage; 