// ===================================================================
// J STUDIO LUXURY BEAUTY SALON - CLIENT APP LOGIC
// MVP Colony, Visakhapatnam
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  // State variables
  let allServices = [];
  let allStylists = [];
  let selectedCategory = 'all';
  let searchQuery = '';

  // Booking Wizard State
  const bookingState = {
    selectedServices: [],
    selectedStylistId: 'any',
    selectedStylistName: 'Any Available Stylist',
    selectedDate: new Date().toISOString().slice(0, 10),
    selectedTimeSlot: null,
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    notes: '',
    lastBookingResponse: null
  };

  // DOM Elements
  const servicesGrid = document.getElementById('servicesGrid');
  const categoryTabs = document.getElementById('categoryTabs');
  const serviceSearchInput = document.getElementById('serviceSearchInput');
  const wizardServicesList = document.getElementById('wizardServicesList');
  const wizardSelectedCount = document.getElementById('wizardSelectedCount');
  const wizardSelectedTotal = document.getElementById('wizardSelectedTotal');
  const wizardStylistGrid = document.getElementById('wizardStylistGrid');
  const bookingDateInput = document.getElementById('bookingDateInput');
  const wizardTimeSlotsGrid = document.getElementById('wizardTimeSlotsGrid');
  const step3SelectedStylist = document.getElementById('step3SelectedStylist');
  const bookingFinalForm = document.getElementById('bookingFinalForm');
  const summaryServicesText = document.getElementById('summaryServicesText');
  const summaryStylistText = document.getElementById('summaryStylistText');
  const summaryDateTimeText = document.getElementById('summaryDateTimeText');
  const summaryPriceText = document.getElementById('summaryPriceText');
  const confirmedReceiptBox = document.getElementById('confirmedReceiptBox');
  const btnWhatsAppConfirm = document.getElementById('btnWhatsAppConfirm');
  const btnBookAnother = document.getElementById('btnBookAnother');

  // Wizard navigation buttons
  const btnNextStep1 = document.getElementById('btnNextStep1');
  const btnPrevStep2 = document.getElementById('btnPrevStep2');
  const btnNextStep2 = document.getElementById('btnNextStep2');
  const btnPrevStep3 = document.getElementById('btnPrevStep3');
  const btnNextStep3 = document.getElementById('btnNextStep3');
  const btnPrevStep4 = document.getElementById('btnPrevStep4');

  // Modals & Navigation
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  const trackerModal = document.getElementById('trackerModal');
  const btnOpenTracker = document.getElementById('btnOpenTracker');
  const btnCloseTracker = document.getElementById('btnCloseTracker');
  const btnSubmitTrack = document.getElementById('btnSubmitTrack');
  const trackInputCode = document.getElementById('trackInputCode');
  const trackResultBox = document.getElementById('trackResultBox');

  const writeReviewModal = document.getElementById('writeReviewModal');
  const btnOpenWriteReview = document.getElementById('btnOpenWriteReview');
  const btnCloseReviewModal = document.getElementById('btnCloseReviewModal');
  const writeReviewForm = document.getElementById('writeReviewForm');
  const contactInquiryForm = document.getElementById('contactInquiryForm');

  // ==========================================
  // BOOKING SYNC HELPER (Serverless Resilience)
  // ==========================================
  const SYNC_STORAGE_KEY = 'jstudio_booking_sync_v1';
  function getSyncState() {
    try {
      const raw = localStorage.getItem(SYNC_STORAGE_KEY) || localStorage.getItem('toppers_booking_sync_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          createdBookings: Array.isArray(parsed.createdBookings) ? parsed.createdBookings : [],
          updatedBookings: parsed.updatedBookings && typeof parsed.updatedBookings === 'object' ? parsed.updatedBookings : {},
          deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : []
        };
      }
    } catch (e) {
      console.error('Sync state read error:', e);
    }
    return { createdBookings: [], updatedBookings: {}, deletedIds: [] };
  }

  function saveSyncState(state) {
    try {
      localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Sync state save error:', e);
    }
  }

  async function syncClientBookings() {
    const state = getSyncState();
    if (
      state.createdBookings.length === 0 &&
      Object.keys(state.updatedBookings).length === 0 &&
      state.deletedIds.length === 0
    ) {
      return;
    }
    try {
      await fetch('/api/bookings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
    } catch (err) {
      console.error('Sync error:', err);
    }
  }

  // ==========================================
  // INITIAL DATA FETCHING
  // ==========================================
  initApp();

  async function initApp() {
    setupMobileMenu();
    setupDateConstraints();
    await syncClientBookings();
    await Promise.all([
      loadServices(),
      loadStylists(),
      loadOffers(),
      loadGallery(),
      loadReviews()
    ]);
    renderBookingServicesList();
    renderBookingStylists();
    fetchTimeSlots();
  }

  // Mobile menu toggle
  function setupMobileMenu() {
    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
      });
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => navLinks.classList.remove('mobile-open'));
      });
    }
  }

  // Set date input minimum to today
  function setupDateConstraints() {
    const today = new Date().toISOString().slice(0, 10);
    if (bookingDateInput) {
      bookingDateInput.min = today;
      bookingDateInput.value = today;
      bookingState.selectedDate = today;

      bookingDateInput.addEventListener('change', (e) => {
        bookingState.selectedDate = e.target.value;
        bookingState.selectedTimeSlot = null;
        fetchTimeSlots();
      });
    }
  }

  // ==========================================
  // SERVICES RENDERING & SEARCH
  // ==========================================
  async function loadServices() {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        allServices = data.data;
        renderServicesGrid();
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  }

  function renderServicesGrid() {
    if (!servicesGrid) return;

    let filtered = allServices.filter(s => s.active !== false);

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      servicesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-subtle);">
          <i class="fas fa-search" style="font-size: 2rem; color: var(--gold-primary); margin-bottom: 12px;"></i>
          <h3 style="color: var(--text-main);">No matching services found</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Try adjusting your search keyword or browse all categories.</p>
        </div>
      `;
      return;
    }

    servicesGrid.innerHTML = filtered.map(service => {
      const categoryNames = {
        'men': "Men's Grooming",
        'women': "Women's Styling",
        'hair-care': "Hair Therapy & Color",
        'skin-facials': "Skin & Facials",
        'bridal-groom': "Bridal & Wedding",
        'spa-nails': "Spa & Nails"
      };

      const categoryIcons = {
        'men': 'fa-cut',
        'women': 'fa-wind',
        'hair-care': 'fa-spray-can-sparkles',
        'skin-facials': 'fa-spa',
        'bridal-groom': 'fa-crown',
        'spa-nails': 'fa-hand-sparkles'
      };

      const catLabel = categoryNames[service.category] || service.category || 'Salon Service';
      const iconClass = categoryIcons[service.category] || 'fa-scissors';
      const isSelectedInBooking = bookingState.selectedServices.some(s => s.id === service.id);

      return `
        <div class="service-card">
          <div class="service-card-image">
            <img src="${service.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80'}" alt="${service.name}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80';">
            <span class="slide8-cat-pill service-cat-badge">${catLabel}</span>
            ${service.popular ? '<span class="service-popular-badge">POPULAR</span>' : ''}
            <div class="bs-icon-box service-floating-icon">
              <i class="fas ${iconClass}"></i>
            </div>
          </div>
          <div class="service-card-body">
            <h3 class="service-card-title">${service.name}</h3>
            <p class="canva-body-text service-card-desc">${service.description || 'Premium grooming experience with L\'Oréal professional products.'}</p>
            <div class="slide8-service-footer">
              <div class="service-price-block">
                <span class="service-price">₹${service.price}</span>
                ${service.originalPrice ? `<span class="service-original-price">₹${service.originalPrice}</span>` : ''}
                <span class="slide8-duration"><i class="far fa-clock"></i> ${service.durationMinutes || 30} Mins</span>
              </div>
              <button class="btn btn-sm ${isSelectedInBooking ? 'btn-canva-gold' : 'btn-canva'} btn-quick-book" data-service-id="${service.id}">
                ${isSelectedInBooking ? '<i class="fas fa-check"></i> Added' : 'Book This'}
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to "Book This" buttons
    servicesGrid.querySelectorAll('.btn-quick-book').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sId = btn.getAttribute('data-service-id');
        const targetService = allServices.find(s => s.id === sId);
        if (targetService) {
          toggleServiceSelection(targetService);
          renderServicesGrid();
          renderBookingServicesList();
          // Smooth scroll to booking section
          document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // Category tab clicks
  if (categoryTabs) {
    categoryTabs.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        categoryTabs.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        selectedCategory = tab.getAttribute('data-category');
        renderServicesGrid();
      });
    });
  }

  // Search input
  if (serviceSearchInput) {
    serviceSearchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderServicesGrid();
    });
  }

  // ==========================================
  // BOOKING WIZARD LOGIC
  // ==========================================

  function toggleServiceSelection(service) {
    const idx = bookingState.selectedServices.findIndex(s => s.id === service.id);
    if (idx > -1) {
      bookingState.selectedServices.splice(idx, 1);
    } else {
      bookingState.selectedServices.push(service);
    }
    updateBookingSummary();
  }

  function renderBookingServicesList() {
    if (!wizardServicesList) return;

    wizardServicesList.innerHTML = allServices.map(service => {
      const isSelected = bookingState.selectedServices.some(s => s.id === service.id);
      return `
        <div class="booking-service-item ${isSelected ? 'selected' : ''}" data-id="${service.id}">
          <div class="bs-info">
            <div class="bs-checkbox">
              ${isSelected ? '<i class="fas fa-check" style="font-size: 0.75rem;"></i>' : ''}
            </div>
            <div class="bs-details">
              <h4>${service.name}</h4>
              <span><i class="far fa-clock"></i> ${service.durationMinutes} mins</span>
            </div>
          </div>
          <div class="bs-price">₹${service.price}</div>
        </div>
      `;
    }).join('');

    // Attach click handlers
    wizardServicesList.querySelectorAll('.booking-service-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const s = allServices.find(srv => srv.id === id);
        if (s) {
          toggleServiceSelection(s);
          renderBookingServicesList();
          renderServicesGrid();
        }
      });
    });

    updateBookingSummary();
  }

  function updateBookingSummary() {
    const count = bookingState.selectedServices.length;
    const total = bookingState.selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);

    if (wizardSelectedCount) {
      wizardSelectedCount.textContent = `${count} ${count === 1 ? 'Service' : 'Services'}`;
    }
    if (wizardSelectedTotal) {
      wizardSelectedTotal.textContent = `₹${total}`;
    }

    // Step 4 summary card
    if (summaryServicesText) {
      summaryServicesText.textContent = count > 0 
        ? bookingState.selectedServices.map(s => s.name).join(', ')
        : 'None selected';
    }
    if (summaryPriceText) {
      summaryPriceText.textContent = `₹${total}`;
    }
  }

  // Load Stylists
  async function loadStylists() {
    try {
      const res = await fetch('/api/stylists');
      const data = await res.json();
      if (data.success) {
        allStylists = data.data;
        renderStylistsSection();
      }
    } catch (err) {
      console.error('Error loading stylists:', err);
    }
  }

  function renderStylistsSection() {
    const grid = document.getElementById('stylistsGrid');
    if (!grid) return;

    const mid = Math.ceil(allStylists.length / 2);
    const leftStylists = allStylists.slice(0, mid);
    const rightStylists = allStylists.slice(mid);

    const renderCard = (st) => `
      <div class="stylist-card">
        <div class="stylist-img-wrap">
          <img src="${st.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80'}" alt="${st.name}" loading="lazy">
        </div>
        <div class="stylist-card-body">
          <h3 class="stylist-name">${st.name}</h3>
          <div class="stylist-role">${st.role}</div>
          <div class="stylist-spec">${st.specialization}</div>
          <button class="btn btn-sm btn-canva btn-book-with-stylist" data-stylist-id="${st.id}" data-stylist-name="${st.name}">
            Book with ${st.name.split(' ')[0]}
          </button>
        </div>
      </div>
    `;

    grid.innerHTML = `
      <div class="team-side-col">
        ${leftStylists.map(renderCard).join('')}
      </div>
      <div class="team-center-col">
        <h2 class="canva-serif-title">Meet Our<br>Team</h2>
        <p class="canva-body-text">
          Trained at international L'Oréal Professionnel academies, our master stylists, colorists, and bridal aestheticians bring precision, artistry, and passion to every chair.
        </p>
        <a href="#booking" class="btn btn-canva">Learn More</a>
      </div>
      <div class="team-side-col">
        ${rightStylists.map(renderCard).join('')}
      </div>
    `;

    grid.querySelectorAll('.btn-book-with-stylist').forEach(btn => {
      btn.addEventListener('click', () => {
        bookingState.selectedStylistId = btn.getAttribute('data-stylist-id');
        bookingState.selectedStylistName = btn.getAttribute('data-stylist-name');
        renderBookingStylists();
        switchStep(2);
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function renderBookingStylists() {
    if (!wizardStylistGrid) return;

    // Stylist cards options including "Any Available"
    const anyCard = `
      <div class="stylist-pick-card ${bookingState.selectedStylistId === 'any' ? 'selected' : ''}" data-id="any" data-name="Any Available Stylist">
        <div style="width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 12px auto; background: var(--gold-gradient-glow); border: 2px solid var(--border-color); display: flex; align-items: center; justify-content: center; font-size: 1.6rem; color: var(--gold-light);">
          <i class="fas fa-user-clock"></i>
        </div>
        <h4>Any Available</h4>
        <p>Shortest wait time & maximum slots</p>
      </div>
    `;

    const stylistCards = allStylists.map(st => `
      <div class="stylist-pick-card ${bookingState.selectedStylistId === st.id ? 'selected' : ''}" data-id="${st.id}" data-name="${st.name}">
        <img src="${st.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}" class="stylist-pick-avatar" alt="${st.name}">
        <h4>${st.name}</h4>
        <p>${st.role.split('&')[0]}</p>
      </div>
    `).join('');

    wizardStylistGrid.innerHTML = anyCard + stylistCards;

    wizardStylistGrid.querySelectorAll('.stylist-pick-card').forEach(card => {
      card.addEventListener('click', () => {
        wizardStylistGrid.querySelectorAll('.stylist-pick-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        bookingState.selectedStylistId = card.getAttribute('data-id');
        bookingState.selectedStylistName = card.getAttribute('data-name');
        if (step3SelectedStylist) {
          step3SelectedStylist.textContent = bookingState.selectedStylistName;
        }
        if (summaryStylistText) {
          summaryStylistText.textContent = bookingState.selectedStylistName;
        }
        fetchTimeSlots();
      });
    });

    if (step3SelectedStylist) {
      step3SelectedStylist.textContent = bookingState.selectedStylistName;
    }
    if (summaryStylistText) {
      summaryStylistText.textContent = bookingState.selectedStylistName;
    }
  }

  // Fetch available slots from backend
  async function fetchTimeSlots() {
    if (!wizardTimeSlotsGrid) return;
    wizardTimeSlotsGrid.innerHTML = '<div style="color: var(--text-muted); font-size: 0.85rem; padding: 12px;">Checking available chairs...</div>';

    try {
      const res = await fetch(`/api/slots?date=${bookingState.selectedDate}&stylistId=${bookingState.selectedStylistId}`);
      const data = await res.json();
      if (data.success) {
        renderTimeSlots(data.slots);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      wizardTimeSlotsGrid.innerHTML = '<div style="color: var(--danger); font-size: 0.85rem;">Failed to load time slots. Please try again.</div>';
    }
  }

  function renderTimeSlots(slots) {
    if (!wizardTimeSlotsGrid) return;

    wizardTimeSlotsGrid.innerHTML = slots.map(slot => {
      const isSelected = bookingState.selectedTimeSlot === slot.time;
      const isBooked = !slot.available;
      return `
        <div class="time-slot-chip ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}" 
             data-time="${slot.time}" 
             ${isBooked ? 'title="This slot is fully booked"' : ''}>
          ${slot.time}
        </div>
      `;
    }).join('');

    wizardTimeSlotsGrid.querySelectorAll('.time-slot-chip:not(.booked)').forEach(chip => {
      chip.addEventListener('click', () => {
        wizardTimeSlotsGrid.querySelectorAll('.time-slot-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        bookingState.selectedTimeSlot = chip.getAttribute('data-time');
        updateDateTimeSummary();
      });
    });
  }

  function updateDateTimeSummary() {
    if (summaryDateTimeText) {
      if (bookingState.selectedTimeSlot) {
        summaryDateTimeText.textContent = `${bookingState.selectedDate} at ${bookingState.selectedTimeSlot}`;
      } else {
        summaryDateTimeText.textContent = `${bookingState.selectedDate} (Select a time slot)`;
      }
    }
  }

  // Step switching helper
  function switchStep(stepNumber) {
    document.querySelectorAll('.wizard-step-node').forEach(node => {
      const step = parseInt(node.getAttribute('data-step'));
      if (step === stepNumber) {
        node.classList.add('active');
      } else if (step < stepNumber) {
        node.classList.remove('active');
        node.classList.add('completed');
      } else {
        node.classList.remove('active', 'completed');
      }
    });

    document.querySelectorAll('.wizard-step-content').forEach(content => {
      content.classList.remove('active');
    });

    const activeContent = document.getElementById(`wizardStep${stepNumber}`);
    if (activeContent) {
      activeContent.classList.add('active');
    }
  }

  // Step 1 -> 2
  if (btnNextStep1) {
    btnNextStep1.addEventListener('click', () => {
      if (bookingState.selectedServices.length === 0) {
        showToast('Please select at least one service before proceeding.', 'error');
        return;
      }
      switchStep(2);
    });
  }

  // Step 2 -> 1 & 2 -> 3
  if (btnPrevStep2) {
    btnPrevStep2.addEventListener('click', () => switchStep(1));
  }
  if (btnNextStep2) {
    btnNextStep2.addEventListener('click', () => {
      switchStep(3);
      fetchTimeSlots();
    });
  }

  // Step 3 -> 2 & 3 -> 4
  if (btnPrevStep3) {
    btnPrevStep3.addEventListener('click', () => switchStep(2));
  }
  if (btnNextStep3) {
    btnNextStep3.addEventListener('click', () => {
      if (!bookingState.selectedTimeSlot) {
        showToast('Please pick an available time slot for your appointment.', 'error');
        return;
      }
      updateDateTimeSummary();
      updateBookingSummary();
      switchStep(4);
    });
  }

  // Step 4 -> 3
  if (btnPrevStep4) {
    btnPrevStep4.addEventListener('click', () => switchStep(3));
  }

  // Step 4: Final Submission
  if (bookingFinalForm) {
    bookingFinalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('clientName').value.trim();
      const phone = document.getElementById('clientPhone').value.trim();
      const email = document.getElementById('clientEmail').value.trim();
      const notes = document.getElementById('clientSpecialNotes').value.trim();

      if (!name || !phone) {
        showToast('Please enter your name and phone number', 'error');
        return;
      }

      const totalAmount = bookingState.selectedServices.reduce((sum, s) => sum + (s.price || 0), 0);
      const serviceIds = bookingState.selectedServices.map(s => s.id);

      const payload = {
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        serviceIds: serviceIds,
        stylistId: bookingState.selectedStylistId,
        date: bookingState.selectedDate,
        timeSlot: bookingState.selectedTimeSlot,
        totalAmount: totalAmount,
        notes: notes
      };

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          if (data.data) {
            const state = getSyncState();
            state.createdBookings.unshift(data.data);
            saveSyncState(state);
          }
          bookingState.lastBookingResponse = data.data;
          renderConfirmationReceipt(data.data);
          switchStep('Success');
          showToast('Appointment successfully confirmed!', 'success');
        } else {
          showToast(data.message || 'Booking failed. Please try again.', 'error');
        }
      } catch (err) {
        console.error('Error submitting booking:', err);
        showToast('Server error while saving appointment. Please contact us on WhatsApp.', 'error');
      }
    });
  }

  // Render receipt
  function renderConfirmationReceipt(booking) {
    if (!confirmedReceiptBox) return;

    confirmedReceiptBox.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1.5px; color: var(--gold-primary);">Booking Reference ID</span>
        <div class="booking-ref-number">${booking.id}</div>
        <span style="display: inline-block; padding: 4px 12px; border-radius: var(--radius-full); background: rgba(16, 185, 129, 0.2); color: var(--success); font-weight: 700; font-size: 0.78rem;">
          Status: ${booking.status}
        </span>
      </div>

      <div class="receipt-row">
        <span>Client Name:</span>
        <strong style="color: var(--text-main);">${booking.customerName}</strong>
      </div>
      <div class="receipt-row">
        <span>Contact Phone:</span>
        <strong style="color: var(--text-main);">${booking.customerPhone}</strong>
      </div>
      <div class="receipt-row">
        <span>Date & Slot:</span>
        <strong style="color: var(--text-main);">${booking.date} at ${booking.timeSlot}</strong>
      </div>
      <div class="receipt-row">
        <span>Preferred Stylist:</span>
        <strong style="color: var(--text-main);">${booking.stylistName}</strong>
      </div>
      <div class="receipt-row">
        <span>Services Booked:</span>
        <strong style="color: var(--text-main); text-align: right; max-width: 60%;">${booking.serviceNames.join(', ')}</strong>
      </div>
      <div class="receipt-row">
        <span>Payable at Salon:</span>
        <span style="font-size: 1.25rem; color: var(--gold-primary);">₹${booking.totalAmount}</span>
      </div>
      <div style="margin-top: 14px; font-size: 0.75rem; color: var(--text-dim); text-align: center;">
        📍 Near Mahatma Gandhi Cancer Hospital, MVP Sector 3, Visakhapatnam
      </div>
    `;

    // Setup WhatsApp direct share
    if (btnWhatsAppConfirm) {
      const msg = encodeURIComponent(
        `Hello J Studio Luxury Beauty Salon! I have booked an appointment.\n\n` +
        `🔖 Booking ID: ${booking.id}\n` +
        `👤 Name: ${booking.customerName}\n` +
        `📅 Date: ${booking.date} at ${booking.timeSlot}\n` +
        `✂️ Services: ${booking.serviceNames.join(', ')}\n` +
        `💈 Stylist: ${booking.stylistName}\n` +
        `💰 Total: ₹${booking.totalAmount}\n\n` +
        `Please confirm my reservation.`
      );
      btnWhatsAppConfirm.onclick = () => {
        window.open(`https://wa.me/919882689999?text=${msg}`, '_blank');
      };
    }
  }

  // Reset booking wizard
  if (btnBookAnother) {
    btnBookAnother.addEventListener('click', () => {
      bookingState.selectedServices = [];
      bookingState.selectedStylistId = 'any';
      bookingState.selectedStylistName = 'Any Available Stylist';
      bookingState.selectedTimeSlot = null;
      renderBookingServicesList();
      renderBookingStylists();
      switchStep(1);
    });
  }

  // ==========================================
  // OFFERS, GALLERY & REVIEWS
  // ==========================================
  async function loadOffers() {
    try {
      const res = await fetch('/api/offers');
      const data = await res.json();
      if (data.success) {
        const grid = document.getElementById('offersGrid');
        if (!grid) return;
        grid.innerHTML = data.data.map(off => `
          <div class="offer-card">
            ${off.badge ? `<span class="offer-ribbon">${off.badge}</span>` : ''}
            <div class="offer-badge-percent">${off.discountPercent}% OFF</div>
            <h3 class="offer-title">${off.title}</h3>
            <p class="offer-desc">${off.description}</p>
            <div class="offer-coupon-box">
              <div>
                <span style="font-size: 0.72rem; color: var(--text-muted); display: block;">PROMO CODE</span>
                <span class="coupon-code">${off.code}</span>
              </div>
              <button class="btn btn-sm btn-canva btn-apply-offer" data-code="${off.code}">
                Use Offer
              </button>
            </div>
          </div>
        `).join('');

        grid.querySelectorAll('.btn-apply-offer').forEach(btn => {
          btn.addEventListener('click', () => {
            const code = btn.getAttribute('data-code');
            showToast(`Promo Code ${code} applied for your booking!`, 'success');
            document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
          });
        });
      }
    } catch (err) {
      console.error('Error loading offers:', err);
    }
  }

  async function loadGallery() {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (data.success) {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;
        grid.innerHTML = data.data.map(item => `
          <div class="gallery-item" onclick="window.open('${item.image}', '_blank')">
            <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';">
            <div class="gallery-overlay">
              <h4>${item.title}</h4>
              <span style="color: var(--gold-light); font-size: 0.75rem; text-transform: uppercase;">J Studio Vizag</span>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading gallery:', err);
    }
  }

  async function loadReviews() {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.success) {
        const grid = document.getElementById('reviewsGrid');
        if (!grid) return;
        grid.innerHTML = data.data.map(r => `
          <div class="review-card">
            <div class="review-stars">
              ${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}
            </div>
            <p class="review-text">"${r.text}"</p>
            <div class="review-author-block">
              <div>
                <div class="reviewer-name">${r.author}</div>
                <div class="reviewer-service">${r.serviceTaken || 'Salon Service'}</div>
              </div>
              <div class="reviewer-badge">
                <i class="fab fa-google" style="color: #4285F4;"></i>
                <span>${r.source || 'Google Review'}</span>
              </div>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error('Error loading reviews:', err);
    }
  }

  // ==========================================
  // TRACKING MODAL
  // ==========================================
  if (btnOpenTracker && trackerModal && btnCloseTracker) {
    btnOpenTracker.addEventListener('click', () => {
      trackerModal.classList.add('open');
      if (trackResultBox) trackResultBox.style.display = 'none';
      if (trackInputCode) trackInputCode.value = '';
    });

    btnCloseTracker.addEventListener('click', () => {
      trackerModal.classList.remove('open');
    });

    trackerModal.addEventListener('click', (e) => {
      if (e.target === trackerModal) trackerModal.classList.remove('open');
    });

    if (btnSubmitTrack && trackInputCode) {
      btnSubmitTrack.addEventListener('click', async () => {
        const code = trackInputCode.value.trim();
        if (!code) {
          showToast('Please enter a booking code', 'error');
          return;
        }

        try {
          const res = await fetch(`/api/bookings/track/${encodeURIComponent(code)}`);
          const data = await res.json();
          if (data.success && trackResultBox) {
            const b = data.data;
            trackResultBox.style.display = 'block';
            trackResultBox.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <h4 style="color: var(--text-main); font-size: 1rem;">Booking Details</h4>
                <span style="background: rgba(176, 130, 39, 0.14); color: var(--gold-primary); padding: 3px 10px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 600;">
                  ${b.status}
                </span>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">Client: <strong style="color: var(--text-main);">${b.customerName}</strong></p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">Date & Time: <strong style="color: var(--text-main);">${b.date} at ${b.timeSlot}</strong></p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">Stylist: <strong style="color: var(--text-main);">${b.stylistName}</strong></p>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 6px;">Services: <strong style="color: var(--text-main);">${b.serviceNames.join(', ')}</strong></p>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Amount: <strong style="color: var(--gold-primary);">₹${b.totalAmount}</strong></p>
            `;
          } else {
            showToast('No booking found with this ID', 'error');
            if (trackResultBox) trackResultBox.style.display = 'none';
          }
        } catch (err) {
          console.error(err);
          showToast('Failed to track booking', 'error');
        }
      });
    }
  }

  // ==========================================
  // WRITE REVIEW MODAL
  // ==========================================
  if (btnOpenWriteReview && writeReviewModal && btnCloseReviewModal) {
    btnOpenWriteReview.addEventListener('click', () => writeReviewModal.classList.add('open'));
    btnCloseReviewModal.addEventListener('click', () => writeReviewModal.classList.remove('open'));
    writeReviewModal.addEventListener('click', (e) => {
      if (e.target === writeReviewModal) writeReviewModal.classList.remove('open');
    });

    if (writeReviewForm) {
      writeReviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const author = document.getElementById('revAuthor').value.trim();
        const rating = document.getElementById('revRating').value;
        const serviceTaken = document.getElementById('revService').value.trim();
        const text = document.getElementById('revText').value.trim();

        try {
          const res = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, rating, serviceTaken, text })
          });
          const data = await res.json();
          if (data.success) {
            showToast('Thank you! Your review has been submitted.', 'success');
            writeReviewModal.classList.remove('open');
            writeReviewForm.reset();
            loadReviews();
          }
        } catch (err) {
          console.error(err);
          showToast('Error submitting review', 'error');
        }
      });
    }
  }

  // ==========================================
  // CONTACT FORM
  // ==========================================
  if (contactInquiryForm) {
    contactInquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('inqName').value.trim();
      const phone = document.getElementById('inqPhone').value.trim();
      const message = document.getElementById('inqMessage').value.trim();

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, message })
        });
        const data = await res.json();
        if (data.success) {
          showToast('Inquiry received! We will contact you shortly.', 'success');
          contactInquiryForm.reset();
        }
      } catch (err) {
        console.error(err);
        showToast('Error sending inquiry', 'error');
      }
    });
  }

  // Helper Toast notification
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
});
