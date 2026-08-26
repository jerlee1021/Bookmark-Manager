import express from 'express';
import prisma from '../db.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

router.use(requireAuth);

const formatBookmark = (bookmark) => ({ // Helper function to format bookmark data(flatten)
    id: bookmark.id,
    title: bookmark.title,
    url: bookmark.url,
    createdAt: bookmark.createdAt,
    notes: bookmark.notes,
    tags: bookmark.bookmarkTags.map(bt => bt.tag.name)
});

const BOOKMARK_SELECT = {
    id: true,
    title: true,
    url: true,
    createdAt: true,
    notes: true,
    bookmarkTags: {
        select: {
            tag: {
                select: {
                    name: true
                }
            }
        }
    }
};

const buildCleanedTagNames = (tags) => {
    const tagList = tags ?? [];
    const names = tagList.map(tag => tag.trim().toLowerCase()).filter(name => name.length > 0);
    const cleanedNames = [...new Set(names)]; // Remove duplicates, spread into an array
    return cleanedNames;
}

router.get('/', async (req, res) => {
    const bookmarks = await prisma.bookmark.findMany({
        where: {userId: req.userId},
        select: BOOKMARK_SELECT,
        orderBy: {createdAt: 'desc'}
    });
    res.status(200).json({bookmarks: bookmarks.map(formatBookmark)});
});

router.post('/', async (req, res) => {
    const {title, url, notes} = req.body;
    const title_trimmed = title?.trim();
    const url_trimmed = url?.trim();
    if(!title_trimmed || !url_trimmed) {
        return res.status(400).json({error: 'Title and URL are required'});
    }
    const tags = req.body.tags;
    if(tags && !Array.isArray(tags)) {
        return res.status(400).json({error: 'Tags must be an array'});
    }
    const cleanedNames = buildCleanedTagNames(tags);
    const bookmark = await prisma.bookmark.create({
        select: BOOKMARK_SELECT,
        data: {
            userId: req.userId,
            title: title_trimmed,
            url: url_trimmed,
            notes: notes || null,
            bookmarkTags: {
                create: cleanedNames.map(name => ({tag: {connectOrCreate: {where: {name}, create: {name}}}}))
            }
        }
    });
    res.status(201).json({message: 'Bookmark created successfully', bookmark : formatBookmark(bookmark)});
});

router.delete('/:id', async (req, res) => {
    const bookmarkId = Number(req.params.id);
    if(!Number.isInteger(bookmarkId)) {
        return res.status(400).json({error: 'Invalid bookmark ID'});
    }
    const result = await prisma.bookmark.deleteMany({
        where: {id: bookmarkId, userId: req.userId}
    });
    if(result.count === 0) {
        return res.status(404).json({error: 'Bookmark not found'});
    }
    res.status(204).end();
});

router.put('/:id', async (req, res) => {
    const bookmarkId = Number(req.params.id);
    if(!Number.isInteger(bookmarkId)) {
        return res.status(400).json({error: 'Invalid bookmark ID'});
    }
    const {title, url, notes} = req.body;
    const title_trimmed = title?.trim();
    const url_trimmed = url?.trim();
    if(!title_trimmed || !url_trimmed) {
        return res.status(400).json({error: 'Title and URL are required'});
    }
    const tags = req.body.tags;
    if(tags && !Array.isArray(tags)) {
        return res.status(400).json({error: 'Tags must be an array'});
    }
    const cleanedNames = buildCleanedTagNames(tags);
    try{
        const updatedBookmark = await prisma.bookmark.update({
            where: {id: bookmarkId, userId: req.userId},
            select: BOOKMARK_SELECT,
            data: {
                title: title_trimmed,
                url: url_trimmed,
                notes: notes || null,
                bookmarkTags: {
                    deleteMany: {}, //remove all JOIN records for this bookmark
                    create: cleanedNames.map(name => ({tag: {connectOrCreate: {where: {name}, create: {name}}}})) //add new JOIN records for the cleaned tag names
                }
            }
        })
        res.status(200).json({message: 'Bookmark updated successfully', bookmark: formatBookmark(updatedBookmark)});
    } catch (error) {
        if(error.code === 'P2025') { // Prisma error code for "Record to update not found"
            return res.status(404).json({error: 'Bookmark not found'});
        }
        console.error('Error updating bookmark:', error);
        return res.status(500).json({error: 'An error occurred while updating the bookmark'});
    }
})

export default router