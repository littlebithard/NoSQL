import { authAPI, productsAPI, categoriesAPI, cartAPI, ordersAPI, analyticsAPI, reviewsAPI } from './api.js';

const state = {
    user: null,
    view: 'login',
    isRegister: false,
    products: [],
    categories: [],
    orders: [],
    cart: { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 },
    selectedProductId: null,
    editingProduct: undefined,
    message: '',
    error: '',
    showReviewForm: false,
    editingReview: undefined,
};

const appEl = document.getElementById('app');

function loadUserFromStorage() {
    try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            state.user = JSON.parse(storedUser);
            state.view = 'home';
        }
    } catch {
        // ignore
    }
}

function saveUser(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    state.user = user;
}

function clearUser() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    state.user = null;
}

function setView(view, extra = {}) {
    state.view = view;
    if (extra.selectedProductId !== undefined) {
        state.selectedProductId = extra.selectedProductId;
    }
    state.message = extra.message || '';
    state.error = extra.error || '';
    render();
}

function formatPrice(price) {
    return `${(price || 0).toFixed(2)}`;
}

function renderNav() {
    if (!state.user) return '';

    const isStaff = ['admin', 'staff'].includes(state.user.role);

    return `
    <nav class="navbar">
        <div class="nav-brand" data-view="home">
            <span class="brand-icon">🛋️</span>
            <span>FurnitureHub</span>
        </div>
        <div class="nav-links">
            <button class="nav-link" data-view="home">🏠 Home</button>
            <button class="nav-link" data-view="products">🪑 Shop</button>
            <button class="nav-link" data-view="orders">📦 My Orders</button>
            ${isStaff ? `
                <button class="nav-link" data-view="dashboard">📊 Dashboard</button>
                <button class="nav-link" data-view="manageProducts">⚙️ Manage</button>
            ` : ''}
        </div>
        <div class="nav-right">
            <button class="cart-btn" data-view="cart">
                🛒 Cart
                <span class="cart-badge" id="cart-badge">${state.cart.itemCount || 0}</span>
            </button>
            <div class="nav-user">
                <span class="user-name">${state.user.username || state.user.email}</span>
                <button class="logout-btn" id="logout-btn">Logout</button>
            </div>
        </div>
    </nav>
    `;
}

function renderLoginView() {
    return `
    <div class="login-container">
        <div class="login-artwork">
            <div class="artwork-content">
                <div class="artwork-icon">🛋️</div>
                <h1>FurnitureHub</h1>
                <p>Transform your space with premium furniture</p>
                <div class="floating-items">
                    <div class="floating-item">🪑</div>
                    <div class="floating-item">🛏️</div>
                    <div class="floating-item">🪔</div>
                </div>
            </div>
        </div>
        <div class="login-form-container">
            <div class="login-form-wrapper">
                <h2>${state.isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                <p class="login-subtitle">
                    ${state.isRegister ? 'Join our furniture community' : 'Sign in to continue shopping'}
                </p>
                ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
                ${state.message ? `<div class="message">${state.message}</div>` : ''}
                <form id="auth-form" class="login-form">
                    ${state.isRegister ? `
                        <div class="form-group">
                            <input type="text" name="username" placeholder="Username" required />
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <input type="text" name="firstName" placeholder="First Name" />
                            </div>
                            <div class="form-group">
                                <input type="text" name="lastName" placeholder="Last Name" />
                            </div>
                        </div>
                    ` : ''}
                    <div class="form-group">
                        <input type="email" name="email" placeholder="Email" required />
                    </div>
                    <div class="form-group">
                        <input type="password" name="password" placeholder="Password" minlength="6" required />
                    </div>
                    <button type="submit" class="submit-btn">
                        ${state.isRegister ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>
                <div class="form-footer">
                    <button type="button" id="toggle-auth-mode" class="toggle-form-btn">
                        ${state.isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

function renderHomeView() {
    const featuredProducts = state.products.filter(p => p.isFeatured).slice(0, 4);
    const displayProducts = featuredProducts.length > 0 ? featuredProducts : state.products.slice(0, 6);
    const categories = state.categories.slice(0, 6);

    return `
    <div class="home-page">
        <section class="hero-section">
            <div class="hero-content">
                <h1 class="hero-title">
                    Transform Your Space with
                    <span class="gradient-text">Premium Furniture</span>
                </h1>
                <p class="hero-subtitle">
                    Discover our curated collection of modern, elegant furniture pieces designed to elevate your home.
                </p>
            </div>
        </section>

        <section class="categories-section">
            <h2 class="section-title">Shop by Category</h2>
            <div class="categories-grid">
                ${categories.map((c) => `
                    <button class="category-card" data-category-id="${c._id}">
                        <div class="category-icon">${getCategoryIcon(c.name)}</div>
                        <h3>${c.name}</h3>
                        <p>${c.productCount || 0} items</p>
                    </button>
                `).join('')}
            </div>
        </section>

        <section class="featured-section">
            <div class="section-header">
                <h2 class="section-title">Featured Products</h2>
                <button class="view-all-link" data-view="products">
                    View All →
                </button>
            </div>
            <div class="products-grid">
                ${displayProducts.map((p) => renderProductCard(p)).join('')}
            </div>
        </section>

        <section class="promo-section">
            <div class="promo-content">
                <h2>Free Shipping on Orders Over $500</h2>
                <p>Plus easy returns within 30 days</p>
                <button class="promo-btn" data-view="products">Start Shopping</button>
            </div>
        </section>
    </div>
    `;
}

function getCategoryIcon(name) {
    const icons = {
        'Living Room': '🛋️',
        'Bedroom': '🛏️',
        'Dining': '🪑',
        'Office': '🖥️',
        'Outdoor': '🌿',
        'Storage': '🗄️',
        'Lighting': '💡',
        'Decor': '🖼️'
    };
    return icons[name] || '🪑';
}

function renderProductCard(product) {
    const price = product.discountPrice || product.price;
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;

    return `
    <div class="product-card" data-product-id="${product._id}">
        <div class="product-image">
            ${product.images && product.images[0]
            ? `<img src="${product.images[0]}" alt="${product.name}" />`
            : `<div class="product-placeholder">🪑</div>`
        }
            ${hasDiscount ? '<span class="sale-badge">SALE</span>' : ''}
            <span class="stock-badge" data-status="${product.status}">${product.status.replace('_', ' ')}</span>
        </div>
        <div class="product-info">
            <p class="product-brand">${product.brand}</p>
            <h3 class="product-name">${product.name}</h3>
            <div class="product-rating">
                ${'★'.repeat(Math.round(product.averageRating || 0))}${'☆'.repeat(5 - Math.round(product.averageRating || 0))}
                <span>(${product.ratings?.length || 0})</span>
            </div>
            <div class="product-price">
                <span class="current-price">${formatPrice(price)}</span>
                ${hasDiscount ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
            </div>
            <button class="add-to-cart-btn" data-product-id="${product._id}" ${product.stock <= 0 ? 'disabled' : ''}>
                ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    </div>
    `;
}

function renderProductsView() {
    return `
    <div class="products-page">
        <div class="page-header">
            <h1>Shop Furniture</h1>
            <p>Find the perfect pieces for your home</p>
        </div>
        <div class="products-layout">
            <aside class="filters-sidebar">
                <h3>Filters</h3>
                <form id="products-filter-form">
                    <div class="filter-group">
                        <label>Category</label>
                        <select name="category">
                            <option value="">All Categories</option>
                            ${state.categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Price Range</label>
                        <div class="price-inputs">
                            <input type="number" name="minPrice" placeholder="Min" />
                            <span>-</span>
                            <input type="number" name="maxPrice" placeholder="Max" />
                        </div>
                    </div>
                    <div class="filter-group">
                        <label>Availability</label>
                        <select name="status">
                            <option value="">All</option>
                            <option value="in_stock">In Stock</option>
                            <option value="low_stock">Low Stock</option>
                        </select>
                    </div>
                    <button type="submit" class="filter-btn">Apply Filters</button>
                </form>
            </aside>
            <main class="products-main">
                <div class="products-toolbar">
                    <form id="products-search-form" class="search-form">
                        <input type="text" name="search" placeholder="Search products..." />
                        <button type="submit">🔍</button>
                    </form>
                    <p class="results-count">${state.products.length} products</p>
                </div>
                <div class="products-grid">
                    ${state.products.map(p => renderProductCard(p)).join('')}
                </div>
            </main>
        </div>
    </div>
    `;
}

function renderProductDetailView(product) {
    if (!product) {
        return `<div class="product-detail-page"><div class="error">Product not found.</div></div>`;
    }

    const price = product.discountPrice || product.price;
    const hasDiscount = product.discountPrice && product.discountPrice < product.price;
    const ratings = Array.isArray(product.ratings) ? product.ratings : [];

    return `
    <div class="product-detail-page">
        <button class="back-btn" id="back-to-products">← Back to Shop</button>
        <div class="product-detail-container">
            <div class="product-gallery">
                ${product.images && product.images[0]
            ? `<img src="${product.images[0]}" alt="${product.name}" class="main-image" />`
            : `<div class="product-placeholder-large">🪑</div>`
        }
            </div>
            <div class="product-detail-info">
                <p class="product-brand">${product.brand}</p>
                <h1>${product.name}</h1>
                <div class="product-sku">SKU: ${product.sku}</div>
                <div class="product-rating-large">
                    ${'★'.repeat(Math.round(product.averageRating || 0))}${'☆'.repeat(5 - Math.round(product.averageRating || 0))}
                    <span>(${ratings.length} reviews)</span>
                </div>
                <div class="product-price-large">
                    <span class="current-price">${formatPrice(price)}</span>
                    ${hasDiscount ? `<span class="original-price">${formatPrice(product.price)}</span>` : ''}
                </div>
                ${product.description ? `
                    <div class="product-description">
                        <h3>Description</h3>
                        <p>${product.description}</p>
                    </div>
                ` : ''}
                ${product.dimensions ? `
                    <div class="product-dimensions">
                        <h3>Dimensions</h3>
                        <p>W: ${product.dimensions.width || '-'}" × H: ${product.dimensions.height || '-'}" × D: ${product.dimensions.depth || '-'}"</p>
                    </div>
                ` : ''}
                <div class="product-details-list">
                    ${product.material ? `<p><strong>Material:</strong> ${product.material}</p>` : ''}
                    ${product.color ? `<p><strong>Color:</strong> ${product.color}</p>` : ''}
                    <p><strong>Availability:</strong> ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
                </div>
                ${state.message ? `<div class="message">${state.message}</div>` : ''}
                ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
                <div class="product-actions">
                    <button id="add-to-cart-detail" class="add-to-cart-btn-large" ${product.stock <= 0 ? 'disabled' : ''}>
                        ${product.stock <= 0 ? 'Out of Stock' : '🛒 Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
        <div class="reviews-section">
            <h2>Customer Reviews</h2>
            <button class="write-review-btn" id="write-review-btn">Write a Review</button>
            ${state.user ? '' : '<p class="login-to-review">Please log in to write a review.</p>'}
            ${state.showReviewForm ? renderReviewForm(product._id) : ''}
            ${state.editingReview ? renderReviewForm(product._id, state.editingReview) : ''}
            ${ratings.length === 0
            ? '<p class="empty-text">No reviews yet.</p>'
            : `
                <div class="reviews-list">
                    ${ratings.slice(0, 5).map(r => `
                        <div class="review-item">
                            <div class="review-header">
                                <span class="review-user">${r.user?.username || 'Customer'}</span>
                                <div class="review-rating">${'★'.repeat(r.rating || 0)}</div>
                            </div>
                            ${r.review ? `<p class="review-text">${r.review}</p>` : ''}
                            ${r.createdAt ? `<span class="review-date">${new Date(r.createdAt).toLocaleDateString()}</span>` : ''}
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    </div>
    `;
}

function renderCartView() {
    const cart = state.cart;

    if (!cart.items || cart.items.length === 0) {
        return `
        <div class="cart-page">
            <div class="page-header">
                <h1>Shopping Cart</h1>
            </div>
            <div class="empty-cart">
                <div class="empty-icon">🛒</div>
                <h2>Your cart is empty</h2>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <button class="cta-primary" data-view="products">Start Shopping</button>
            </div>
        </div>
        `;
    }

    return `
    <div class="cart-page">
        <div class="page-header">
            <h1>Shopping Cart</h1>
            <p>${cart.itemCount} items in your cart</p>
        </div>
        ${state.message ? `<div class="message">${state.message}</div>` : ''}
        ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
        <div class="cart-layout">
            <div class="cart-items">
                ${cart.items.map(item => `
                    <div class="cart-item">
                        <div class="cart-item-image">
                            ${item.product.images && item.product.images[0]
            ? `<img src="${item.product.images[0]}" alt="${item.product.name}" />`
            : `<div class="cart-placeholder">🪑</div>`
        }
                        </div>
                        <div class="cart-item-info">
                            <h3>${item.product.name}</h3>
                            <p class="cart-item-price">${formatPrice(item.price)}</p>
                        </div>
                        <div class="cart-item-quantity">
                            <button class="qty-btn" data-action="decrease" data-item-id="${item._id}">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" data-action="increase" data-item-id="${item._id}">+</button>
                        </div>
                        <div class="cart-item-total">
                            ${formatPrice(item.total)}
                        </div>
                        <button class="remove-item-btn" data-item-id="${item._id}">✕</button>
                    </div>
                `).join('')}
            </div>
            <div class="cart-summary">
                <h3>Order Summary</h3>
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>${formatPrice(cart.subtotal)}</span>
                </div>
                <div class="summary-row">
                    <span>Shipping</span>
                    <span>${cart.shipping === 0 ? 'FREE' : formatPrice(cart.shipping)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax (8%)</span>
                    <span>${formatPrice(cart.tax)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total</span>
                    <span>${formatPrice(cart.total)}</span>
                </div>
                ${cart.subtotal < 500 ? `<p class="shipping-notice">Add ${formatPrice(500 - cart.subtotal)} more for free shipping!</p>` : ''}
                <button class="checkout-btn" id="checkout-btn">Proceed to Checkout</button>
                <button class="clear-cart-btn" id="clear-cart-btn">Clear Cart</button>
            </div>
        </div>
    </div>
    `;
}

function renderCheckoutView() {
    return `
    <div class="checkout-page">
        <div class="page-header">
            <h1>Checkout</h1>
        </div>
        ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
        <form id="checkout-form" class="checkout-form">
            <div class="checkout-section">
                <h3>Shipping Address</h3>
                <div class="form-group">
                    <input type="text" name="street" placeholder="Street Address" required />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" name="city" placeholder="City" required />
                    </div>
                    <div class="form-group">
                        <input type="text" name="state" placeholder="State" required />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" name="zip" placeholder="ZIP Code" required />
                    </div>
                    <div class="form-group">
                        <input type="text" name="country" placeholder="Country" value="USA" />
                    </div>
                </div>
            </div>
            <div class="checkout-section">
                <h3>Payment Method</h3>
                <div class="payment-options">
                    <label class="payment-option">
                        <input type="radio" name="paymentMethod" value="card" checked />
                        <span>💳 Credit/Debit Card</span>
                    </label>
                    <label class="payment-option">
                        <input type="radio" name="paymentMethod" value="cash_on_delivery" />
                        <span>💵 Cash on Delivery</span>
                    </label>
                </div>
            </div>
            <div class="checkout-section">
                <h3>Order Notes (Optional)</h3>
                <textarea name="notes" placeholder="Special instructions for your order..."></textarea>
            </div>
            <div class="checkout-summary">
                <p>Total: <strong>${formatPrice(state.cart.total)}</strong></p>
                <button type="submit" class="place-order-btn">Place Order</button>
                <button type="button" class="back-to-cart-btn" data-view="cart">← Back to Cart</button>
            </div>
        </form>
    </div>
    `;
}

function renderOrdersView() {
    const active = state.orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
    const history = state.orders.filter(o => ['delivered', 'cancelled'].includes(o.status));

    return `
    <div class="orders-page">
        <div class="page-header">
            <h1>My Orders</h1>
            <p>Track and manage your orders</p>
        </div>
        ${state.message ? `<div class="message">${state.message}</div>` : ''}
        ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
        <section class="orders-section">
            <h2>Active Orders (${active.length})</h2>
            ${active.length === 0 ? `
                <div class="empty-state">
                    <p>No active orders</p>
                    <button class="browse-link" data-view="products">Start Shopping</button>
                </div>
            ` : `
                <div class="orders-list">
                    ${active.map(o => renderOrderCard(o)).join('')}
                </div>
            `}
        </section>
        <section class="orders-section">
            <h2>Order History (${history.length})</h2>
            ${history.length === 0
            ? `<p class="empty-text">No order history yet.</p>`
            : `<div class="orders-list">${history.map(o => renderOrderCard(o)).join('')}</div>`
        }
        </section>
    </div>
    `;
}

function renderOrderCard(order) {
    const statusColors = {
        pending: '#f59e0b',
        confirmed: '#3b82f6',
        processing: '#8b5cf6',
        shipped: '#06b6d4',
        delivered: '#10b981',
        cancelled: '#ef4444'
    };

    return `
    <div class="order-card">
        <div class="order-header">
            <div>
                <span class="order-number">${order.orderNumber}</span>
                <span class="order-date">${new Date(order.orderedAt).toLocaleDateString()}</span>
            </div>
            <span class="order-status" style="background: ${statusColors[order.status]}">${order.status}</span>
        </div>
        <div class="order-items">
            ${order.items.slice(0, 2).map(item => `
                <span class="order-item-name">${item.name} × ${item.quantity}</span>
            `).join('')}
            ${order.items.length > 2 ? `<span class="more-items">+${order.items.length - 2} more</span>` : ''}
        </div>
        <div class="order-footer">
            <span class="order-total">${formatPrice(order.totalAmount)}</span>
            ${['pending', 'confirmed'].includes(order.status)
            ? `<button class="cancel-order-btn" data-order-id="${order._id}">Cancel Order</button>`
            : order.trackingNumber
                ? `<span class="tracking">Tracking: ${order.trackingNumber}</span>`
                : ''
        }
        </div>
    </div>
    `;
}

function renderDashboardView() {
    return `
    <div class="dashboard-page">
        <div class="page-header">
            <h1>Dashboard</h1>
            <p>Store analytics and statistics</p>
        </div>
        <div class="dashboard-stats" id="dashboard-stats">
            <div class="loading">Loading dashboard...</div>
        </div>
    </div>
    `;
}

function renderProductFormModal() {
    const p = state.editingProduct || {};
    const isEdit = !!p._id;
    const catId = p.category && (p.category._id || p.category);

    return `
    <div class="modal-overlay" id="product-modal-overlay">
        <div class="modal-content product-form-modal">
            <div class="modal-header">
                <h2>${isEdit ? 'Edit Product' : 'Add Product'}</h2>
                <button type="button" class="modal-close" id="close-product-modal" aria-label="Close">&times;</button>
            </div>
            <form id="product-form" class="product-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>SKU *</label>
                        <input type="text" name="sku" value="${p.sku || ''}" required placeholder="e.g. FRN-001" />
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select name="category" required>
                            <option value="">Select Category</option>
                            ${state.categories.map(c => `
                                <option value="${c._id}" ${catId === c._id ? 'selected' : ''}>${c.name}</option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Name *</label>
                    <input type="text" name="name" value="${p.name || ''}" required />
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Brand *</label>
                        <input type="text" name="brand" value="${p.brand || ''}" required />
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="in_stock" ${p.status === 'in_stock' ? 'selected' : ''}>In Stock</option>
                            <option value="low_stock" ${p.status === 'low_stock' ? 'selected' : ''}>Low Stock</option>
                            <option value="out_of_stock" ${p.status === 'out_of_stock' ? 'selected' : ''}>Out of Stock</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" placeholder="Product description">${p.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Price *</label>
                        <input type="number" name="price" value="${p.price ?? ''}" step="0.01" min="0" required />
                    </div>
                    <div class="form-group">
                        <label>Discount Price</label>
                        <input type="number" name="discountPrice" value="${p.discountPrice ?? ''}" step="0.01" min="0" placeholder="Optional" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Stock *</label>
                        <input type="number" name="stock" value="${p.stock ?? 0}" min="0" required />
                    </div>
                    <div class="form-group">
                        <label>Material</label>
                        <input type="text" name="material" value="${p.material || ''}" placeholder="e.g. Wood, Metal" />
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Color</label>
                        <input type="text" name="color" value="${p.color || ''}" placeholder="e.g. Brown, Black" />
                    </div>
                    <div class="form-group">
                        <label>Weight (kg)</label>
                        <input type="number" name="weight" value="${p.dimensions?.weight ?? ''}" step="0.01" min="0" placeholder="Optional" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Images (comma-separated URLs)</label>
                    <textarea name="images" placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg">${(p.images || []).join(', ')}</textarea>
                </div>
                <div class="form-group">
                    <label class="checkbox-label">
                        <input type="checkbox" name="isFeatured" ${p.isFeatured ? 'checked' : ''} />
                        Featured Product
                    </label>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-product-form" class="cancel-btn">Cancel</button>
                    <button type="submit" class="submit-btn">${isEdit ? 'Update Product' : 'Add Product'}</button>
                </div>
            </form>
        </div>
    </div>
    `;
}

function renderManageProductsView() {
    return `
    <div class="manage-products-page">
        <div class="page-header">
            <h1>Manage Products</h1>
            <button class="add-product-btn" id="add-product-btn">+ Add Product</button>
        </div>
        ${state.message ? `<div class="message">${state.message}</div>` : ''}
        ${state.error ? `<div class="error-message">${state.error}</div>` : ''}
        <div class="products-table-container">
            <table class="products-table">
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Name</th>
                        <th>Brand</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.products.map(p => `
                        <tr>
                            <td>${p.sku}</td>
                            <td>${p.name}</td>
                            <td>${p.brand}</td>
                            <td>${formatPrice(p.price)}</td>
                            <td>${p.stock}</td>
                            <td><span class="status-badge" data-status="${p.status}">${p.status}</span></td>
                            <td>
                                <button class="edit-btn" data-product-id="${p._id}">Edit</button>
                                <button class="delete-btn" data-product-id="${p._id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        ${state.editingProduct !== undefined ? renderProductFormModal() : ''}
    </div>
    `;
}

function renderReviewForm(productId, review = null) {
    const isEdit = !!review;
    const currentRating = review?.rating || '';

    return `
    <div class="review-form-container">
      <h3>${isEdit ? 'Edit Your Review' : 'Write a Review'}</h3>
      <form id="review-form" class="review-form">
        <div class="form-group">
          <label for="review-rating">Rating *</label>
          <select id="review-rating" name="rating" required>
            <option value="">Select Rating</option>
            <option value="1" ${currentRating === 1 ? 'selected' : ''}>⭐ Poor (1)</option>
            <option value="2" ${currentRating === 2 ? 'selected' : ''}>⭐⭐ Fair (2)</option>
            <option value="3" ${currentRating === 3 ? 'selected' : ''}>⭐⭐⭐ Good (3)</option>
            <option value="4" ${currentRating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ Very Good (4)</option>
            <option value="5" ${currentRating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ Excellent (5)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="review-comment">Review *</label>
          <textarea 
            id="review-comment" 
            name="review" 
            required 
            rows="4"
            placeholder="Share your experience with this product...">${review?.review || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" id="cancel-review-btn" class="cancel-btn">Cancel</button>
          <button type="submit" class="submit-btn">
            ${isEdit ? 'Update Review' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  `;
}

function reviewsFormModal() {
    const r = state.editingReview;
    return `
    <div class="modal-overlay" id="review-modal-overlay">
        <div class="modal-content review-form-modal">
            <div class="modal-header">
                <h2>${r ? 'Edit Your Review' : 'Write a Review'}</h2>
                <button type="button" class="modal-close" id="close-review-modal" aria-label="Close">&times;</button>
            </div>
            <form id="review-form" class="review-form">
                <div class="form-group">
                    <label>Rating</label>
                    <select name="rating" required>
                        <option value="">Select Rating</option>
                        <option value="1">1 Star</option>
                        <option value="2">2 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="5">5 Stars</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Comment</label>
                    <textarea name="comment" required></textarea>
                </div>
                <button type="submit">Submit Review</button>
            </form>
        </div>
    </div>
    `;
}

function render() {
    let content = '';

    if (!state.user || state.view === 'login') {
        content = renderLoginView();
    } else {
        switch (state.view) {
            case 'home':
                content = renderHomeView();
                break;
            case 'products':
                content = renderProductsView();
                break;
            case 'productDetail':
                content = renderProductDetailView(
                    state.products.find((p) => p._id === state.selectedProductId)
                );
                break;
            case 'cart':
                content = renderCartView();
                break;
            case 'checkout':
                content = renderCheckoutView();
                break;
            case 'orders':
                content = renderOrdersView();
                break;
            case 'dashboard':
                content = renderDashboardView();
                break;
            case 'manageProducts':
                content = renderManageProductsView();
                break;
            case 'reviews':
                content = renderReviewsView();
                break;
            default:
                content = renderHomeView();
        }
    }

    appEl.innerHTML = `
        <div class="App">
            ${renderNav()}
            ${content}
        </div>
    `;

    attachEventHandlers();
}

async function createProduct(productData) {
    try {
        const res = await productsAPI.create(productData);
        state.message = 'Product created successfully!';
        state.editingProduct = undefined;
        await loadProducts();
    } catch (err) {
        state.error = err.data?.message || err.message || 'Failed to create product';
        render();
    }
}

async function updateProduct(productId, productData) {
    try {
        const res = await productsAPI.update(productId, productData);
        state.message = 'Product updated successfully!';
        state.editingProduct = undefined;
        await loadProducts();
    } catch (err) {
        state.error = err.data?.message || err.message || 'Failed to update product';
        render();
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    try {
        await productsAPI.delete(productId);
        state.message = 'Product deleted successfully!';
        await loadProducts();
    } catch (err) {
        state.error = err.data?.message || err.message || 'Failed to delete product';
        render();
    }
}

function attachEventHandlers() {
    // Navigation
    appEl.querySelectorAll('[data-view]').forEach((el) => {
        el.addEventListener('click', () => {
            const view = el.getAttribute('data-view');
            if (view && state.user) {
                setView(view);
                if (view === 'products') loadProducts();
                else if (view === 'orders') loadOrders();
                else if (view === 'cart') loadCart();
                else if (view === 'dashboard') loadDashboard();
                else if (view === 'manageProducts') {
                    loadProducts();
                    loadCategories();
                }
            }
        });
    });

    // Logout
    const logoutBtn = appEl.querySelector('#logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearUser();
            setView('login');
        });
    }

    // Auth toggle
    const toggleAuth = appEl.querySelector('#toggle-auth-mode');
    if (toggleAuth) {
        toggleAuth.addEventListener('click', () => {
            state.isRegister = !state.isRegister;
            setView('login');
        });
    }

    // Auth form
    const authForm = appEl.querySelector('#auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(authForm);
            const payload = {
                email: formData.get('email'),
                password: formData.get('password'),
            };

            if (state.isRegister) {
                payload.username = formData.get('username');
                payload.profile = {
                    firstName: formData.get('firstName') || undefined,
                    lastName: formData.get('lastName') || undefined,
                };
            }

            state.error = '';
            state.message = '';
            render();

            try {
                const res = state.isRegister
                    ? await authAPI.register(payload)
                    : await authAPI.login(payload);

                const data = res.data || res;
                const userData = data.user || {
                    id: data.id,
                    username: data.username,
                    email: data.email,
                    role: data.role,
                };
                const token = data.token || res.token;

                saveUser(userData, token);
                state.isRegister = false;
                state.message = 'Welcome to FurnitureHub!';
                setView('home');
                loadInitialData();
            } catch (err) {
                state.error = err.data?.message || err.message || 'Authentication failed';
                render();
            }
        });
    }

    // Category cards
    appEl.querySelectorAll('.category-card').forEach((card) => {
        card.addEventListener('click', () => {
            const categoryId = card.getAttribute('data-category-id');
            setView('products');
            loadProducts({ category: categoryId });
        });
    });

    // Product cards
    appEl.querySelectorAll('.product-card').forEach((card) => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) return;
            const productId = card.getAttribute('data-product-id');
            state.selectedProductId = productId;
            setView('productDetail', { selectedProductId: productId });
            loadProductDetail(productId);
        });
    });

    // Add to cart buttons
    appEl.querySelectorAll('.add-to-cart-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const productId = btn.getAttribute('data-product-id');
            await addToCart(productId);
        });
    });

    // Add to cart detail
    const addToCartDetail = appEl.querySelector('#add-to-cart-detail');
    if (addToCartDetail) {
        addToCartDetail.addEventListener('click', async () => {
            await addToCart(state.selectedProductId);
        });
    }

    // Back buttons
    const backToProducts = appEl.querySelector('#back-to-products');
    if (backToProducts) {
        backToProducts.addEventListener('click', () => setView('products'));
    }

    // Product search
    const searchForm = appEl.querySelector('#products-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(searchForm);
            loadProducts({ search: formData.get('search') });
        });
    }

    // Product filters
    const filterForm = appEl.querySelector('#products-filter-form');
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(filterForm);
            const filters = {};
            if (formData.get('category')) filters.category = formData.get('category');
            if (formData.get('minPrice')) filters.minPrice = formData.get('minPrice');
            if (formData.get('maxPrice')) filters.maxPrice = formData.get('maxPrice');
            if (formData.get('status')) filters.status = formData.get('status');
            loadProducts(filters);
        });
    }

    // Cart quantity buttons
    appEl.querySelectorAll('.qty-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();           // Prevents default button behavior
            e.stopPropagation();          // Stops event bubbling

            const itemId = btn.getAttribute('data-item-id');
            const action = btn.getAttribute('data-action');
            const item = state.cart.items.find(i => i._id === itemId);

            if (item) {
                const newQty = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
                if (item.quantity === item.product.stock && action === 'increase') {
                    state.error = 'Cannot add more than available stock';
                    render();
                    return;
                }

                btn.disabled = true;       // Prevent double-clicks

                try {
                    await updateCartItem(itemId, newQty);
                } finally {
                    // Re-enable button after operation
                    setTimeout(() => {
                        const newBtn = document.querySelector(`[data-item-id="${itemId}"][data-action="${action}"]`);
                        if (newBtn) newBtn.disabled = false;
                    }, 100);
                }
            }
        });
    });

    // Remove cart item
    appEl.querySelectorAll('.remove-item-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();           // Prevents default
            e.stopPropagation();          // Stops bubbling

            const itemId = btn.getAttribute('data-item-id');

            btn.disabled = true;           // Prevent double-clicks

            try {
                await removeFromCart(itemId);
            } catch (err) {
                console.error('Error removing from cart:', err);
                state.error = err.message || 'Failed to remove item';
                render();
            }
        });
    });

    // Checkout button
    const checkoutBtn = appEl.querySelector('#checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => setView('checkout'));
    }

    // Clear cart
    const clearCartBtn = appEl.querySelector('#clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async () => {
            try {
                await cartAPI.clear();
                state.cart = { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 };
                state.message = 'Cart cleared';
                render();
            } catch (err) {
                state.error = err.message;
                render();
            }
        });
    }

    // Checkout form
    const checkoutForm = appEl.querySelector('#checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(checkoutForm);
            try {
                await ordersAPI.create({
                    shippingAddress: {
                        street: formData.get('street'),
                        city: formData.get('city'),
                        state: formData.get('state'),
                        zip: formData.get('zip'),
                        country: formData.get('country') || 'USA'
                    },
                    paymentMethod: formData.get('paymentMethod'),
                    notes: formData.get('notes')
                });
                state.cart = { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 };
                state.message = 'Order placed successfully!';
                setView('orders');
                loadOrders();
            } catch (err) {
                state.error = err.data?.message || err.message;
                render();
            }
        });
    }

    // Cancel order
    appEl.querySelectorAll('.cancel-order-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const orderId = btn.getAttribute('data-order-id');
            try {
                await ordersAPI.cancel(orderId);
                state.message = 'Order cancelled';
                await loadOrders();
            } catch (err) {
                state.error = err.message;
                render();
            }
        });
    });

    // Add Product Button
    const addProductBtn = appEl.querySelector('#add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            state.editingProduct = {};
            state.error = '';
            state.message = '';
            render();
        });
    }

    // Edit Product Buttons
    appEl.querySelectorAll('.edit-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const productId = btn.getAttribute('data-product-id');
            const product = state.products.find(p => p._id === productId);
            if (product) {
                state.editingProduct = { ...product }; // Clone product for editing
                state.error = '';
                state.message = '';
                render();
            }
        });
    });

    // Delete Product Buttons
    appEl.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const productId = btn.getAttribute('data-product-id');
            await deleteProduct(productId);
        });
    });

    // Close Product Modal
    const closeModalBtn = appEl.querySelector('#close-product-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            state.editingProduct = undefined;
            state.error = '';
            render();
        });
    }

    // Cancel Product Form
    const cancelFormBtn = appEl.querySelector('#cancel-product-form');
    if (cancelFormBtn) {
        cancelFormBtn.addEventListener('click', () => {
            state.editingProduct = undefined;
            state.error = '';
            render();
        });
    }

    // Product Form Submit
    const productForm = appEl.querySelector('#product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(productForm);

            const productData = {
                sku: formData.get('sku'),
                name: formData.get('name'),
                brand: formData.get('brand'),
                description: formData.get('description') || undefined,
                category: formData.get('category'),
                price: parseFloat(formData.get('price')),
                stock: parseInt(formData.get('stock'), 10) || 0,
                status: formData.get('status') || 'in_stock',
                isFeatured: formData.get('isFeatured') === 'on',
            };

            const discountPrice = formData.get('discountPrice');
            if (discountPrice && parseFloat(discountPrice) > 0) {
                productData.discountPrice = parseFloat(discountPrice);
            }
            const weight = formData.get('weight');
            if (weight && parseFloat(weight) > 0) {
                productData.dimensions = { weight: parseFloat(weight) };
            }
            const imagesStr = formData.get('images');
            if (imagesStr) {
                productData.images = imagesStr
                    .split(',')
                    .map(url => url.trim())
                    .filter(url => url.length > 0);
            }
            const material = formData.get('material');
            if (material) productData.material = material;
            const color = formData.get('color');
            if (color) productData.color = color;

            if (state.editingProduct && state.editingProduct._id) {
                await updateProduct(state.editingProduct._id, productData);
            } else {
                await createProduct(productData);
            }
        });
    }

    // Click outside modal to close
    const modalOverlay = appEl.querySelector('.modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                state.editingProduct = undefined;
                state.error = '';
                render();
            }
        });
    }

    const writeReviewBtn = appEl.querySelector('#write-review-btn');
    if (writeReviewBtn) {
        writeReviewBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent bubbling to product card
            if (!state.user) {
                state.error = 'Please log in to write a review.';
                render();
                return;
            }
            state.showReviewForm = true;
            state.editingReview = undefined;
            state.error = '';
            state.message = '';
            render();
        });
    }

    // Cancel review form
    const cancelReviewBtn = appEl.querySelector('#cancel-review-btn');
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.showReviewForm = false;
            state.editingReview = undefined;
            state.error = '';
            state.message = '';
            render();
        });
    }

    // Submit review form
    const reviewFormEl = appEl.querySelector('#review-form');
    if (reviewFormEl) {
        reviewFormEl.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const formData = new FormData(reviewFormEl);
            const rating = parseInt(formData.get('rating'), 10);
            const reviewText = formData.get('review').trim();
            const productId = state.selectedProductId;

            // Validation
            if (!rating || rating < 1 || rating > 5) {
                state.error = 'Please select a valid rating (1-5 stars).';
                render();
                return;
            }
            if (!reviewText || reviewText.length < 10) {
                state.error = 'Review must be at least 10 characters long.';
                render();
                return;
            }

            state.error = '';
            state.message = 'Submitting review...';
            render();

            try {
                await reviewsAPI.create({
                    productId,
                    rating,
                    review: reviewText
                });

                state.message = 'Review submitted successfully! 🌟';
                state.showReviewForm = false;
                state.editingReview = undefined;

                // Refresh to show new review
                await loadProductDetail(productId);

                // Auto-clear success message
                setTimeout(() => {
                    state.message = '';
                    render();
                }, 3000);
            } catch (err) {
                console.error('Review submit error:', err); // Critical for debugging
                if (err.data?.status === 403 || err.status === 403) { // Adjusted error checking for apiRequest
                    state.error = err.data?.message || err.message || 'You can only review products you have purchased.';
                } else if (err.data?.status === 400 || err.status === 400) {
                    state.error = err.data?.message || err.message || 'Invalid rating. Must be between 1-5.';
                } else {
                    state.error = `Submission failed: ${err.message || 'Unknown error'}`;
                }
                render();
            }
        });
    }
}



async function addReview(productId, rating, reviewText) {
    await reviewsAPI.create({
        productId,
        rating,
        review: reviewText
    });
}

// API Functions
async function addToCart(productId) {
    try {
        await cartAPI.add(productId, 1);
        await loadCart();
        state.message = 'Added to cart!';
        render();
    } catch (err) {
        state.error = err.data?.message || err.message;
        render();
    }
}

async function updateCartItem(itemId, quantity) {
    try {
        if (quantity <= 0) {
            await cartAPI.remove(itemId);
        } else {
            await cartAPI.update(itemId, quantity);
        }
        await loadCart();
        state.error = '';             // Clear previous errors
        render();
    } catch (err) {
        state.error = err.data?.message || err.message || 'Failed to update cart';  // Better error messages
        render();
        throw err;                     // Re-throw for event handler
    }
}

async function removeFromCart(itemId) {
    try {
        await cartAPI.remove(itemId);
        await loadCart();
        state.message = 'Item removed from cart';  // Success message
        state.error = '';                          // Clear errors
        render();
    } catch (err) {
        state.error = err.data?.message || err.message || 'Failed to remove item';
        render();
        throw err;
    }
}

async function loadProducts(filters = {}) {
    try {
        const res = await productsAPI.getAll({ limit: 50, ...filters });
        state.products = res.data || [];
        render();
    } catch (err) {
        state.error = err.message;
        render();
    }
}

async function loadCategories() {
    try {
        const res = await categoriesAPI.getAll();
        state.categories = res.data || [];
        render();
    } catch {
        // silent
    }
}

async function loadProductDetail(id) {
    try {
        const res = await productsAPI.getById(id);
        const product = res.data;
        const idx = state.products.findIndex((p) => p._id === product._id);
        if (idx >= 0) {
            state.products[idx] = product;
        } else {
            state.products.push(product);
        }
        render();
    } catch (err) {
        state.error = err.message;
        render();
    }
}

async function loadCart() {
    try {
        const res = await cartAPI.get();
        state.cart = res.data || { items: [], subtotal: 0, tax: 0, shipping: 0, total: 0, itemCount: 0 };
        updateCartBadge();
    } catch {
        // silent
    }
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.textContent = state.cart.itemCount || 0;
    }
}

async function loadOrders() {
    try {
        const res = await ordersAPI.getMy();
        state.orders = res.data || [];
        render();
    } catch (err) {
        state.error = err.message;
        render();
    }
}



async function loadDashboard() {
    try {
        const [dashboardRes, popularRes] = await Promise.all([
            analyticsAPI.getDashboard(),
            analyticsAPI.getPopularProducts(),
        ]);
        const dashboard = dashboardRes.data || {};
        const popular = popularRes.data || [];

        const statsEl = document.getElementById('dashboard-stats');
        if (!statsEl) return;

        const overview = dashboard.overview || {};

        statsEl.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">📦</div>
                    <div class="stat-value">${overview.totalProducts || 0}</div>
                    <div class="stat-label">Total Products</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">${overview.totalUsers || 0}</div>
                    <div class="stat-label">Customers</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🛒</div>
                    <div class="stat-value">${overview.totalOrders || 0}</div>
                    <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-value">${formatPrice(overview.totalRevenue || 0)}</div>
                    <div class="stat-label">Revenue</div>
                </div>
            </div>
            <div class="dashboard-sections">
                <div class="dashboard-section">
                    <h3>Popular Products</h3>
                    <div class="popular-list">
                        ${popular.slice(0, 5).map(p => `
                            <div class="popular-item">
                                <span>${p.name}</span>
                                <span>${p.totalQuantitySold} sold</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="dashboard-section">
                    <h3>Pending Orders</h3>
                    <div class="pending-count">${overview.pendingOrders || 0}</div>
                </div>
            </div>
        `;
    } catch (err) {
        const statsEl = document.getElementById('dashboard-stats');
        if (statsEl) {
            statsEl.innerHTML = `<div class="error">Failed to load dashboard: ${err.message}</div>`;
        }
    }
}

async function loadInitialData() {
    await Promise.all([
        loadProducts(),
        loadCategories(),
        loadCart()
    ]);
    render();
}

// Initialize app
loadUserFromStorage();
if (state.user) {
    loadInitialData();
}
render();