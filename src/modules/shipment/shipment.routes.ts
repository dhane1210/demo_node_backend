import { Router } from 'express';
import { ShipmentController } from './shipment.controller';
import { validateRequest } from '../../middleware/validate-request';
import { createShipmentSchema, updateShipmentSchema, searchShipmentSchema, trackShipmentSchema } from './shipment.validator';
import { DocumentController } from './document.controller';
import { createDocumentSchema } from './document.validator';

const router = Router();

// Dashboard List (Paginated)
router.get('/', ShipmentController.getDashboard);

// Dashboard Statistics
router.get('/dashboard', ShipmentController.getDashboardStats);

// Search (must be before :id route)
router.get('/search', validateRequest(searchShipmentSchema, 'query'), ShipmentController.searchShipments);

// Track — manual fetch from Sinay API
router.post('/track', validateRequest(trackShipmentSchema), ShipmentController.trackShipment);

// Shipment detail
router.get('/:id', ShipmentController.getShipmentDetail);

// Create shipment
router.post('/', validateRequest(createShipmentSchema), ShipmentController.createShipment);

// Update shipment (admin curation)
router.patch('/:id', validateRequest(updateShipmentSchema), ShipmentController.updateShipment);

// Delete shipment
router.delete('/:id', ShipmentController.deleteShipment);

// Documents
router.get('/:shipmentId/documents', DocumentController.getShipmentDocuments);
router.post('/documents', validateRequest(createDocumentSchema), DocumentController.createDocument);
router.delete('/documents/:id', DocumentController.deleteDocument);

export default router;
