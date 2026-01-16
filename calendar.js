// Il Metrone Booking Calendar JavaScript
// Adapted from Villa Volpe System

const CONFIG = {
    // ID Calendario del Metrone
    calendarId: '9cfddfe8fa84f5e592da10625ceb9f9a58629d23b47fe50d3fca97ed2fe6e798@group.calendar.google.com',
    
    // IL TUO URL DI APPS SCRIPT (Quello nuovo che hai pubblicato)
    webAppUrl: 'https://script.google.com/macros/s/AKfycbwSxb4vDEStHjj1CthAA7OU1yFTRUvtgbjTbs-jY7INvnV65G68nRgg8ruJzKhDSQ6Z9g/exec',
    
    minNights: 2, // Ho impostato 2 notti come da tua richiesta precedente
    maxGuests: 12,
    email: 'metronecustoza@gmail.com'
};

// State
let state = {
    currentMonth: new Date(),
    checkInDate: null,
    checkOutDate: null,
    blockedDates: [],
    guestData: {
        name: '',
        email: '',
        phone: '',
        adults: 2,
        children: 0,
        pets: 'no',
        requests: ''
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeCalendar();
    setupEventListeners();
    loadBlockedDates();
});

function initializeCalendar() {
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthDisplay = document.getElementById('current-month');
    
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    // Update month display
    monthDisplay.textContent = state.currentMonth.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    grid.innerHTML = '';
    
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day header';
        header.textContent = day;
        grid.appendChild(header);
    });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        grid.appendChild(empty);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;
        dayCell.dataset.date = date.toISOString().split('T')[0];
        
        if (date < today) {
            dayCell.classList.add('blocked');
        }
        else if (isDateBlocked(date)) {
            dayCell.classList.add('blocked');
        }
        else {
            dayCell.classList.add('available');
            dayCell.addEventListener('click', () => selectDate(date));
        }
        
        if (date.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }
        
        if (state.checkInDate && date.toDateString() === state.checkInDate.toDateString()) {
            dayCell.classList.add('selected');
        }
        if (state.checkOutDate && date.toDateString() === state.checkOutDate.toDateString()) {
            dayCell.classList.add('selected');
        }
        
        if (state.checkInDate && state.checkOutDate) {
            if (date > state.checkInDate && date < state.checkOutDate) {
                dayCell.classList.add('in-range');
            }
        }
        
        grid.appendChild(dayCell);
    }
}

function selectDate(date) {
    if (!state.checkInDate || (state.checkInDate && state.checkOutDate)) {
        state.checkInDate = date;
        state.checkOutDate = null;
    }
    else if (state.checkInDate && !state.checkOutDate) {
        if (date < state.checkInDate) {
            state.checkOutDate = state.checkInDate;
            state.checkInDate = date;
        } else {
            state.checkOutDate = date;
        }
        
        const nights = calculateNights(state.checkInDate, state.checkOutDate);
        if (nights < CONFIG.minNights) {
            alert(`Minimum ${CONFIG.minNights} nights stay required`);
            state.checkOutDate = null;
        }
        
        if (state.checkOutDate && hasBlockedDatesInRange(state.checkInDate, state.checkOutDate)) {
            alert('Selected dates contain unavailable days. Please choose different dates.');
            state.checkInDate = null;
            state.checkOutDate = null;
        }
    }
    
    updateDateDisplay();
    renderCalendar();
}

function updateDateDisplay() {
    const checkInDisplay = document.getElementById('checkin-display');
    const checkOutDisplay = document.getElementById('checkout-display');
    const nightsDisplay = document.getElementById('nights-display');
    const nightsCount = document.getElementById('nights-count');
    const continueBtn = document.getElementById('continue-to-guests');
    
    if (state.checkInDate) {
        checkInDisplay.textContent = formatDateDisplay(state.checkInDate);
    } else {
        checkInDisplay.textContent = 'Select date';
    }
    
    if (state.checkOutDate) {
        checkOutDisplay.textContent = formatDateDisplay(state.checkOutDate);
        const nights = calculateNights(state.checkInDate, state.checkOutDate);
        nightsCount.textContent = nights;
        nightsDisplay.style.display = 'block';
        continueBtn.disabled = false;
    } else {
        checkOutDisplay.textContent = 'Select date';
        nightsDisplay.style.display = 'none';
        continueBtn.disabled = true;
    }
}

function formatDateDisplay(date) {
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
}

function formatDateForSheet(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function calculateNights(checkIn, checkOut) {
    const diffTime = Math.abs(checkOut - checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function isDateBlocked(date) {
    const dateStr = date.toISOString().split('T')[0];
    return state.blockedDates.includes(dateStr);
}

function hasBlockedDatesInRange(startDate, endDate) {
    const current = new Date(startDate);
    current.setDate(current.getDate() + 1);
    
    while (current < endDate) {
        if (isDateBlocked(current)) {
            return true;
        }
        current.setDate(current.getDate() + 1);
    }
    return false;
}

// === MODIFICATO: Carica le date dal tuo Apps Script invece che dall'API Google ===
// Questo risolve i problemi di API Key e funziona direttamente con il tuo foglio/calendario
async function loadBlockedDates() {
    try {
        console.log('Loading blocked dates from Apps Script...');
        
        // Chiamata GET al tuo script (funzione doGet)
        const response = await fetch(CONFIG.webAppUrl);
        const data = await response.json();
        
        console.log('Received dates:', data);

        if (Array.isArray(data)) {
            data.forEach(range => {
                if (range.from && range.to) {
                    let currentDate = new Date(range.from);
                    const endDate = new Date(range.to);
                    
                    // Normalizziamo le date a mezzanotte
                    currentDate.setHours(0,0,0,0);
                    endDate.setHours(0,0,0,0);

                    // Blocchiamo i giorni (escluso il giorno di checkout)
                    while (currentDate < endDate) {
                        const dateStr = currentDate.toISOString().split('T')[0];
                        if (!state.blockedDates.includes(dateStr)) {
                            state.blockedDates.push(dateStr);
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                }
            });
            console.log(`Total blocked dates: ${state.blockedDates.length}`);
        }
        
        renderCalendar();
    } catch (error) {
        console.error('Error loading blocked dates:', error);
        // Non mostriamo alert fastidiosi all'utente, il calendario resterà aperto
    }
}

function setupEventListeners() {
    document.getElementById('prev-month').addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
        renderCalendar();
    });
    
    document.getElementById('continue-to-guests').addEventListener('click', () => {
        goToStep('guests');
    });
    
    const guestForm = document.getElementById('guest-form');
    const adultsSelect = document.getElementById('num-adults');
    const childrenSelect = document.getElementById('num-children');
    const warningDiv = document.getElementById('guest-limit-warning');
    
    function validateGuestCount() {
        const adults = parseInt(adultsSelect.value) || 0;
        const children = parseInt(childrenSelect.value) || 0;
        const total = adults + children;
        
        if (total > CONFIG.maxGuests) {
            warningDiv.style.display = 'flex';
            return false;
        } else {
            warningDiv.style.display = 'none';
            return true;
        }
    }
    
    adultsSelect.addEventListener('change', validateGuestCount);
    childrenSelect.addEventListener('change', validateGuestCount);
    
    document.getElementById('continue-to-policy').addEventListener('click', () => {
        if (!guestForm.checkValidity()) {
            guestForm.reportValidity();
            return;
        }
        
        if (!validateGuestCount()) {
            return;
        }
        
        state.guestData = {
            name: document.getElementById('guest-name').value,
            email: document.getElementById('guest-email').value,
            phone: document.getElementById('guest-phone').value,
            adults: parseInt(document.getElementById('num-adults').value),
            children: parseInt(document.getElementById('num-children').value),
            pets: document.getElementById('pets').value,
            requests: document.getElementById('special-requests').value
        };
        
        updateSummary();
        goToStep('policy');
    });
    
    document.getElementById('accept-policy').addEventListener('change', (e) => {
        document.getElementById('send-request').disabled = !e.target.checked;
    });
    
    document.getElementById('send-request').addEventListener('click', sendBookingRequest);
}

function goToStep(stepName) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById(`step-${stepName}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateSummary() {
    document.getElementById('summary-checkin').textContent = formatDateDisplay(state.checkInDate);
    document.getElementById('summary-checkout').textContent = formatDateDisplay(state.checkOutDate);
    
    const nights = calculateNights(state.checkInDate, state.checkOutDate);
    document.getElementById('summary-nights').textContent = `${nights} night${nights > 1 ? 's' : ''}`;
    
    const totalGuests = state.guestData.adults + state.guestData.children;
    let guestText = `${state.guestData.adults} adult${state.guestData.adults > 1 ? 's' : ''}`;
    if (state.guestData.children > 0) {
        guestText += `, ${state.guestData.children} child${state.guestData.children > 1 ? 'ren' : ''}`;
    }
    document.getElementById('summary-guests').textContent = guestText;
    
    const petsText = state.guestData.pets === 'yes' ? 'Yes (Supplement applies)' : 'No';
    document.getElementById('summary-pets').textContent = petsText;
}

function sendBookingRequest() {
    const nights = calculateNights(state.checkInDate, state.checkOutDate);
    const totalGuests = state.guestData.adults + state.guestData.children;
    
    const sendButton = document.getElementById('send-request');
    const originalText = sendButton.textContent;
    sendButton.textContent = 'Sending...';
    sendButton.disabled = true;
    
    const bookingData = {
        guestName: state.guestData.name,
        guestEmail: state.guestData.email,
        guestPhone: state.guestData.phone,
        checkIn: formatDateForSheet(state.checkInDate),
        checkOut: formatDateForSheet(state.checkOutDate),
        nights: nights,
        adults: state.guestData.adults,
        children: state.guestData.children,
        totalGuests: totalGuests,
        pets: state.guestData.pets,
        specialRequests: state.guestData.requests || ''
    };
    
    fetch(CONFIG.webAppUrl, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookingData)
})

    .then(response => {
        console.log('Request sent successfully');
        document.getElementById('confirmation-email').textContent = state.guestData.email;
        goToStep('confirmation');
    })
    .catch(error => {
        console.error('Error sending request:', error);
        alert('Error sending request. Please contact us at ' + CONFIG.email);
        sendButton.textContent = originalText;
        sendButton.disabled = false;
    });
}

function resetWidget() {
    state.checkInDate = null;
    state.checkOutDate = null;
    state.guestData = {
        name: '',
        email: '',
        phone: '',
        adults: 2,
        children: 0,
        pets: 'no',
        requests: ''
    };
    
    document.getElementById('guest-form').reset();
    document.getElementById('accept-policy').checked = false;
    goToStep('calendar');
    renderCalendar();
}
