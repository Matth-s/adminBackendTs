exports.processArraysMaterial = (material) => {
  material.unavailableDates = processArray(material.unavailableDates);
  material.providedMaterials = processArray(
    material.providedMaterials
  );
  material.arrayPicture = processArray(material.arrayPicture);
  return material;
};

function processArray(array) {
  return array.length === 1 && array[0] === 'emptyArray' ? [] : array;
}
