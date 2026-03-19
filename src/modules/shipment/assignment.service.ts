import { AssignmentRepository } from './assignment.repository';
import { CreateAssignmentInput, ShipmentAssignment } from './assignment.types';
import { v4 as uuidv4 } from 'uuid';
import { CustomerRepository } from '../customer/customer.repository';
import { CommunicationService } from '../communication/communication.service';

export class AssignmentService {
    private repository: AssignmentRepository;
    private customerRepository: CustomerRepository;
    private communicationService: CommunicationService;

    constructor() {
        this.repository = new AssignmentRepository();
        this.customerRepository = new CustomerRepository();
        this.communicationService = new CommunicationService();
    }

    private generateTrackingId(): string {
        // Generate a random 8-character alphanumeric string
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'TRK-';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async createAssignment(input: CreateAssignmentInput): Promise<ShipmentAssignment> {
        let trackingId = this.generateTrackingId();

        // Ensure uniqueness (simple check)
        let existing = this.repository.findByTrackingId(trackingId);
        while (existing) {
            trackingId = this.generateTrackingId();
            existing = this.repository.findByTrackingId(trackingId);
        }

        let customerName = input.customer_name;
        let customerEmail = input.customer_email;

        if (input.customer_id) {
            const customer = this.customerRepository.findById(input.customer_id);
            if (customer) {
                customerName = customer.name;
                customerEmail = customer.email || customerEmail;
            }
        }

        const assignment: Partial<ShipmentAssignment> = {
            ...input,
            customer_id: input.customer_id || undefined,
            customer_name: customerName,
            customer_email: customerEmail,
            tracking_id: trackingId,
        };

        const result = this.repository.create(assignment as CreateAssignmentInput);

        return result;
    }

    async sendAssignmentEmail(id: string): Promise<boolean> {
        const assignment = this.repository.findById(id);
        if (!assignment || !assignment.customer_email) {
            throw new Error("Assignment or customer email not found");
        }
        await this.communicationService.sendEmail({
            template_id: 'auto-assignment',
            recipient_email: assignment.customer_email,
            recipient_name: assignment.customer_name,
            subject: `Your Tracking ID for Shipment: ${assignment.tracking_id}`,
            body: `Hello ${assignment.customer_name},\n\nYour shipment has been assigned. Your unique tracking ID is: ${assignment.tracking_id}\n\nYou can use this ID on our customer portal to check the status or contact us for updates.\n\nThank you!`,
            shipment_id: assignment.shipment_id,
        });
        return true;
    }

    getAllAssignments(page: number = 1, limit: number = 20, customerId?: string, shipmentId?: string) {
        return this.repository.findAll(page, limit, customerId, shipmentId);
    }

    getAssignmentByTrackingId(trackingId: string) {
        return this.repository.findByTrackingId(trackingId);
    }

    deleteAssignment(id: string) {
        return this.repository.delete(id);
    }
}
