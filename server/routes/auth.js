import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { issueAuthCookie, requireAuth, COOKIE_OPTIONS } from '../lib/auth.js';

const router = express.Router();

// Routes go here
router.post('/register', async (req, res) => {
  const {email, password} = req.body;
  if(!email || !password) {
    return res.status(400).json({error: 'Email and password are required'});
  }

  const existingUser = await prisma.user.findUnique({where: {email}});
  if(existingUser) {
    return res.status(409).json({error: 'Email already registered'});
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: passwordHash
    },
    select: {
      id: true,
      email: true,
    }
  });
  
  issueAuthCookie(res, user.id);

  res.status(201).json({message: 'User registered successfully', user});
});

router.post('/login', async (req, res) => {
  const {email, password} = req.body;

  if(!email || !password) {
    return res.status(400).json({error: 'Email and password are required'});
  }

  const user = await prisma.user.findUnique({where: {email}});
  if(!user) {
    return res.status(401).json({error: 'Invalid email or password'});
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if(!isPasswordValid) {
    return res.status(401).json({error: 'Invalid email or password'});
  }

  issueAuthCookie(res, user.id);

  res.status(200).json({message: 'Login successful', user: {id: user.id, email: user.email}});
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({where: {id: req.userId},
    select: {
      id: true,
      email: true,
    }
  });
  if(!user) {
    return res.status(401).json({error: 'User not found'});
  }
  res.status(200).json({user});
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({message: 'Logout successful'});
});

export default router;

