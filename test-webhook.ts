import axios from 'axios';

async function testWebhook() {
    try {
        const payload = {
            eventType: 'container.arrival.at.final.pod',
            data: {
                shipmentNumber: 'EGHU9714932' // Assuming this shipment exists; replace if needed
            }
        };

        console.log('Sending mock Sinay webhook...');
        const response = await axios.post('http://localhost:3000/api/v1/webhooks/sinay', payload, {
            headers: {
                'svix-event-type': 'container.arrival.at.final.pod'
            }
        });

        console.log('Webhook responded:', response.data);
    } catch (error: any) {
        console.error('Webhook error:', error.response?.data || error.message);
    }
}

testWebhook();
