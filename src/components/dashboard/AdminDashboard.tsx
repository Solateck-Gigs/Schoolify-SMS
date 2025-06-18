import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, Grid } from '@mui/material';
import { Users, CreditCard, Image, Code, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format } from 'date-fns';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  period?: string;
}

const StatCard = ({ title, value, change, icon: Icon, period = "Last 30 days" }: StatCardProps) => {
  const isPositive = change >= 0;
  return (
    <Card sx={{ height: '100%', bgcolor: 'background.paper', borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              bgcolor: 'primary.main',
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}
          >
            <Icon size={24} color="white" />
          </Box>
          <Typography variant="subtitle1" color="text.secondary">
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h4" component="div" sx={{ mb: 1, fontWeight: 'bold' }}>
          {value}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {isPositive ? (
              <TrendingUp size={20} color="#4caf50" />
            ) : (
              <TrendingDown size={20} color="#f44336" />
            )}
            <Typography
              variant="body2"
              color={isPositive ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {Math.abs(change)}%
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {period}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState('6');
  const [stats] = useState({
    users: { value: '430', change: 32.54 },
    subscriptions: { value: '360', change: -32.54 },
    generatedImages: { value: '43,583', change: 32.54 },
    generatedCodes: { value: '34,385', change: 32.54 }
  });

  const [monthlyData] = useState([
    { month: 'Feb', users: 2000 },
    { month: 'Mar', users: 5000 },
    { month: 'Apr', users: 2500 },
    { month: 'May', users: 4000 },
    { month: 'Jun', users: 3000 },
    { month: 'Jul', users: 3000 }
  ]);

  const [dailyData] = useState([
    { day: '1', feb: 2000, mar: 2500, apr: 3000, may: 4500 },
    { day: '2', feb: 2200, mar: 2700, apr: 3200, may: 4000 },
    { day: '3', feb: 1800, mar: 3000, apr: 3500, may: 4200 },
    { day: '4', feb: 2400, mar: 2800, apr: 3800, may: 4800 },
    { day: '5', feb: 2100, mar: 2600, apr: 3300, may: 5000 },
    { day: '6', feb: 2300, mar: 2900, apr: 3600, may: 4600 },
    { day: '7', feb: 2500, mar: 3100, apr: 3900, may: 4300 },
    { day: '8', feb: 2700, mar: 3300, apr: 4100, may: 4700 },
    { day: '9', feb: 2900, mar: 3500, apr: 4300, may: 4900 },
    { day: '10', feb: 3100, mar: 3700, apr: 4500, may: 5100 },
    { day: '11', feb: 3300, mar: 3900, apr: 4700, may: 5300 },
    { day: '12', feb: 3500, mar: 4100, apr: 4900, may: 5500 },
    { day: '13', feb: 3700, mar: 4300, apr: 5100, may: 5700 },
    { day: '14', feb: 3900, mar: 4500, apr: 5300, may: 5900 },
    { day: '15', feb: 4100, mar: 4700, apr: 5500, may: 6100 }
  ]);

  const registrations = [
    { name: 'Stella Powell', status: 'Active', regDate: '03/27/2026', action: 'View' },
    { name: 'Aaron Dunn', status: 'Pending', regDate: '08/14/2026', action: 'View' },
    { name: 'Eleanor Kim', status: 'Active', regDate: '11/17/2026', action: 'View' },
    { name: 'Joshua Cook', status: 'Active', regDate: '08/09/2026', action: 'View' },
    { name: 'Anna Russell', status: 'Pending', regDate: '08/09/2026', action: 'View' }
  ];

  const transactions = [
    { paidBy: 'Stella Powell', package: 'Starter', price: '$11.99', status: 'Expired', paidDate: '03/27/2026' },
    { paidBy: 'Aaron Dunn', package: 'Professional', price: '$24', status: 'Active', paidDate: '08/14/2026' },
    { paidBy: 'Eleanor Kim', package: 'Organization', price: '$39', status: 'Active', paidDate: '11/17/2026' },
    { paidBy: 'Joshua Cook', package: 'Starter', price: '$11.99', status: 'Expired', paidDate: '08/09/2026' },
    { paidBy: 'Anna Russell', package: 'Starter', price: '$11.99', status: 'Active', paidDate: '08/09/2026' }
  ];

  return (
    <Box sx={{ p: 3, bgcolor: '#F8F9FC' }}>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Users"
            value={stats.users.value}
            change={stats.users.change}
            icon={Users as any}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Subscriptions"
            value={stats.subscriptions.value}
            change={stats.subscriptions.change}
            icon={CreditCard as any}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Generated Images"
            value={stats.generatedImages.value}
            change={stats.generatedImages.change}
            icon={Image as any}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Generated Codes"
            value={stats.generatedCodes.value}
            change={stats.generatedCodes.change}
            icon={Code as any}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Total New Users</Typography>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  size="small"
                >
                  <MenuItem value="3">3 months</MenuItem>
                  <MenuItem value="6">6 months</MenuItem>
                  <MenuItem value="12">12 months</MenuItem>
                </Select>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Total New Users</Typography>
                <Select
                  value="15"
                  size="small"
                >
                  <MenuItem value="15">15 days</MenuItem>
                  <MenuItem value="30">30 days</MenuItem>
                </Select>
              </Box>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="feb" stroke="#FFA500" />
                    <Line type="monotone" dataKey="mar" stroke="#00BCD4" />
                    <Line type="monotone" dataKey="apr" stroke="#9C27B0" />
                    <Line type="monotone" dataKey="may" stroke="#4CAF50" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tables */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Latest Registrations</Typography>
              </Box>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Reg. Date</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrations.map((reg, index) => (
                      <tr key={index}>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>{reg.name}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: reg.status === 'Active' ? '#E8F5E9' : '#FFF3E0',
                            color: reg.status === 'Active' ? '#2E7D32' : '#E65100'
                          }}>
                            {reg.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>{reg.regDate}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>
                          <button style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #6366F1',
                            color: '#6366F1',
                            backgroundColor: 'transparent',
                            cursor: 'pointer'
                          }}>
                            {reg.action}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 4, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Latest Transactions</Typography>
              </Box>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Paid By</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Package Name</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Price</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid #eee' }}>Paid Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((trans, index) => (
                      <tr key={index}>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>{trans.paidBy}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>{trans.package}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>{trans.price}</td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: trans.status === 'Active' ? '#E8F5E9' : '#FFEBEE',
                            color: trans.status === 'Active' ? '#2E7D32' : '#C62828'
                          }}>
                            {trans.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', borderBottom: '1px solid #eee' }}>{trans.paidDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard; 