import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../lib/store';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../components/ui/Table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { GraduationCap, Eye, Calendar, BookOpen, DollarSign, TrendingUp, Users, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiFetch } from '../lib/api';

interface Child {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  user_id_number: string;
  admissionNumber: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  class?: {
    _id: string;
    name: string;
    gradeLevel: string;
    section: string;
  };
  createdAt: string;
  isActive: boolean;
}

interface ChildStats {
  attendanceRate: number;
  averageGrade: number;
  totalFees: number;
  paidFees: number;
  recentGrades: Array<{
    subject: string;
    score: number;
    totalScore: number;
    date: string;
  }>;
  attendanceRecords: Array<{
    date: string;
    status: 'present' | 'absent' | 'tardy';
  }>;
}

interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'tardy';
}

export default function MyChildrenPage() {
  const { user } = useAuthStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [childStats, setChildStats] = useState<ChildStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Only parents should access this page
  if (user?.role !== 'parent') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Access denied. This page is only available to parents.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const childrenData = await apiFetch('/parent/children') as Child[];
      setChildren(childrenData);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to fetch children information');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildStats = async (childId: string) => {
    try {
      setStatsLoading(true);
      const statsData = await apiFetch(`/parent/child/${childId}/stats`) as ChildStats;
      setChildStats(statsData);
    } catch (error) {
      console.error('Error fetching child stats:', error);
      toast.error('Failed to fetch child statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const openDetailsModal = async (child: Child) => {
    setSelectedChild(child);
    setShowDetailsModal(true);
    await fetchChildStats(child._id);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getFeeStatusColor = (paid: number, total: number) => {
    const percentage = total > 0 ? (paid / total) * 100 : 0;
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            My Children
          </h1>
          <p className="text-gray-600">
            View your children's academic progress, attendance, and school information
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-800">Children Overview</h3>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading children information...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Your child hasn't enrolled yet</p>
              <p className="text-sm mt-2">Please contact the school administration to link your children to your account or complete the enrollment process.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {children.map((child) => (
                <Card key={child._id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">
                            {child.firstName.charAt(0)}{child.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{child.firstName} {child.lastName}</h4>
                          <p className="text-sm text-gray-500">ID: {child.user_id_number}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(child.isActive)}`}>
                        {child.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Class:</span>
                        <span className="text-sm font-medium">
                          {child.class ? `${child.class.name} - Grade ${child.class.gradeLevel}` : 'Not assigned'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Admission No:</span>
                        <span className="text-sm font-medium">{child.admissionNumber}</span>
                      </div>
                      
                      {child.dateOfBirth && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Date of Birth:</span>
                          <span className="text-sm font-medium">{new Date(child.dateOfBirth).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {child.bloodGroup && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Blood Group:</span>
                          <span className="text-sm font-medium">{child.bloodGroup}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => openDetailsModal(child)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Child Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {selectedChild?.firstName} {selectedChild?.lastName} - Academic Overview
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of your child's academic progress and school activities
            </DialogDescription>
          </DialogHeader>
          
          {selectedChild && (
            <div className="space-y-6">
              {/* Quick Stats */}
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading statistics...</p>
                </div>
              ) : childStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="border border-gray-200">
                    <CardContent className="p-4 text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-gray-900">{childStats.attendanceRate}%</p>
                      <p className="text-sm text-gray-600">Attendance Rate</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-gray-900">{childStats.averageGrade}%</p>
                      <p className="text-sm text-gray-600">Average Grade</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4 text-center">
                      <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        ${childStats.paidFees}/${childStats.totalFees}
                      </p>
                      <p className="text-sm text-gray-600">Fees Paid</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border border-gray-200">
                    <CardContent className="p-4 text-center">
                      <Award className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-gray-900">{childStats.recentGrades.length}</p>
                      <p className="text-sm text-gray-600">Recent Assessments</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Grades */}
              {childStats?.recentGrades && childStats.recentGrades.length > 0 && (
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Recent Academic Performance
                    </h4>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableHeader>Subject</TableHeader>
                            <TableHeader>Score</TableHeader>
                            <TableHeader>Percentage</TableHeader>
                            <TableHeader>Date</TableHeader>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {childStats.recentGrades.map((grade, index) => {
                            const percentage = (grade.score / grade.totalScore) * 100;
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{grade.subject}</TableCell>
                                <TableCell>{grade.score}/{grade.totalScore}</TableCell>
                                <TableCell>
                                  <span className={`font-semibold ${getGradeColor(percentage)}`}>
                                    {percentage.toFixed(1)}%
                                  </span>
                                </TableCell>
                                <TableCell>{new Date(grade.date).toLocaleDateString()}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Attendance */}
              {childStats?.attendanceRecords && childStats.attendanceRecords.length > 0 && (
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Recent Attendance Records
                    </h4>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {childStats.attendanceRecords.slice(0, 14).map((record, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg text-center text-sm ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : record.status === 'tardy'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <p className="font-medium">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                          <p className="text-xs capitalize">{record.status}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <h4 className="font-semibold text-gray-900">Personal Information</h4>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Full Name</p>
                        <p className="text-gray-900">{selectedChild.firstName} {selectedChild.lastName}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Student ID</p>
                        <p className="text-gray-900">{selectedChild.user_id_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Admission Number</p>
                        <p className="text-gray-900">{selectedChild.admissionNumber}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900">{selectedChild.email}</p>
                      </div>
                      {selectedChild.dateOfBirth && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                          <p className="text-gray-900">{new Date(selectedChild.dateOfBirth).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedChild.bloodGroup && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Blood Group</p>
                          <p className="text-gray-900">{selectedChild.bloodGroup}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information */}
              {selectedChild.class && (
                <Card>
                  <CardHeader>
                    <h4 className="font-semibold text-gray-900">Academic Information</h4>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Class</p>
                        <p className="text-gray-900">{selectedChild.class.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Grade Level</p>
                        <p className="text-gray-900">Grade {selectedChild.class.gradeLevel}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Section</p>
                        <p className="text-gray-900">{selectedChild.class.section}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 