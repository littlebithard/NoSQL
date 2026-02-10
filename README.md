# Endterm Project Report  
**Course:** Advanced Databases (NoSQL)  
**Project Title:** FurnitureHub – NoSQL-Based Web Application  
**Database:** MongoDB  
**Project Type:** Web Application (Backend + Frontend)  
**Team Size:** 1 Student  

---

## 1. Project Overview

The **FurnitureHub** project is a web-based furniture e-commerce application developed as part of the *Advanced Databases (NoSQL)* course. The main goal of the project is to demonstrate practical knowledge of **NoSQL database design**, **MongoDB querying**, **aggregation pipelines**, and **RESTful backend development**, combined with a functional frontend.

The system allows users to register, authenticate, and interact with furniture products through a web interface. The backend exposes RESTful APIs that handle CRUD operations, business logic, authentication, and data aggregation using MongoDB.

---

## 2. System Architecture

The application follows a **client–server architecture** with three main layers:

### 2.1 Architecture Components

**Frontend**
- Provides user interaction via web pages  
- Sends HTTP requests to the backend API  
- Allows users to create, view, update, and delete data  

**Backend**
- Built using Node.js and Express.js  
- Implements RESTful API endpoints  
- Contains business logic and validation  
- Handles authentication and authorization  

**Database**
- MongoDB (NoSQL document database)  
- Stores users, products, and categories  
- Uses both embedded and referenced data models  

### 2.2 Data Flow

1. User interacts with frontend UI  
2. Frontend sends HTTP request to backend API  
3. Backend processes request and executes MongoDB operations  
4. MongoDB returns results to backend  
5. Backend sends JSON response to frontend  

---

## 3. Database Design and Schema Description

### 3.1 Collections Overview

The database consists of multiple collections:
- `users`
- `products`
- `categories`

### 3.2 User Collection

```js
User {
  _id: ObjectId,
  name: String,
  email: String,
  password: String,
  role: String,
  createdAt: Date
}
```
- Passwords are stored in hashed form using bcrypt
- JWT is used for authentication
- Role-based authorization is supported

### 3.3 Product Collection

```js
Product {
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: ObjectId,
  stock: Number,
  createdAt: Date
}
```
- Uses referenced data model for categories
- Supports advanced update operations

### 3.4 Category Collection

```js
Category {
  _id: ObjectId,
  name: String,
  description: String
}
```
- Referenced by products
- Enables aggregation-based analytics

---

## 4. MongoDB Operations and Queries 

### 4.1 CRUD Operations

- All collections support full CRUD functionality:
    1. Create: Insert users, products, categories
    2. Read: Fetch single or multiple documents
    3. Update: Modify fields using advanced operators
    4. Delete: Remove documents with conditions

### 4.2 Advanced Update & Delete Operators

- The project uses multiple MongoDB operators:
    - $set – update specific fields
    - $inc – increment product stock
    - $push – add embedded data
    - $pull – remove embedded data
    - Positional operators for array updates

### 4.3 Aggregation Framework

Multi-stage aggregation pipelines are implemented to provide business insights.

- Example use cases:
    - Count products per category
    - Calculate average price per category
    - List categories with total product stock

---

## 5. REST API Documentation

## Routes

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| **Auth** | | | | |
| POST | /api/auth/register | No | - | Register user |
| POST | /api/auth/login | No | - | Login user |
| GET | /api/auth/me | Yes | - | Get current user |
| **Products** | | | | |
| GET | /api/products | No | - | Get all products (with filters) |
| GET | /api/products/featured | No | - | Get featured products |
| GET | /api/products/low-stock | Yes | admin/staff | Get low stock products |
| GET | /api/products/recent | No | - | Get recent products |
| GET | /api/products/:id | No | - | Get single product |
| POST | /api/products | Yes | admin/staff | Create product |
| PUT | /api/products/:id | Yes | admin/staff | Update product |
| DELETE | /api/products/:id | Yes | admin | Delete product |
| PATCH | /api/products/:id/stock | Yes | admin/staff | Update stock |
| POST | /api/products/:id/rating | Yes | - | Add rating |
| **Categories** | | | | |
| GET | /api/categories | No | - | Get all categories |
| POST | /api/categories | Yes | admin/staff | Create category |
| PUT | /api/categories/:id | Yes | admin/staff | Update category |
| DELETE | /api/categories/:id | Yes | admin | Delete category |
| **Cart** | | | | |
| GET | /api/cart | Yes | - | Get cart |
| POST | /api/cart | Yes | - | Add to cart |
| PUT | /api/cart/:itemId | Yes | - | Update cart item |
| DELETE | /api/cart/:itemId | Yes | - | Remove cart item |
| DELETE | /api/cart | Yes | - | Clear cart |
| **Orders** | | | | |
| POST | /api/orders | Yes | - | Create order |
| GET | /api/orders/my | Yes | - | Get my orders |
| GET | /api/orders/pending | Yes | admin/staff | Get pending orders |
| GET | /api/orders | Yes | admin/staff | Get all orders |
| GET | /api/orders/:id | Yes | - | Get single order |
| PUT | /api/orders/:id/status | Yes | admin/staff | Update order status |
| PUT | /api/orders/:id/cancel | Yes | - | Cancel order |
| **Wishlist** | | | | |
| GET | /api/wishlist | Yes | - | Get user wishlist |
| POST | /api/wishlist | Yes | - | Add product to wishlist |
| DELETE | /api/wishlist/:itemId | Yes | - | Remove item from wishlist |
| DELETE | /api/wishlist | Yes | - | Clear wishlist |
| POST | /api/wishlist/:itemId/move-to-cart | Yes | - | Move item to cart |
| GET | /api/wishlist/check/:productId | Yes | - | Check if product in wishlist |
| **Reviews** | | | | |
| GET | /api/reviews/product/:productId | No | - | Get product reviews |
| POST | /api/reviews/product/:productId | Yes | - | Add/Update review |
| PUT | /api/reviews/:reviewId | Yes | - | Update review |
| DELETE | /api/reviews/:reviewId | Yes | - | Delete review |
| GET | /api/reviews/user/my-reviews | Yes | - | Get user's reviews |
| GET | /api/reviews/pending | Yes | - | Get pending reviews |
| GET | /api/reviews/stats | Yes | admin/staff | Get review statistics |
| **Notifications** | | | | |
| GET | /api/notifications | Yes | - | Get notifications |
| GET | /api/notifications/unread-count | Yes | - | Get unread count |
| PUT | /api/notifications/:id/read | Yes | - | Mark as read |
| PUT | /api/notifications/read-all | Yes | - | Mark all as read |
| DELETE | /api/notifications/:id | Yes | - | Delete notification |
| DELETE | /api/notifications | Yes | - | Delete read notifications |
| POST | /api/notifications/send | Yes | admin | Send notification |
| POST | /api/notifications/broadcast | Yes | admin | Broadcast notification |
| GET | /api/notifications/stats | Yes | admin/staff | Get notification stats |
| **Search** | | | | |
| GET | /api/search | No | - | Advanced search products |
| GET | /api/search/suggestions | No | - | Get search suggestions |
| GET | /api/search/filters | No | - | Get available filters |
| POST | /api/search/recent | No | - | Save search history |
| GET | /api/search/trending | No | - | Get trending searches |
| **Uploads** | | | | |
| POST | /api/upload/image | Yes | admin/staff | Upload single image |
| POST | /api/upload/images | Yes | admin/staff | Upload multiple images |
| POST | /api/upload/product-images/:productId | Yes | admin/staff | Upload product images |
| DELETE | /api/upload/image/:filename | Yes | admin/staff | Delete image |
| POST | /api/upload/avatar | Yes | - | Upload user avatar |
| **Analytics** | | | | |
| GET | /api/analytics/dashboard | Yes | admin/staff | Dashboard data |
| GET | /api/analytics/popular-products | Yes | admin/staff | Popular products |
| GET | /api/analytics/top-categories | Yes | admin/staff | Top categories |
| GET | /api/analytics/monthly-revenue | Yes | admin/staff | Monthly revenue |
| GET | /api/analytics/sales-report | Yes | admin/staff | Sales report |
| GET | /api/analytics/customer-activity | Yes | admin/staff | Customer activity |
| **Users** | | | | |
| GET | /api/users | Yes | admin | Get all users |
| GET | /api/users/:id | Yes | - | Get user by ID |
| PUT | /api/users/:id | Yes | - | Update user |
| DELETE | /api/users/:id | Yes | admin | Delete user |

---

## 6. Security Implementation
- JWT-based authentication
- Password hashing using bcrypt
- Protected API routes
- Authorization middleware

---

## 7. Conclusion

The FurnitureHub project successfully demonstrates advanced usage of MongoDB and NoSQL concepts within a real-world web application. The system includes CRUD operations, aggregation pipelines, authentication, REST API design, and documentation.

