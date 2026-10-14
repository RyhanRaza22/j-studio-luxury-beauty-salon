// ===================================================================
// J STUDIO LUXURY BEAUTY SALON - ADMIN DASHBOARD SCRIPT
// MVP Colony, Visakhapatnam
// ===================================================================

document.addEventListener('DOMContentLoaded', () => {
  let authToken = localStorage.getItem('jstudio_admin_token') || localStorage.getItem('toppers_admin_token');
  let currentAdminUser = null;
  let cachedBookings = [];
  let cachedServices = [];
  let cachedStylists = [];

  // DOM Elements
  const loginOverlay = document.getElementById('loginOverlay');
  const loginForm = document.getElementById('loginForm');
  const btnLogout = document.getElementById('btnLogout');
  const currentUserName = document.getElementById('currentUserName');
  const pageTitle = document.getElementById('pageTitle');

  // Navigation Items
  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // KPI elements
  const kpiRevenue = document.getElementById('kpiRevenue');
  const kpiTotalBookings = document.getElementById('kpiTotalBookings');
  const kpiPendingBookings = document.getElementById('kpiPendingBookings');
  const kpiTotalServices = document.getElementById('kpiTotalServices');
  const recentBookingsTbody = document.getElementById('recentBookingsTbody');
  const topServicesList = document.getElementById('topServicesList');

  // Appointments elements
  const allBookingsTbody = document.getElementById('allBookingsTbody');
  const filterBookingStatus = document.getElementById('filterBookingStatus');
  const searchBookingInput = document.getElementById('searchBookingInput');
  const btnOpenNewBookingModal = document.getElementById('btnOpenNewBookingModal');
  const btnQuickNewBooking = document.getElementById('btnQuickNewBooking');
  const btnDeleteCompletedBookings = document.getElementById('btnDeleteCompletedBookings');
  const btnQuickClearCompleted = document.getElementById('btnQuickClearCompleted');

  // Services elements
  const adminServicesTbody = document.getElementById('adminServicesTbody');
  const filterServiceCategory = document.getElementById('filterServiceCategory');
  const btnOpenAddServiceModal = document.getElementById('btnOpenAddServiceModal');
  const serviceForm = document.getElementById('serviceForm');

  // Stylists elements
  const adminStylistsTbody = document.getElementById('adminStylistsTbody');
  const btnOpenAddStylistModal = document.getElementById('btnOpenAddStylistModal');
  const stylistForm = document.getElementById('stylistForm');

  // Offers elements
  const adminOffersTbody = document.getElementById('adminOffersTbody');
  const btnOpenAddOfferModal = document.getElementById('btnOpenAddOfferModal');

  // Reviews & Inquiries
  const adminReviewsTbody = document.getElementById('adminReviewsTbody');
  const adminInquiriesTbody = document.getElementById('adminInquiriesTbody');
  const adminGalleryGrid = document.getElementById('adminGalleryGrid');
  const btnOpenAddGalleryModal = document.getElementById('btnOpenAddGalleryModal');
  const galleryForm = document.getElementById('galleryForm');

  // Settings forms
  const salonSettingsForm = document.getElementById('salonSettingsForm');
  const changePasswordForm = document.getElementById('changePasswordForm');

  // Manual Walk-in form
  const walkInForm = document.getElementById('walkInForm');
  const walkStylist = document.getElementById('walkStylist');
  const walkDate = document.getElementById('walkDate');
  const walkStatus = document.getElementById('walkStatus');
  const walkServiceSelect = document.getElementById('walkServiceSelect');

  // Booking Sync State Helper (ensures serverless cold-start resilience)
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

  async function syncBookingsWithServer() {
    const state = getSyncState();
    try {
      const res = await fetch('/api/bookings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state)
      });
      return await res.json();
    } catch (err) {
      console.error('Sync error:', err);
      return null;
    }
  }

  // Initialize
  checkAuth();

  // ==========================================
  // AUTHENTICATION LOGIC
  // ==========================================
  async function checkAuth() {
    if (!authToken) {
      showLogin(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        currentAdminUser = data.user;
        if (currentUserName) currentUserName.textContent = data.user.name || data.user.username;
        showLogin(false);
        initDashboard();
      } else {
        localStorage.removeItem('jstudio_admin_token');
        localStorage.removeItem('toppers_admin_token');
        authToken = null;
        showLogin(true);
      }
    } catch (err) {
      console.error('Auth verification error:', err);
      showLogin(true);
    }
  }

  function showLogin(show) {
    if (loginOverlay) {
      loginOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          authToken = data.token;
          localStorage.setItem('jstudio_admin_token', authToken);
          localStorage.setItem('toppers_admin_token', authToken);
          currentAdminUser = data.user;
          if (currentUserName) currentUserName.textContent = data.user.name;
          showLogin(false);
          adminToast('Welcome back, ' + data.user.name, 'success');
          initDashboard();
        } else {
          adminToast(data.message || 'Invalid login details', 'error');
        }
      } catch (err) {
        console.error(err);
        adminToast('Login failed. Please check network connection.', 'error');
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      localStorage.removeItem('jstudio_admin_token');
      localStorage.removeItem('toppers_admin_token');
      authToken = null;
      showLogin(true);
      adminToast('You have been logged out.', 'info');
    });
  }

  // ==========================================
  // TAB NAVIGATION
  // ==========================================
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.getAttribute('data-tab');
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      tabPanes.forEach(p => p.style.display = 'none');

      const targetPane = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
      if (targetPane) targetPane.style.display = 'block';

      // Update Topbar Title
      const titles = {
        'overview': 'Dashboard Overview',
        'appointments': 'Salon Appointments & Bookings',
        'services': 'Service Catalog & Rates',
        'stylists': 'Stylists & Aesthetician Team',
        'offers': 'Promotions & Discount Codes',
        'reviews': 'Customer Testimonials & Google Reviews',
        'inquiries': 'Customer Inquiries & Messages',
        'gallery': 'Gallery & Portfolio Media',
        'settings': 'Salon Settings & Security'
      };
      if (pageTitle) pageTitle.textContent = titles[tab] || 'Admin Dashboard';

      // Reload section data
      if (tab === 'overview') loadStats();
      if (tab === 'appointments') loadAppointments();
      if (tab === 'services') loadServices();
      if (tab === 'stylists') loadStylists();
      if (tab === 'offers') loadOffers();
      if (tab === 'reviews') loadReviews();
      if (tab === 'inquiries') loadInquiries();
      if (tab === 'gallery') loadGallery();
      if (tab === 'settings') loadSettings();
    });
  });

  // ==========================================
  // INITIAL DASHBOARD LOAD
  // ==========================================
  async function initDashboard() {
    loadStats();
    loadAppointments();
    loadServices();
    loadStylists();
    loadOffers();
    loadReviews();
    loadInquiries();
    loadGallery();
    loadSettings();
  }

  // Helper for Authenticated Fetch
  async function authFetch(url, options = {}) {
    const headers = options.headers || {};
    headers['Authorization'] = `Bearer ${authToken}`;
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem('jstudio_admin_token');
      localStorage.removeItem('toppers_admin_token');
      showLogin(true);
      throw new Error('Authentication expired');
    }
    return res.json();
  }

  // ==========================================
  // 1. DASHBOARD STATS
  // ==========================================
  function renderStatsView(s) {
    if (!s) return;
    if (kpiRevenue) kpiRevenue.textContent = `₹${(s.totalRevenue || 0).toLocaleString('en-IN')}`;
    if (kpiTotalBookings) kpiTotalBookings.textContent = s.totalBookings || 0;
    if (kpiPendingBookings) kpiPendingBookings.textContent = s.pendingBookings || 0;
    if (kpiTotalServices) kpiTotalServices.textContent = s.totalServices || 0;

    // Render Recent Bookings in Overview
    if (recentBookingsTbody) {
      const recent = s.recentBookings || [];
      if (recent.length === 0) {
        recentBookingsTbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align: center; padding: 28px; color: var(--text-muted);">
              No recent appointments found. Click "Walk-in Booking" to add one.
            </td>
          </tr>
        `;
      } else {
        recentBookingsTbody.innerHTML = recent.map(b => {
          let actionButtons = '';
          if (b.status === 'Pending') {
            actionButtons = `
              <button class="btn btn-sm btn-gold" onclick="updateBookingStatus('${b.id}', 'Confirmed')">
                Confirm
              </button>
            `;
          } else if (b.status === 'Confirmed') {
            actionButtons = `
              <button class="btn btn-sm btn-outline-gold" onclick="updateBookingStatus('${b.id}', 'Completed')">
                Complete
              </button>
            `;
          }
          return `
            <tr>
              <td><strong style="color: var(--gold-light); font-size: 0.8rem;">${b.id}</strong></td>
              <td>${b.customerName}</td>
              <td><a href="tel:${b.customerPhone}" style="color: var(--text-muted);">${b.customerPhone}</a></td>
              <td>${b.date} • ${b.timeSlot}</td>
              <td>${b.stylistName || 'Any Available Stylist'}</td>
              <td><strong>₹${b.totalAmount}</strong></td>
              <td><span class="badge-status ${b.status}">${b.status}</span></td>
              <td>
                <div style="display: flex; gap: 6px; align-items: center;">
                  ${actionButtons}
                  <button class="btn btn-sm btn-danger" onclick="deleteBooking('${b.id}')" title="Delete Appointment">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Top Services Popularity
    if (topServicesList) {
      if ((s.topServices || []).length === 0) {
        topServicesList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.88rem;">No service booking statistics recorded yet.</p>';
      } else {
        topServicesList.innerHTML = s.topServices.map(ts => `
          <div style="margin-bottom: 14px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 4px;">
              <span style="color: #fff; font-weight: 600;">${ts.name}</span>
              <span style="color: var(--gold-light); font-weight: 700;">${ts.count} Bookings</span>
            </div>
            <div style="background: rgba(255,255,255,0.06); height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="width: ${Math.min(ts.count * 20, 100)}%; background: var(--gold-gradient); height: 100%;"></div>
            </div>
          </div>
        `).join('');
      }
    }
  }

  async function loadStats() {
    try {
      const synced = await syncBookingsWithServer();
      if (synced && synced.success && synced.stats) {
        renderStatsView(synced.stats);
        return;
      }
      const data = await authFetch('/api/dashboard/stats');
      if (data.success) {
        renderStatsView(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // ==========================================
  // 2. APPOINTMENTS MANAGEMENT
  // ==========================================
  async function loadAppointments() {
    try {
      const synced = await syncBookingsWithServer();
      if (synced && synced.success && Array.isArray(synced.data)) {
        cachedBookings = synced.data;
        renderAppointmentsTable();
        if (synced.stats) renderStatsView(synced.stats);
        return;
      }
      const data = await authFetch('/api/bookings');
      if (data.success) {
        cachedBookings = data.data;
        renderAppointmentsTable();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderAppointmentsTable() {
    if (!allBookingsTbody) return;

    let filtered = [...cachedBookings];
    const statusFilter = filterBookingStatus ? filterBookingStatus.value : 'All';
    const searchQuery = searchBookingInput ? searchBookingInput.value.trim().toLowerCase() : '';

    if (statusFilter !== 'All') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter(b =>
        (b.customerName || '').toLowerCase().includes(searchQuery) ||
        (b.id || '').toLowerCase().includes(searchQuery) ||
        (b.customerPhone || '').includes(searchQuery)
      );
    }

    if (filtered.length === 0) {
      allBookingsTbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 36px; color: var(--text-muted);">
            No appointments found matching this criteria.
          </td>
        </tr>
      `;
      return;
    }

    allBookingsTbody.innerHTML = filtered.map(b => {
      const cleanPhone = (b.customerPhone || '').replace(/[^0-9]/g, '');
      const servicesList = Array.isArray(b.serviceNames) ? b.serviceNames.join(', ') : (b.customServiceName || 'Salon Service');
      const whatsAppMsg = encodeURIComponent(
        `Hello ${b.customerName}! Greetings from J Studio Luxury Beauty Salon, MVP Colony.\n` +
        `Your appointment (Ref ID: ${b.id}) on ${b.date} at ${b.timeSlot} is ${b.status}.\n` +
        `Services: ${servicesList}\n` +
        `Stylist: ${b.stylistName || 'Any Available Stylist'}\n` +
        `Total: ₹${b.totalAmount}\n` +
        `We look forward to styling you!`
      );

      return `
        <tr>
          <td><strong style="color: var(--gold-light); font-size: 0.82rem;">${b.id}</strong></td>
          <td><strong>${b.customerName}</strong></td>
          <td>
            <a href="tel:${b.customerPhone}" style="color: var(--text-muted);">${b.customerPhone}</a>
          </td>
          <td>${b.date}<br><small style="color: var(--text-dim);">${b.timeSlot}</small></td>
          <td>${b.stylistName || 'Any Available Stylist'}</td>
          <td style="max-width: 200px; font-size: 0.82rem; color: var(--text-muted);">${servicesList}</td>
          <td><strong style="color: var(--gold-light);">₹${b.totalAmount}</strong></td>
          <td>
            <select class="form-control" style="width: auto; padding: 4px 8px; font-size: 0.78rem;" onchange="updateBookingStatus('${b.id}', this.value)">
              <option value="Pending" ${b.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Confirmed" ${b.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
              <option value="Completed" ${b.status === 'Completed' ? 'selected' : ''}>Completed</option>
              <option value="Cancelled" ${b.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-sm btn-outline-gold" onclick="viewBookingDetails('${b.id}')" title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              <a href="https://wa.me/${cleanPhone}?text=${whatsAppMsg}" target="_blank" class="btn btn-sm btn-gold" title="Send WhatsApp Message">
                <i class="fab fa-whatsapp"></i>
              </a>
              <button class="btn btn-sm btn-danger" onclick="deleteBooking('${b.id}')" title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (filterBookingStatus) filterBookingStatus.addEventListener('change', renderAppointmentsTable);
  if (searchBookingInput) searchBookingInput.addEventListener('input', renderAppointmentsTable);

  // Global functions attached to window for table action handlers
  window.updateBookingStatus = async function (id, newStatus) {
    try {
      // Update local sync state immediately
      const state = getSyncState();
      state.updatedBookings[id] = { status: newStatus };
      state.createdBookings = state.createdBookings.map(cb =>
        cb.id === id ? { ...cb, status: newStatus } : cb
      );
      saveSyncState(state);

      const data = await authFetch(`/api/bookings/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      if (data.success) {
        adminToast(`Booking ${id} status updated to ${newStatus}`, 'success');
        await loadAppointments();
      }
    } catch (err) {
      console.error(err);
      adminToast('Failed to update status', 'error');
    }
  };

  window.deleteBooking = async function (id) {
    if (!confirm(`Are you sure you want to permanently delete appointment ${id}?`)) return;
    try {
      // Record deletion in persistent sync state
      const state = getSyncState();
      if (!state.deletedIds.includes(id)) {
        state.deletedIds.push(id);
      }
      state.createdBookings = state.createdBookings.filter(cb => cb.id !== id);
      delete state.updatedBookings[id];
      saveSyncState(state);

      // Optimistically remove from cachedBookings
      cachedBookings = cachedBookings.filter(b => b.id !== id);
      renderAppointmentsTable();

      const data = await authFetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (data.success) {
        adminToast(`Appointment ${id} deleted`, 'info');
        await loadAppointments();
      }
    } catch (err) {
      console.error(err);
      adminToast('Failed to delete booking', 'error');
    }
  };

  async function clearCompletedBookings() {
    const completedList = cachedBookings.filter(b => b.status === 'Completed');
    if (completedList.length === 0) {
      adminToast('There are no completed appointments to delete.', 'info');
      return;
    }

    if (!confirm(`Delete all ${completedList.length} completed appointment(s)?`)) return;

    try {
      const completedIds = completedList.map(b => b.id);
      const state = getSyncState();
      completedIds.forEach(id => {
        if (!state.deletedIds.includes(id)) {
          state.deletedIds.push(id);
        }
        delete state.updatedBookings[id];
      });
      state.createdBookings = state.createdBookings.filter(cb => !completedIds.includes(cb.id));
      saveSyncState(state);

      cachedBookings = cachedBookings.filter(b => b.status !== 'Completed');
      renderAppointmentsTable();

      const data = await authFetch('/api/bookings/completed', { method: 'DELETE' });
      if (data.success) {
        adminToast(data.message || `Deleted ${completedIds.length} completed appointment(s)`, 'info');
        await loadAppointments();
      }
    } catch (err) {
      console.error(err);
      adminToast('Failed to delete completed bookings', 'error');
    }
  }

  if (btnDeleteCompletedBookings) {
    btnDeleteCompletedBookings.addEventListener('click', clearCompletedBookings);
  }
  if (btnQuickClearCompleted) {
    btnQuickClearCompleted.addEventListener('click', clearCompletedBookings);
  }

  window.viewBookingDetails = function (id) {
    const booking = cachedBookings.find(b => b.id === id);
    if (!booking) return;

    const servicesList = Array.isArray(booking.serviceNames) ? booking.serviceNames.join(', ') : (booking.customServiceName || 'Salon Service');
    const detailsBox = document.getElementById('bookingDetailsBody');
    if (detailsBox) {
      detailsBox.innerHTML = `
        <div style="background: rgba(11, 15, 23, 0.7); border: 1px solid var(--admin-border-gold); padding: 20px; border-radius: var(--radius-sm); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="font-size: 0.8rem; color: var(--gold-light);">REFERENCE ID: ${booking.id}</span>
            <span class="badge-status ${booking.status}">${booking.status}</span>
          </div>
          <p><strong>Customer:</strong> ${booking.customerName}</p>
          <p><strong>Phone:</strong> ${booking.customerPhone}</p>
          <p><strong>Email:</strong> ${booking.customerEmail || 'Not provided'}</p>
          <p><strong>Date & Time:</strong> ${booking.date} at ${booking.timeSlot}</p>
          <p><strong>Stylist Assigned:</strong> ${booking.stylistName || 'Any Available Stylist'}</p>
          <p><strong>Services:</strong> ${servicesList}</p>
          <p><strong>Notes:</strong> ${booking.notes || 'None'}</p>
          <p style="margin-top: 10px; font-size: 1.15rem; color: var(--gold-light);"><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button class="btn btn-outline-gold" onclick="window.print()"><i class="fas fa-print"></i> Print Receipt</button>
          <button class="btn btn-gold" onclick="closeAdminModal('viewBookingModal')">Close</button>
        </div>
      `;
    }
    openAdminModal('viewBookingModal');
  };

  // Walk-in booking modal
  if (btnOpenNewBookingModal) {
    btnOpenNewBookingModal.addEventListener('click', openWalkInModal);
  }
  if (btnQuickNewBooking) {
    btnQuickNewBooking.addEventListener('click', openWalkInModal);
  }

  if (walkServiceSelect) {
    walkServiceSelect.addEventListener('change', () => {
      const selectedId = walkServiceSelect.value;
      if (!selectedId) return;
      const srv = cachedServices.find(s => s.id === selectedId);
      if (srv) {
        const nameInput = document.getElementById('walkServiceName');
        const amountInput = document.getElementById('walkAmount');
        if (nameInput) nameInput.value = srv.name;
        if (amountInput) amountInput.value = srv.price;
      }
    });
  }

  function openWalkInModal() {
    if (walkDate) {
      const today = new Date().toISOString().slice(0, 10);
      walkDate.value = today;
    }
    // Populate stylists
    if (walkStylist) {
      walkStylist.innerHTML = '<option value="any">Any Available Stylist</option>' +
        cachedStylists.map(s => `<option value="${s.id}">${s.name} (${(s.role || '').split('&')[0].trim()})</option>`).join('');
    }
    // Populate services dropdown
    if (walkServiceSelect) {
      walkServiceSelect.innerHTML = '<option value="">-- Choose from menu or type custom below --</option>' +
        cachedServices.map(s => `<option value="${s.id}">${s.name} — ₹${s.price}</option>`).join('');
    }
    openAdminModal('walkInModal');
  }

  if (walkInForm) {
    walkInForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const selectedSrvId = walkServiceSelect ? walkServiceSelect.value : '';
      const customName = document.getElementById('walkServiceName').value.trim();
      const payload = {
        customerName: document.getElementById('walkName').value.trim(),
        customerPhone: document.getElementById('walkPhone').value.trim(),
        date: document.getElementById('walkDate').value,
        timeSlot: document.getElementById('walkSlot').value,
        stylistId: document.getElementById('walkStylist').value,
        status: walkStatus ? walkStatus.value : 'Confirmed',
        serviceIds: selectedSrvId ? [selectedSrvId] : [],
        serviceNames: customName ? [customName] : undefined,
        customServiceName: customName || 'Walk-in Service',
        totalAmount: Number(document.getElementById('walkAmount').value) || 299
      };

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success && data.data) {
          // Persist in local sync state so serverless cold-starts never lose it
          const state = getSyncState();
          state.createdBookings.unshift(data.data);
          saveSyncState(state);

          adminToast(`Booking ${data.data.id} created successfully!`, 'success');
          closeAdminModal('walkInModal');
          walkInForm.reset();
          await loadAppointments();
        } else {
          adminToast(data.message || 'Failed to create booking', 'error');
        }
      } catch (err) {
        console.error(err);
        adminToast('Failed to create walk-in booking', 'error');
      }
    });
  }

  // ==========================================
  // 3. SERVICE CATALOG MANAGEMENT
  // ==========================================
  async function loadServices() {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      if (data.success) {
        cachedServices = data.data;
        renderServicesTable();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderServicesTable() {
    if (!adminServicesTbody) return;

    let filtered = [...cachedServices];
    const cat = filterServiceCategory ? filterServiceCategory.value : 'all';
    if (cat !== 'all') {
      filtered = filtered.filter(s => s.category === cat);
    }

    adminServicesTbody.innerHTML = filtered.map(s => `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="${s.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=100&q=80'}" style="width: 44px; height: 44px; border-radius: 6px; object-fit: cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=100&q=80';">
            <div>
              <strong>${s.name}</strong>
              ${s.popular ? '<span style="background: #ef4444; color: #fff; font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; margin-left: 6px;">HOT</span>' : ''}
              <div style="font-size: 0.75rem; color: var(--text-dim); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${s.description || ''}</div>
            </div>
          </div>
        </td>
        <td><span style="text-transform: capitalize; color: var(--text-muted);">${s.category}</span></td>
        <td>${s.durationMinutes} mins</td>
        <td><strong style="color: var(--gold-light);">₹${s.price}</strong></td>
        <td>${s.originalPrice ? `<span style="text-decoration: line-through; color: var(--text-dim);">₹${s.originalPrice}</span>` : '-'}</td>
        <td>
          <button class="btn btn-sm ${s.active !== false ? 'btn-gold' : 'btn-danger'}" onclick="toggleServiceActive('${s.id}', ${s.active !== false})">
            ${s.active !== false ? 'Active' : 'Inactive'}
          </button>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-outline-gold" onclick="editService('${s.id}')"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteService('${s.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (filterServiceCategory) filterServiceCategory.addEventListener('change', renderServicesTable);

  if (btnOpenAddServiceModal) {
    btnOpenAddServiceModal.addEventListener('click', () => {
      document.getElementById('serviceModalTitle').textContent = 'Add New Service';
      document.getElementById('serviceEditId').value = '';
      if (serviceForm) serviceForm.reset();
      document.getElementById('srvFormActive').checked = true;
      openAdminModal('serviceModal');
    });
  }

  if (serviceForm) {
    serviceForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('serviceEditId').value;
      const payload = {
        name: document.getElementById('srvFormName').value.trim(),
        category: document.getElementById('srvFormCategory').value,
        durationMinutes: Number(document.getElementById('srvFormDuration').value) || 30,
        price: Number(document.getElementById('srvFormPrice').value),
        originalPrice: Number(document.getElementById('srvFormOriginalPrice').value) || null,
        description: document.getElementById('srvFormDesc').value.trim(),
        image: document.getElementById('srvFormImage').value.trim() || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
        popular: document.getElementById('srvFormPopular').checked,
        active: document.getElementById('srvFormActive').checked
      };

      try {
        const url = id ? `/api/services/${id}` : '/api/services';
        const method = id ? 'PUT' : 'POST';
        const data = await authFetch(url, { method, body: JSON.stringify(payload) });

        if (data.success) {
          adminToast(id ? 'Service updated successfully' : 'New service created', 'success');
          closeAdminModal('serviceModal');
          loadServices();
          loadStats();
        }
      } catch (err) {
        console.error(err);
        adminToast('Failed to save service', 'error');
      }
    });
  }

  window.editService = function (id) {
    const s = cachedServices.find(srv => srv.id === id);
    if (!s) return;

    document.getElementById('serviceModalTitle').textContent = 'Edit Service';
    document.getElementById('serviceEditId').value = s.id;
    document.getElementById('srvFormName').value = s.name;
    document.getElementById('srvFormCategory').value = s.category;
    document.getElementById('srvFormDuration').value = s.durationMinutes || 30;
    document.getElementById('srvFormPrice').value = s.price;
    document.getElementById('srvFormOriginalPrice').value = s.originalPrice || '';
    document.getElementById('srvFormDesc').value = s.description || '';
    document.getElementById('srvFormImage').value = s.image || '';
    document.getElementById('srvFormPopular').checked = !!s.popular;
    document.getElementById('srvFormActive').checked = s.active !== false;

    openAdminModal('serviceModal');
  };

  window.toggleServiceActive = async function (id, currentActive) {
    try {
      const data = await authFetch(`/api/services/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !currentActive })
      });
      if (data.success) {
        adminToast('Service visibility toggled', 'info');
        loadServices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.deleteService = async function (id) {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const data = await authFetch(`/api/services/${id}`, { method: 'DELETE' });
      if (data.success) {
        adminToast('Service deleted', 'info');
        loadServices();
        loadStats();
      }
    } catch (err) {
      console.error(err);
      adminToast('Failed to delete service', 'error');
    }
  };

  // ==========================================
  // 4. STYLISTS MANAGEMENT
  // ==========================================
  async function loadStylists() {
    try {
      const res = await fetch('/api/stylists');
      const data = await res.json();
      if (data.success) {
        cachedStylists = data.data;
        renderStylistsTable();
      }
    } catch (err) {
      console.error(err);
    }
  }

  function renderStylistsTable() {
    if (!adminStylistsTbody) return;

    adminStylistsTbody.innerHTML = cachedStylists.map(st => `
      <tr>
        <td>
          <img src="${st.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--admin-border-gold);">
        </td>
        <td><strong>${st.name}</strong></td>
        <td style="color: var(--gold-light); font-size: 0.82rem;">${st.role}</td>
        <td>${st.specialization || '-'}</td>
        <td>${st.experience || '-'}</td>
        <td>
          <span class="badge-status ${st.active !== false ? 'Confirmed' : 'Cancelled'}">
            ${st.active !== false ? 'Active' : 'On Leave'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-danger" onclick="deleteStylist('${st.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (btnOpenAddStylistModal) {
    btnOpenAddStylistModal.addEventListener('click', () => {
      document.getElementById('stylistModalTitle').textContent = 'Add Stylist';
      document.getElementById('stylistEditId').value = '';
      if (stylistForm) stylistForm.reset();
      openAdminModal('stylistModal');
    });
  }

  if (stylistForm) {
    stylistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('styFormName').value.trim(),
        role: document.getElementById('styFormRole').value.trim(),
        specialization: document.getElementById('styFormSpec').value.trim(),
        experience: document.getElementById('styFormExp').value.trim(),
        rating: Number(document.getElementById('styFormRating').value) || 4.9,
        photo: document.getElementById('styFormPhoto').value.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      };

      try {
        const data = await authFetch('/api/stylists', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (data.success) {
          adminToast('Stylist added successfully', 'success');
          closeAdminModal('stylistModal');
          loadStylists();
        }
      } catch (err) {
        console.error(err);
        adminToast('Failed to add stylist', 'error');
      }
    });
  }

  window.deleteStylist = async function (id) {
    if (!confirm('Are you sure you want to remove this stylist?')) return;
    try {
      const data = await authFetch(`/api/stylists/${id}`, { method: 'DELETE' });
      if (data.success) {
        adminToast('Stylist removed', 'info');
        loadStylists();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // 5. OFFERS MANAGEMENT
  // ==========================================
  async function loadOffers() {
    try {
      const res = await fetch('/api/offers');
      const data = await res.json();
      if (data.success && adminOffersTbody) {
        adminOffersTbody.innerHTML = data.data.map(off => `
          <tr>
            <td><strong style="color: var(--gold-light);">${off.code}</strong></td>
            <td><strong>${off.title}</strong><div style="font-size: 0.75rem; color: var(--text-dim);">${off.description || ''}</div></td>
            <td><span style="font-size: 1.1rem; font-weight: 800; color: #fff;">${off.discountPercent}%</span></td>
            <td><span style="background: rgba(212,175,55,0.15); color: var(--gold-light); padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.72rem;">${off.badge || 'Promo'}</span></td>
            <td>${off.validUntil || 'Ongoing'}</td>
            <td><span class="badge-status ${off.active !== false ? 'Confirmed' : 'Cancelled'}">${off.active !== false ? 'Active' : 'Expired'}</span></td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="deleteOffer('${off.id}')"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  window.deleteOffer = async function (id) {
    if (!confirm('Are you sure you want to delete this offer?')) return;
    try {
      const data = await authFetch(`/api/offers/${id}`, { method: 'DELETE' });
      if (data.success) {
        adminToast('Offer deleted', 'info');
        loadOffers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // 6. REVIEWS MANAGEMENT
  // ==========================================
  async function loadReviews() {
    try {
      const res = await fetch('/api/reviews');
      const data = await res.json();
      if (data.success && adminReviewsTbody) {
        adminReviewsTbody.innerHTML = data.data.map(r => `
          <tr>
            <td><strong>${r.author}</strong></td>
            <td><span style="color: #fbbf24;">${'★'.repeat(r.rating || 5)}</span></td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">${r.serviceTaken || '-'}</td>
            <td style="max-width: 250px; font-size: 0.82rem; color: var(--text-muted);">${r.text}</td>
            <td><span style="color: var(--text-dim); font-size: 0.75rem;">${r.source || 'Website'}</span></td>
            <td>
              <button class="btn btn-sm ${r.featured ? 'btn-gold' : 'btn-outline-gold'}" onclick="toggleFeatureReview('${r.id}', ${!!r.featured})">
                ${r.featured ? 'Featured ★' : 'Standard'}
              </button>
            </td>
            <td>
              <button class="btn btn-sm btn-danger" onclick="deleteReview('${r.id}')"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `).join('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  window.toggleFeatureReview = async function (id, curFeatured) {
    try {
      const data = await authFetch(`/api/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ featured: !curFeatured })
      });
      if (data.success) {
        adminToast('Review featured status updated', 'info');
        loadReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.deleteReview = async function (id) {
    if (!confirm('Delete this customer review?')) return;
    try {
      const data = await authFetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (data.success) {
        adminToast('Review deleted', 'info');
        loadReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // 7. INQUIRIES MANAGEMENT
  // ==========================================
  async function loadInquiries() {
    try {
      const data = await authFetch('/api/inquiries');
      if (data.success && adminInquiriesTbody) {
        if (data.data.length === 0) {
          adminInquiriesTbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">No inquiries recorded.</td></tr>';
          return;
        }

        adminInquiriesTbody.innerHTML = data.data.map(inq => {
          const cleanPhone = (inq.phone || '').replace(/[^0-9]/g, '');
          return `
            <tr>
              <td style="font-size: 0.8rem; color: var(--text-dim);">${new Date(inq.date).toLocaleDateString()}</td>
              <td><strong>${inq.name}</strong></td>
              <td><a href="tel:${inq.phone}" style="color: var(--text-muted);">${inq.phone}</a></td>
              <td style="max-width: 250px; font-size: 0.85rem;">${inq.message}</td>
              <td>
                <span class="badge-status ${inq.status === 'unread' ? 'Pending' : 'Confirmed'}">
                  ${inq.status}
                </span>
              </td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(inq.name)},%20thank%20you%20for%20contacting%20J%20Studio%20Luxury%20Beauty%20Salon%20Vizag." target="_blank" class="btn btn-sm btn-gold" title="Reply on WhatsApp">
                    <i class="fab fa-whatsapp"></i>
                  </a>
                  <button class="btn btn-sm btn-outline-gold" onclick="markInquiryRead('${inq.id}')" title="Mark Replied">
                    <i class="fas fa-check"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="deleteInquiry('${inq.id}')" title="Delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  window.markInquiryRead = async function (id) {
    try {
      const data = await authFetch(`/api/inquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'replied' })
      });
      if (data.success) {
        adminToast('Inquiry marked as replied', 'success');
        loadInquiries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.deleteInquiry = async function (id) {
    try {
      const data = await authFetch(`/api/inquiries/${id}`, { method: 'DELETE' });
      if (data.success) {
        adminToast('Inquiry deleted', 'info');
        loadInquiries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // 8. GALLERY MANAGEMENT
  // ==========================================
  async function loadGallery() {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (data.success && adminGalleryGrid) {
        adminGalleryGrid.innerHTML = data.data.map(item => `
          <div style="background: var(--admin-card-hover); border: 1px solid var(--admin-border); border-radius: var(--radius-sm); overflow: hidden; position: relative;">
            <img src="${item.image}" style="width: 100%; height: 160px; object-fit: cover;" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80';">
            <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="font-size: 0.85rem; color: #fff; display: block;">${item.title}</strong>
                <span style="font-size: 0.72rem; color: var(--gold); text-transform: uppercase;">${item.category}</span>
              </div>
              <button class="btn btn-sm btn-danger" onclick="deleteGalleryItem('${item.id}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('');
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (btnOpenAddGalleryModal) {
    btnOpenAddGalleryModal.addEventListener('click', () => {
      if (galleryForm) galleryForm.reset();
      openAdminModal('galleryModal');
    });
  }

  if (galleryForm) {
    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        title: document.getElementById('galFormTitle').value.trim(),
        category: document.getElementById('galFormCategory').value,
        image: document.getElementById('galFormUrl').value.trim()
      };

      try {
        const data = await authFetch('/api/gallery', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (data.success) {
          adminToast('Image added to gallery', 'success');
          closeAdminModal('galleryModal');
          loadGallery();
        }
      } catch (err) {
        console.error(err);
        adminToast('Failed to add image', 'error');
      }
    });
  }

  window.deleteGalleryItem = async function (id) {
    if (!confirm('Delete this photo from gallery?')) return;
    try {
      const data = await authFetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (data.success) {
        adminToast('Photo deleted', 'info');
        loadGallery();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // 9. SETTINGS & PASSWORD CHANGE
  // ==========================================
  async function loadSettings() {
    try {
      const res = await fetch('/api/salon-info');
      const data = await res.json();
      if (data.success) {
        const info = data.data;
        if (document.getElementById('setSalonName')) document.getElementById('setSalonName').value = info.name || '';
        if (document.getElementById('setSalonTagline')) document.getElementById('setSalonTagline').value = info.tagline || '';
        if (document.getElementById('setSalonAddress')) document.getElementById('setSalonAddress').value = info.address || '';
        if (document.getElementById('setSalonPhone')) document.getElementById('setSalonPhone').value = info.phone || '';
        if (document.getElementById('setSalonWhatsApp')) document.getElementById('setSalonWhatsApp').value = info.whatsapp || '';
        if (document.getElementById('setSalonHours')) document.getElementById('setSalonHours').value = info.operatingHours || '';
        if (document.getElementById('setSalonMapUrl')) document.getElementById('setSalonMapUrl').value = info.mapUrl || '';
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (salonSettingsForm) {
    salonSettingsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('setSalonName').value.trim(),
        tagline: document.getElementById('setSalonTagline').value.trim(),
        address: document.getElementById('setSalonAddress').value.trim(),
        phone: document.getElementById('setSalonPhone').value.trim(),
        whatsapp: document.getElementById('setSalonWhatsApp').value.trim(),
        operatingHours: document.getElementById('setSalonHours').value.trim(),
        mapUrl: document.getElementById('setSalonMapUrl').value.trim()
      };

      try {
        const data = await authFetch('/api/salon-info', {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (data.success) {
          adminToast('Salon details updated successfully', 'success');
        }
      } catch (err) {
        console.error(err);
        adminToast('Failed to update salon settings', 'error');
      }
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('currentPassInput').value;
      const newPassword = document.getElementById('newPassInput').value;
      const confirmPassword = document.getElementById('confirmPassInput').value;

      if (newPassword !== confirmPassword) {
        adminToast('New password and confirmation do not match', 'error');
        return;
      }

      try {
        const data = await authFetch('/api/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword })
        });
        if (data.success) {
          adminToast('Password changed successfully!', 'success');
          changePasswordForm.reset();
        } else {
          adminToast(data.message || 'Failed to change password', 'error');
        }
      } catch (err) {
        console.error(err);
        adminToast('Error updating password', 'error');
      }
    });
  }

  // Helper Modal Open/Close
  window.openAdminModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
  };

  window.closeAdminModal = function (id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
  };

  // Toast Helper
  function adminToast(message, type = 'info') {
    const container = document.getElementById('adminToastContainer');
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
    }, 3500);
  }
});
