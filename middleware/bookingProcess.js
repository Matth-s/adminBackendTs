exports.processArraysBooking = (booking) => {
  booking.unavailableDates = processArrayBooking(
    booking.unavailableDates
  );
  booking.bookingDates = processArrayBooking(booking.bookingDates);
  booking.providedMaterialsBooking = processArrayBooking(
    booking.providedMaterialsBooking
  );
  return booking;
};

exports.processArrayBooking = (array) => {
  return array.length === 1 && array[0] === 'emptyArray' ? [] : array;
};

exports.processEmptyArraysOnCreate = (booking) => {
  booking.unavailableDates = processArrayOnCreate(
    booking.unavailableDates
  );
  booking.bookingDates = processArrayOnCreate(booking.bookingDates);
  booking.providedMaterialsBooking = processArrayOnCreate(
    booking.providedMaterialsBooking
  );
  return booking;
};

exports.processArrayOnCreate = (array) => {
  if (array.length === 0) {
    return ['emptyArray'];
  }
  return array;
};
