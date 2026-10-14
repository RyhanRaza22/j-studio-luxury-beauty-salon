# ✂️ J Studio Luxury Beauty Salon - Full-Stack Website & Admin Dashboard

A full-stack, responsive website and administrative suite built for **J Studio Luxury Beauty Salon**, located in **MVP Sector 3, MVP Colony, Visakhapatnam (Vizag)**.

---

## 📍 Google Maps Location & Analysis
- **Business Name:** J Studio Luxury Beauty Salon
- **Coordinates:** `17.744141, 83.333954`
- **Location:** MVP Sector 3, Near Mahatma Gandhi Cancer Hospital, MVP Colony, Visakhapatnam, Andhra Pradesh 530017
- **Phone:** `+91 98826 89999` / `+91 891 250 8899`
- **WhatsApp:** `+91 98826 89999`
- **Hours:** Monday – Sunday: 8:00 AM – 9:00 PM (Open 7 Days a Week)
- **Google Rating:** 4.8 / 5.0 (485+ Verified Google Reviews)
- **Key Specialties:** L'Oréal Professionnel Partner Salon, Precision Men's Grooming, Balayage & Hair Botox, HydraFacials, and HD & Airbrush Bridal Studio.

---

## 🚀 Quick Start Guide

### 1. Start the Server
```bash
npm start
```
The server will boot up at:
- **Public Customer Website:** [http://localhost:3000](http://localhost:3000)
- **Admin Management Portal:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)

### 2. Admin Credentials
- **Username:** `admin`
- **Password:** `jstudio@2026`
*(You can update this password anytime directly within the Admin Settings tab!)*

---

## ✨ Features Breakdown

### 🌟 1. Customer-Facing Website (`public/index.html`)
- **Luxury Gold & Slate Design System:** High-end aesthetics tailored for a premium unisex salon with smooth micro-interactions and glassmorphism.
- **5-Step Online Booking Wizard:**
  - **Step 1: Choose Services** (select multiple services with live total duration & price calculation).
  - **Step 2: Choose Stylist** (Option to pick "Any Available Stylist" or select specific Master Stylists).
  - **Step 3: Date & Live Slot Picker** (Checks booked chairs in real-time between 8:00 AM and 8:30 PM).
  - **Step 4: Client Contact Details** (Name, Phone number, Email, special notes).
  - **Step 5: Instant Booking Confirmation** (Generates a unique reference code e.g. `TG-20261012-5114`, printable receipt, and 1-click **WhatsApp Confirmation Share**).
- **Service Menu with Search & Category Filters:**
  - Men's Grooming, Women's Styling, Hair Therapy & Color, Skin & Facials, Bridal & Wedding, Spa & Nails.
- **Booking Tracker:** Allows clients to track their appointment status anytime by entering their Booking ID.
- **Interactive Google Maps Embed:** Centered on MVP Colony coordinates (`17.744141, 83.333954`) with 1-click "Get Directions" link.
- **Verified Google Reviews & Feedback Modal:** Displays authentic reviews and allows visitors to submit new ratings.
- **Floating Action Buttons:** Quick 1-click WhatsApp chat (`https://wa.me/919882689999`) and direct phone call.
- **Mobile Responsive Layout:** Designed for smartphones, tablets, laptops, and ultra-wide desktops.

---

### 🛡️ 2. Admin Management Dashboard (`public/admin.html`)
- **Secure JWT Authentication:** Token-based session protection and secure `bcrypt` password encryption.
- **Dashboard Overview & Analytics:**
  - Real-time KPIs: Estimated Revenue, Total Bookings, Pending Action, Active Services.
  - Recent Bookings quick table with 1-click Confirm/Complete status toggles.
  - Service Popularity rankings.
- **Full Appointment Management:**
  - Filter by status (*Pending, Confirmed, Completed, Cancelled*).
  - Search by client name, reference code, or mobile number.
  - Walk-in / Phone Booking Creator modal for on-the-spot appointments.
  - Direct 1-click WhatsApp customer messaging with prefilled appointment template.
  - Print booking invoice slip.
- **Service Catalog CRUD:**
  - Add, edit, or delete salon services.
  - Set regular price and promotional discount price.
  - Toggle service visibility (Active / Inactive) with 1 click.
- **Stylists & Team Roster CRUD:**
  - Add, edit, or remove master stylists, roles, experience, and photo links.
- **Offers & Promo Codes CRUD:**
  - Create festival discounts, manage promo codes (e.g. `VIZAGGLOW`, `JSTUDIOGROOM`).
- **Customer Reviews Management:**
  - Approve reviews, toggle "Featured ★" status, or remove spam.
- **Customer Inquiries:**
  - Review incoming inquiries from the contact form, mark as replied, and contact clients directly.
- **Gallery Management:**
  - Add and delete before/after pictures and ambience photos.
- **Salon Settings & Security:**
  - Update salon name, phone numbers, WhatsApp, timings, Google Maps URL.
  - Securely change admin password with confirmation validation.

---

## 🛠️ Technology Stack
- **Backend:** Node.js, Express.js (v5)
- **Frontend:** HTML5, CSS3 (Custom Variables, Flexbox, CSS Grid), Vanilla JavaScript ES6+
- **Database:** Zero-configuration atomic JSON database (`data/db.json`) with safe concurrent writes
- **Security:** JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), input sanitization
- **File Uploads:** Multer with static asset serving (`/uploads/`)
- **Icons & Typography:** FontAwesome 6, Playfair Display & Plus Jakarta Sans via Google Fonts

---

## 📁 Project Structure
```
j studio luxury beauty salon/
├── server.js               # Express server & REST API endpoints
├── db.js                   # Database layer & model helpers
├── package.json            # Project manifest & scripts
├── data/
│   ├── db.json             # Persistent database file
│   └── uploads/            # Uploaded photos
└── public/
    ├── index.html          # Public Customer Website
    ├── admin.html          # Admin Dashboard Portal
    ├── css/
    │   ├── style.css       # Luxury website styles
    │   └── admin.css       # Admin dashboard styles
    └── js/
        ├── app.js          # Customer booking wizard & interactions
        └── admin.js        # Admin dashboard logic & API client
```
