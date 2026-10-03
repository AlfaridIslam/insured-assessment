import { Policy, User } from '../models/index.js';

/**
 * Searches policy by username or user details
 * @param {string} username
 */
export const searchPoliciesByUsername = async (username) => {
  const regex = new RegExp(username, 'i');

  // Find matching users first
  const users = await User.find({
    $or: [{ firstName: regex }, { email: regex }],
  }).select('_id');

  const userIds = users.map((u) => u._id);

  const policies = await Policy.find({ userId: { $in: userIds } })
    .populate('userId', 'firstName email phoneNumber address state zipCode')
    .populate('policyCategoryId', 'categoryName')
    .populate('companyId', 'companyName')
    .lean();

  return policies;
};

/**
 * Aggregates policies grouped by each user
 */
export const getAggregatedPoliciesByUser = async () => {
  const aggregation = await Policy.aggregate([
    {
      $group: {
        _id: '$userId',
        totalPolicies: { $sum: 1 },
        totalPremium: { $sum: '$premiumAmount' },
        policyIds: { $push: '$_id' },
        policyNumbers: { $push: '$policyNumber' },
        categories: { $addToSet: '$policyCategoryId' },
        carriers: { $addToSet: '$companyId' },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        userName: '$user.firstName',
        email: '$user.email',
        phoneNumber: '$user.phoneNumber',
        totalPolicies: 1,
        totalPremium: { $round: ['$totalPremium', 2] },
        policyNumbers: 1,
      },
    },
    {
      $sort: { totalPolicies: -1, totalPremium: -1 },
    },
  ]);

  return aggregation;
};

export default {
  searchPoliciesByUsername,
  getAggregatedPoliciesByUser,
};
