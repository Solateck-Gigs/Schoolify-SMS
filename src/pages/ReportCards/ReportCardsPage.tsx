import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/store';
import { apiFetch } from '../../lib/api';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { toast } from 'react-hot-toast';
import { Download, Send } from 'lucide-react';

interface Class {
  _id: string;
  classType: string;
  gradeId: string;
  section: string;
}

interface ReportCard {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
  };
  position: number;
  averageScore: number;
  totalScore: number;
  promotionStatus: string;
  sentToParent: boolean;
  sentDate?: Date;
}

interface ApiResponse {
  message?: string;
  success?: boolean;
  [key: string]: any;
}

const ReportCardsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('Term 1');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2023-2024');
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [generating, setGenerating] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('classes') as Class[];
      setClasses(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
      setLoading(false);
    }
  };

  const fetchReportCards = async () => {
    if (!selectedClass || !selectedTerm || !selectedAcademicYear) {
      toast.error('Please select class, term and academic year');
      return;
    }

    try {
      setLoading(true);
      const data = await apiFetch(`report-cards?classId=${selectedClass}&term=${selectedTerm}&academicYear=${selectedAcademicYear}`) as ReportCard[];
      setReportCards(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching report cards:', error);
      toast.error('Failed to fetch report cards');
      setLoading(false);
    }
  };

  const generateReportCards = async () => {
    if (!selectedClass || !selectedTerm || !selectedAcademicYear) {
      toast.error('Please select class, term and academic year');
      return;
    }

    try {
      setGenerating(true);
      const response = await apiFetch('report-cards/generate', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClass,
          term: selectedTerm,
          academicYear: selectedAcademicYear
        })
      }) as ApiResponse;

      toast.success(response.message || 'Report cards generated successfully');
      fetchReportCards(); // Refresh the list
      setGenerating(false);
    } catch (error) {
      console.error('Error generating report cards:', error);
      toast.error('Failed to generate report cards');
      setGenerating(false);
    }
  };

  const sendReportCardsToParents = async () => {
    if (!selectedClass || !selectedTerm || !selectedAcademicYear) {
      toast.error('Please select class, term and academic year');
      return;
    }

    try {
      setSending(true);
      const response = await apiFetch('report-cards/send', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClass,
          term: selectedTerm,
          academicYear: selectedAcademicYear
        })
      }) as ApiResponse;

      toast.success(response.message || 'Report cards sent to parents successfully');
      fetchReportCards(); // Refresh the list
      setSending(false);
    } catch (error) {
      console.error('Error sending report cards:', error);
      toast.error('Failed to send report cards to parents');
      setSending(false);
    }
  };

  const viewReportCard = (reportCardId: string) => {
    // Navigate to detailed view or open modal
    window.open(`/report-cards/${reportCardId}`, '_blank');
  };

  const downloadReportCard = (reportCardId: string) => {
    // Implementation for downloading report card as PDF
    toast.success('Report card download feature coming soon!');
  };

  // Determine if the user is a teacher, admin, parent, or student
  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin';
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Report Cards</h1>

      {isTeacherOrAdmin && (
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">Generate Report Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select
              label="Class"
              value={selectedClass}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedClass(e.target.value)}
              options={classes.map(c => ({
                value: c._id,
                label: `${c.classType} ${c.gradeId} ${c.section}`
              }))}
              placeholder="Select Class"
            />
            <Select
              label="Term"
              value={selectedTerm}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTerm(e.target.value)}
              options={[
                { value: 'Term 1', label: 'Term 1' },
                { value: 'Term 2', label: 'Term 2' },
                { value: 'Term 3', label: 'Term 3' }
              ]}
              placeholder="Select Term"
            />
            <Select
              label="Academic Year"
              value={selectedAcademicYear}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAcademicYear(e.target.value)}
              options={[
                { value: '2023-2024', label: '2023-2024' },
                { value: '2024-2025', label: '2024-2025' }
              ]}
              placeholder="Select Academic Year"
            />
            <div className="flex items-end space-x-2">
              <Button
                onClick={fetchReportCards}
                disabled={loading}
                variant="outline"
              >
                View Report Cards
              </Button>
              <Button
                onClick={generateReportCards}
                disabled={generating || !selectedClass}
                variant="primary"
              >
                {generating ? 'Generating...' : 'Generate Report Cards'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isParent && (
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">View Child's Report Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="Term"
              value={selectedTerm}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTerm(e.target.value)}
              options={[
                { value: 'Term 1', label: 'Term 1' },
                { value: 'Term 2', label: 'Term 2' },
                { value: 'Term 3', label: 'Term 3' }
              ]}
              placeholder="Select Term"
            />
            <Select
              label="Academic Year"
              value={selectedAcademicYear}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAcademicYear(e.target.value)}
              options={[
                { value: '2023-2024', label: '2023-2024' },
                { value: '2024-2025', label: '2024-2025' }
              ]}
              placeholder="Select Academic Year"
            />
            <div className="flex items-end">
              <Button
                onClick={fetchReportCards}
                disabled={loading}
                variant="primary"
              >
                View Report Cards
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isStudent && (
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold mb-4">View My Report Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select
              label="Term"
              value={selectedTerm}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTerm(e.target.value)}
              options={[
                { value: 'Term 1', label: 'Term 1' },
                { value: 'Term 2', label: 'Term 2' },
                { value: 'Term 3', label: 'Term 3' }
              ]}
              placeholder="Select Term"
            />
            <Select
              label="Academic Year"
              value={selectedAcademicYear}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAcademicYear(e.target.value)}
              options={[
                { value: '2023-2024', label: '2023-2024' },
                { value: '2024-2025', label: '2024-2025' }
              ]}
              placeholder="Select Academic Year"
            />
            <div className="flex items-end">
              <Button
                onClick={fetchReportCards}
                disabled={loading}
                variant="primary"
              >
                View Report Cards
              </Button>
            </div>
          </div>
        </Card>
      )}

      {reportCards.length > 0 ? (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Admission #</th>
                <th>Position</th>
                <th>Average Score</th>
                <th>Status</th>
                {isTeacherOrAdmin && <th>Sent to Parent</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reportCards.map((reportCard) => (
                <tr key={reportCard._id}>
                  <td>{`${reportCard.student.firstName} ${reportCard.student.lastName}`}</td>
                  <td>{reportCard.student.admissionNumber}</td>
                  <td>{reportCard.position}</td>
                  <td>{reportCard.averageScore.toFixed(1)}%</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      reportCard.promotionStatus === 'promoted'
                        ? 'bg-green-100 text-green-800'
                        : reportCard.promotionStatus === 'retained'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {reportCard.promotionStatus.charAt(0).toUpperCase() + reportCard.promotionStatus.slice(1)}
                    </span>
                  </td>
                  {isTeacherOrAdmin && (
                    <td>
                      {reportCard.sentToParent ? (
                        <span className="text-green-600">Sent</span>
                      ) : (
                        <span className="text-red-600">Not sent</span>
                      )}
                    </td>
                  )}
                  <td className="flex space-x-2">
                    <Button
                      onClick={() => viewReportCard(reportCard._id)}
                      variant="outline"
                      size="sm"
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => downloadReportCard(reportCard._id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-1" /> PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {isTeacherOrAdmin && (
            <div className="p-4 bg-gray-50 border-t">
              <Button
                onClick={sendReportCardsToParents}
                disabled={sending || reportCards.every(rc => rc.sentToParent)}
                variant="primary"
                className="flex items-center"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send to Parents'}
              </Button>
            </div>
          )}
        </Card>
      ) : (
        !loading && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No report cards found. Please select a class and term or generate new report cards.</p>
          </div>
        )
      )}

      {loading && (
        <div className="text-center p-8">
          <p className="text-gray-500">Loading report cards...</p>
        </div>
      )}
    </div>
  );
};

export default ReportCardsPage;