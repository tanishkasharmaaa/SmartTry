# 🛍️ SM△RTTRY

SmartTry is an **AI-powered ecommerce shopping assistant** that helps users discover products, track orders, and get personalized recommendations through a smart chat interface.

It combines **rule-based logic** with **Gemini AI** to deliver fast, accurate, and hallucination-free product suggestions — all using real products from the database.

---

## 🚀 Features

### 🤖 AI Chat Assistant

* Natural language product search
* Semantic recommendations ("trending outfits", "best shoes for men")
* Hybrid AI: **Manual logic + Gemini Flash AI**
* Zero hallucination (AI only uses DB products)

### 🛒 Product Discovery

* Browse by category, gender, price
* Trending & popular products
* Style-based filtering (streetwear, casual, modern)

### 📦 Order Tracking

* Track orders using Order ID
* View order status and items inside chat

### 🔐 Authentication Aware

* Personalized recommendations for logged-in users
* Uses user interests & cart history

### ⚡ Real-Time Experience

* WebSocket-powered chat
* Smooth UI with carousels & cards

---

## 🧠 How SmartTry AI Works

1. **Manual Intelligence (Fast & Deterministic)**

   * Greetings
   * Order tracking
   * Category, price & gender filters

2. **Gemini Flash AI (Semantic Intelligence)**

   * Understands intent & style
   * Recommends only real products
   * Returns structured product data

3. **Safe Fallbacks**

   * Helpful suggestions if nothing matches

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Chakra UI
* WebSockets
* Vite

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* WebSockets
* Gemini 2.5 Flash API

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

*Add screenshots here*

* AI-powered chat recommendations
* Product carousels inside chat
* Clean, modern UI with Chakra UI

```
/screenshots/chat-home.png
/screenshots/product-recommendation.png
/screenshots/order-tracking.png
```

> 📌 Tip: Add real screenshots to make recruiters instantly engaged.

---

## 🎥 SmartTry Presentation Video

> A short walkthrough explaining the idea, architecture, and features of SmartTry.

🔗 **Watch Demo Video:**
(Add YouTube / Loom / Drive link here)

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
