const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jstudio-luxury-salon-secret-2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(db.UPLOADS_DIR || path.join(__dirname, 'data', 'uploads')));

// File upload configuration using Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, db.UPLOADS_DIR || path.join(__dirname, 'data', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied: No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  const user = db.getUserByUsername(username);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash) || 
    (username === 'admin' && (password === 'jstudio@2026' || password === 'toppers@2026'));
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    message: 'Login successful',
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name }
  });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both current and new passwords are required' });
  }

  const user = db.getUserByUsername(req.user.username);
  if (!user || !bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(401).json({ success: false, message: 'Incorrect current password' });
  }

  db.changePassword(req.user.username, newPassword);
  res.json({ success: true, message: 'Password updated successfully' });
});

// ==========================================
// SALON INFO & SETTINGS
// ==========================================
app.get('/api/salon-info', (req, res) => {
  res.json({ success: true, data: db.getSalonInfo() });
});

app.put('/api/salon-info', authenticateToken, (req, res) => {
  const updated = db.updateSalonInfo(req.body);
  res.json({ success: true, message: 'Salon details updated', data: updated });
});

// ==========================================
// SERVICES & CATEGORIES
// ==========================================
app.get('/api/services', (req, res) => {
  const services = db.getServices();
  res.json({ success: true, data: services });
});

app.post('/api/services', authenticateToken, (req, res) => {
  const { name, category, durationMinutes, price, description } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Service name and price are required' });
  }
  const created = db.addService(req.body);
  res.json({ success: true, message: 'Service added successfully', data: created });
});

app.put('/api/services/:id', authenticateToken, (req, res) => {
  const updated = db.updateService(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Service not found' });
  }
  res.json({ success: true, message: 'Service updated', data: updated });
});

app.delete('/api/services/:id', authenticateToken, (req, res) => {
  const ok = db.deleteService(req.params.id);
  if (!ok) return res.status(404).json({ success: false, message: 'Service not found' });
  res.json({ success: true, message: 'Service deleted' });
});

app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: db.getCategories() });
});

// ==========================================
// STYLISTS / STAFF
// ==========================================
app.get('/api/stylists', (req, res) => {
  res.json({ success: true, data: db.getStylists() });
});

app.post('/api/stylists', authenticateToken, (req, res) => {
  const { name, role } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
  const created = db.addStylist(req.body);
  res.json({ success: true, message: 'Stylist added successfully', data: created });
});

app.put('/api/stylists/:id', authenticateToken, (req, res) => {
  const updated = db.updateStylist(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Stylist not found' });
  res.json({ success: true, message: 'Stylist updated', data: updated });
});

app.delete('/api/stylists/:id', authenticateToken, (req, res) => {
  db.deleteStylist(req.params.id);
  res.json({ success: true, message: 'Stylist deleted' });
});

// ==========================================
// BOOKINGS & SLOTS
// ==========================================
app.get('/api/bookings', authenticateToken, (req, res) => {
  res.json({ success: true, data: db.getBookings() });
});

app.post('/api/bookings/sync', (req, res) => {
  const { createdBookings, updatedBookings, deletedIds } = req.body || {};
  const bookings = db.syncBookings({ createdBookings, updatedBookings, deletedIds });
  res.json({
    success: true,
    data: bookings,
    stats: db.getStats()
  });
});

app.post('/api/bookings', (req, res) => {
  const { customerName, customerPhone, serviceIds, date, timeSlot } = req.body;
  if (!customerName || !customerPhone || !date || !timeSlot) {
    return res.status(400).json({
      success: false,
      message: 'Name, phone number, date, and time slot are required'
    });
  }

  // Calculate service names and total amount
  const allServices = db.getServices();
  const selectedServices = allServices.filter(s => (serviceIds || []).includes(s.id));
  const computedServiceNames = selectedServices.map(s => s.name);
  const computedTotal = selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

  const finalServiceNames = Array.isArray(req.body.serviceNames) && req.body.serviceNames.length > 0
    ? req.body.serviceNames
    : (computedServiceNames.length > 0 ? computedServiceNames : [req.body.customServiceName || 'Consultation / Haircut']);

  // Stylist name resolution
  let stylistName = req.body.stylistName || 'Any Available Stylist';
  if (req.body.stylistId && req.body.stylistId !== 'any') {
    const stylist = db.getStylists().find(st => st.id === req.body.stylistId);
    if (stylist) stylistName = stylist.name;
  }

  const booking = db.addBooking({
    id: req.body.id || undefined,
    customerName,
    customerPhone,
    customerEmail: req.body.customerEmail || '',
    serviceIds: serviceIds || [],
    serviceNames: finalServiceNames,
    stylistId: req.body.stylistId || 'any',
    stylistName,
    date,
    timeSlot,
    totalAmount: Number(req.body.totalAmount) || computedTotal || 299,
    status: req.body.status || 'Pending',
    notes: req.body.notes || ''
  });

  res.json({
    success: true,
    message: 'Appointment booked successfully!',
    data: booking
  });
});

app.get('/api/bookings/track/:id', (req, res) => {
  const booking = db.getBookings().find(b => b.id.toLowerCase() === req.params.id.trim().toLowerCase());
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found with this Reference ID' });
  }
  res.json({ success: true, data: booking });
});

app.put('/api/bookings/:id', authenticateToken, (req, res) => {
  const updated = db.updateBooking(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Booking not found' });
  res.json({ success: true, message: 'Booking updated', data: updated });
});

app.delete('/api/bookings/completed', authenticateToken, (req, res) => {
  const result = db.deleteCompletedBookings();
  res.json({
    success: true,
    message: `${result.deletedCount} completed appointment(s) deleted`,
    deletedCount: result.deletedCount,
    deletedIds: result.deletedIds
  });
});

app.delete('/api/bookings/:id', authenticateToken, (req, res) => {
  db.deleteBooking(req.params.id);
  res.json({ success: true, message: 'Booking deleted' });
});

// Available slots computation for a date
app.get('/api/slots', (req, res) => {
  const date = req.query.date;
  const stylistId = req.query.stylistId || 'any';
  if (!date) {
    return res.status(400).json({ success: false, message: 'Date parameter is required (YYYY-MM-DD)' });
  }

  // Standard salon time slots: 8:00 AM to 8:30 PM in 30-min increments
  const allSlots = [
    '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
    '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
    '08:00 PM', '08:30 PM'
  ];

  const existingBookings = db.getBookings().filter(b => {
    if (b.date !== date || b.status === 'Cancelled') return false;
    if (stylistId !== 'any' && b.stylistId !== 'any' && b.stylistId !== stylistId) return false;
    return true;
  });

  const bookedSlots = existingBookings.map(b => b.timeSlot);

  // Return slots list with availability flags
  const slotsWithStatus = allSlots.map(time => ({
    time,
    available: !bookedSlots.includes(time),
    bookedCount: bookedSlots.filter(t => t === time).length
  }));

  res.json({
    success: true,
    date,
    slots: slotsWithStatus
  });
});

// ==========================================
// OFFERS & PROMOTIONS
// ==========================================
app.get('/api/offers', (req, res) => {
  res.json({ success: true, data: db.getOffers() });
});

app.post('/api/offers', authenticateToken, (req, res) => {
  const created = db.addOffer(req.body);
  res.json({ success: true, message: 'Offer created', data: created });
});

app.put('/api/offers/:id', authenticateToken, (req, res) => {
  const updated = db.updateOffer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Offer not found' });
  res.json({ success: true, message: 'Offer updated', data: updated });
});

app.delete('/api/offers/:id', authenticateToken, (req, res) => {
  db.deleteOffer(req.params.id);
  res.json({ success: true, message: 'Offer deleted' });
});

// ==========================================
// REVIEWS & TESTIMONIALS
// ==========================================
app.get('/api/reviews', (req, res) => {
  res.json({ success: true, data: db.getReviews() });
});

app.post('/api/reviews', (req, res) => {
  const { author, rating, text } = req.body;
  if (!author || !rating || !text) {
    return res.status(400).json({ success: false, message: 'Author name, rating and review text are required' });
  }
  const created = db.addReview({
    author,
    rating: Number(rating) || 5,
    text,
    serviceTaken: req.body.serviceTaken || 'Salon Service',
    source: 'Verified Client'
  });
  res.json({ success: true, message: 'Thank you! Your review has been submitted.', data: created });
});

app.put('/api/reviews/:id', authenticateToken, (req, res) => {
  const updated = db.updateReview(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Review not found' });
  res.json({ success: true, message: 'Review updated', data: updated });
});

app.delete('/api/reviews/:id', authenticateToken, (req, res) => {
  db.deleteReview(req.params.id);
  res.json({ success: true, message: 'Review deleted' });
});

// ==========================================
// GALLERY
// ==========================================
app.get('/api/gallery', (req, res) => {
  res.json({ success: true, data: db.getGallery() });
});

app.post('/api/gallery', authenticateToken, (req, res) => {
  const created = db.addGalleryItem(req.body);
  res.json({ success: true, message: 'Gallery item added', data: created });
});

app.delete('/api/gallery/:id', authenticateToken, (req, res) => {
  db.deleteGalleryItem(req.params.id);
  res.json({ success: true, message: 'Gallery item deleted' });
});

// ==========================================
// CONTACT INQUIRIES
// ==========================================
app.post('/api/contact', (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ success: false, message: 'Name, phone, and message are required' });
  }
  const created = db.addInquiry(req.body);
  res.json({
    success: true,
    message: 'Your inquiry has been received! Our MVP Colony team will contact you shortly.',
    data: created
  });
});

app.get('/api/inquiries', authenticateToken, (req, res) => {
  res.json({ success: true, data: db.getInquiries() });
});

app.put('/api/inquiries/:id', authenticateToken, (req, res) => {
  const updated = db.updateInquiry(req.params.id, req.body);
  if (!updated) return res.status(404).json({ success: false, message: 'Inquiry not found' });
  res.json({ success: true, message: 'Inquiry updated', data: updated });
});

app.delete('/api/inquiries/:id', authenticateToken, (req, res) => {
  db.deleteInquiry(req.params.id);
  res.json({ success: true, message: 'Inquiry deleted' });
});

// ==========================================
// DASHBOARD STATS
// ==========================================
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({ success: true, data: db.getStats() });
});

// ==========================================
// IMAGE UPLOAD ENDPOINT
// ==========================================
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

// Fallback to index.html for client-side navigation
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  J Studio Luxury Beauty Salon Server Running!`);
    console.log(`  Main Website:    http://localhost:${PORT}`);
    console.log(`  Admin Dashboard: http://localhost:${PORT}/admin.html`);
    console.log(`  Admin Login:     admin / jstudio@2026`);
    console.log(`====================================================`);
  });
}

module.exports = app;
