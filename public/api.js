const API_BASE = '/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
}

async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers: getAuthHeaders()
    });

    const data = await response.json();

    if (!response.ok) {
        const error = new Error(data.message || 'Request failed');
        error.data = data;
        error.status = response.status;
        throw error;
    }

    return data;
}

// Auth API
export const authAPI = {
    login: (credentials) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),
    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),
    getProfile: () => apiRequest('/auth/profile')
};

// Products API
export const productsAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/products${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/products/${id}`),
    getFeatured: () => apiRequest('/products/featured'),
    getByCategory: (categoryId) => apiRequest(`/products/category/${categoryId}`),
    getLowStock: () => apiRequest('/products/low-stock'),
    getRecent: (limit = 10) => apiRequest(`/products/recent${limit ? `?limit=${limit}` : ''}`),
    create: (data) => apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/products/${id}`, {
        method: 'DELETE'
    }),
    updateStock: (id, stock) => apiRequest(`/products/${id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({ stock })
    }),
    addRating: (id, rating) => apiRequest(`/products/${id}/rating`, {
        method: 'POST',
        body: JSON.stringify(rating)
    })
};

// Categories API
export const categoriesAPI = {
    getAll: () => apiRequest('/categories'),
    getById: (id) => apiRequest(`/categories/${id}`),
    create: (data) => apiRequest('/categories', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/categories/${id}`, {
        method: 'DELETE'
    })
};

// Cart API
export const cartAPI = {
    get: () => apiRequest('/cart'),
    add: (productId, quantity = 1) => apiRequest('/cart', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity })
    }),
    update: (itemId, quantity) => apiRequest(`/cart/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity })
    }),
    remove: (itemId) => apiRequest(`/cart/${itemId}`, {
        method: 'DELETE'
    }),
    clear: () => apiRequest('/cart', {
        method: 'DELETE'
    })
};

// Orders API
export const ordersAPI = {
    create: (orderData) => apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
    }),
    getMy: () => apiRequest('/orders/my'),
    getPending: () => apiRequest('/orders/pending'),
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/orders${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/orders/${id}`),
    updateStatus: (id, status, trackingNumber) => apiRequest(`/orders/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, trackingNumber })
    }),
    cancel: (id) => apiRequest(`/orders/${id}/cancel`, {
        method: 'PUT'
    })
};

// Analytics API
export const analyticsAPI = {
    getDashboard: () => apiRequest('/analytics/dashboard'),
    getPopularProducts: () => apiRequest('/analytics/popular-products'),
    getTopCategories: () => apiRequest('/analytics/top-categories'),
    getSalesReport: () => apiRequest('/analytics/sales-report'),
    getMonthlyStats: (year) => apiRequest(`/analytics/monthly-stats${year ? `?year=${year}` : ''}`),
    getMonthlyRevenue: (year) => apiRequest(`/analytics/monthly-revenue${year ? `?year=${year}` : ''}`),
    getCustomerActivity: () => apiRequest('/analytics/customer-activity')
};

// Reviews API
export const reviewsAPI = {
    create: (data) => apiRequest(`/reviews/product/${data.productId}`, {
        method: 'POST',
        body: JSON.stringify({
            rating: data.rating,
            review: data.review
        })
    }),
    add: (productId, reviewData) => apiRequest(`/reviews/product/${productId}`, { // Fixed endpoint to match server
        method: 'POST',
        body: JSON.stringify(reviewData)
    }),
    update: (reviewId, reviewData) => apiRequest(`/reviews/${reviewId}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData)
    }),
    delete: (reviewId, productId) => apiRequest(`/reviews/${reviewId}`, {
        method: 'DELETE',
        body: JSON.stringify({ productId })
    }),
    getMyReviews: () => apiRequest('/reviews/user/my-reviews')
};

// Users API (for admin)
export const usersAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/users${query ? `?${query}` : ''}`);
    },
    getById: (id) => apiRequest(`/users/${id}`),
    update: (id, data) => apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`/users/${id}`, {
        method: 'DELETE'
    })
};