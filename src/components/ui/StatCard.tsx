import { Card, CardContent, Box, Typography, styled } from '@mui/material';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  period?: string;
}

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderRadius: '16px',
  overflow: 'visible',
  position: 'relative',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 25px 0 rgba(0,0,0,0.08)',
  },
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '-24px',
  right: '24px',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  borderRadius: '12px',
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.14)',
  '& svg': {
    color: theme.palette.common.white,
  },
}));

const ValueTypography = styled(Typography)(({ theme }) => ({
  fontSize: '2.125rem',
  fontWeight: 700,
  lineHeight: 1.2,
  marginBottom: theme.spacing(1),
  color: theme.palette.text.primary,
}));

const ChangeWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  '& svg': {
    width: 20,
    height: 20,
  },
}));

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  period = "Last 30 days" 
}) => {
  const isPositive = change >= 0;

  return (
    <StyledCard>
      <CardContent sx={{ pt: 4 }}>
        <IconWrapper>
          <Icon size={24} />
        </IconWrapper>

        <Typography
          variant="subtitle2"
          color="textSecondary"
          gutterBottom
          sx={{ fontSize: '1rem', mb: 3 }}
        >
          {title}
        </Typography>

        <ValueTypography variant="h4">
          {value}
        </ValueTypography>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <ChangeWrapper>
            {isPositive ? (
              <TrendingUp color="#4caf50" />
            ) : (
              <TrendingDown color="#f44336" />
            )}
            <Typography
              variant="body2"
              color={isPositive ? 'success.main' : 'error.main'}
              fontWeight="medium"
            >
              {Math.abs(change)}%
            </Typography>
          </ChangeWrapper>

          <Typography variant="caption" color="textSecondary">
            {period}
          </Typography>
        </Box>
      </CardContent>
    </StyledCard>
  );
}; 