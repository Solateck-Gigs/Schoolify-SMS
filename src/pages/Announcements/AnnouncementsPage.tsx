import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-hot-toast';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  created_at: string;
  // Add any other relevant fields from your backend announcement model
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
      try {
        // Fetch announcements from backend
        const data = await apiFetch('/announcements');
        setAnnouncements(data);
      } catch (err) {
        setError('Failed to load announcements.');
        setAnnouncements([]);
        toast.error('Failed to load announcements.');
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
                  <TableHead>Content</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement._id}>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell>{announcement.content}</TableCell>
                    <TableCell>{new Date(announcement.created_at).toLocaleDateString()}</TableCell>
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