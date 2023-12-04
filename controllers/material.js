const admin = require('../db/config');
const verifyToken = require('../middleware/decodeToken');
const { ref, list, getDownloadURL } = require('firebase/storage');
const { storage } = require('../firebaseConf');

function processArrays(material) {
  material.unavailableDates = processArray(material.unavailableDates);
  material.providedMaterials = processArray(
    material.providedMaterials
  );
  material.arrayPicture = processArray(material.arrayPicture);
  return material;
}

function processArray(array) {
  return array.length === 1 && array[0] === 'emptyArray' ? [] : array;
}

function processEmptyArraysOnCreate(material) {
  material.unavailableDates = processArrayOnCreate(
    material.unavailableDates
  );
  material.providedMaterials = processArrayOnCreate(
    material.providedMaterials
  );
  material.arrayPicture = processArrayOnCreate(material.arrayPicture);
  return material;
}

function processArrayOnCreate(array) {
  if (array.length === 0) {
    return ['emptyArray'];
  }
  return array;
}
function extractIdFromDownloadUrl(downloadUrl) {
  const parts = downloadUrl.split('%2F');
  if (parts.length >= 3) {
    const desiredPart = parts[2];
    const result = desiredPart.split('?alt')[0];
    return result;
  } else {
    return null;
  }
}

exports.getAllData = async (req, res, next) => {
  try {
    const database = admin.database();
    const ref = database.ref('material');

    ref.once('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const dataArray = Object.values(data).map((material) => ({
          ...material,
          unavailableDates: processArray(material.unavailableDates),
          providedMaterials: processArray(material.providedMaterials),
          arrayPicture: processArray(material.arrayPicture),
        }));
        return res.status(200).json(dataArray);
      }

      res.status(200).json([]);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMaterialById = async (req, res, next) => {
  const { id } = req.params;

  try {
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
            const material = processArrays(materialList[0]);
            return res.status(200).json(material);
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

exports.searchByName = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log(id, ' id');

    const nameFormat = id.replaceAll('-', '').toLowerCase();
    console.log(nameFormat, 'name format');

    const database = admin.database(); // Assuming admin is properly initialized

    const ref = database.ref('material');

    ref.once('value', (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const dataArray = Object.values(data).map((material) => ({
            ...material,
            unavailableDates: processArray(material.unavailableDates),
            providedMaterials: processArray(
              material.providedMaterials
            ),
            arrayPicture: processArray(material.arrayPicture),
          }));

          if (dataArray.length > 0) {
            const newData = dataArray.filter((item) =>
              item.name.toLowerCase().includes(nameFormat)
            );
            res.status(200).json(newData);
          } else {
            res.status(200).json(null);
          }
        } else {
          res.status(200).json(null);
        }
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMaterial = async (req, res, next) => {
  const { authorization } = req.headers;
  let material = req.body;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    const folderRef = ref(storage, `material/${material.id}/`);

    const items = await list(folderRef);

    let presentationPicture;

    if (items.items.length > 0) {
      const downloadUrls = await Promise.all(
        items.items.map(async (item) => {
          const imageUrl = await getDownloadURL(item);

          return {
            src: imageUrl,
            id: extractIdFromDownloadUrl(imageUrl),
          };
        })
      );

      material.arrayPicture = [...downloadUrls];

      if (material.presentationPicture === '') {
        presentationPicture = downloadUrls[0].src;
      } else {
        presentationPicture =
          downloadUrls
            .map((item) => {
              if (item.id === material.presentationPicture) {
                return item.src;
              }
              return null;
            })
            .find((src) => src !== null) || '';
      }

      material.presentationPicture = presentationPicture;

      material = processEmptyArraysOnCreate(material);
    } else {
      material = processEmptyArraysOnCreate(material);
    }

    const database = admin.database();
    const materialRef = database.ref('material');
    const newMaterialRef = materialRef.child(material.id);

    await newMaterialRef.set(material);

    material = processArrays(material);

    return res.status(201).json(material);
  } catch (error) {
    return res.status(500).json(error);
  }
};

exports.updateMaterialById = async (req, res, next) => {
  const { authorization } = req.headers;
  const { id } = req.params;
  let material = req.body;

  if (!authorization) {
    return res.status(401).json('Unauthorized');
  }

  try {
    const isTokenValid = await verifyToken(authorization);

    if (!isTokenValid) {
      return res.status(403).json('Forbidden');
    }

    const folderRef = ref(storage, `material/${material.id}/`);

    const items = await list(folderRef);
    let presentationPicture;

    if (items.items.length > 0) {
      const downloadUrls = await Promise.all(
        items.items.map(async (item) => {
          const imageUrl = await getDownloadURL(item);

          return {
            src: imageUrl,
            id: extractIdFromDownloadUrl(imageUrl),
          };
        })
      );

      material.arrayPicture = [...downloadUrls];

      if (material.presentationPicture === '') {
        presentationPicture = downloadUrls[0].src;
      } else if (material.presentationPicture.includes('https')) {
        presentationPicture = material.presentationPicture;
      } else {
        presentationPicture =
          downloadUrls
            .map((item) => {
              if (item.id === material.presentationPicture) {
                return item.src;
              }
              return null;
            })
            .find((src) => src !== null) || '';
      }

      material.presentationPicture = presentationPicture;

      material = processEmptyArraysOnCreate(material);
    } else {
      material.presentationPicture = '';
      material.arrayPicture = [];
      material = processEmptyArraysOnCreate(material);
    }

    const database = admin.database();
    const materialRef = database.ref('material');
    await materialRef.child(id).set(material);

    material = processArrays(material);

    return res.status(200).json(material);
  } catch (error) {
    return res.status(500).json('Internal server error');
  }
};

exports.deleteMaterialById = async (req, res, next) => {
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
    const materialRef = database.ref('material');
    const materialSnapshot = await materialRef
      .child(id)
      .once('value');

    if (!materialSnapshot.exists()) {
      return res.status(404).json('Material not found');
    }

    await materialRef.child(id).remove();

    return res.status(200).json(200);
  } catch (error) {
    return res.status(500).json('Internal server error');
  }
};
