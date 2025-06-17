// Profile Sidebar Navigation
const menuItems = document.querySelectorAll('.profile-menu-item');
const detailBoxes = document.querySelectorAll('.profile-detail-box');
const settingBox = document.getElementById('settingBox');
const closeSetting = document.getElementById('closeSetting');
const logoutProfile = document.getElementById('logoutProfile');
const profileForm = document.getElementById('profileForm');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profileNameMain = document.getElementById('profileNameMain');
const profileEmailMain = document.getElementById('profileEmailMain');
const editName = document.getElementById('editName');
const editEmail = document.getElementById('editEmail');
const editPassword = document.getElementById('editPassword');
const userEmail = document.getElementById('userEmail');
const themeSelect = document.getElementById('themeSelect');
const langSelect = document.getElementById('langSelect');
const notificationsList = document.getElementById('profileNotificationsList');

// Sidebar menu switching
menuItems.forEach(item => {
    item.addEventListener('click', () => {
        menuItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        detailBoxes.forEach(box => box.classList.add('hidden'));
        if (item.dataset.section === 'setting') {
            settingBox.classList.remove('hidden');
        } else {
            settingBox.classList.add('hidden');
            document.getElementById(item.dataset.section).classList.remove('hidden');
        }
    });
});

closeSetting.addEventListener('click', () => {
    settingBox.classList.add('hidden');
});

document.getElementById('closeProfileDetail').addEventListener('click', () => {
    document.getElementById('profile-detail').classList.add('hidden');
});

// Profile Data
function loadProfile() {
    const profile = JSON.parse(localStorage.getItem('profile')) || {
        name: 'Your name',
        email: 'yourname@gmail.com',
        password: '',
    };
    profileName.textContent = profile.name;
    profileEmail.textContent = profile.email;
    profileNameMain.textContent = profile.name;
    profileEmailMain.textContent = profile.email;
    editName.value = profile.name;
    editEmail.value = profile.email;
    editPassword.value = profile.password;
    userEmail.textContent = profile.email;
}

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = {
        name: editName.value,
        email: editEmail.value,
        password: editPassword.value,
    };
    localStorage.setItem('profile', JSON.stringify(profile));
    loadProfile();
    alert('Profile updated!');
});

// Settings
function loadSettings() {
    const theme = localStorage.getItem('theme') || 'light';
    const lang = localStorage.getItem('lang') || 'en';
    themeSelect.value = theme;
    langSelect.value = lang;
    document.body.className = theme;
}
themeSelect.addEventListener('change', () => {
    localStorage.setItem('theme', themeSelect.value);
    document.body.className = themeSelect.value;
});
langSelect.addEventListener('change', () => {
    localStorage.setItem('lang', langSelect.value);
});

// Notifications
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

function loadNotifications() {
    notificationsList.innerHTML = '';
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
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

// Logout
logoutProfile.addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
});
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
});

// Sidebar for mobile
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.querySelector('.nav-links');
let sidebarOverlay = document.getElementById('sidebarOverlay');
if (!sidebarOverlay) {
    sidebarOverlay = document.createElement('div');
    sidebarOverlay.id = 'sidebarOverlay';
    sidebarOverlay.style.position = 'fixed';
    sidebarOverlay.style.top = '0';
    sidebarOverlay.style.left = '0';
    sidebarOverlay.style.width = '100vw';
    sidebarOverlay.style.height = '100vh';
    sidebarOverlay.style.background = 'rgba(0,0,0,0.15)';
    sidebarOverlay.style.zIndex = '1049';
    sidebarOverlay.style.display = 'none';
    document.body.appendChild(sidebarOverlay);
}
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
    sidebarOverlay.style.display = navLinks.classList.contains('show') ? 'block' : 'none';
});
sidebarOverlay.addEventListener('click', () => {
    navLinks.classList.remove('show');
    sidebarOverlay.style.display = 'none';
});
navLinks.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link')) {
        navLinks.classList.remove('show');
        sidebarOverlay.style.display = 'none';
    }
});

// Initial load
loadProfile();
loadSettings();
loadNotifications();
