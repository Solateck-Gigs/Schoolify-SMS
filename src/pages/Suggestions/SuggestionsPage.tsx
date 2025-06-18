import React, { useState } from 'react';
import { useAuthStore } from '../../lib/store';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Label } from '../../components/ui/Label';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Suggestion {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

export default function SuggestionsPage() {
  const { user } = useAuthStore();
  const [submissionType, setSubmissionType] = useState('suggestion' as 'suggestion' | 'question');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [newSuggestion, setNewSuggestion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const fetchSuggestions = async () => {
    try {
      const { data } = await api.get('/suggestions');
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to fetch suggestions');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestion.trim()) return;

    try {
      const { data } = await api.post('/suggestions', {
        content: newSuggestion,
        category: selectedCategory
      });
      setSuggestions(prev => [...prev, data]);
      setNewSuggestion('');
      toast.success('Suggestion submitted successfully!');
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('Failed to submit suggestion');
    }
  };

  if (!user || user.role !== 'parent') {
    return <div>Access Denied: Parents Only</div>;
  }

  const typeOptions = [
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'question', label: 'Question' },
  ];

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-gray-800">Suggestions and Questions</h1>
      <p className="text-gray-600">Submit your feedback or ask questions to the school administration.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="submissionType">Type</Label>
          <Select
            id="submissionType"
            name="submissionType"
            value={submissionType}
            onChange={(e) => setSubmissionType(e.target.value as 'suggestion' | 'question')}
            options={typeOptions}
            fullWidth
          />
        </div>

        <div>
          <Label htmlFor="content">Message</Label>
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            rows={6}
            required
          ></textarea>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Submission'}
          </Button>
        </div>
      </form>

      {/* Section to display past submissions will be added here */}
    </div>
  );
} 