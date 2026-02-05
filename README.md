# Endterm Project Report  
**Course:** Advanced Databases (NoSQL)  
**Project Title:** FurnitureHub – NoSQL-Based Web Application  
**Database:** MongoDB  
**Project Type:** Web Application (Backend + Frontend)  

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

### 5.1 Authentication Endpoints
| Method | Endpoint             | Description           |
| ------ | -------------------- | --------------------- |
| POST   | `/api/auth/register` | Register new user     |
| POST   | `/api/auth/login`    | Login and receive JWT |

### 5.2 User Endpoints
| Method | Endpoint             | Description      |
| ------ | -------------------- | ---------------- |
| GET    | `/api/users/profile` | Get user profile |
| PUT    | `/api/users/profile` | Update profile   |
| DELETE | `/api/users/:id`     | Delete user      |

### 5.3 Product Endpoints
| Method | Endpoint            | Description       |
| ------ | ------------------- | ----------------- |
| GET    | `/api/products`     | Get all products  |
| GET    | `/api/products/:id` | Get product by ID |
| POST   | `/api/products`     | Create product    |
| PUT    | `/api/products/:id` | Update product    |
| DELETE | `/api/products/:id` | Delete product    |

### 5.4 Aggregation Endpoint
| Method | Endpoint              | Description                   |
| ------ | --------------------- | ----------------------------- |
| GET    | `/api/products/stats` | Aggregated product statistics |

---

## 6. Security Implementation
- JWT-based authentication
- Password hashing using bcrypt
- Protected API routes
- Authorization middleware

---

## 7. Conclusion


The FurnitureHub project successfully demonstrates advanced usage of MongoDB and NoSQL concepts within a real-world web application. The system includes CRUD operations, aggregation pipelines, authentication, REST API design, and documentation.
