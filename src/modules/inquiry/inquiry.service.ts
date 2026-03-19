import { InquiryRepository } from './inquiry.repository';
import { CreateInquiryInput, AdminRespondInput } from './inquiry.types';
import { getDatabase } from '../../config/database';
import { AssignmentRepository } from '../shipment/assignment.repository';

export class InquiryService {
    private repository: InquiryRepository;

    constructor() {
        this.repository = new InquiryRepository();
    }

    getAllInquiries(status?: string, page: number = 1, limit: number = 20) {
        return this.repository.findAll(status, page, limit);
    }

    getInquiryById(id: string) {
        return this.repository.findById(id);
    }

    trackInquiry(trackingId: string) {
        let inquiry = this.repository.findByTrackingId(trackingId);
        let shipmentId = inquiry?.shipment_id;
        let customerData = inquiry ? { name: inquiry.customer_name, email: inquiry.customer_email } : null;

        if (!inquiry) {
            // Check if it's a fresh assignment
            const assignmentRepo = new AssignmentRepository();
            const assignment = assignmentRepo.findByTrackingId(trackingId);
            if (assignment) {
                shipmentId = assignment.shipment_id;
                customerData = { name: assignment.customer_name, email: assignment.customer_email };
            } else {
                return null;
            }
        }

        // Fetch shipment details
        let shipmentDetails = null;
        if (shipmentId) {
            const db = getDatabase();
            const result = db.exec(`SELECT * FROM shipments WHERE id = '${shipmentId}'`);
            if (result.length > 0) {
                const row = result[0].values[0];
                const cols = result[0].columns;
                shipmentDetails = cols.reduce((obj: any, col: string, i: number) => {
                    obj[col] = row[i];
                    return obj;
                }, {});
            }
        }

        return {
            inquiry,
            customer: customerData,
            shipment: shipmentDetails,
        };
    }

    createInquiry(input: CreateInquiryInput) {
        // Automatically link shipment if trackingId is provided and valid
        if (input.tracking_id) {
            const assignmentRepo = new AssignmentRepository();
            const assignment = assignmentRepo.findByTrackingId(input.tracking_id);
            if (assignment && assignment.shipment_id) {
                (input as any).shipment_id = assignment.shipment_id;
            }
        }
        return this.repository.create(input);
    }

    respondToInquiry(id: string, input: AdminRespondInput) {
        return this.repository.update(id, input);
    }

    linkInquiryToShipment(id: string, shipmentId: string) {
        return this.repository.linkToShipment(id, shipmentId);
    }
}
