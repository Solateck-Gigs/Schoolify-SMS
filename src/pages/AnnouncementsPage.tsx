import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Bell, Plus, Edit, Trash2, Eye, AlertCircle, Users, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: string[];
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
  readBy: string[];
}

export default function AnnouncementsPage() {
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    targetAudience: [] as string[]
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementsData = await apiFetch('/announcements') as Announcement[];
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      if (!formData.title.trim() || !formData.content.trim()) {
        toast.error('Title and content are required');
        return;
      }

      if (formData.targetAudience.length === 0) {
        toast.error('Please select at least one target audience');
        return;
      }

      await apiFetch('/announcements', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      toast.success('Announcement created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const handleEditAnnouncement = async () => {
    try {
      if (!selectedAnnouncement) return;

      await apiFetch(`/announcements/${selectedAnnouncement._id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      toast.success('Announcement updated successfully');
      setShowEditModal(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      if (!confirm('Are you sure you want to delete this announcement?')) return;

      await apiFetch(`/announcements/${announcementId}`, {
        method: 'DELETE'
      });

      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const markAsRead = async (announcementId: string) => {
    try {
      await apiFetch(`/announcements/${announcementId}/read`, {
        method: 'POST'
      });
      fetchAnnouncements(); // Refresh to update read status
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      targetAudience: []
    });
    setSelectedAnnouncement(null);
  };

  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience
    });
    setShowEditModal(true);
  };

  const openViewModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setShowViewModal(true);
    if (!announcement.readBy.includes(user?._id || '')) {
      markAsRead(announcement._id);
    }
  };

  const handleAudienceToggle = (audience: string) => {
    setFormData(prev => ({
      ...prev,
      targetAudience: prev.targetAudience.includes(audience)
        ? prev.targetAudience.filter(a => a !== audience)
        : [...prev.targetAudience, audience]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const audienceOptions = [
    { value: 'all', label: 'All Users' },
    { value: 'students', label: 'Students' },
    { value: 'teachers', label: 'Teachers' },
    { value: 'parents', label: 'Parents' },
    { value: 'admins', label: 'Administrators' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' }
  ];

  const isUnread = (announcement: Announcement) => {
    return !announcement.readBy.includes(user?._id || '');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell className="h-6 w-6" />
            School Announcements
          </h1>
          <p className="text-gray-600">
            {isAdmin 
              ? 'Create and manage school announcements and notifications'
              : 'Stay updated with the latest school announcements and news'
            }
          </p>
        </div>
        
        {isAdmin && (
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Recent Announcements</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Bell className="h-4 w-4" />
              <span>{announcements.filter(a => isUnread(a)).length} unread</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No announcements available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card 
                  key={announcement._id} 
                  className={`border transition-all hover:shadow-md cursor-pointer ${
                    isUnread(announcement) ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : 'border-gray-200'
                  }`}
                  onClick={() => openViewModal(announcement)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${getPriorityColor(announcement.priority)}`}>
                            {getPriorityIcon(announcement.priority)}
                            {announcement.priority.toUpperCase()}
                          </span>
                          {isUnread(announcement) && (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              NEW
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-gray-900 mb-1">{announcement.title}</h4>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {announcement.content.substring(0, 150)}
                          {announcement.content.length > 150 && '...'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {announcement.targetAudience.join(', ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(announcement.createdAt).toLocaleDateString()}
                          </span>
                          <span>
                            By {announcement.createdBy.firstName} {announcement.createdBy.lastName}
                          </span>
                        </div>
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(announcement);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAnnouncement(announcement._id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Announcement Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Announcement</DialogTitle>
            <DialogDescription>
              Share important information with the school community.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              label="Title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter announcement title..."
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Enter announcement content..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {audienceOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.targetAudience.includes(option.value)}
                      onChange={() => handleAudienceToggle(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateAnnouncement}>
              Create Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>
              Update the announcement information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              label="Title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Enter announcement title..."
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Enter announcement content..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {audienceOptions.map(option => (
                  <label key={option.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.targetAudience.includes(option.value)}
                      onChange={() => handleAudienceToggle(option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditAnnouncement}>
              Update Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Announcement Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAnnouncement && getPriorityIcon(selectedAnnouncement.priority)}
              {selectedAnnouncement?.title}
            </DialogTitle>
            <DialogDescription>
              Posted on {selectedAnnouncement && new Date(selectedAnnouncement.createdAt).toLocaleDateString()} by {selectedAnnouncement?.createdBy.firstName} {selectedAnnouncement?.createdBy.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full border flex items-center gap-1 ${getPriorityColor(selectedAnnouncement.priority)}`}>
                  {getPriorityIcon(selectedAnnouncement.priority)}
                  {selectedAnnouncement.priority.toUpperCase()}
                </span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                  {selectedAnnouncement.targetAudience.join(', ')}
                </span>
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedAnnouncement.content}</p>
              </div>
              
              <div className="text-xs text-gray-500 border-t pt-4">
                <p>Last updated: {new Date(selectedAnnouncement.updatedAt).toLocaleString()}</p>
                <p>Read by {selectedAnnouncement.readBy.length} users</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 