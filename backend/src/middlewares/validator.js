import Joi from 'joi';

const scheduleMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).required(),
  // Enforces strict YYYY-MM-DD format
  day: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.pattern.base': 'Day must be in YYYY-MM-DD format (e.g., 2026-10-31).'
  }),
  // Enforces strict 24-hour HH:mm or HH:mm:ss format
  time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/).required().messages({
    'string.pattern.base': 'Time must be in 24-hour HH:mm format (e.g., 14:30).'
  })
});

const policySearchSchema = Joi.object({
  username: Joi.string().trim().min(1),
  q: Joi.string().trim().min(1)
}).or('username', 'q');

export const validateScheduleMessage = (req, res, next) => {
  const { error } = scheduleMessageSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  next();
};

export const validatePolicySearch = (req, res, next) => {
  const { error } = policySearchSchema.validate(req.query, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error: username or search query parameter "username" / "q" is required.',
      errors: errorMessages
    });
  }
  next();
};

export default {
  validateScheduleMessage,
  validatePolicySearch,
};