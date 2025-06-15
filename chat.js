// JS principal pour la page chat
console.log("chat.js chargé !");

const API_BASE_URL = 'https://projet-json-server-7.onrender.com';

async function apiRequest(endpoint, options = {}) {
    try {
        console.log(`Requête API: ${API_BASE_URL}${endpoint}`, options);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options
        });
        console.log('Réponse API:', response.status, response.statusText);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        console.log('Données reçues:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function saveContact(contactData) {
    return await apiRequest('/contacts', { method: 'POST', body: JSON.stringify(contactData) });
}

async function getContacts() {
    return await apiRequest('/contacts');
}

async function saveMessage(messageData) {
    return await apiRequest('/messages', { method: 'POST', body: JSON.stringify(messageData) });
}

async function getMessages(chatId = null) {
    const endpoint = chatId ? `/messages?chatId=${chatId}` : '/messages';
    return await apiRequest(endpoint);
}

class ModalSystem {
    constructor() {
        this.modal = document.getElementById('modal');
        this.confirmModal = document.getElementById('confirm-modal');
        this.loadingModal = document.getElementById('loading-modal');
        this.toastContainer = document.getElementById('toastContainer');
        this.tempPreview = document.getElementById('tempPreview');
        this.currentView = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('modal-close')?.addEventListener('click', () => this.hideModal());
        document.getElementById('confirm-cancel')?.addEventListener('click', () => this.hideConfirmModal());
        [this.modal, this.confirmModal, this.loadingModal].forEach(modal => {
            modal?.addEventListener('click', (e) => e.target === modal && this.hideAllModals());
        });
        document.addEventListener('keydown', (e) => e.key === 'Escape' && this.hideAllModals());
    }

    showModal(message, type = 'info') {
        const modal = this.modal, messageEl = document.getElementById('modal-message'), iconEl = document.getElementById('modal-icon');
        if (!modal || !messageEl || !iconEl) return;
        messageEl.textContent = message;
        const icons = {
            success: '<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-bounce"><i class="fas fa-check text-white text-xl"></i></div>',
            error: '<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-times text-white text-xl"></i></div>',
            warning: '<div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce"><i class="fas fa-exclamation text-white text-xl"></i></div>',
            info: '<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-info text-white text-xl"></i></div>'
        };
        iconEl.innerHTML = icons[type] || icons.info;
        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
        type === 'success' && setTimeout(() => this.hideModal(), 3000);
    }

    hideModal() {
        const modal = this.modal;
        if (!modal) return;
        modal.classList.add('animate-fade-out');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('animate-fade-in', 'animate-fade-out'); }, 200);
    }

    showConfirmModal(title, message, onConfirm, type = 'warning') {
        const modal = this.confirmModal, titleEl = document.getElementById('confirm-title'), messageEl = document.getElementById('confirm-message'), iconEl = document.getElementById('confirm-icon'), confirmBtn = document.getElementById('confirm-ok');
        if (!modal || !titleEl || !messageEl || !iconEl || !confirmBtn) return;
        titleEl.textContent = title;
        messageEl.textContent = message;
        const icons = { danger: '<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-exclamation-triangle text-white text-xl"></i></div>', warning: '<div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center animate-bounce"><i class="fas fa-exclamation text-white text-xl"></i></div>', question: '<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center animate-pulse"><i class="fas fa-question text-white text-xl"></i></div>' };
        iconEl.innerHTML = icons[type] || icons.warning;
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => { this.hideConfirmModal(); onConfirm && onConfirm(); });
        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
    }

    hideConfirmModal() {
        const modal = this.confirmModal;
        if (!modal) return;
        modal.classList.add('animate-fade-out');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('animate-fade-in', 'animate-fade-out'); }, 200);
    }

    showLoadingModal(message = 'Chargement...') {
        const modal = this.loadingModal, messageEl = document.getElementById('loading-message');
        if (!modal || !messageEl) return;
        messageEl.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('animate-fade-in');
    }

    hideLoadingModal() {
        const modal = this.loadingModal;
        if (!modal) return;
        modal.classList.add('animate-fade-out');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('animate-fade-in', 'animate-fade-out'); }, 200);
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `p-3 rounded-lg text-white shadow-lg animate-slide-down ${type === 'success' ? 'bg-green-600' : 'bg-blue-600'} max-w-xs`;
        toast.innerHTML = `${message} <button class="ml-4 text-white hover:text-gray-200">×</button>`;
        this.toastContainer.appendChild(toast);
        setTimeout(() => this.removeToast(toast), 5000);
        toast.querySelector('button')?.addEventListener('click', () => this.removeToast(toast));
    }

    removeToast(toast) {
        if (!toast) return;
        toast.classList.add('animate-slide-up');
        setTimeout(() => toast.remove(), 300);
    }

    showNewContactFormInPreview() {
        if (!this.tempPreview) return;
        this.currentView = 'newContact';
        const newContactHTML = `
            <div class="h-full w-[600px] bg-gray-900 flex flex-col border-r-2 border-gray-700 p-4 animate-slide-up">
                <div class="flex items-center mb-4">
                    <button id="newContactBack" class="text-gray-400 hover:text-white text-2xl mr-4">←</button>
                    <h2 class="text-white text-lg font-bold">Nouveau contact</h2>
                </div>
                <div class="flex-1 space-y-4 overflow-y-auto">
                    <input type="text" id="contactFirstName" placeholder="Prénom" class="w-full p-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400">
                    <input type="text" id="contactLastName" placeholder="Nom" class="w-full p-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400">
                    <div class="flex items-center">
                        <select id="contactCountryCode" class="w-24 p-2 bg-gray-800 text-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                            <option value="+221">SN +221</option>
                            <option value="+33">FR +33</option>
                            <option value="+1">US +1</option>
                            <option value="+44">UK +44</option>
                        </select>
                        <input type="tel" id="contactPhone" placeholder="Téléphone" class="flex-1 p-2 bg-gray-800 text-white rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400">
                    </div>
                    <div class="flex items-center space-x-2">
                        <input type="checkbox" id="syncContact" class="w-5 h-5 text-green-500 bg-gray-800 rounded focus:ring-green-500 focus:ring-offset-gray-900">
                        <label for="syncContact" class="text-gray-300 text-sm">Synchroniser le contact sur le téléphone</label>
                    </div>
                    <button id="saveContactBtn" class="w-full bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg font-medium mt-4">Enregistrer</button>
                    <p class="text-gray-500 text-xs text-center">Ce contact sera ajouté au carnet d'adresses de votre téléphone.</p>
                </div>
            </div>
        `;
        this.tempPreview.innerHTML = newContactHTML;
        this.tempPreview.style.display = 'flex';
        const backBtn = this.tempPreview.querySelector('#newContactBack');
        backBtn?.addEventListener('click', () => {
            if (this.currentView === 'newContact' && this.tempPreview) {
                this.hideNewContactFormInPreview();
                this.showNewChatInPreview();
            }
        });
        const saveBtn = this.tempPreview.querySelector('#saveContactBtn');
        saveBtn?.addEventListener('click', () => {
            const firstName = document.getElementById('contactFirstName').value.trim();
            const lastName = document.getElementById('contactLastName').value.trim();
            const phone = document.getElementById('contactCountryCode').value + document.getElementById('contactPhone').value.trim().replace(/\s/g, '');
            const sync = document.getElementById('syncContact').checked;
            if (!firstName || !lastName || !phone) {
                this.warning('Veuillez remplir tous les champs obligatoires.');
                return;
            }
            const phoneRegex = /^[\+]?[0-9]{10,}$/;
            if (!phoneRegex.test(phone)) {
                this.warning('Veuillez entrer un numéro de téléphone valide.');
                return;
            }
            const contactData = {
                id: Date.now().toString(),
                firstName: firstName,
                lastName: lastName,
                fullName: `${firstName} ${lastName}`,
                phone: phone,
                country: phone.slice(1, 3),
                avatar: { color: 'bg-green-500', initial: firstName.charAt(0).toUpperCase() },
                createdAt: new Date().toISOString()
            };
            this.loading('Ajout du contact...');
            saveContact(contactData).then(() => {
                this.hideLoading();
                this.success(`Contact ${contactData.fullName} ajouté avec succès !`);
                this.hideNewContactFormInPreview();
                this.showNewChatInPreview();
                this.showToast(`Nouveau contact : ${contactData.fullName}`, 'success');
            }).catch(error => {
                console.error('Erreur lors de l\'ajout du contact:', error);
                this.hideLoading();
                this.error('Erreur lors de l\'ajout du contact. Veuillez réessayer.');
            });
        });
    }

    hideNewContactFormInPreview() {
        if (!this.tempPreview) return;
        this.tempPreview.style.display = 'none';
        this.tempPreview.innerHTML = '';
        this.currentView = null;
    }

    showSettingsInPreview() {
        if (!this.tempPreview) return;
        this.currentView = 'settings';
        const settingsHTML = `
            <div class="h-full w-[600px] bg-gray-900 flex flex-col border-r-2 border-gray-700 animate-slide-up">
                <div class="flex justify-center pt-8 pb-4 bg-gray-900 border-b border-gray-800">
                    <input type="text" placeholder="Rechercher dans les paramètres" class="w-3/4 bg-gray-800 text-gray-200 placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 text-center hover:bg-gray-700">
                </div>
                <div class="flex flex-col items-center pt-8 pb-6 border-b border-gray-800 relative">
                    <div class="relative group">
                        <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="avatar" class="w-24 h-24 rounded-full border-4 border-gray-700 shadow-lg group-hover:border-gray-600 transition-colors duration-200">
                        <span class="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-2 border-gray-900 rounded-full animate-pulse"></span>
                    </div>
                    <div class="mt-4 text-white font-bold text-xl flex items-center gap-2">Bachir_deV <span class="text-lg">💻❌🇸🇳🖤</span></div>
                    <div class="text-green-400 text-xs font-semibold mt-1 flex items-center gap-1">
                        <span class="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span>
                        En ligne
                    </div>
                    <div class="text-gray-400 text-xs mt-2 px-4 text-center">Salut ! J'utilise WhatsApp.</div>
                </div>
                <div class="flex-1 px-0 py-0 overflow-y-auto scrollbar-thin">
                    <ul class="divide-y divide-gray-800">
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800 transition-all duration-200 group hover:scale-[1.02]"><i class="fas fa-user-shield text-green-400 text-lg w-7 group-hover:scale-110 transition-transform duration-200"></i><div class="ml-4"><div class="text-gray-100 font-medium group-hover:text-white transition-colors duration-200">Compte</div><div class="text-gray-500 text-xs">Notifications de sécurité, informations de compte</div></div></a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800 transition-all duration-200 group hover:scale-[1.02]"><i class="fas fa-user-lock text-green-400 text-lg w-7 group-hover:scale-110 transition-transform duration-200"></i><div class="ml-4"><div class="text-gray-100 font-medium group-hover:text-white transition-colors duration-200">Confidentialité</div><div class="text-gray-500 text-xs">Contacts bloqués, messages éphémères</div></div></a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800 transition-all duration-200 group hover:scale-[1.02]"><i class="fas fa-comments text-green-400 text-lg w-7 group-hover:scale-110 transition-transform duration-200"></i><div class="ml-4"><div class="text-gray-100 font-medium group-hover:text-white transition-colors duration-200">Discussions</div><div class="text-gray-500 text-xs">Thème, fond d'écran, paramètres des discussions</div></div></a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800 transition-all duration-200 group hover:scale-[1.02]"><i class="fas fa-bell text-green-400 text-lg w-7 group-hover:scale-110 transition-transform duration-200"></i><div class="ml-4"><div class="text-gray-100 font-medium group-hover:text-white transition-colors duration-200">Notifications</div><div class="text-gray-500 text-xs">Notifications de messages</div></div></a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800 transition-all duration-200 group hover:scale-[1.02]"><i class="fas fa-keyboard text-green-400 text-lg w-7 group-hover:scale-110 transition-transform duration-200"></i><div class="ml-4"><div class="text-gray-100 font-medium group-hover:text-white transition-colors duration-200">Raccourcis clavier</div><div class="text-gray-500 text-xs">Raccourcis pour naviguer plus rapidement</div></div></a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800 transition-all duration-200 group hover:scale-[1.02]"><i class="fas fa-download text-green-400 text-lg w-7 group-hover:scale-110 transition-transform duration-200"></i><div class="ml-4"><div class="text-gray-100 font-medium group-hover:text-white transition-colors duration-200">Stockage et données</div><div class="text-gray-500 text-xs">Utilisation du réseau, téléchargement automatique</div></div></a></li>
                        <li><a href="#" class="flex items-center px-8 py-5 hover:bg-gray-800 transition-all duration-200 group hover:scale-[1.02]"><i class="fas fa-question-circle text-green-400 text-lg w-7 group-hover:scale-110 transition-transform duration-200"></i><div class="ml-4"><div class="text-gray-100 font-medium group-hover:text-white transition-colors duration-200">Aide</div><div class="text-gray-500 text-xs">Centre d'aide, nous contacter, conditions d'utilisation</div></div></a></li>
                        <li><a href="#" id="settingsLogout" class="flex items-center px-8 py-5 hover:bg-red-800 transition-all duration-200 group hover:scale-[1.02]"><i class="fas fa-sign-out-alt text-red-400 text-lg w-7 group-hover:scale-110 transition-transform duration-200"></i><div class="ml-4"><div class="text-red-300 font-medium group-hover:text-red-200 transition-colors duration-200">Se déconnecter</div><div class="text-gray-500 text-xs">Déconnexion de WhatsApp Web</div></div></a></li>
                    </ul>
                </div>
            </div>
        `;
        this.tempPreview.innerHTML = settingsHTML;
        this.tempPreview.style.display = 'flex';
        const logoutBtn = this.tempPreview.querySelector('#settingsLogout');
        logoutBtn?.addEventListener('click', () => {
            const chatSystem = window.WhatsAppSystems?.chatSystem;
            chatSystem?.logout();
        });
    }

    hideSettingsInPreview() {
        if (!this.tempPreview) return;
        this.tempPreview.style.display = 'none';
        this.tempPreview.innerHTML = '';
        this.currentView = null;
    }

    async showNewChatInPreview() {
        if (!this.tempPreview) return;
        this.currentView = 'newChat';
        this.loading('Chargement des contacts...');
        const contacts = await getContacts();
        this.hideLoading();
        const newChatHTML = `
            <div class="h-full w-[600px] bg-gray-900 flex flex-col border-r-2 border-gray-700 p-4 animate-slide-up">
                <div class="p-4 bg-gray-800 border-b-2 border-gray-700 flex justify-between items-center">
                    <h2 class="text-white text-lg font-semibold">Nouvelle discussion</h2>
                    <button id="closePreview" class="text-white hover:text-gray-300">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto">
                    <div class="p-4">
                        <button class="flex items-center w-full p-2 text-white hover:bg-gray-700 rounded-lg">
                            <i class="fas fa-users text-xl text-green-500 mr-3"></i>
                            <span>Nouveau groupe</span>
                        </button>
                        <button id="newContactBtn" class="flex items-center w-full p-2 text-white hover:bg-gray-700 rounded-lg">
                            <i class="fas fa-user-plus text-xl text-green-500 mr-3"></i>
                            <span>Nouveau contact</span>
                        </button>
                        <button class="flex items-center w-full p-2 text-white hover:bg-gray-700 rounded-lg">
                            <i class="fas fa-address-book text-xl text-green-500 mr-3"></i>
                            <span>Nouvelle communauté</span>
                        </button>
                    </div>
                    <div class="p-4 border-t-2 border-gray-700">
                        <h3 class="text-white text-sm font-medium">Contacts sur WhatsApp</h3>
                        <div class="mt-2">
                            ${contacts.map(contact => `
                                <div class="flex items-center p-2 hover:bg-gray-700 rounded-lg cursor-pointer" data-contact-id="${contact.id}">
                                    <div class="${contact.avatar.color} w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-white font-bold">${contact.avatar.initial}</span>
                                    </div>
                                    <div>
                                        <p class="text-white">${contact.fullName || `${contact.firstName} ${contact.lastName}`}</p>
                                        <p class="text-gray-400 text-sm">${contact.phone}</p>
                                    </div>
                                </div>
                            `).join('')}
                            <div class="flex items-center p-2 hover:bg-gray-700 rounded-lg cursor-pointer">
                                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                                    <span class="text-white font-bold">B</span>
                                </div>
                                <div>
                                    <p class="text-white">Bachir IIR 👀 (vous)</p>
                                    <p class="text-gray-400 text-sm">Envoyez-vous un message</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        this.tempPreview.innerHTML = newChatHTML;
        this.tempPreview.style.display = 'flex';
        const closeBtn = this.tempPreview.querySelector('#closePreview');
        closeBtn?.addEventListener('click', () => {
            if (this.currentView === 'newChat' && this.tempPreview) {
                this.hideNewChatInPreview();
            }
        });
        const newContactBtn = this.tempPreview.querySelector('#newContactBtn');
        newContactBtn?.addEventListener('click', () => {
            if (this.currentView === 'newChat' && this.tempPreview) {
                this.hideNewChatInPreview();
                this.showNewContactFormInPreview();
            }
        });
        this.tempPreview.querySelectorAll('[data-contact-id]').forEach(contact => {
            contact.addEventListener('click', () => {
                const chatSystem = window.WhatsAppSystems?.chatSystem;
                chatSystem?.selectContact(contact.dataset.contactId);
                this.hideNewChatInPreview();
            });
        });
    }

    hideNewChatInPreview() {
        if (!this.tempPreview) return;
        this.tempPreview.style.display = 'none';
        this.tempPreview.innerHTML = '';
        this.currentView = null;
    }

    hideAllModals() {
        this.hideModal();
        this.hideConfirmModal();
        this.hideLoadingModal();
    }

    success(message) { this.showModal(message, 'success'); }
    error(message) { this.showModal(message, 'error'); }
    warning(message) { this.showModal(message, 'warning'); }
    info(message) { this.showModal(message, 'info'); }
    loading(message) { this.showLoadingModal(message); }
    hideLoading() { this.hideLoadingModal(); }
}

class ChatSystem {
    constructor() {
        this.modalSystem = new ModalSystem();
        this.currentChatId = null;
        this.contactsList = document.getElementById('contactsList');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.sendIcon = document.getElementById('sendIcon');
        this.chatAvatarInitial = document.getElementById('chatAvatarInitial');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.sidebarChats = document.getElementById('sidebarChats');
        this.newChatPreview = document.getElementById('newChatPreview');
        this.sidebarSettings = document.getElementById('sidebarSettings');
        this.contextMenu = document.getElementById('contextMenu');
        this.setupEventListeners();
        window.WhatsAppSystems = window.WhatsAppSystems || {};
        window.WhatsAppSystems.chatSystem = this;
        this.loadContacts();
    }

    setupEventListeners() {
        document.getElementById('newChatBtn')?.addEventListener('click', () => this.showNewChat());
        document.getElementById('settingsIcon')?.addEventListener('click', () => this.showSettings());
        document.getElementById('sidebarChatIcon')?.addEventListener('click', () => this.showChats());
        document.getElementById('closePreview')?.addEventListener('click', () => this.hideNewChat());
        document.getElementById('menuBtn')?.addEventListener('click', (e) => this.toggleContextMenu(e));
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target) && e.target !== document.getElementById('menuBtn')) {
                this.contextMenu.classList.add('hidden');
            }
        });
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        this.messageInput?.addEventListener('input', (e) => {
            const charCount = document.getElementById('charCount');
            if (charCount) charCount.textContent = e.target.value.length;
            this.sendIcon.className = e.target.value.trim() ? 'fas fa-paper-plane text-xl' : 'fas fa-microphone text-xl';
        });
        this.messageInput?.addEventListener('keypress', (e) => e.key === 'Enter' && this.sendMessage());
    }

    async loadContacts() {
        try {
            this.modalSystem.loading('Chargement des contacts...');
            const contacts = await getContacts();
            this.renderContacts(contacts);
            this.modalSystem.hideLoading();
        } catch (error) {
            console.error('Erreur lors du chargement des contacts:', error);
            this.modalSystem.error('Erreur lors du chargement des contacts.');
        }
    }

    renderContacts(contacts) {
        if (!this.contactsList) return;
        this.contactsList.innerHTML = contacts.map(contact => `
            <div class="flex items-center p-3 hover:bg-gray-800 cursor-pointer" data-contact-id="${contact.id}">
                <div class="${contact.avatar.color} w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <span class="text-white font-bold">${contact.avatar.initial}</span>
                </div>
                <div class="flex-1">
                    <div class="text-white font-medium">${contact.fullName || `${contact.firstName} ${contact.lastName}`}</div>
                    <div class="text-gray-400 text-sm truncate">${contact.lastMessage?.text || 'Aucun message'}</div>
                </div>
                <div class="text-gray-400 text-xs">${new Date(contact.lastMessage?.timestamp || contact.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `).join('');
        this.contactsList.querySelectorAll('[data-contact-id]').forEach(contact => {
            contact.addEventListener('click', () => this.selectContact(contact.dataset.contactId));
        });
    }

    async selectContact(contactId) {
        try {
            this.currentChatId = contactId;
            const contacts = await getContacts();
            const contact = contacts.find(c => c.id === contactId);
            if (!contact) throw new Error('Contact non trouvé');
            this.chatAvatarInitial.textContent = contact.avatar.initial;
            document.querySelector('.font-semibold.text-lg').textContent = contact.fullName || `${contact.firstName} ${contact.lastName}`;
            this.messagesContainer.innerHTML = '';
            this.modalSystem.loading('Chargement des messages...');
            const messages = await getMessages(contactId);
            this.renderMessages(messages);
            this.modalSystem.hideLoading();
            this.sidebarChats.style.display = 'none';
            this.newChatPreview.style.display = 'none';
            this.sidebarSettings.style.display = 'none';
        } catch (error) {
            console.error('Erreur lors de la sélection du contact:', error);
            this.modalSystem.error('Erreur lors du chargement des messages.');
        }
    }

    renderMessages(messages) {
        if (!this.messagesContainer) return;
        this.messagesContainer.innerHTML = messages
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .map(message => `
                <div class="max-w-[70%] ${message.senderId === 'self' ? 'ml-auto bg-green-600' : 'bg-gray-700'} p-2 rounded-lg text-white">
                    ${message.text}
                    <div class="text-xs text-gray-300 mt-1">${new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `).join('');
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text || !this.currentChatId) return;
        const messageData = {
            id: Date.now().toString(),
            chatId: this.currentChatId,
            senderId: 'self',
            text: text,
            timestamp: new Date().toISOString()
        };
        this.modalSystem.loading('Envoi du message...');
        saveMessage(messageData).then(() => {
            this.messageInput.value = '';
            document.getElementById('charCount').textContent = '0';
            this.sendIcon.className = 'fas fa-microphone text-xl';
            this.renderMessages([...this.messagesContainer.children].map(m => JSON.parse(m.dataset.message)).concat(messageData));
            this.modalSystem.hideLoading();
            this.modalSystem.success('Message envoyé !');
        }).catch(error => {
            console.error('Erreur lors de l\'envoi du message:', error);
            this.modalSystem.hideLoading();
            this.modalSystem.error('Erreur lors de l\'envoi du message.');
        });
    }

    showNewChat() {
        this.newChatPreview.style.display = 'block';
        this.modalSystem.showNewChatInPreview();
        this.sidebarChats.style.display = 'none';
        this.sidebarSettings.style.display = 'none';
    }

    hideNewChat() {
        this.newChatPreview.style.display = 'none';
        this.modalSystem.hideNewChatInPreview();
        this.sidebarChats.style.display = 'flex';
    }

    showSettings() {
        this.sidebarSettings.style.display = 'flex';
        this.modalSystem.showSettingsInPreview();
        this.sidebarChats.style.display = 'none';
        this.newChatPreview.style.display = 'none';
    }

    hideSettings() {
        this.sidebarSettings.style.display = 'none';
        this.modalSystem.hideSettingsInPreview();
        this.sidebarChats.style.display = 'flex';
    }

    showChats() {
        this.sidebarChats.style.display = 'flex';
        this.newChatPreview.style.display = 'none';
        this.sidebarSettings.style.display = 'none';
    }

    toggleContextMenu(event) {
        if (this.contextMenu.classList.contains('hidden')) {
            this.contextMenu.style.left = `${event.pageX}px`;
            this.contextMenu.style.top = `${event.pageY}px`;
            this.contextMenu.classList.remove('hidden');
            this.contextMenu.classList.add('animate-scale-in');
        } else {
            this.contextMenu.classList.add('animate-scale-out');
            setTimeout(() => this.contextMenu.classList.add('hidden'), 200);
            this.contextMenu.classList.remove('animate-scale-in');
        }
    }

    logout() {
        this.modalSystem.showConfirmModal('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', () => {
            this.currentChatId = null;
            this.messagesContainer.innerHTML = '';
            this.messageInput.value = '';
            document.getElementById('charCount').textContent = '0';
            this.sendIcon.className = 'fas fa-microphone text-xl';
            this.chatAvatarInitial.textContent = '';
            document.querySelector('.font-semibold.text-lg').textContent = '';
            this.sidebarChats.style.display = 'flex';
            this.newChatPreview.style.display = 'none';
            this.sidebarSettings.style.display = 'none';
            this.modalSystem.success('Déconnexion réussie !');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ChatSystem();
});