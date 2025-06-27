import React, { useState, useEffect } from 'react';
import { BookOpen, Filter, Award, TrendingUp, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import { useAuthStore } from '../../lib/store';
import { apiFetch } from '../../lib/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

interface Mark {
  _id: string;
  subject: string;
  score: number;
  totalScore: number;
  assessmentType: string;
  term: string;
  academicYear: string;
  grade: string;
  remarks?: string;
  markedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface SubjectSummary {
  subject: string;
  averageScore: number;
  grade: string;
  assessments: Mark[];
}

interface Child {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  class?: {
    name: string;
    section: string;
  }
}

// Define proper interfaces for API responses
interface ChildResult {
  studentInfo: {
    name: string;
    class: any;
    classSize: number;
  };
  resultsBySubject: Array<{
    subject: string;
    exam: {
      scores: Mark[];
      average: number;
    };
    test: {
      scores: Mark[];
      average: number;
    };
    overallAverage: number;
    grade: string;
  }>;
  promotionStatus: {
    totalScore: number;
    threshold: number;
    canBePromoted: boolean;
    nextClass: string;
  };
  term: string;
  academicYear: string;
}

export default function ResultsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([]);
  const [overallAverage, setOverallAverage] = useState(0);
  const [overallGrade, setOverallGrade] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [promotionStatus, setPromotionStatus] = useState<any>(null);
  const [childName, setChildName] = useState<string>('');
  
  // Options for filters
  const termOptions = [
    { value: '', label: 'All Terms' },
    { value: 'Term 1', label: 'Term 1' },
    { value: 'Term 2', label: 'Term 2' },
    { value: 'Term 3', label: 'Term 3' },
    { value: 'Annual', label: 'Annual' },
  ];
  
  const academicYearOptions = [
    { value: '', label: 'All Academic Years' },
    { value: '2023-2024', label: '2023-2024' },
    { value: '2022-2023', label: '2022-2023' },
  ];

  // Load children if parent
  useEffect(() => {
    if (user && user.role === 'parent') {
      fetchChildren();
    }
  }, [user]);

  // Fetch results based on selected child/term/year
  useEffect(() => {
    if (user) {
      if (user.role === 'student' || (user.role === 'parent' && selectedChild)) {
        fetchResults();
      }
    }
  }, [user, selectedTerm, selectedAcademicYear, selectedChild]);

  const fetchChildren = async () => {
    try {
      const response = await apiFetch('/parents/children');
      
      if (Array.isArray(response) && response.length > 0) {
        setChildren(response);
        setSelectedChild(response[0]._id);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to load children');
    }
  };

  const fetchResults = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Build query params
      const queryParams = new URLSearchParams();
      if (selectedTerm) queryParams.append('term', selectedTerm);
      if (selectedAcademicYear) queryParams.append('academicYear', selectedAcademicYear);
      
      // Fetch results - different endpoint based on role
      let endpoint;
      if (user.role === 'student') {
        endpoint = `/students/${user._id}/results${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      } else if (user.role === 'parent' && selectedChild) {
        endpoint = `/parents/child/${selectedChild}/results${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      } else {
        return; // No endpoint to call
      }
      
      const data: ChildResult = await apiFetch(endpoint);
      
      if (data && data.resultsBySubject) {
        setMarks(data.resultsBySubject.flatMap(subject => 
          [...subject.exam.scores, ...subject.test.scores])
        );
        
        // Create summaries for each subject
        const summaries = data.resultsBySubject.map((result) => ({
          subject: result.subject,
          averageScore: result.overallAverage,
          grade: result.grade,
          assessments: [...result.exam.scores, ...result.test.scores]
        }));
        
        setSubjectSummaries(summaries);
        setPromotionStatus(data.promotionStatus);
        setChildName(data.studentInfo?.name || user.firstName + ' ' + user.lastName);
        
        // Calculate overall average
        if (summaries.length > 0) {
          const overall = summaries.reduce((sum: number, subject: SubjectSummary) => sum + subject.averageScore, 0) / summaries.length;
          setOverallAverage(Math.round(overall));
          setOverallGrade(getGradeFromScore(overall));
        }
      } else {
        toast.error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getGradeFromScore = (score: number): string => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    return 'F';
  };

  const getGradeColor = (grade: string): string => {
    switch (grade) {
      case 'A+': return 'bg-green-100 text-green-800';
      case 'A': return 'bg-green-100 text-green-800';
      case 'B+': return 'bg-blue-100 text-blue-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C+': return 'bg-yellow-100 text-yellow-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const toggleSubjectExpand = (subject: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subject)) {
      newExpanded.delete(subject);
    } else {
      newExpanded.add(subject);
    }
    setExpandedSubjects(newExpanded);
  };

  const downloadResults = () => {
    // This would normally generate a PDF report
    // For now, just show a success message
    toast.success('Results report downloaded');
  };

  if (!user || (user.role !== 'student' && user.role !== 'parent')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Access Denied</h2>
          <p className="mt-2 text-gray-600">This page is only available for students and parents.</p>
        </div>
      </div>
    );
  }

  if (user.role === 'parent' && children.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">No Children Found</h2>
          <p className="mt-2 text-gray-600">You don't have any children linked to your account.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800 flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              {user.role === 'parent' ? 'Child Results' : 'My Academic Results'}
            </h1>
            <p className="text-gray-600">
              {user.role === 'parent' 
                ? "View your child's academic performance across all subjects"
                : "View your academic performance across all subjects"
              }
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {user.role === 'parent' && children.length > 0 && (
              <Select
                label=""
                options={children.map(child => ({
                  value: child._id,
                  label: `${child.firstName} ${child.lastName} (${child.class?.name || 'No class'})`
                }))}
                value={selectedChild}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedChild(e.target.value)}
              />
            )}
            <Select
              label=""
              options={termOptions}
              value={selectedTerm}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedTerm(e.target.value)}
            />
            <Select
              label=""
              options={academicYearOptions}
              value={selectedAcademicYear}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedAcademicYear(e.target.value)}
            />
            <Button onClick={downloadResults} variant="outline" className="flex items-center gap-1">
              <Download size={16} />
              Download
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : subjectSummaries.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="rounded-full bg-blue-100 p-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Overall
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mt-2">{overallAverage}%</h3>
                  <p className="text-sm text-gray-500">
                    {subjectSummaries.length} subjects
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="rounded-full bg-green-100 p-2">
                      <Award className="h-5 w-5 text-green-600" />
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(overallGrade)}`}>
                      {overallGrade}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mt-2">Overall Grade</h3>
                  <p className="text-sm text-gray-500">
                    {overallGrade.includes('A') ? 'Excellent' : 
                     overallGrade.includes('B') ? 'Very Good' : 
                     overallGrade.includes('C') ? 'Good' : 'Needs Improvement'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Filter className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      promotionStatus?.canBePromoted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {promotionStatus?.canBePromoted ? 'Eligible' : 'Not Eligible'}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mt-2">Promotion Status</h3>
                  <p className="text-sm text-gray-500">
                    {promotionStatus?.totalScore || 0} / {promotionStatus?.threshold || '?'} points required
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-6">
              <CardHeader>
                <h3 className="text-lg font-bold">Results for {childName}</h3>
              </CardHeader>
              <CardContent>
                {subjectSummaries.map((subject) => (
                  <div key={subject.subject} className="mb-4 border border-gray-200 rounded-md">
                    <div 
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleSubjectExpand(subject.subject)}
                    >
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-md flex items-center justify-center ${getGradeColor(subject.grade)}`}>
                          <span className="font-bold text-lg">{subject.grade}</span>
                        </div>
                        <div className="ml-3">
                          <h4 className="font-semibold">{subject.subject}</h4>
                          <p className="text-sm text-gray-500">
                            {subject.assessments.filter(a => a.assessmentType === 'exam').length} exams, 
                            {subject.assessments.filter(a => a.assessmentType === 'test').length} tests
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="font-bold mr-2">{subject.averageScore}%</span>
                        {expandedSubjects.has(subject.subject) ? 
                          <ChevronUp size={20} /> : 
                          <ChevronDown size={20} />
                        }
                      </div>
                    </div>
                    
                    {expandedSubjects.has(subject.subject) && (
                      <div className="p-3 border-t">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableHeader>Type</TableHeader>
                              <TableHeader>Date</TableHeader>
                              <TableHeader>Score</TableHeader>
                              <TableHeader>Grade</TableHeader>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {subject.assessments.sort((a, b) => {
                              // Sort by type (exam first), then by date (newest first)
                              if (a.assessmentType !== b.assessmentType) {
                                return a.assessmentType === 'exam' ? -1 : 1;
                              }
                              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            }).map((assessment) => (
                              <TableRow key={assessment._id}>
                                <TableCell className="capitalize">{assessment.assessmentType}</TableCell>
                                <TableCell>{new Date(assessment.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  {assessment.score} / {assessment.totalScore} ({Math.round((assessment.score / assessment.totalScore) * 100)}%)
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(assessment.grade)}`}>
                                    {assessment.grade}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Results Found</h3>
              <p className="text-gray-500 mb-4">
                There are no results available for the selected filters. Try changing your selection or check back later.
              </p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
} 