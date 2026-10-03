import * as policyService from '../services/policy.service.js';

/**
 * Search policy info by username
 */
export const searchPolicyByUser = async (req, res, next) => {
  try {
    const username = req.query.username || req.query.q;
    const searchFn = policyService.searchPoliciesByUsername || policyService.default?.searchPoliciesByUsername;
    const policies = await searchFn(username);

    return res.status(200).json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Aggregated policy by each user
 */
export const getAggregatedPolicies = async (req, res, next) => {
  try {
    const aggFn = policyService.getAggregatedPoliciesByUser || policyService.default?.getAggregatedPoliciesByUser;
    const aggregated = await aggFn();

    return res.status(200).json({
      success: true,
      count: aggregated.length,
      data: aggregated,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  searchPolicyByUser,
  getAggregatedPolicies,
};
