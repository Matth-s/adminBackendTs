const admin = require('../db/config');

const { z } = require('zod');
const { encryptData } = require('../middleware/Crypto');
const { v4: uuidv4 } = require('uuid');

const phoneRegex = /^(?:\+33|0)[1-9](\d{2}){4}$/;

const providedMaterialsBookingSchema = z.object({
  id: z.string(),
  materialName: z.string(),
  price: z.number(),
  quantity: z.number(),
  total: z.number(),
});

const bookingSchema = z.object({
  id: z.string(),
  idMaterial: z.string(),
  materialName: z.string(),
  total: z.number(),
  pricePerDay: z.number(),
  providedMaterialsBooking: z
    .array(providedMaterialsBookingSchema)
    .or(z.array(z.unknown()))
    .optional(),
  firstName: z.string().min(3).max(30),
  lastName: z.string().min(3).max(30),
  phone: z.string().regex(phoneRegex),
  email: z.string().email(),
  city: z.string().min(2).max(30),
  street: z.string().max(50),
  unavailableDates: z
    .array(z.string())
    .or(z.array(z.unknown()))
    .optional(),
  bookingDates: z.array(z.string()).min(1),
  coachingPriceHour: z.number(),
  coachingTime: z.number(),
  isCompleted: z.boolean(),
  downPayment: z.number(),
  timestamp: z.number(),
});

exports.postMessage = async (req, res, next) => {
  const message = req.body;

  try {
    const validatedMessage = bookingSchema.parse(message);

    let messageEncrypted = {
      id: uuidv4(),
      idMaterial: message.idMaterial,
      street: encryptData(message.street),
      city: encryptData(message.city),
      email: encryptData(message.email),
      firstName: encryptData(message.firstName),
      lastName: encryptData(message.lastName),
      phone: encryptData(message.phone),
      bookingDates: message.bookingDates,
      materialName: message.materialName,
      downPayment: message.downPayment,
      total: message.total,
      isCompleted: false,
      coachingPriceHour: message.coachingPriceHour,
      coachingTime: message.coachingTime,
      providedMaterialsBooking: message.providedMaterialsBooking,
      unavailableDates: message.unavailableDates,
      timestamp: message.timestamp,
      pricePerDay: message.pricePerDay,
    };

    if (messageEncrypted.providedMaterialsBooking.length === 0) {
      messageEncrypted.providedMaterialsBooking = ['emptyArray'];
    }

    if (messageEncrypted.unavailableDates.length === 0) {
      messageEncrypted.unavailableDates = ['emptyArray'];
    }

    const database = admin.database();
    const messagingRef = database.ref('messaging');

    await messagingRef.push(messageEncrypted);

    res.status(201).json({ message: 'Réservation crée' });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};
