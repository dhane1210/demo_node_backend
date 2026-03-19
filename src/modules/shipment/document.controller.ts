import { Request, Response } from 'express';
import { DocumentRepository } from './document.repository';
import { ApiResponseHelper } from '../../utils/api-response';
import { asyncHandler } from '../../middleware/async-handler';

const documentRepository = new DocumentRepository();

export class DocumentController {
    static getShipmentDocuments = asyncHandler(async (req: Request, res: Response) => {
        const documents = documentRepository.findByShipmentId(req.params.shipmentId as string);
        ApiResponseHelper.success(res, documents);
    });

    static createDocument = asyncHandler(async (req: Request, res: Response) => {
        const document = documentRepository.create(req.body);
        ApiResponseHelper.created(res, document);
    });

    static deleteDocument = asyncHandler(async (req: Request, res: Response) => {
        documentRepository.delete(req.params.id as string);
        ApiResponseHelper.success(res, { message: 'Document deleted successfully' });
    });
}
