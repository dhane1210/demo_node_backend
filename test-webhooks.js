const axios = require('axios');

async function checkEndpoints() {
    try {
        const response = await axios.get('https://api.sinay.ai/webhook/api/v1/endpoint', {
            headers: {
                'API_KEY': '93c64487-ff68-4548-ba41-d940037510d2',
                'accept': 'application/json'
            }
        });
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("Error fetching endpoints:", e.response ? e.response.data : e.message);
    }
}

checkEndpoints();
