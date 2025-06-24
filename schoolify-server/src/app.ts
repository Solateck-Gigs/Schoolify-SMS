import express from 'express';
import statsRoutes from './routes/stats';

const app = express();

app.use('/api/stats', statsRoutes);

export default app; 