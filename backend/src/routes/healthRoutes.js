const { Router } = require('express');
const healthController = require('../controllers/healthController');

const router = Router();

router.get('/', healthController.health);
router.get('/health', healthController.health);
router.get('/health/pdf-converter', healthController.pdfConverter);
router.get('/health/sap-connectivity', healthController.sapConnectivity);

module.exports = router;
