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

router.post('/', async (req, res) => {
    const {title, url, notes} = req.body;
    const title_trimmed = title?.trim();
    const url_trimmed = url?.trim();
    if(!title_trimmed || !url_trimmed) {
        return res.status(400).json({error: 'Title and URL are required'});
    }
    const bookmark = await prisma.bookmark.create({
        select: {id: true, title: true, url: true, createdAt: true, notes: true},
        data: {
            userId: req.userId,
            title: title_trimmed,
            url: url_trimmed,
            notes: notes || null
        }
    });
    res.status(201).json({message: 'Bookmark created successfully', bookmark});
});

export default router