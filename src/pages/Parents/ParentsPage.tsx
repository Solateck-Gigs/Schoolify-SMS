import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { toast } from 'react-hot-toast';

interface Parent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'parent';
  homeAddress?: string;
  occupation?: string;
  children?: string[];
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    setLoading(true);
    try {
      const parentsData = await apiFetch('/parents') as Parent[];
      setParents(parentsData);
    } catch (error) {
      toast.error('Failed to fetch parents');
      setParents([]);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Parents Management</h1>
      <div className="rounded-md border">
        <Table>
          <TableHead>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Contact Number</TableHead>
              <TableHead>Occupation</TableHead>
              <TableHead>Children</TableHead>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading parents...</TableCell>
              </TableRow>
            ) : parents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No parents found.</TableCell>
              </TableRow>
            ) : (
              parents.map(parent => (
                <TableRow key={parent._id}>
                  <TableCell>{parent.firstName} {parent.lastName}</TableCell>
                  <TableCell>{parent.email}</TableCell>
                  <TableCell>{parent.phone || 'N/A'}</TableCell>
                  <TableCell>{parent.occupation || 'N/A'}</TableCell>
                  <TableCell>{parent.children?.length || 0} child(ren)</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 