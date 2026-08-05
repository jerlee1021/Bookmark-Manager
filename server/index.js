import express from 'express';
import prisma from './db.js';

const app = express();

app.get('/health', (req, res) => {
    res.json({status: 'ok'});
});

app.get('/db-check', async (req, res) => {
  const count = await prisma.user.count();
  res.json({ users: count });
});

app.listen(3000, () => {
      console.log('Server is running on port 3000');
});