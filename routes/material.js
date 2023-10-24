const express = require('express');
const router = express.Router();
const materialCtrl = require('../controllers/material');

router.get('/', materialCtrl.getAllData);
router.post('/', materialCtrl.createMaterial);
router.get('/:id', materialCtrl.getMaterialById);
router.put('/:id', materialCtrl.updateMaterialById);
router.delete('/:id', materialCtrl.deleteMaterialById);

module.exports = router;
