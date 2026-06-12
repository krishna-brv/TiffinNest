# TiffinNest 🍲

TiffinNest is a full-stack MERN application that connects busy individuals such as students and working professionals with local home chefs and tiffin providers. The platform enables users to discover home-cooked meal services, subscribe to flexible meal plans, and manage their orders efficiently.

---

## 🚀 Features

### 👨‍🍳 For Customers

* Browse local home chefs and tiffin providers.
* View real-time menu updates and meal availability.
* Subscribe to daily, weekly, or monthly meal plans.
* Filter meals based on dietary preferences:

  * Vegetarian
  * Non-Vegetarian
  * Vegan
  * Jain
* Track active orders and delivery status.
* View complete order history.
* Pause or resume meal subscriptions anytime.

### 🏪 For Tiffin Providers

* Manage menus, pricing, and meal availability.
* View daily meal requirements and subscription counts.
* Track customer orders efficiently.
* Access analytics such as:

  * Monthly revenue
  * Active subscribers
  * Customer reviews and ratings

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Redux Toolkit
* Axios

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose ODM

### Authentication & Security

* JSON Web Tokens (JWT)
* bcryptjs Password Hashing

---

## 📁 Project Structure

```text
TiffinNest/
│
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route business logic
│   ├── middleware/      # Authentication & validations
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API endpoints
│   └── server.js        # Backend entry point
│
└── frontend/
    ├── public/
    └── src/
        ├── components/  # Reusable UI components
        ├── pages/       # Application pages
        ├── store/       # Redux store & slices
        └── App.js       # Frontend entry point
```

---

## ⚙️ Installation & Setup

### Prerequisites

Make sure the following are installed:

* Node.js (v16 or above)
* MongoDB Atlas account or local MongoDB instance
* Git

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/krishna-brv/TiffinNest.git
cd TiffinNest
```

---

## 2️⃣ Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:

```bash
npm run dev
```

Backend will run at:

```text
http://localhost:5000
```

---

## 3️⃣ Frontend Setup

Open a new terminal and navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the frontend folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend application:

```bash
npm start
```

Frontend will run at:

```text
http://localhost:3000
```

---

## 🔌 API Endpoints

All APIs include validation and error handling. Protected routes require a valid JWT token.

### 🔑 Authentication Routes

| Method | Endpoint             | Description                | Access    |
| ------ | -------------------- | -------------------------- | --------- |
| POST   | `/api/auth/register` | Register a new user/vendor | Public    |
| POST   | `/api/auth/login`    | Login user and receive JWT | Public    |
| GET    | `/api/auth/profile`  | Get logged-in user details | Protected |

---

### 🍱 Tiffin & Menu Routes

| Method | Endpoint           | Description               | Access |
| ------ | ------------------ | ------------------------- | ------ |
| GET    | `/api/tiffins`     | Get all tiffin vendors    | Public |
| GET    | `/api/tiffins/:id` | Get vendor profile & menu | Public |
| POST   | `/api/tiffins`     | Create new menu listing   | Vendor |
| PUT    | `/api/tiffins/:id` | Update menu details       | Vendor |

---

### 📅 Subscription & Order Routes

| Method | Endpoint                 | Description                    | Access |
| ------ | ------------------------ | ------------------------------ | ------ |
| POST   | `/api/orders/subscribe`  | Subscribe to a meal plan       | User   |
| GET    | `/api/orders/my-orders`  | View user orders/subscriptions | User   |
| PUT    | `/api/orders/:id/status` | Update delivery status         | Vendor |

---

## 🔒 Authentication Flow

1. User registers or logs in.
2. Passwords are securely hashed using bcryptjs.
3. JWT token is generated upon successful login.
4. Protected routes verify the JWT before granting access.

---

## 🌟 Future Enhancements

* Online payment integration (Razorpay/Stripe)
* Real-time order notifications
* Delivery partner management
* Geolocation-based vendor discovery
* Mobile application support
* AI-powered meal recommendations

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new feature branch.

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes.

```bash
git commit -m "Add AmazingFeature"
```

4. Push to GitHub.

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request.

---


## 👨‍💻 Author

**Brahmadevara Roop Venkata Krishna**

Built with the MERN Stack to support local home chefs and provide affordable, healthy meal subscriptions for customers.
