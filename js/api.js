const API_BASE_URL = 'https://projet-json-server-4.onrender.com';

export async function apiRequest(endpoint, options = {}) {
    try {
        console.log(`Requête API: ${API_BASE_URL}${endpoint}`, options);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function saveContact(contactData) {
    return await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify(contactData)
    });
}

export async function getContacts() {
    return await apiRequest('/contacts');
}