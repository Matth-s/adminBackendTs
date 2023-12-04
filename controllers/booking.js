const admin = require('../db/config');
const verifyToken = require('../middleware/decodeToken');
const { encryptData, decryptData } = require('../middleware/Crypto');

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

function processArray(array) {
  return array.length === 1 && array[0] === 'emptyArray' ? [] : array;
}

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

exports.getAllData = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }
  const database = admin.database();
  const ref = database.ref('booking');

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
          bookingDates: item.bookingDates,
          materialName: item.materialName,
          downPayment: item.downPayment,
          total: item.total,
          isCompleted: item.isCompleted,
          coachingPriceHour: item.coachingPriceHour,
          coachingTime: item.coachingTime,
          timestamp: item.timestamp,
          providedMaterialsBooking: item.providedMaterialsBooking,
          unavailableDates: item.unavailableDates,
          pricePerDay: item.pricePerDay,
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

exports.getDataById = async (req, res, next) => {
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
    const bookingRef = database.ref('booking');

    bookingRef
      .orderByChild('id')
      .equalTo(id)
      .once('value', (snapshot) => {
        const bookingData = snapshot.val();

        if (bookingData) {
          const bookingList = Object.values(bookingData);
          if (bookingList.length > 0) {
            let booking = processArrays(bookingList[0]);

            booking = {
              id: booking.id,
              idMaterial: booking.idMaterial,
              street: decryptData(booking.street),
              city: decryptData(booking.city),
              email: decryptData(booking.email),
              firstName: decryptData(booking.firstName),
              lastName: decryptData(booking.lastName),
              phone: decryptData(booking.phone),
              bookingDates: booking.bookingDates,
              materialName: booking.materialName,
              downPayment: booking.downPayment,
              total: booking.total,
              isCompleted: booking.isCompleted,
              coachingPriceHour: booking.coachingPriceHour,
              coachingTime: booking.coachingTime,
              timestamp: booking.timestamp,
              providedMaterialsBooking:
                booking.providedMaterialsBooking,
              unavailableDates: booking.unavailableDates,
              pricePerDay: booking.pricePerDay,
            };

            return res.status(200).json(booking);
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

exports.createBooking = async (req, res, next) => {
  const { authorization } = req.headers;
  const booking = req.body;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    let encryptedBooking = {
      id: booking.id,
      idMaterial: booking.idMaterial,
      street: encryptData(booking.street),
      city: encryptData(booking.city),
      email: encryptData(booking.email),
      firstName: encryptData(booking.firstName),
      lastName: encryptData(booking.lastName),
      phone: encryptData(booking.phone),
      bookingDates: booking.bookingDates,
      materialName: booking.materialName,
      downPayment: booking.downPayment,
      total: booking.total,
      isCompleted: booking.isCompleted,
      coachingPriceHour: booking.coachingPriceHour,
      coachingTime: booking.coachingTime,
      providedMaterialsBooking: booking.providedMaterialsBooking,
      unavailableDates: booking.unavailableDates,
      timestamp: booking.timestamp,
      pricePerDay: booking.pricePerDay,
    };

    encryptedBooking = processEmptyArraysOnCreate(encryptedBooking);

    const database = admin.database();
    const bookingRef = database.ref('booking');
    const newBookingRef = bookingRef.child(booking.id);

    const materialRef = database
      .ref('material')
      .child(booking.idMaterial);

    // push booking date to unavailableDates material
    const materialSnapshot = await materialRef.once('value');
    const materialData = materialSnapshot.val();

    let { unavailableDates } = materialData;

    unavailableDates.push(...booking.bookingDates);

    unavailableDates = processArray(materialData.unavailableDates);

    await materialRef.update({
      unavailableDates: unavailableDates,
    });

    await newBookingRef.set(encryptedBooking);

    res.status(201).json(booking);
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.updateBooking = async (req, res, next) => {
  const { id } = req.params;
  const { authorization } = req.headers;
  let bookingBody = req.body;
  let oldBookingDateRequest;
  let encryptedBooking;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    encryptedBooking = {
      ...bookingBody,
      street: encryptData(bookingBody.street),
      city: encryptData(bookingBody.city),
      email: encryptData(bookingBody.email),
      firstName: encryptData(bookingBody.firstName),
      lastName: encryptData(bookingBody.lastName),
      phone: encryptData(bookingBody.phone),
      bookingDates: bookingBody.bookingDates, 
    };

    encryptedBooking = processEmptyArraysOnCreate(encryptedBooking);

    const database = admin.database();
    const bookingRef = database.ref('booking');
    const materialRef = database.ref('material');

    bookingRef
      .orderByChild('id')
      .equalTo(id)
      .once('value', (snapshot) => {
        const bookingData = snapshot.val();

        if (!bookingData) {
          return res.status(404).json('Réservation introuvable');
        }

        const bookingDataValue = Object.values(bookingData);
        oldBookingDateRequest = bookingDataValue[0].bookingDates;
      });

    materialRef
      .orderByChild('id')
      .equalTo(bookingBody.idMaterial)
      .once('value', async (snapshot) => {
        let materialData = snapshot.val();

        if (!materialData) {
          try {
            await bookingRef.child(id).set(encryptedBooking);
            return res.status(200).json({ bookingRes: bookingBody });
          } catch (error) {
            return res.status(500).json({ message: error });
          }
        }

        const MaterialDataValue = Object.values(materialData);
        let material = MaterialDataValue[0];

        let filteredDates = material.unavailableDates.filter(
          (date) => !oldBookingDateRequest.includes(date)
        );

        material.unavailableDates = filteredDates;

        if (material.unavailableDates.includes('emptyArray')) {
          material.unavailableDates = bookingBody.bookingDates;
        } else {
          material.unavailableDates.push(...bookingBody.bookingDates);
        }

        await materialRef.child(bookingBody.idMaterial).set(material);

        await bookingRef.child(id).set(encryptedBooking);

        material = processArraysMaterial(material);

        res
          .status(200)
          .json({ bookingRes: bookingBody, materialRes: material });
      });
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.deleteBookingById = async (req, res, next) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  console.log(authorization);

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    const database = admin.database();
    const bookingRef = database.ref('booking');
    const materialRef = database.ref('material');

    const bookingSnapshot = await bookingRef
      .orderByChild('id')
      .equalTo(id)
      .once('value');
    const bookingData = bookingSnapshot.val();

    if (!bookingData) {
      return res.status(404).json('Réservation introuvable');
    }

    const bookingDataValue = Object.values(bookingData);
    const { idMaterial, unavailableDates } = bookingDataValue[0];

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

      const bookingSnapshotAgain = await bookingRef
        .orderByChild('id')
        .equalTo(id)
        .once('value');
      const bookingDataAgain = bookingSnapshotAgain.val();

      if (!bookingDataAgain) {
        return res.status(404).json('Réservation introuvable');
      }

      const bookingKey = Object.keys(bookingDataAgain)[0];
      await bookingRef.child(bookingKey).remove();

      material = processArraysMaterial(material);

      return res.status(200).json(material);
    } else {
      const bookingSnapshotYetAgain = await bookingRef
        .orderByChild('id')
        .equalTo(id)
        .once('value');
      const bookingDataYetAgain = bookingSnapshotYetAgain.val();

      if (!bookingDataYetAgain) {
        return res.status(404).json('Réservation introuvable');
      }

      const bookingKey = Object.keys(bookingDataYetAgain)[0];
      await bookingRef.child(bookingKey).remove();

      return res.status(200);
    }
  } catch (error) {
    return res.status(500).json('Erreur interne du serveur');
  }
};

exports.getUnavailableDates = async (req, res, next) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(404).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    const database = admin.database();
    const materialRef = database.ref('material');

    materialRef
      .orderByChild('id')
      .equalTo(id)
      .once('value', (snapshot) => {
        const materialData = snapshot.val();

        if (materialData) {
          const materialList = Object.values(materialData);
          if (materialList.length > 0) {
            return res
              .status(200)
              .json(materialList[0].unavailableDates);
          }
        }

        return res
          .status(404)
          .json({ message: 'Matériel introuvable' });
      });
  } catch (error) {
    res.status(500).json('Erreur interne');
  }
};

exports.markAsPaid = async (req, res, next) => {
  const { id } = req.params;
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(404).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    const database = admin.database();
    const bookingRef = database.ref('booking');

    bookingRef
      .orderByChild('id')
      .equalTo(id)
      .once('value', (snapshot) => {
        const bookingData = snapshot.val();

        if (bookingData) {
          const bookingList = Object.values(bookingData);
          if (bookingList.length > 0) {
            const firstBooking = bookingList[0];
            firstBooking.isCompleted = true;

            bookingRef.child(firstBooking.id).set(firstBooking);

            return res
              .status(200)
              .json({ message: 'Marqué comme payé' });
          }
        }

        return res
          .status(404)
          .json({ message: 'Matériel introuvable' });
      });
  } catch (error) {
    res.status(500).json('Erreur interne');
  }
};
