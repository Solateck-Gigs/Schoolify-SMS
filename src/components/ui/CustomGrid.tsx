import { Grid, GridProps, styled } from '@mui/material';

interface CustomGridProps extends GridProps {
  children: React.ReactNode;
}

const StyledGrid = styled(Grid)(({ theme }) => ({
  '& .stat-card': {
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[4],
    },
  },
  '& .chart-paper': {
    borderRadius: '12px',
    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
    transition: 'box-shadow 0.2s ease-in-out',
    '&:hover': {
      boxShadow: '0 8px 25px 0 rgba(0,0,0,0.08)',
    },
  },
  '& .stat-icon-container': {
    background: theme.palette.primary.main,
    borderRadius: '12px',
    padding: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
    width: '48px',
    height: '48px',
    '& svg': {
      color: theme.palette.common.white,
    },
  },
  '& .stat-value': {
    fontSize: '2rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(1),
  },
  '& .stat-title': {
    fontSize: '1rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  '& .stat-change': {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    fontSize: '0.875rem',
  },
}));

export const CustomGrid: React.FC<CustomGridProps> = (props) => (
  <StyledGrid {...props} />
); 