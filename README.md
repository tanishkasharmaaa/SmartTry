# 🛍️ SM△RTTRY

SmartTry is an **AI-powered e-commerce shopping assistant** that helps users discover products, track orders, and get personalized recommendations through a smart chat interface.

It combines **rule-based logic** with **Gemini AI** to deliver fast, accurate, and grounded product suggestions using real products from the database.

---

## 🚀 Features

### 🤖 AI Chat Assistant

- Natural language product search
- Semantic recommendations ("trending outfits", "best outfits for men")
- Hybrid AI: **Manual Logic + Gemini Flash AI**
- Grounded recommendations based on real database products

### 🔐 Login Required

- SmartTry AI is available only to authenticated users.
- Enables personalization, secure order access, and controlled AI usage.

### 🛒 Product Discovery

- Browse by category, gender, and price
- Trending and popular products
- Style-based filtering (streetwear, casual, modern)

### 📦 Order Tracking

- Track orders using Order ID
- View order status and items inside chat

### 🔐 Authentication-Aware Personalization

- Personalized recommendations for logged-in users
- Uses user interests and cart history

### 💳 Secure Online Payments

- Integrated **Razorpay** for online payment processing
- Backend payment order creation and payment verification
- Payment status handling for e-commerce orders

### ⚡ Real-Time Experience

- WebSocket-powered chat
- Real-time AI responses
- Interactive product carousels and cards

---

## 🧠 How SmartTry AI Works

### 1. Manual Intelligence — Fast & Deterministic

Handles predictable requests without unnecessary AI calls:

- Greetings
- Order tracking
- Category, price, and gender filters

### 2. Gemini Flash AI — Semantic Intelligence

- Understands product intent and style preferences
- Helps interpret natural-language searches
- Recommendations are grounded in real product data

### 3. Safe Fallbacks

- Provides helpful suggestions when no matching products are found
- Uses database-backed product results rather than inventing products

---

## 🏗️ System Design & Implementation

Explore the architecture, request flow, and implementation details of SmartTry AI:

- **System Design:** [[Explore Smarttry SDD]](https://docs.google.com/document/d/1AgxbHk5If4oOTiCEpYpi0cnpV86YpBH7bP2C_6FBYTU/edit?usp=sharing)

These documents can cover the application architecture, AI-powered search flow, WebSocket communication, caching strategy, payment workflow, and database integration.

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Chakra UI
- WebSockets
- Vite

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Gemini 2.5 Flash API
- Razorpay Payment Gateway

### Infrastructure & Performance

- Redis caching
- Docker
- REST APIs and WebSockets

---

## 📂 Project Structure

```
smarttry/
├── frontend/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── backend/
│   ├── controllers/
│   │   ├── askAI.js
│   │   ├── manualHandlers.js
│   │   └── askGeminiFlash.js
│   ├── models/
│   └── routes/
│
└── README.md
```

---

## 🔑 Environment Variables

Create a `.env` file in backend:

```
# ===============================
# Server Configuration
# ===============================
PORT=3000
CLIENT_URL=http://localhost:3000

# ===============================
# Database
# ===============================
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<db_name>

# ===============================
# Authentication & Security
# ===============================
JWT_SECRET_KEY=your_jwt_secret_key
SESSION_SECRET=your_session_secret

# ===============================
# Google OAuth
# ===============================
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# ===============================
# Gemini AI
# ===============================
GEMINI_API_KEY=your_gemini_api_key
PROJECT_NAME=projects/your_project_id
PROJECT_NUMBER=your_project_number

# ===============================
# Email (SMTP / Gmail)
# ===============================
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=your_email@gmail.com

# ===============================
# Redis (Optional)
# ===============================
REDIS_URL=rediss://your_redis_url
UPSTASH_REDIS_REST_URL=https://your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# ===============================
# Tokens (Optional / Advanced)
# ===============================
ACCESS_TOKEN=your_access_token
REFRESH_TOKEN=your_refresh_token

# ===============================
# Gmail API (Optional)
# ===============================
GMAIL_REDIRECT_URI=http://your_redirect_uri
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token

# ===============================
# SendGrid (Optional)
# ===============================
SENDGRID_API_KEY=your_sendgrid_api_key

# ===============================
# Other
# ===============================
SID=your_service_id

# ===============================
# RAZORPAY KEYS
# ===============================

RAZORPAY_KEY_ID=your_rzp_test_Keyid
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## ▶️ Running Locally

### Backend

```
npm install
npm run dev
```

### Frontend

```
npm install
npm run dev
```

---

## 🌐 Deployment Notes

* Uses SPA routing (React Router)
* Requires server-side rewrites (Vercel / Netlify / Express)
* Gemini AI is used only for recommendations — never for orders

---

## 👀 Glimpses of SmartTry

> A quick visual look at how SmartTry feels and functions.

### 🖼️ Product Discovery & AI Chat

### 🤖 SmartTry in Desktop Screen
![Chat](/frontend/public/1.png)
![Products and Filter](/frontend/public/2.png)
![Single Product](/frontend/public/3.png)
![Checkout](/frontend/public/4.png)
![Review and Pay](/frontend/public/5.png)
![Final Payment](/frontend/public/12.png)
![Order History](/frontend/public/7.png)

### 🤖 SmartTry in Mobile Screen
<p align="center">
  <div style="display: flex; gap: 16px; justify-content: center;">
    <img src="/frontend/public/8.png" width="180" alt="Mobile Home" />
    <img src="/frontend/public/9.png" width="180" alt="Mobile Chat" />
    <img src="/frontend/public/10.png" width="180" alt="Mobile Order" />
    <img src="/frontend/public/11.png" width="180" alt="Mobile Order" />
    <img src="/frontend/public/13.png" width="180" height="90%" alt="Mobile Order Payment" />
  </div>
</p>


> 📌 Tip: Add real screenshots to make recruiters instantly engaged.

---

## 🎥 SmartTry Presentation Video

> A short walkthrough explaining the idea, architecture, and features of SmartTry.

🔗 **Watch Demo Video:** [LinkedIn Demo](https://www.linkedin.com/posts/tanishka-304953274_smarttry-aiinecommerce-hybridai-activity-7417095784107577344-of-n?utm_source=share&utm_medium=member_desktop&rcm=ACoAAEMPVvQBpboMeA3e-ruxDSlTaqdlwCHv1TQ)
🌐 **Live Demo:** https://smart-try.vercel.app/  


### What the video covers:

* Problem SmartTry solves
* Live AI chat demo
* Hybrid AI architecture (Manual + Gemini)
* Order tracking flow
* Tech stack overview

> 🎯 Recommended length: **2–4 minutes**

---

## ✨ Why SmartTry?

✔ No fake AI answers
✔ Real-time shopping assistant
✔ Scalable architecture
✔ Production-ready hybrid AI

---

## 👨‍💻 Author

**Tanishka Sharma**
MERN Stack Developer | AI-integrated Web Apps

🔗 Portfolio: [https://tanishka-portfolio-wvi4.vercel.app/](https://tanishka-portfolio-wvi4.vercel.app/)

---

⭐ If you like SmartTry, give it a star on GitHub!
