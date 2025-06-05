
import { Card, CardContent, CardHeader } from './ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Calendar, Mail, Phone, MapPin, Heart, BookOpen, GraduationCap, Users, Award, FileText } from 'lucide-react';

interface StudentProfileProps {
  student: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    enrollmentDate: string;
    classLevel: number;
    section?: string;
    parentId: string;
    address?: string;
    contactNumber?: string;
    email?: string;
    profileImage?: string;
    bloodType?: string;
    medicalConditions?: string[];
    emergencyContacts?: {
      name: string;
      relationship: string;
      phone: string;
    }[];
    achievements?: {
      id: string;
      title: string;
      date: string;
      description: string;
      category: 'academic' | 'sports' | 'arts' | 'other';
    }[];
    extracurricularActivities?: {
      id: string;
      name: string;
      role?: string;
      startDate: string;
      endDate?: string;
    }[];
    attendance?: {
      present: number;
      absent: number;
      late: number;
      total: number;
    };
    academicPerformance?: {
      subject: string;
      grade: string;
      score: number;
      term: string;
      year: string;
    }[];
  };
  isParent?: boolean;
}

export default function StudentProfile({ student, isParent = false }: StudentProfileProps) {
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const attendancePercentage = student.attendance 
    ? Math.round((student.attendance.present / student.attendance.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100">
              {student.profileImage ? (
                <img 
                  src={student.profileImage} 
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {student.firstName} {student.lastName}
                </h1>
                <p className="text-gray-600">
                  Class {student.classLevel}{student.section ? ` - Section ${student.section}` : ''}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Age: {calculateAge(student.dateOfBirth)} years</span>
                </div>
                {student.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{student.email}</span>
                  </div>
                )}
                {student.contactNumber && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{student.contactNumber}</span>
                  </div>
                )}
                {student.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{student.address}</span>
                  </div>
                )}
                {student.bloodType && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Heart className="w-4 h-4" />
                    <span>Blood Type: {student.bloodType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Information Tabs */}
      <Tabs defaultValue="academic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="academic">
            <BookOpen className="w-4 h-4 mr-2" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Calendar className="w-4 h-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="medical">
            <Heart className="w-4 h-4 mr-2" />
            Medical
          </TabsTrigger>
          <TabsTrigger value="activities">
            <Award className="w-4 h-4 mr-2" />
            Activities
          </TabsTrigger>
        </TabsList>

        {/* Academic Tab */}
        <TabsContent value="academic">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Academic Performance</h2>
            </CardHeader>
            <CardContent>
              {student.academicPerformance && student.academicPerformance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.academicPerformance.map((performance, index) => (
                      <TableRow key={index}>
                        <TableCell>{performance.subject}</TableCell>
                        <TableCell>{performance.term} {performance.year}</TableCell>
                        <TableCell>
                          <Badge variant={
                            performance.grade.startsWith('A') ? 'success' :
                            performance.grade.startsWith('B') ? 'primary' :
                            performance.grade.startsWith('C') ? 'warning' : 'destructive'
                          }>
                            {performance.grade}
                          </Badge>
                        </TableCell>
                        <TableCell>{performance.score}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-4">No academic records available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Attendance Overview</h2>
            </CardHeader>
            <CardContent>
              {student.attendance ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">Present</p>
                      <p className="text-2xl font-bold text-green-700">{student.attendance.present}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-600">Absent</p>
                      <p className="text-2xl font-bold text-red-700">{student.attendance.absent}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600">Late</p>
                      <p className="text-2xl font-bold text-yellow-700">{student.attendance.late}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Attendance Rate</p>
                      <p className="text-2xl font-bold text-blue-700">{attendancePercentage}%</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No attendance records available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Medical Information</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Medical Conditions */}
              {student.medicalConditions && student.medicalConditions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Medical Conditions</h3>
                  <div className="flex flex-wrap gap-2">
                    {student.medicalConditions.map((condition, index) => (
                      <Badge key={index} variant="secondary">{condition}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Emergency Contacts */}
              {student.emergencyContacts && student.emergencyContacts.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Emergency Contacts</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.emergencyContacts.map((contact, index) => (
                        <TableRow key={index}>
                          <TableCell>{contact.name}</TableCell>
                          <TableCell>{contact.relationship}</TableCell>
                          <TableCell>{contact.phone}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {(!student.medicalConditions?.length && !student.emergencyContacts?.length) && (
                <p className="text-gray-500 text-center py-4">No medical information available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Activities & Achievements</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Achievements */}
              {student.achievements && student.achievements.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Achievements</h3>
                  <div className="space-y-4">
                    {student.achievements.map((achievement) => (
                      <div key={achievement.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                          </div>
                          <Badge variant="outline">{achievement.category}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{achievement.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracurricular Activities */}
              {student.extracurricularActivities && student.extracurricularActivities.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Extracurricular Activities</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activity</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {student.extracurricularActivities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell>{activity.name}</TableCell>
                          <TableCell>{activity.role || '-'}</TableCell>
                          <TableCell>
                            {new Date(activity.startDate).toLocaleDateString()} - 
                            {activity.endDate 
                              ? new Date(activity.endDate).toLocaleDateString()
                              : 'Present'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {(!student.achievements?.length && !student.extracurricularActivities?.length) && (
                <p className="text-gray-500 text-center py-4">No activities or achievements recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 