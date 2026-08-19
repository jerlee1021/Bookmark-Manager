import express from 'express';
import prisma from './db.js';
import authRoutes from './routes/auth.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    res.json({status: 'ok'});
});


app.listen(3000, () => {
      console.log('Server is running on port 3000');
});