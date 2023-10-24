const Joi = require("joi");

const Images = Joi.object({ image: Joi.string() });

const material = Joi.object({
  downPayment: Joi.number(),
  category: Joi.string(),
  date: Joi.string() | null,
  description: Joi.string(),
  id: Joi.string(),
  presentationPicture: Joi.string(),
  pictureArray: Joi.array().items(Images) | Joi.allow(null),
  name: Joi.string().required(),
  pricePerDay: Joi.number(),
  disponibility: Joi.boolean(),
  visible: Joi.boolean(),
});

module.exports = { material };
