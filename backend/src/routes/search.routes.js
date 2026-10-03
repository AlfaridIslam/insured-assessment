import express from 'express';
import { searchUser } from '../controllers/search.controller.js';

const router = express.Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search for a user's policy info
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: First name of the user to search
 *     responses:
 *       200:
 *         description: User and their aggregated policies
 */
router.get('/', searchUser);

export default router;