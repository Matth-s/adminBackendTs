const admin = require('../db/config');
const verifyToken = require('../middleware/decodeToken');
const { encryptData, decryptData } = require('../middleware/Crypto');

const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');

function processArraysMaterial(material) {
  material.unavailableDates = processArrayMaterial(
    material.unavailableDates
  );
  material.providedMaterials = processArrayMaterial(
    material.providedMaterials
  );
  material.arrayPicture = processArrayMaterial(material.arrayPicture);
  return material;
}

function processArrayMaterial(array) {
  return array.length === 1 && array[0] === 'emptyArray' ? [] : array;
}

function processArrays(booking) {
  booking.unavailableDates = processArray(booking.unavailableDates);
  booking.bookingDates = processArray(booking.bookingDates);
  booking.providedMaterialsBooking = processArray(
    booking.providedMaterialsBooking
  );
  return booking;
}

function processArray(array) {
  return array.length === 1 && array[0] === 'emptyArray' ? [] : array;
}

function processEmptyArraysOnCreate(booking) {
  booking.unavailableDates = processArrayOnCreate(
    booking.unavailableDates
  );
  booking.bookingDates = processArrayOnCreate(booking.bookingDates);
  booking.providedMaterialsBooking = processArrayOnCreate(
    booking.providedMaterialsBooking
  );
  return booking;
}

function processArrayOnCreate(array) {
  if (array.length === 0) {
    return ['emptyArray'];
  }
  return array;
}

const phoneRegex = /^(?:\+33|0)[1-9](\d{2}){4}$/;

const providedMaterialsBookingSchema = z.object({
  id: z.string(),
  materialName: z.string(),
  price: z.number(),
  quantity: z.number(),
  total: z.number(),
});

const messageSchema = z.object({
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
  //email: z.string().email(),
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
  isRead: z.boolean(),
});

exports.createBooking = async (req, res) => {
  const { authorization } = req.headers;
  const message = req.body;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    let encryptedBooking = {
      ...message,
      street: encryptData(message.street),
      city: encryptData(message.city),
      email: encryptData(message.email),
      firstName: encryptData(message.firstName),
      lastName: encryptData(message.lastName),
      phone: encryptData(message.phone),
    };

    encryptedBooking = processEmptyArraysOnCreate(encryptedBooking);

    const database = admin.database();
    const bookingRef = database.ref('booking');
    const messageRef = database.ref('messaging');
    const newBookingRef = bookingRef.child(message.id);
    const newMessageRef = messageRef.child(message.id);

    await newBookingRef.set(encryptedBooking);
    await newMessageRef.remove();

    res.status(201).json(message);
  } catch (error) {
    console.log(error);
    return res.status(500).json(error);
  }
};

exports.postMessage = async (req, res, next) => {
  const message = req.body;

  try {
    const validatedBooking = messageSchema.parse(message);

    let messageEncrypted = {
      ...message,
      id: uuidv4(),
      street: encryptData(message.street),
      city: encryptData(message.city),
      email: encryptData(message.email),
      firstName: encryptData(message.firstName),
      lastName: encryptData(message.lastName),
      phone: encryptData(message.phone),
    };

    if (messageEncrypted.providedMaterialsBooking.length === 0) {
      messageEncrypted.providedMaterialsBooking = ['emptyArray'];
    }

    if (messageEncrypted.unavailableDates.length === 0) {
      messageEncrypted.unavailableDates = ['emptyArray'];
    }

    const database = admin.database();

    const materialRef = database
      .ref('material')
      .child(messageEncrypted.idMaterial);

    const materialSnapshot = await materialRef.once('value');
    const materialData = materialSnapshot.val();

    let { unavailableDates } = materialData;

    unavailableDates.push(...message.bookingDates);

    await materialRef.update({
      unavailableDates: unavailableDates,
    });

    const messagingRef = database.ref('messaging');
    const newMessagingRef = messagingRef.child(messageEncrypted.id);

    await newMessagingRef.set(messageEncrypted);

    res.status(201).json({ message: 'Réservation crée' });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
};

exports.getAllMessage = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }
  const database = admin.database();
  const ref = database.ref('messaging');

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    ref.once('value', (snapshot) => {
      const data = snapshot.val();

      if (data) {
        let dataArray = Object.values(data).map((item) => ({
          ...item,
          street: decryptData(item.street),
          city: decryptData(item.city),
          email: decryptData(item.email),
          firstName: decryptData(item.firstName),
          lastName: decryptData(item.lastName),
          phone: decryptData(item.phone),
        }));

        dataArray = dataArray.map((item) => {
          return processArrays(item);
        });

        return res.status(200).json(dataArray);
      } else {
        return res.status(200).json([]);
      }
    });
  } catch (error) {
    return res.status(500).json('Erreur interne du serveur');
  }
};

exports.getMessageById = async (req, res, next) => {
  const { authorization } = req.headers;
  const { id } = req.params;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    const database = admin.database();
    const messageRef = database.ref('messaging');

    messageRef
      .orderByChild('id')
      .equalTo(id)
      .once('value', (snapshot) => {
        const messagingData = snapshot.val();

        if (messagingData) {
          const messagingList = Object.values(messagingData);
          if (messagingList.length > 0) {
            let message = processArrays(messagingList[0]);

            message = {
              ...message,
              street: decryptData(message.street),
              city: decryptData(message.city),
              email: decryptData(message.email),
              firstName: decryptData(message.firstName),
              lastName: decryptData(message.lastName),
              phone: decryptData(message.phone),
            };

            return res.status(200).json(message);
          }
        }

        return res
          .status(404)
          .json({ message: 'Matériel introuvable' });
      });
  } catch (error) {
    return res.status(500).json('Erreur interne du serveur');
  }
};

exports.deleteMessage = async (req, res, next) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    const database = admin.database();
    const messageRef = database.ref('messaging');
    const materialRef = database.ref('material');

    const messageSnapshot = await messageRef
      .orderByChild('id')
      .equalTo(id)
      .once('value');
    const messageData = messageSnapshot.val();

    if (!messageData) {
      return res.status(404).json('Réservation introuvable');
    }

    const messageDataValue = Object.values(messageData);
    const { idMaterial, unavailableDates } = messageDataValue[0];

    const materialSnapshot = await materialRef
      .orderByChild('id')
      .equalTo(idMaterial)
      .once('value');
    const materialData = materialSnapshot.val();

    if (materialData) {
      const materialValue = Object.values(materialData);
      let material = materialValue[0];

      material = {
        ...material,
        unavailableDates: unavailableDates.filter((date) =>
          unavailableDates.includes(date)
        ),
      };

      if (material.unavailableDates.length === 0) {
        material.unavailableDates = ['emptyArray'];
      } else if (material.providedMaterials.length === 0) {
        material.providedMaterials = ['emptyArray'];
      } else if (material.arrayPicture.length === 0) {
        material.arrayPicture = ['emptyArray'];
      }

      await materialRef.child(material.id).set(material);

      const bookingSnapshotAgain = await messageRef
        .orderByChild('id')
        .equalTo(id)
        .once('value');
      const bookingDataAgain = bookingSnapshotAgain.val();

      if (!bookingDataAgain) {
        return res.status(404).json('Réservation introuvable');
      }

      const bookingKey = Object.keys(bookingDataAgain)[0];
      await messageRef.child(bookingKey).remove();

      material = processArraysMaterial(material);

      return res.status(200).json(material);
    } else {
      const bookingSnapshotYetAgain = await messageRef
        .orderByChild('id')
        .equalTo(id)
        .once('value');
      const bookingDataYetAgain = bookingSnapshotYetAgain.val();

      if (!bookingDataYetAgain) {
        return res.status(404).json('Réservation introuvable');
      }

      const bookingKey = Object.keys(bookingDataYetAgain)[0];
      await messageRef.child(bookingKey).remove();

      return res.status(200);
    }
  } catch (error) {
    return res.status(500).json('Erreur interne du serveur');
  }
};

exports.changeStatus = async (req, res, next) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  console.log('changeStatus');

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    const database = admin.database();
    const messageRef = database.ref('messaging');

    const snapshot = await messageRef
      .orderByChild('id')
      .equalTo(id)
      .once('value');
    const messageData = snapshot.val();

    if (!messageData) {
      return res.status(404).json({ message: 'Message introuvable' });
    }

    const messageValue = Object.values(messageData);
    const messageUpdate = {
      ...messageValue[0],
      isRead: !messageValue[0].isRead,
    };

    await messageRef.child(id).set(messageUpdate);

    return res.status(200).json();
  } catch (error) {
    return res.status(500).json({ message: 'Erreur interne' });
  }
};
