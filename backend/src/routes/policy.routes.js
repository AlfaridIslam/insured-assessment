import express from 'express';
import { searchPolicyByUser, getAggregatedPolicies } from '../controllers/policy.controller.js';
import { validatePolicySearch } from '../middlewares/validator.js';

const router = express.Router();

// GET /api/policies/search - Search policy by username
router.get('/search', validatePolicySearch, searchPolicyByUser);

// GET /api/policies/aggregated-by-user - Aggregated policy data grouped by each user
router.get('/aggregated-by-user', getAggregatedPolicies);

export default router;
