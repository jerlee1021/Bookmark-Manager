import express from 'express';
import prisma from '../db.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
    const bookmarks = await prisma.bookmark.findMany({
        where: {userId: req.userId},
        select: {id: true, title: true, url: true, createdAt: true, notes: true},
        orderBy: {createdAt: 'desc'}
    });
    res.status(200).json({bookmarks});
});

export default router