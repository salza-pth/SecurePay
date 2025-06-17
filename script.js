// Constants
const VALID_EMAIL = 'securepay@gmail.com';
const VALID_PASSWORD = '123456';
const HIGH_AMOUNT_THRESHOLD = 5000000;

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.querySelector('.nav-links');
const authModal = document.getElementById('authModal');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const loginSection = document.getElementById('loginSection');
const registerSection = document.getElementById('registerSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const userEmail = document.getElementById('userEmail');
const closeBtns = document.querySelectorAll('.close');
const authRequiredElements = document.querySelectorAll('.auth-required');
const transactionForm = document.getElementById('submitTransaction');
const transactionTable = document.getElementById('transactionTable').querySelector('tbody');
const notificationsList = document.getElementById('notificationsList');
const getStartedBtn = document.querySelector('.cta-button');

// Initialize data from localStorage
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let notifications = JSON.parse(localStorage.getItem('notifications')) || [];

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.querySelector('.nav-links');
    const navItems = navLinks.querySelectorAll('a, button');

    // Toggle menu function
    function toggleMenu() {
        navLinks.classList.toggle('show');
    }

    // Menu toggle click
    menuToggle.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
    };

    // Handle clicks on nav items
    navItems.forEach(item => {
        item.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // If it's a link with href, navigate
            if (this.getAttribute('href')) {
                window.location.href = this.getAttribute('href');
            }
            
            // If it's a button, trigger its action
            if (this.tagName === 'BUTTON') {
                this.click();
            }
            
            toggleMenu();
        };
    });

    // Close menu when clicking outside
    document.onclick = function(e) {
        if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
            navLinks.classList.remove('show');
        }
    };
});

// Money formatting helper
function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Update statistics
function updateStatistics() {
    const successfulTx = transactions.filter(t => t.status === 'success');
    const failedTx = transactions.filter(t => t.status === 'failed');
    const fraudTx = transactions.filter(t => t.status === 'fraud');
    
    const totalAmount = successfulTx.reduce((sum, tx) => sum + tx.amount, 0);
    const averageAmount = successfulTx.length > 0 ? totalAmount / successfulTx.length : 0;

    document.getElementById('totalTransactions').textContent = transactions.length;
    document.getElementById('successfulTransactions').textContent = successfulTx.length;
    document.getElementById('failedTransactions').textContent = failedTx.length;
    document.getElementById('fraudTransactions').textContent = fraudTx.length;
    document.getElementById('totalAmount').textContent = formatRupiah(totalAmount);
    document.getElementById('averageAmount').textContent = formatRupiah(averageAmount);
}

// Simulated account mapping and flagged accounts
const accountMapping = {
    "GoPay": "9876543210",
    "OVO": "1357902468",
    "ShopeePay": "6669998888", // suspicious
    "Visa": "1234567890", // suspicious
    "Mastercard": "2468135790",
    "DANA": "1122334455",
    "LinkAja": "9988776655"
};
const flaggedAccounts = ["6669998888", "1234567890"];

// Authentication Functions
function login(email, password) {
    if (email === VALID_EMAIL && password === VALID_PASSWORD) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userEmail', email);
        updateAuthState(true);
        return true;
    }
    return false;
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    updateAuthState(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navLinks.classList.remove('show'); // Close mobile menu on logout
}

// Add back the logout event listener
logoutBtn.addEventListener('click', logout);

function updateAuthState(isLoggedIn) {
    if (isLoggedIn) {
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        document.querySelector('.user-info').classList.remove('hidden');
        userEmail.textContent = localStorage.getItem('userEmail');
        authRequiredElements.forEach(el => el.classList.remove('hidden'));
        updateStatistics();
        updateTransactionTable();
        updateNotifications();
    } else {
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        document.querySelector('.user-info').classList.add('hidden');
        userEmail.textContent = '';
        authRequiredElements.forEach(el => el.classList.add('hidden'));
    }
}

// Transaction Functions
function createTransaction(method, amount) {
    const account = accountMapping[method] || "-";
    let status = 'success';
    let flagged = false;
    amount = parseFloat(amount);

    // Visa: only flagged if amount > 10,000,000
    if (method === 'Visa' && amount > 10000000 && flaggedAccounts.includes(account)) {
        flagged = true;
        const proceed = confirm('⚠️ This payment source is flagged for suspicious activity. Do you want to continue?');
        if (!proceed) {
            status = 'fraud';
        }
    }
    // Other flagged accounts: always flagged
    else if (method !== 'Visa' && flaggedAccounts.includes(account)) {
        flagged = true;
        const proceed = confirm('⚠️ This payment source is flagged for suspicious activity. Do you want to continue?');
        if (!proceed) {
            status = 'fraud';
        }
    }

    // Check for high amount (if not already fraud)
    if (status !== 'fraud' && amount > HIGH_AMOUNT_THRESHOLD) {
        const confirmed = confirm('This transaction is higher than usual. Do you want to continue?');
        if (!confirmed) {
            status = 'fraud';
        }
    }

    const transaction = {
        id: `TX-${String(transactions.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toLocaleString('id-ID'),
        method,
        amount,
        status,
        account
    };

    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));

    createNotification(transaction);
    updateTransactionTable();
    updateStatistics();
    return transaction;
}

function updateTransactionTable() {
    transactionTable.innerHTML = '';
    // Show newest first
    transactions.slice().reverse().forEach(tx => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${tx.id}</td>
            <td>${tx.timestamp}</td>
            <td>${tx.method}</td>
            <td>${formatRupiah(tx.amount)}</td>
            <td><span class="status ${tx.status}">${tx.status}</span></td>
        `;
        transactionTable.appendChild(row);
    });
}

// Notification Functions
function createNotification(transaction) {
    let message = '';
    if (transaction.status === 'fraud' && flaggedAccounts.includes(transaction.account)) {
        message = `Suspicious account detected for ${transaction.method}. Transaction blocked.`;
    } else if (transaction.status === 'success' && flaggedAccounts.includes(transaction.account)) {
        message = `Transaction Success - your transaction in ${transaction.method} has succeeded (account flagged as suspicious).`;
    } else if (transaction.status === 'success') {
        message = `Transaction Success - your transaction in ${transaction.method} has succeeded.`;
    } else if (transaction.status === 'failed') {
        message = `Transaction Failed - your transaction in ${transaction.method} has failed.`;
    } else if (transaction.status === 'fraud') {
        message = `Suspicious activity recorded`;
    } else {
        message = `Transaction in ${transaction.method}`;
    }
    const notification = {
        id: `NOTIF-${String(notifications.length + 1).padStart(3, '0')}`,
        timestamp: new Date().toLocaleString('id-ID'),
        type: transaction.status,
        message
    };

    notifications.unshift(notification); // Add to beginning of array
    if (notifications.length > 50) { // Limit to 50 notifications
        notifications.pop();
    }
    localStorage.setItem('notifications', JSON.stringify(notifications));
    updateNotifications();
}

function getNotifIconAndTitle(type) {
    if (type === 'success') {
        return { icon: '✔️', colorClass: 'success', title: 'Transaction Success' };
    } else if (type === 'failed' || type === 'error') {
        return { icon: '❌', colorClass: 'error', title: 'Transaction Failed' };
    } else if (type === 'fraud' || type === 'warning') {
        return { icon: '⚠️', colorClass: 'warning', title: 'Suspicious activity recorded' };
    }
    return { icon: 'ℹ️', colorClass: '', title: 'Notification' };
}

function updateNotifications() {
    notificationsList.innerHTML = '';
    notifications.forEach(notif => {
        const { icon, colorClass, title } = getNotifIconAndTitle(notif.type);
        const div = document.createElement('div');
        div.className = `notification ${colorClass}`;
        div.innerHTML = `
            <span class="notif-icon">${icon}</span>
            <div class="notif-content">
                <span class="notif-title">${title}</span>
                <span class="notif-message">${notif.message.replace(/Transaction [^:]+ \([^)]+\): /, '')}</span>
            </div>
        `;
        notificationsList.appendChild(div);
    });
}

// Modal and tab logic
function showAuthModal(tab) {
    authModal.classList.remove('hidden');
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginSection.classList.remove('hidden');
        registerSection.classList.add('hidden');
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        loginSection.classList.add('hidden');
        registerSection.classList.remove('hidden');
    }
}

loginBtn.addEventListener('click', () => showAuthModal('login'));
registerBtn.addEventListener('click', () => showAuthModal('register'));
tabLogin.addEventListener('click', () => showAuthModal('login'));
tabRegister.addEventListener('click', () => showAuthModal('register'));

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        authModal.classList.add('hidden');
    });
});

// Event Listeners
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (login(email, password)) {
        authModal.classList.add('hidden');
        loginForm.reset();
    } else {
        alert('Invalid credentials. Please try again.');
    }
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Registration is for demo purposes only.');
    authModal.classList.add('hidden');
    registerForm.reset();
});

// Custom dropdown logic for payment method
const customDropdown = document.getElementById('customDropdown');
const dropdownToggle = document.getElementById('dropdownToggle');
const dropdownMenu = document.getElementById('dropdownMenu');
const selectedMethod = document.getElementById('selectedMethod');
let selectedPaymentMethod = '';

dropdownToggle.addEventListener('click', () => {
    customDropdown.classList.toggle('open');
});

dropdownMenu.querySelectorAll('.dropdown-option').forEach(option => {
    option.addEventListener('click', () => {
        selectedPaymentMethod = option.getAttribute('data-value');
        selectedMethod.textContent = option.querySelector('span').textContent;
        customDropdown.classList.remove('open');
    });
});

document.addEventListener('click', (e) => {
    if (!customDropdown.contains(e.target)) {
        customDropdown.classList.remove('open');
    }
});

// Format amount input with thousands separator (Indonesian format)
const amountInput = document.getElementById('amount');
let rawAmount = '';
amountInput.addEventListener('input', (e) => {
    // Remove non-digits
    let value = e.target.value.replace(/\D/g, '');
    rawAmount = value;
    if (value) {
        e.target.value = parseInt(value, 10).toLocaleString('id-ID');
    } else {
        e.target.value = '';
    }
});

document.getElementById('submitTransaction').addEventListener('click', () => {
    const method = selectedPaymentMethod;
    // Use rawAmount for calculations
    const amount = rawAmount;

    if (!method || !amount) {
        alert('Please fill in all fields');
        return;
    }

    createTransaction(method, amount);
    selectedPaymentMethod = '';
    selectedMethod.textContent = 'Select Payment Method';
    amountInput.value = '';
    rawAmount = '';
});

// Initialize auth state on page load
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    updateAuthState(isLoggedIn);
});

// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Get Started button functionality
if (getStartedBtn) {
    getStartedBtn.addEventListener('click', function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            // Scroll to portfolio section and focus on amount input
            const portfolioSection = document.getElementById('portfolio');
            const amountInput = document.getElementById('amount');
            if (portfolioSection && amountInput) {
                portfolioSection.scrollIntoView({ behavior: 'smooth' });
                setTimeout(() => {
                    amountInput.focus();
                }, 1000);
            }
        } else {
            // Open login modal
            authModal.classList.remove('hidden');
            tabLogin.click();
        }
    });
}
