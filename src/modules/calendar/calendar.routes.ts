import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { validateRequest } from '../../middleware/validate-request';
import { createCalendarEventSchema, updateCalendarEventSchema } from './calendar.validator';

const router = Router();

router.get('/events', CalendarController.getEvents);
router.post('/events', validateRequest(createCalendarEventSchema), CalendarController.createEvent);
router.post('/events/sync', CalendarController.syncFromShipments);
router.patch('/events/:id', validateRequest(updateCalendarEventSchema), CalendarController.updateEvent);
router.delete('/events/:id', CalendarController.deleteEvent);

export default router;
