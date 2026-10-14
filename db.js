const fs = require('fs');
const path = require('path');
const os = require('os');
const bcrypt = require('bcryptjs');

const BUNDLED_DATA_DIR = path.join(__dirname, 'data');
const SEED_DB_FILE = path.join(BUNDLED_DATA_DIR, 'db.json');

function resolveWritableDataDir() {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), 'jstudio-luxury-salon-data');
  }
  try {
    if (!fs.existsSync(BUNDLED_DATA_DIR)) {
      fs.mkdirSync(BUNDLED_DATA_DIR, { recursive: true });
    }
    const probeFile = path.join(BUNDLED_DATA_DIR, '.write-probe');
    fs.writeFileSync(probeFile, 'ok', 'utf-8');
    fs.unlinkSync(probeFile);
    return BUNDLED_DATA_DIR;
  } catch (err) {
    return path.join(os.tmpdir(), 'jstudio-luxury-salon-data');
  }
}

const DATA_DIR = resolveWritableDataDir();
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure writable directories exist
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Directory initialization warning:', err.message);
}

// Initial seed data reflecting J Studio Luxury Beauty Salon in MVP Colony, Vizag
function getInitialData() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('jstudio@2026', salt);

  return {
    salonInfo: {
      name: "J Studio Luxury Beauty Salon",
      tagline: "Premier Hair Styling, Luxury Spa & Bridal Studio",
      address: "MVP Sector 3, Near Mahatma Gandhi Cancer Hospital, MVP Colony, Visakhapatnam, Andhra Pradesh 530017",
      phone: "+91 90660 31999",
      altPhone: "+91 891 250 8899",
      whatsapp: "+91 90660 31999",
      email: "jstudioluxurybeauty@gmail.com",
      operatingHours: "Monday - Sunday: 8:00 AM – 9:00 PM",
      rating: 4.8,
      totalReviews: 485,
      mapCoordinates: {
        lat: 17.744141,
        lng: 83.333954
      },
      mapUrl: "https://maps.google.com/?q=J+Studio+Luxury+Beauty+Salon+Vizag",
      amenities: [
        "L'Oréal Professionnel Partner",
        "100% Sanitized & Hospital-Grade Hygiene",
        "Air-Conditioned Private Bridal Suite",
        "Free High-Speed Wi-Fi",
        "Dedicated Customer Parking",
        "Complimentary Herbal Tea & Coffee",
        "UPI, Cards & Cash Accepted"
      ],
      notice: "Walk-ins welcome! We recommend pre-booking to skip the queue during peak evening & weekend hours."
    },
    users: [
      {
        id: "user-1",
        username: "admin",
        passwordHash: adminPasswordHash,
        name: "Salon Manager",
        role: "admin",
        createdAt: new Date().toISOString()
      }
    ],
    categories: [
      { id: "all", name: "All Services", icon: "sparkles" },
      { id: "men", name: "Men's Grooming", icon: "user" },
      { id: "women", name: "Women's Styling", icon: "user-check" },
      { id: "hair-care", name: "Hair Therapy & Color", icon: "scissors" },
      { id: "skin-facials", name: "Skin & Facials", icon: "smile" },
      { id: "bridal-groom", name: "Bridal & Wedding", icon: "heart" },
      { id: "spa-nails", name: "Spa & Nail Art", icon: "sun" }
    ],
    services: [
      // Men's Grooming
      {
        id: "srv-m-1",
        name: "Signature Men's Haircut & Styling",
        category: "men",
        durationMinutes: 30,
        price: 299,
        originalPrice: 350,
        description: "Consultation, precision haircut tailored to face profile, scalp wash, blow dry & styling wax finish.",
        image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-m-2",
        name: "Royal Beard Sculpting & Razor Finish",
        category: "men",
        durationMinutes: 25,
        price: 199,
        originalPrice: 250,
        description: "Hot towel therapy, precision trimming, sharp blade contouring, organic beard oil nourishment.",
        image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=600&q=80",
        popular: false,
        active: true
      },
      {
        id: "srv-m-3",
        name: "Men's Grand Executive Combo",
        category: "men",
        durationMinutes: 60,
        price: 549,
        originalPrice: 700,
        description: "Signature haircut + beard sculpting + de-tan face scrub + relaxing 10-min neck & shoulder massage.",
        image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-m-4",
        name: "Men's Charcoal Detox Facial",
        category: "men",
        durationMinutes: 45,
        price: 999,
        originalPrice: 1299,
        description: "Deep pore dirt extraction, blackhead removal, activated charcoal glow pack, calming mint toner.",
        image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80",
        popular: false,
        active: true
      },

      // Women's Styling
      {
        id: "srv-w-1",
        name: "Designer Haircut, Wash & Blowdry",
        category: "women",
        durationMinutes: 45,
        price: 699,
        originalPrice: 850,
        description: "Expert consultation, face-framing layers, curtain bangs or blunt cut, L'Oréal shampoo & serum blowdry.",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-w-2",
        name: "L'Oréal Professionnel Global Hair Color",
        category: "hair-care",
        durationMinutes: 90,
        price: 2499,
        originalPrice: 3200,
        description: "Ammonia-free rich pigment formula with high shine, 100% grey coverage, deep bond protection.",
        image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-w-3",
        name: "Sun-Kissed Balayage & Ombre Highlights",
        category: "hair-care",
        durationMinutes: 120,
        price: 3799,
        originalPrice: 4800,
        description: "Hand-painted seamless highlights tailored to skin tone, gloss toner, gloss lock treatment included.",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-w-4",
        name: "Keratin Smooth Protein Therapy",
        category: "hair-care",
        durationMinutes: 150,
        price: 3499,
        originalPrice: 4500,
        description: "Eliminates frizz, repairs damaged cuticles, delivers silky, mirror-like straight hair for up to 5 months.",
        image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-w-5",
        name: "Hair Botox & Nanoplastia Ritual",
        category: "hair-care",
        durationMinutes: 150,
        price: 4299,
        originalPrice: 5500,
        description: "Deep collagen infusion for over-processed, bleached or frizzy locks. Intense volume control and radiant shine.",
        image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
        popular: false,
        active: true
      },

      // Skin & Facials
      {
        id: "srv-s-1",
        name: "Hydra Deep-Aqua Glow Facial",
        category: "skin-facials",
        durationMinutes: 60,
        price: 1899,
        originalPrice: 2500,
        description: "Vacuum vortex suction pore cleansing, hyaluronic acid infusion, LED light therapy for glass skin.",
        image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-s-2",
        name: "O3+ Bridal Radiance D-Tan & Facial",
        category: "skin-facials",
        durationMinutes: 75,
        price: 2399,
        originalPrice: 2999,
        description: "Oxygenating treatment for sun damage repair, melanin regulation, skin brightening & instant festive luminosity.",
        image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-s-3",
        name: "Vitamin C Radiance & Anti-Pigment Facial",
        category: "skin-facials",
        durationMinutes: 50,
        price: 1499,
        originalPrice: 1900,
        description: "Pure botanical vitamin C antioxidant boost, dark spot reduction, firming peptide mask massage.",
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
        popular: false,
        active: true
      },

      // Bridal & Groom
      {
        id: "srv-b-1",
        name: "HD Bridal Makeover & Hair Artistry",
        category: "bridal-groom",
        durationMinutes: 180,
        price: 7999,
        originalPrice: 10000,
        description: "High-definition camera ready base, luxury lash extensions, intricate bridal hairstyle, saree/lehenga draping.",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-b-2",
        name: "Airbrush Grand Bridal Transformation",
        category: "bridal-groom",
        durationMinutes: 210,
        price: 11999,
        originalPrice: 15000,
        description: "Waterproof, 24-hour sweat resistant silicon airbrush makeup, couture hair updo, jewelry setting & trial touch-up.",
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-b-3",
        name: "Royal Groom Grand Wedding Package",
        category: "bridal-groom",
        durationMinutes: 120,
        price: 3299,
        originalPrice: 4200,
        description: "Bespoke haircut, beard sculpting, de-tan glow facial, manicure, hair styling & grooming touch-up on wedding day.",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        popular: false,
        active: true
      },

      // Spa & Nails
      {
        id: "srv-p-1",
        name: "Crystal Spa Pedicure & Foot Reflexology",
        category: "spa-nails",
        durationMinutes: 50,
        price: 799,
        originalPrice: 999,
        description: "Sea salt bubble soak, callus smoothing, dead skin scrub, hydration mask, hot stone reflexology foot rub.",
        image: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      },
      {
        id: "srv-p-2",
        name: "Gel Extensions & Chrome Nail Art",
        category: "spa-nails",
        durationMinutes: 90,
        price: 1499,
        originalPrice: 1999,
        description: "Custom tip shaping, durable gel overlay, mirror chrome or glitter nail art on all 10 fingers.",
        image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80",
        popular: true,
        active: true
      }
    ],
    stylists: [
      {
        id: "sty-1",
        name: "Kiran Varma",
        role: "Senior Art Director & L'Oréal Certified Colorist",
        specialization: "Creative Balayage, Precision Fades & Hair Botox",
        experience: "9+ Years Experience",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        rating: 4.9,
        active: true
      },
      {
        id: "sty-2",
        name: "Ananya Sharma",
        role: "Lead Bridal Aesthetician & Makeup Artist",
        specialization: "HD Bridal Makeovers, Airbrush & Skin Radiance",
        experience: "7+ Years Experience",
        photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
        rating: 4.95,
        active: true
      },
      {
        id: "sty-3",
        name: "Rahul Naidu",
        role: "Master Barber & Beard Stylist",
        specialization: "Fade Art, Beard Sculpting & Scalp Treatments",
        experience: "6+ Years Experience",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        rating: 4.85,
        active: true
      },
      {
        id: "sty-4",
        name: "Pooja Reddy",
        role: "Nail Artist & Skin Specialist",
        specialization: "HydraFacials, Gel Extensions & Nail Aesthetics",
        experience: "5+ Years Experience",
        photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
        rating: 4.8,
        active: true
      }
    ],
    bookings: [],
    offers: [
      {
        id: "off-1",
        code: "VIZAGGLOW",
        title: "Grand Festive Glow Offer",
        discountPercent: 20,
        description: "Flat 20% OFF on all Luxury Facials & Hair Spa Treatments above ₹1,500.",
        validUntil: "2026-11-30",
        badge: "Most Popular",
        active: true
      },
      {
        id: "off-2",
        code: "JSTUDIOGROOM",
        title: "Executive Grooming Bundle",
        discountPercent: 25,
        description: "Get 25% off when you book Men's Haircut + Beard Sculpting + D-Tan Face Pack.",
        validUntil: "2026-12-31",
        badge: "Men's Special",
        active: true
      },
      {
        id: "off-3",
        code: "BRIDAL2026",
        title: "Royal Bridal Advance Booking",
        discountPercent: 15,
        description: "Complimentary pre-bridal trial & 15% discount on HD/Airbrush Wedding Makeover packages.",
        validUntil: "2026-12-31",
        badge: "Wedding Season",
        active: true
      }
    ],
    reviews: [
      {
        id: "rev-1",
        author: "Dr. Rajesh K.",
        rating: 5,
        date: "2 weeks ago",
        source: "Google Review",
        text: "Best unisex salon in MVP Colony without a doubt. Very clean and hygienic atmosphere near MG Cancer Hospital. Kiran gave me an exceptional haircut and beard grooming. Staff wears masks and uses sanitized blades every time.",
        serviceTaken: "Men's Haircut & Beard Grooming",
        verified: true,
        featured: true
      },
      {
        id: "rev-2",
        author: "Deepika Chintala",
        rating: 5,
        date: "1 month ago",
        source: "Google Review",
        text: "I booked my bridal makeover here with Ananya. She is truly magical! My HD makeup stayed flawless throughout the 6-hour ceremony in Vizag humidity. Everyone praised my look. Highly recommend J Studio Luxury Beauty Salon!",
        serviceTaken: "HD Bridal Makeover",
        verified: true,
        featured: true
      },
      {
        id: "rev-3",
        author: "Manoj Kumar P.",
        rating: 5,
        date: "3 weeks ago",
        source: "Google Review",
        text: "They are authentic L'Oréal Professionnel partners. Got my hair keratin treatment done, results are so smooth and natural. Transparent pricing, no hidden charges. Parking right in front was very convenient.",
        serviceTaken: "Keratin Smooth Therapy",
        verified: true,
        featured: true
      },
      {
        id: "rev-4",
        author: "Sneha Latha",
        rating: 5,
        date: "1 month ago",
        source: "Google Review",
        text: "The HydraFacial here is top class. My skin felt glowing and deeply cleansed for days. The ambience is quiet, luxurious, and the staff is very polite. Worth every rupee.",
        serviceTaken: "Hydra Deep-Aqua Glow Facial",
        verified: true,
        featured: true
      },
      {
        id: "rev-5",
        author: "Kalyan Varma",
        rating: 4,
        date: "2 months ago",
        source: "Google Review",
        text: "Great stylists who actually listen to what you want. Rahul styled my hair perfectly. Just make sure you book in advance on weekends as it gets very busy.",
        serviceTaken: "Men's Styling & Wash",
        verified: true,
        featured: false
      }
    ],
    gallery: [
      {
        id: "gal-1",
        title: "Modern Styling Stations & Ambience",
        category: "salon",
        image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "gal-2",
        title: "L'Oréal Hair Color & Balayage Art",
        category: "hair",
        image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "gal-3",
        title: "Royal HD Bridal Makeup Transformation",
        category: "bridal",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "gal-4",
        title: "Executive Men's Grooming Lounge",
        category: "men",
        image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "gal-5",
        title: "Luxury Pedicure & Reflexology Suite",
        category: "spa",
        image: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80"
      },
      {
        id: "gal-6",
        title: "Couture Hair Updo & Saree Styling",
        category: "bridal",
        image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"
      }
    ],
    inquiries: [
      {
        id: "inq-1",
        name: "Praneeth V.",
        phone: "+91 91234 56789",
        email: "praneeth@gmail.com",
        subject: "Bridal Package for 4 members",
        message: "Looking for family bridal packages for a wedding on Nov 15th in MVP Colony. Please call me back.",
        date: "2026-10-11T10:15:00.000Z",
        status: "unread"
      }
    ]
  };
}

const IMAGE_MIGRATIONS = {
  "https://images.unsplash.com/photo-1512290900672-1f4088924b27?auto=format&fit=crop&w=600&q=80": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1512290903029-dc81c5d57b28?auto=format&fit=crop&w=600&q=80": "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1522337094346-290f269a944d?auto=format&fit=crop&w=600&q=80": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519014816548-bf7805b9e88e?auto=format&fit=crop&w=600&q=80": "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1519014816548-bf7805b9e88e?auto=format&fit=crop&w=800&q=80": "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1522337094346-290f269a944d?auto=format&fit=crop&w=800&q=80": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"
};

function sanitizeBrokenImages(data) {
  if (!data) return false;
  let changed = false;
  if (Array.isArray(data.services)) {
    data.services.forEach(s => {
      if (s && s.image && IMAGE_MIGRATIONS[s.image]) {
        s.image = IMAGE_MIGRATIONS[s.image];
        changed = true;
      }
    });
  }
  if (Array.isArray(data.gallery)) {
    data.gallery.forEach(g => {
      if (g && g.image && IMAGE_MIGRATIONS[g.image]) {
        g.image = IMAGE_MIGRATIONS[g.image];
        changed = true;
      }
    });
  }
  return changed;
}

// Database helper functions with safe file operations & serverless in-memory cache
class DB {
  constructor() {
    this.cache = null;
    this.UPLOADS_DIR = UPLOADS_DIR;
    this.init();
  }

  loadSeedData() {
    try {
      if (SEED_DB_FILE !== DB_FILE && fs.existsSync(SEED_DB_FILE)) {
        const raw = fs.readFileSync(SEED_DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading seed db.json:', err.message);
    }
    return getInitialData();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (sanitizeBrokenImages(parsed)) {
          this.write(parsed);
        } else {
          this.cache = parsed;
        }
      } else {
        const data = this.loadSeedData();
        sanitizeBrokenImages(data);
        this.cache = data;
        this.write(data);
      }
    } catch (err) {
      console.error('DB init fallback to memory cache:', err.message);
      this.cache = this.loadSeedData();
      sanitizeBrokenImages(this.cache);
    }
  }

  read() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (sanitizeBrokenImages(parsed)) {
          this.write(parsed);
        } else {
          this.cache = parsed;
        }
        return this.cache;
      }
    } catch (err) {
      console.error('Error reading db.json, using cache:', err.message);
    }

    if (!this.cache) {
      this.init();
    }
    return this.cache;
  }

  write(data) {
    this.cache = data;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const serialized = JSON.stringify(data, null, 2);
      try {
        const tmpFile = DB_FILE + '.tmp';
        fs.writeFileSync(tmpFile, serialized, 'utf-8');
        fs.renameSync(tmpFile, DB_FILE);
      } catch (renameErr) {
        fs.writeFileSync(DB_FILE, serialized, 'utf-8');
      }
      return true;
    } catch (err) {
      console.error('Error writing to DB file (persisted in memory cache):', err.message);
      return true;
    }
  }

  // Getters
  getSalonInfo() {
    return this.read().salonInfo;
  }

  updateSalonInfo(updatedInfo) {
    const data = this.read();
    data.salonInfo = { ...data.salonInfo, ...updatedInfo };
    this.write(data);
    return data.salonInfo;
  }

  // Services
  getServices() {
    return this.read().services || [];
  }

  addService(service) {
    const data = this.read();
    const newService = {
      id: 'srv-' + Date.now(),
      active: true,
      popular: false,
      ...service
    };
    data.services.push(newService);
    this.write(data);
    return newService;
  }

  updateService(id, updates) {
    const data = this.read();
    const index = data.services.findIndex(s => s.id === id);
    if (index === -1) return null;
    data.services[index] = { ...data.services[index], ...updates };
    this.write(data);
    return data.services[index];
  }

  deleteService(id) {
    const data = this.read();
    const initialLength = data.services.length;
    data.services = data.services.filter(s => s.id !== id);
    if (data.services.length !== initialLength) {
      this.write(data);
      return true;
    }
    return false;
  }

  // Categories
  getCategories() {
    return this.read().categories || [];
  }

  // Stylists
  getStylists() {
    return this.read().stylists || [];
  }

  addStylist(stylist) {
    const data = this.read();
    const newStylist = {
      id: 'sty-' + Date.now(),
      rating: 4.9,
      active: true,
      ...stylist
    };
    data.stylists.push(newStylist);
    this.write(data);
    return newStylist;
  }

  updateStylist(id, updates) {
    const data = this.read();
    const index = data.stylists.findIndex(s => s.id === id);
    if (index === -1) return null;
    data.stylists[index] = { ...data.stylists[index], ...updates };
    this.write(data);
    return data.stylists[index];
  }

  deleteStylist(id) {
    const data = this.read();
    data.stylists = data.stylists.filter(s => s.id !== id);
    this.write(data);
    return true;
  }

  // Bookings
  getBookings() {
    const data = this.read();
    return (data.bookings || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  addBooking(bookingData) {
    const data = this.read();
    if (!data.bookings) data.bookings = [];
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const bookingId = bookingData.id || `JS-${datePrefix}-${randomCode}`;

    const existingIdx = data.bookings.findIndex(b => b.id.toLowerCase() === bookingId.toLowerCase());
    if (existingIdx !== -1) {
      return data.bookings[existingIdx];
    }

    const newBooking = {
      id: bookingId,
      status: bookingData.status || 'Pending',
      createdAt: bookingData.createdAt || new Date().toISOString(),
      ...bookingData,
      id: bookingId
    };
    data.bookings.unshift(newBooking);
    this.write(data);
    return newBooking;
  }

  updateBooking(id, updates) {
    const data = this.read();
    if (!data.bookings) return null;
    const cleanId = String(id).trim().toLowerCase();
    const index = data.bookings.findIndex(b => String(b.id).trim().toLowerCase() === cleanId);
    if (index === -1) return null;
    data.bookings[index] = { ...data.bookings[index], ...updates };
    this.write(data);
    return data.bookings[index];
  }

  deleteBooking(id) {
    const data = this.read();
    if (!data.bookings) return false;
    const cleanId = String(id).trim().toLowerCase();
    const initialLen = data.bookings.length;
    data.bookings = data.bookings.filter(b => String(b.id).trim().toLowerCase() !== cleanId);
    this.write(data);
    return data.bookings.length < initialLen || true;
  }

  deleteCompletedBookings() {
    const data = this.read();
    if (!data.bookings) return { deletedCount: 0, deletedIds: [] };
    const completed = data.bookings.filter(b => b.status === 'Completed');
    const deletedIds = completed.map(b => b.id);
    data.bookings = data.bookings.filter(b => b.status !== 'Completed');
    this.write(data);
    return { deletedCount: deletedIds.length, deletedIds };
  }

  syncBookings({ createdBookings = [], updatedBookings = {}, deletedIds = [] } = {}) {
    const data = this.read();
    if (!data.bookings) data.bookings = [];
    let modified = false;

    const deletedSet = new Set((deletedIds || []).map(id => String(id).trim().toLowerCase()));
    if (deletedSet.size > 0) {
      const before = data.bookings.length;
      data.bookings = data.bookings.filter(b => !deletedSet.has(String(b.id).trim().toLowerCase()));
      if (data.bookings.length !== before) modified = true;
    }

    if (Array.isArray(createdBookings)) {
      createdBookings.forEach(cb => {
        if (!cb || !cb.id) return;
        const cleanId = String(cb.id).trim().toLowerCase();
        if (deletedSet.has(cleanId)) return;
        const exists = data.bookings.some(b => String(b.id).trim().toLowerCase() === cleanId);
        if (!exists) {
          data.bookings.unshift(cb);
          modified = true;
        }
      });
    }

    if (updatedBookings && typeof updatedBookings === 'object') {
      Object.entries(updatedBookings).forEach(([id, updates]) => {
        const cleanId = String(id).trim().toLowerCase();
        if (deletedSet.has(cleanId)) return;
        const idx = data.bookings.findIndex(b => String(b.id).trim().toLowerCase() === cleanId);
        if (idx !== -1 && updates && typeof updates === 'object') {
          const current = data.bookings[idx];
          if (updates.status && current.status !== updates.status) {
            data.bookings[idx] = { ...current, ...updates };
            modified = true;
          }
        }
      });
    }

    if (modified) {
      this.write(data);
    }
    return this.getBookings();
  }

  // Offers
  getOffers() {
    return this.read().offers || [];
  }

  addOffer(offer) {
    const data = this.read();
    const newOffer = {
      id: 'off-' + Date.now(),
      active: true,
      ...offer
    };
    data.offers.push(newOffer);
    this.write(data);
    return newOffer;
  }

  updateOffer(id, updates) {
    const data = this.read();
    const index = data.offers.findIndex(o => o.id === id);
    if (index === -1) return null;
    data.offers[index] = { ...data.offers[index], ...updates };
    this.write(data);
    return data.offers[index];
  }

  deleteOffer(id) {
    const data = this.read();
    data.offers = data.offers.filter(o => o.id !== id);
    this.write(data);
    return true;
  }

  // Reviews
  getReviews() {
    return this.read().reviews || [];
  }

  addReview(review) {
    const data = this.read();
    const newReview = {
      id: 'rev-' + Date.now(),
      date: 'Just now',
      source: 'Website Review',
      verified: true,
      featured: false,
      ...review
    };
    data.reviews.unshift(newReview);
    this.write(data);
    return newReview;
  }

  updateReview(id, updates) {
    const data = this.read();
    const index = data.reviews.findIndex(r => r.id === id);
    if (index === -1) return null;
    data.reviews[index] = { ...data.reviews[index], ...updates };
    this.write(data);
    return data.reviews[index];
  }

  deleteReview(id) {
    const data = this.read();
    data.reviews = data.reviews.filter(r => r.id !== id);
    this.write(data);
    return true;
  }

  // Gallery
  getGallery() {
    return this.read().gallery || [];
  }

  addGalleryItem(item) {
    const data = this.read();
    const newItem = {
      id: 'gal-' + Date.now(),
      ...item
    };
    data.gallery.push(newItem);
    this.write(data);
    return newItem;
  }

  deleteGalleryItem(id) {
    const data = this.read();
    data.gallery = data.gallery.filter(g => g.id !== id);
    this.write(data);
    return true;
  }

  // Inquiries
  getInquiries() {
    return this.read().inquiries || [];
  }

  addInquiry(inquiry) {
    const data = this.read();
    const newInquiry = {
      id: 'inq-' + Date.now(),
      date: new Date().toISOString(),
      status: 'unread',
      ...inquiry
    };
    data.inquiries.unshift(newInquiry);
    this.write(data);
    return newInquiry;
  }

  updateInquiry(id, updates) {
    const data = this.read();
    const index = data.inquiries.findIndex(i => i.id === id);
    if (index === -1) return null;
    data.inquiries[index] = { ...data.inquiries[index], ...updates };
    this.write(data);
    return data.inquiries[index];
  }

  deleteInquiry(id) {
    const data = this.read();
    data.inquiries = data.inquiries.filter(i => i.id !== id);
    this.write(data);
    return true;
  }

  // Authentication & Users
  getUserByUsername(username) {
    const data = this.read();
    return (data.users || []).find(u => u.username === username);
  }

  changePassword(username, newPassword) {
    const data = this.read();
    const user = (data.users || []).find(u => u.username === username);
    if (!user) return false;
    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    this.write(data);
    return true;
  }

  // Dashboard Stats
  getStats() {
    const data = this.read();
    const bookings = data.bookings || [];
    const services = data.services || [];
    const stylists = data.stylists || [];
    const inquiries = data.inquiries || [];

    const totalBookings = bookings.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayBookings = bookings.filter(b => b.date === todayStr).length;
    const pendingBookings = bookings.filter(b => b.status === 'Pending').length;
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;

    const totalRevenue = bookings
      .filter(b => b.status === 'Completed' || b.status === 'Confirmed')
      .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

    const unreadInquiries = inquiries.filter(i => i.status === 'unread').length;

    // Service popularity
    const serviceCountMap = {};
    bookings.forEach(b => {
      (b.serviceNames || []).forEach(name => {
        serviceCountMap[name] = (serviceCountMap[name] || 0) + 1;
      });
    });

    const topServices = Object.entries(serviceCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalBookings,
      todayBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      unreadInquiries,
      totalServices: services.length,
      totalStylists: stylists.length,
      topServices,
      recentBookings: bookings.slice(0, 6)
    };
  }
}

module.exports = new DB();
