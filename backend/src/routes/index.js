const { Router } = require('express');

const healthRoutes = require('./healthRoutes');
const userRoutes = require('./userRoutes');
const machineRoutes = require('./machineRoutes');
const reportRoutes = require('./reportRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const platformRoutes = require('./platformRoutes');
const eqpModuleRoutes = require('./eqpModuleRoutes');
const sheetsRoutes = require('./sheetsRoutes');
const partsInquiryRoutes = require('./partsInquiryRoutes');
const sapIntegrationRoutes = require('./sapIntegrationRoutes');
const swaggerRoutes = require('./swaggerRoutes');
const komatsuAdminRoutes = require('./komatsuAdminRoutes');
const { requireInternalApiAuth } = require('../middleware/internalApiAuthMiddleware');

const router = Router();

// Swagger Documentation & Interactive UI
router.use('/api/docs/sap-integration', swaggerRoutes);

// SAP B1 M2M Integration Endpoints
router.use('/api/v1/integration/sap', sapIntegrationRoutes);

// Internal Platform Authentication
router.use(requireInternalApiAuth);

// Admin Komatsu & Integration Management
router.use('/api/admin', komatsuAdminRoutes);

router.use(healthRoutes);
router.use(userRoutes);
router.use(machineRoutes);
router.use(reportRoutes);
router.use(analyticsRoutes);
router.use(platformRoutes);
router.use(eqpModuleRoutes);
router.use(sheetsRoutes);
router.use(partsInquiryRoutes);

module.exports = router;

