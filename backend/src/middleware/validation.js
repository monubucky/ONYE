const Joi = require('joi');

const sourceSchema = Joi.object({
  system: Joi.string().required().max(100),
  medication: Joi.string().required().max(500),
  last_updated: Joi.string().isoDate().optional(),
  last_filled: Joi.string().isoDate().optional(),
  source_reliability: Joi.string().valid('high', 'medium', 'low').optional(),
  notes: Joi.string().optional().max(1000),
}).or('last_updated', 'last_filled');

const reconcileSchema = Joi.object({
  patient_context: Joi.object({
    age: Joi.number().min(0).max(150).optional(),
    conditions: Joi.array().items(Joi.string()).optional(),
    recent_labs: Joi.object().optional(),
    allergies: Joi.array().items(Joi.string()).optional(),
  }).required(),
  sources: Joi.array().items(sourceSchema).min(2).max(20).required(),
});

const validateQualitySchema = Joi.object({
  demographics: Joi.object({
    name: Joi.string().optional(),
    dob: Joi.string().optional(),
    gender: Joi.string().optional(),
  }).optional(),
  medications: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  conditions: Joi.array().items(Joi.string()).optional(),
  vital_signs: Joi.object().optional(),
  last_updated: Joi.string().optional(),
}).min(1);

function validateReconcile(req, res, next) {
  const { error } = reconcileSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }
  next();
}

function validateDataQuality(req, res, next) {
  const { error } = validateQualitySchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
      })),
    });
  }
  next();
}

module.exports = { validateReconcile, validateDataQuality };
