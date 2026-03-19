import { Request, Response } from 'express';
import { CalendarService } from './calendar.service';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const calendarService = new CalendarService();

export class CalendarController {
    static getEvents = asyncHandler(async (req: Request, res: Response) => {
        const { start_date, end_date, event_type } = req.query;
        const events = await calendarService.getEvents(
            start_date as string | undefined,
            end_date as string | undefined,
            event_type as string | undefined
        );
        ApiResponseHelper.success(res, events);
    });

    static createEvent = asyncHandler(async (req: Request, res: Response) => {
        const event = await calendarService.createEvent(req.body);
        ApiResponseHelper.created(res, event);
    });

    static syncFromShipments = asyncHandler(async (_req: Request, res: Response) => {
        const result = await calendarService.syncFromShipments();
        ApiResponseHelper.success(res, result);
    });

    static updateEvent = asyncHandler(async (req: Request, res: Response) => {
        const event = await calendarService.updateEvent(req.params.id as string, req.body);
        if (!event) { ApiResponseHelper.notFound(res, 'Calendar event'); return; }
        ApiResponseHelper.success(res, event);
    });

    static deleteEvent = asyncHandler(async (req: Request, res: Response) => {
        await calendarService.deleteEvent(req.params.id as string);
        ApiResponseHelper.success(res, { message: 'Event deleted successfully' });
    });
}
