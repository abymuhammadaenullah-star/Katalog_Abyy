export const API_BASE = '/api';
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://202.10.36.132:5000';

// ==========================================
// IMAGE URL HELPER
// ==========================================
export const getImageUrl = (image) => {
    // Tidak ada gambar
    if (!image || image === '-' || typeof image !== 'string') {
        return null;
    }

    const cleanImage = image.trim();
    if (!cleanImage) return null;

    // Jika sudah berupa URL web lengkap (http:// atau https://)
    if (cleanImage.startsWith('http://') || cleanImage.startsWith('https://')) {
        return cleanImage;
    }

    // Ambil nama file dan hapus awalan /uploads/ atau uploads/
    const filename = cleanImage.replace(/^\/?uploads\//, '').trim();
    if (!filename) return null;

    // Bersihkan SERVER_URL dari trailing slash
    const base = SERVER_URL.replace(/\/+$/, '');

    // Return URL absolut ke backend server uploads
    return `${base}/uploads/${filename}`;
};


// ==========================================
// TOKEN MANAGEMENT
// ==========================================
export const getAuthToken = () =>
    localStorage.getItem('katalogwa_token');

export const setAuthToken = (token) =>
    localStorage.setItem('katalogwa_token', token);

export const clearAuthToken = () =>
    localStorage.removeItem('katalogwa_token');

export const isAuthenticated = () =>
    !!getAuthToken();


// ==========================================
// AUTH HEADERS
// ==========================================
const getHeaders = (isFormData = false) => {
    const token = getAuthToken();

    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (!isFormData) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
};


// ==========================================
// ERROR HANDLER
// ==========================================
const handleResponse = async (response) => {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const errorMsg =
            data.message ||
            `Request failed with status ${response.status}`;

        throw new Error(errorMsg);
    }

    return data;
};


// ==========================================
// STORE SETTINGS
// ==========================================
export const fetchStoreSettings = async () => {
    const res = await fetch(`${API_BASE}/store`);
    return handleResponse(res);
};

export const updateStoreSettings = async (settings) => {
    const res = await fetch(`${API_BASE}/store`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(settings)
    });

    return handleResponse(res);
};


// ==========================================
// CATEGORIES
// ==========================================
export const fetchCategories = async () => {
    const res = await fetch(`${API_BASE}/categories`);
    return handleResponse(res);
};

export const createCategory = async (name) => {
    const res = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name })
    });

    return handleResponse(res);
};

export const updateCategory = async (id, name) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ name })
    });

    return handleResponse(res);
};

export const deleteCategory = async (id) => {
    const res = await fetch(`${API_BASE}/categories/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
    });

    return handleResponse(res);
};


// ==========================================
// PRODUCTS
// ==========================================
export const fetchProducts = async ({
    categoryId = '',
    search = ''
} = {}) => {
    const params = new URLSearchParams();

    if (categoryId) {
        params.append('categoryId', categoryId);
    }

    if (search) {
        params.append('search', search);
    }

    const url =
        `${API_BASE}/products` +
        (params.toString()
            ? `?${params.toString()}`
            : '');

    const res = await fetch(url);

    return handleResponse(res);
};


export const createProduct = async (formData) => {
    const isFormData = formData instanceof FormData;

    const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: getHeaders(isFormData),
        body: isFormData
            ? formData
            : JSON.stringify(formData)
    });

    return handleResponse(res);
};


export const updateProduct = async (id, formData) => {
    const isFormData = formData instanceof FormData;

    const res = await fetch(
        `${API_BASE}/products/${id}`,
        {
            method: 'PUT',
            headers: getHeaders(isFormData),
            body: isFormData
                ? formData
                : JSON.stringify(formData)
        }
    );

    return handleResponse(res);
};


export const updateProductStock = async (id, stock) => {
    const res = await fetch(
        `${API_BASE}/products/${id}/stock-amount`,
        {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
                stock: Number(stock)
            })
        }
    );

    return handleResponse(res);
};


export const toggleProductStock = async (id) => {
    const res = await fetch(
        `${API_BASE}/products/${id}/stock`,
        {
            method: 'PATCH',
            headers: getHeaders()
        }
    );

    return handleResponse(res);
};


export const deleteProduct = async (id) => {
    const res = await fetch(
        `${API_BASE}/products/${id}`,
        {
            method: 'DELETE',
            headers: getHeaders()
        }
    );

    return handleResponse(res);
};


// ==========================================
// ORDERS
// ==========================================
export const fetchOrders = async () => {
    const res = await fetch(
        `${API_BASE}/orders`,
        {
            headers: getHeaders()
        }
    );

    return handleResponse(res);
};


export const createOrder = async (orderData) => {
    const res = await fetch(
        `${API_BASE}/orders`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        }
    );

    return handleResponse(res);
};


export const updateOrderStatus = async (id, status) => {
    const res = await fetch(
        `${API_BASE}/orders/${id}/status`,
        {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
                status
            })
        }
    );

    return handleResponse(res);
};

export const deleteOrder = async (id) => {
    const res = await fetch(
        `${API_BASE}/orders/${encodeURIComponent(id)}`,
        {
            method: 'DELETE',
            headers: getHeaders()
        }
    );

    return handleResponse(res);
};


// ==========================================
// AUTH
// ==========================================
export const loginAdmin = async (email, password) => {
    const res = await fetch(
        `${API_BASE}/auth/login`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        }
    );

    const data = await handleResponse(res);

    if (data && data.token) {
        setAuthToken(data.token);
    }

    return data;
};


export const fetchAdminProfile = async () => {
    const res = await fetch(
        `${API_BASE}/auth/me`,
        {
            headers: getHeaders()
        }
    );

    return handleResponse(res);
};


export const updateAdminProfile = async (profileData) => {
    const res = await fetch(
        `${API_BASE}/auth/profile`,
        {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(profileData)
        }
    );

    const data = await handleResponse(res);

    if (data && data.token) {
        setAuthToken(data.token);
    }

    return data;
};