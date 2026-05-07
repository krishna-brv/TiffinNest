# TiffinNest Project Documentation

## Overview

TiffinNest is a full-stack web application for connecting customers with local home kitchens. Customers can browse providers, order meal plans, create recurring routines through the current month, view scheduled deliveries, calculate delivered-order bills, rate delivered meal items, and manage their account. Providers can manage kitchen profiles, create meal plans, and process incoming orders.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Zustand, Axios, Lucide icons
- Backend: Node.js, Express, MongoDB, Mongoose, JWT authentication, Socket.IO
- Authentication: JWT stored in browser local storage through the frontend auth store

## Folder Structure

```text
Community Dabba/
  backend/
    config/              MongoDB connection
    controllers/         Route handlers and business logic
    middleware/          Auth and role middleware
    models/              Mongoose schemas
    routes/              Express API routes
    utils/               Token helpers
    server.js            Express and Socket.IO server entry
  frontend/
    public/              Static assets
    src/
      pages/             React route pages
      services/          Axios API client
      store/             Zustand auth store
      App.jsx            Frontend route configuration
      index.css          Tailwind and shared UI utilities
```

## Environment Variables

Create a `.env` file inside `backend/`.

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5001
```

The frontend API client currently points to:

```text
http://localhost:5001/api
```

If the backend runs on a different port, update `frontend/src/services/api.js`.

## Installation

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

## Running The Project

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Main User Roles

### Customer

Customers can:

- Register and log in
- Browse providers
- View provider meal plans
- Place one-time orders
- Create daily, weekly, or monthly routines
- Edit an existing routine instead of creating a duplicate order
- View active and past orders
- View scheduled routine dates on the dashboard calendar
- Calculate monthly bill based only on delivered items
- Rate delivered meal items
- Edit account name and change password

### Provider

Providers can:

- Register and log in
- Create or update kitchen profile
- Add, update, and delete meal plans
- View incoming orders
- Update order status
- See kitchen rating through provider listing after customer item reviews

## Key Features

### Routine Orders

When a customer creates a routine order, the backend generates scheduled delivery dates through the end of the current month.

Supported routine types:

- `one-time`
- `daily`
- `weekly`
- `monthly`

If a customer tries to order the same meal again while it is already scheduled in their routine, the app allows editing the existing routine instead of creating a duplicate order.

### Calendar Dots

The customer dashboard calendar shows a small dot under dates that have scheduled routine deliveries.

### Monthly Bill Calculation

Monthly billing is calculated from delivered schedule entries only. Future scheduled items are not billed.

### Item Ratings And Kitchen Rating

Customers can rate a meal item after it has been delivered. The meal item stores its own average rating and review count. The provider kitchen rating is recalculated from all meal item ratings using review counts as weights.

### Account Dashboard

The `/account` page asks the user what they want to update:

- Edit Profile: allows changing name only; email is locked
- Change Password: requires current password, new password, and confirmation

## API Summary

### Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
PUT  /api/auth/profile
PUT  /api/auth/password
```

### Providers

```text
GET  /api/providers
POST /api/providers/profile
GET  /api/providers/:id
```

### Meal Plans

```text
POST   /api/meals
GET    /api/meals/provider/:providerId
POST   /api/meals/:id/reviews
PUT    /api/meals/:id
DELETE /api/meals/:id
```

### Orders

```text
POST /api/orders
GET  /api/orders/myorders
GET  /api/orders/monthly-bill
GET  /api/orders/provider
PUT  /api/orders/:id/routine
GET  /api/orders/:id
PUT  /api/orders/:id/status
```

### Reviews

```text
POST /api/reviews
GET  /api/reviews/provider/:providerId
```

Note: The current item-rating flow uses `POST /api/meals/:id/reviews`. The provider review routes still exist separately.

## Important Frontend Routes

```text
/                         Landing page
/login                    Login
/register                 Register
/account                  User dashboard
/customer/dashboard       Customer dashboard
/customer/providers       Provider listing
/customer/provider/:id    Provider menu
/customer/orders          Customer orders and billing
/provider/dashboard       Provider dashboard
/provider/plans           Provider profile and meal plans
/provider/orders          Provider incoming orders
```

## Verification Commands

Backend syntax checks:

```bash
node --check backend/controllers/authController.js
node --check backend/controllers/orderController.js
node --check backend/controllers/mealController.js
```

Frontend build:

```bash
cd frontend
npm run build
```

## Notes For Future Improvements

- Add automated backend tests for routine scheduling and billing.
- Add frontend form validation messages instead of alert dialogs in a few places.
- Add pagination or filters for provider and order lists.
- Add provider-side rating analytics.
- Restrict Socket.IO CORS origin in production.
