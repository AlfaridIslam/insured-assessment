import { findUserWithPolicies } from '../services/search.service.js';

export const searchUser = async (req, res, next) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a username query parameter (e.g., ?username=John)',
      });
    }

    const userData = await findUserWithPolicies(username);

    if (!userData || userData.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No user or policies found matching '${username}'`,
      });
    }

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};