import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { toast } from 'react-hot-toast';
import { User, Bell, Lock, UserCircle } from 'lucide-react';
import { apiFetch } from '../../lib/api';

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  message_notifications: boolean;
  announcement_notifications: boolean;
}

export default function ProfileSettings() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    message_notifications: true,
    announcement_notifications: true,
  });

  useEffect(() => {
    if (user) {
      // Fetch user profile data
      const fetchProfile = async () => {
        try {
          const profile = await apiFetch(`/users/${user.id}`);
          setFormData(prev => ({
            ...prev,
            full_name: profile.full_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
          }));
          setProfileImage(profile.avatar_url);
          // Fetch notification preferences
          const prefs = await apiFetch(`/users/${user.id}/notification-preferences`);
          setNotificationPrefs(prefs);
        } catch (error) {
          console.error('Error fetching profile or preferences:', error);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      setLoading(true);
      // You may need to implement an /upload endpoint in your backend
      const formDataObj = new FormData();
      formDataObj.append('avatar', file);
      const response = await fetch(`/users/${user.id}/avatar`, {
        method: 'POST',
        body: formDataObj,
      });
      if (!response.ok) throw new Error('Failed to upload image');
      const { publicUrl } = await response.json();
      setProfileImage(publicUrl);
      toast.success('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to update profile image');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setNotificationPrefs(prev => ({ ...prev, [name]: checked }));
  };

  const updateProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await apiFetch(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        }),
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!user || !formData.current_password || !formData.new_password) return;
    if (formData.new_password !== formData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await apiFetch(`/users/${user.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({
          current_password: formData.current_password,
          new_password: formData.new_password,
        }),
      });
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }));
      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPreferences = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await apiFetch(`/users/${user.id}/notification-preferences`, {
        method: 'PUT',
        body: JSON.stringify({
          ...notificationPrefs,
          updated_at: new Date().toISOString(),
        }),
      });
      toast.success('Notification preferences updated successfully');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserCircle className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="flex items-center gap-6 mb-8">
            <div className="relative">
              <img
                src={profileImage || `https://ui-avatars.com/api/?name=${formData.full_name}`}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full cursor-pointer hover:bg-primary/90"
              >
                <User className="w-4 h-4" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
              </label>
            </div>
            <div>
              <h2 className="text-lg font-semibold">{formData.full_name}</h2>
              <p className="text-muted-foreground">{formData.email}</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleFormChange}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleFormChange}
                disabled={loading}
              />
            </div>

            <Button onClick={updateProfile} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                name="current_password"
                type="password"
                value={formData.current_password}
                onChange={handleFormChange}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                name="new_password"
                type="password"
                value={formData.new_password}
                onChange={handleFormChange}
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleFormChange}
                disabled={loading}
              />
            </div>

            <Button onClick={updatePassword} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email_notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
              <input
                type="checkbox"
                id="email_notifications"
                name="email_notifications"
                checked={notificationPrefs.email_notifications}
                onChange={handleNotificationChange}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push_notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive push notifications in your browser
                </p>
              </div>
              <input
                type="checkbox"
                id="push_notifications"
                name="push_notifications"
                checked={notificationPrefs.push_notifications}
                onChange={handleNotificationChange}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="message_notifications">Message Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new messages
                </p>
              </div>
              <input
                type="checkbox"
                id="message_notifications"
                name="message_notifications"
                checked={notificationPrefs.message_notifications}
                onChange={handleNotificationChange}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="announcement_notifications">Announcement Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about new announcements
                </p>
              </div>
              <input
                type="checkbox"
                id="announcement_notifications"
                name="announcement_notifications"
                checked={notificationPrefs.announcement_notifications}
                onChange={handleNotificationChange}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
            </div>

            <Button onClick={updateNotificationPreferences} disabled={loading}>
              {loading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 