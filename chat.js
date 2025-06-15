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
                                    <div class="bg-green-500 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                        <span class="text-white font-bold">${contact.firstName.charAt(0).toUpperCase()}</span>
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
                const navigationSystem = window.WhatsAppSystems?.navigationSystem;
                navigationSystem?.showChats();
            }
        });
        const newContactBtn = this.tempPreview.querySelector('#newContactBtn');
        newContactBtn?.addEventListener('click', () => this.showNewContactFormInPreview());
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

    success(message, title = 'Succès') { this.showModal(message, 'success'); }
    error(message, title = 'Erreur') { this.showModal(message, 'error'); }
    warning(message, title = 'Attention') { this.showModal(message, 'warning'); }
    info(message, title = 'Information') { this.showModal(message, 'info'); }
    confirm(title, message, onConfirm, type = 'warning') { this.showConfirmModal(title, message, onConfirm, type); }
    loading(message = 'Chargement...') { this.showLoadingModal(message); }
    hideLoading() { this.hideLoadingModal(); }
}

class NavigationSystem {
    constructor() {
        this.sidebarChats = document.getElementById('sidebarChats');
        this.tempPreview = document.getElementById('tempPreview');
        this.modalSystem = new ModalSystem();
        this.currentView = 'chats';
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('sidebarChatIcon')?.addEventListener('click', () => this.showChats());
        document.getElementById('settingsIcon')?.addEventListener('click', () => this.showSettings());
        document.getElementById('menuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); this.toggleContextMenu(); });
        document.getElementById('newChatBtn')?.addEventListener('click', () => this.showNewChat());
        document.addEventListener('click', () => this.hideContextMenu());
        document.getElementById('contextMenu')?.addEventListener('click', (e) => e.stopPropagation());
    }

    showChats() {
        if (this.currentView === 'chats') return;
        this.animateTransition(() => {
            this.modalSystem.hideNewContactFormInPreview();
            this.modalSystem.hideSettingsInPreview();
            this.modalSystem.hideNewChatInPreview();
            this.sidebarChats.style.display = 'flex';
            this.tempPreview.style.display = 'none';
            this.currentView = 'chats';
        });
    }

    showSettings() {
        if (this.currentView === 'settings') return;
        this.animateTransition(() => {
            this.modalSystem.hideNewContactFormInPreview();
            this.modalSystem.hideNewChatInPreview();
            this.modalSystem.showSettingsInPreview();
            this.sidebarChats.style.display = 'none';
            this.currentView = 'settings';
        });
    }

    showNewChat() {
        if (this.currentView === 'newChat') return;
        this.animateTransition(() => {
            this.modalSystem.hideNewContactFormInPreview();
            this.modalSystem.hideSettingsInPreview();
            this.modalSystem.showNewChatInPreview();
            this.sidebarChats.style.display = 'none';
            this.currentView = 'newChat';
        });
    }

    toggleContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;
        if (contextMenu.classList.contains('hidden')) {
            contextMenu.classList.remove('hidden');
            contextMenu.classList.add('animate-scale-in');
        } else {
            this.hideContextMenu();
        }
    }

    hideContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu && !contextMenu.classList.contains('hidden')) {
            contextMenu.classList.remove('animate-scale-in');
            contextMenu.classList.add('animate-scale-out');
            setTimeout(() => { contextMenu.classList.add('hidden'); contextMenu.classList.remove('animate-scale-out'); }, 200);
        }
    }

    animateTransition(callback) {
        const elements = [this.sidebarChats, this.tempPreview].filter(el => el);
        elements.forEach(el => el.classList.add('animate-fade-out'));
        setTimeout(() => {
            callback();
            elements.forEach(el => el.classList.remove('animate-fade-out'));
            elements.filter(el => !el.classList.contains('hidden')).forEach(el => el.classList.add('animate-fade-in'));
        }, 200);
    }
}

class ChatSystem {
    constructor() {
        this.messagesContainer = document.querySelector('.flex-1 p-4 overflow-y-auto scrollbar-thin #messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.sendIcon = document.getElementById('sendIcon');
        this.charCount = document.getElementById('charCount');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPanel = document.getElementById('emojiPanel');
        this.attachBtn = document.getElementById('attachBtn');
        this.modalSystem = new ModalSystem();
        this.navigationSystem = new NavigationSystem();
        this.currentChatId = null;
        this.currentContact = null;
        window.WhatsAppSystems = { modalSystem: this.modalSystem, navigationSystem: this.navigationSystem, chatSystem: this };
        this.setupEventListeners();
        this.loadInitialData();
        this.showDefaultMessage();
    }

    setupEventListeners() {
        this.sendBtn?.addEventListener('click', () => this.handleSend());
        this.messageInput?.addEventListener('input', (e) => this.updateCharCount(e.target.value));
        this.messageInput?.addEventListener('keypress', (e) => e.key === 'Enter' && !e.shiftKey && this.handleSend());
        this.emojiBtn?.addEventListener('click', () => this.toggleEmojiPanel());
        this.emojiPanel?.addEventListener('click', (e) => e.target.tagName === 'BUTTON' && this.addEmoji(e.target.textContent));
        this.attachBtn?.addEventListener('click', () => this.showAttachmentOptions());
        document.getElementById('chatMenuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); this.toggleChatMenu(); });
        document.getElementById('contextMenu')?.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                this.handleContextMenuAction(e.target.textContent);
            }
        });
        const contactsList = document.getElementById('contactsList');
        contactsList?.addEventListener('click', (e) => {
            const contactElement = e.target.closest('div[data-contact-id]');
            if (contactElement) {
                const contactId = contactElement.getAttribute('data-contact-id');
                this.selectContact(contactId);
            }
        });
    }

    async loadInitialData() {
        try {
            const contacts = await getContacts();
            const contactsList = document.getElementById('contactsList');
            if (contactsList) {
                contactsList.innerHTML = contacts.map(contact => `
                    <div class="p-3 flex items-center space-x-3 hover:bg-gray-800 cursor-pointer" data-contact-id="${contact.id}">
                        <div class="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mr-3">
                            <span class="text-white font-bold">${contact.firstName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-center">
                                <span class="text-white font-semibold">${contact.fullName || `${contact.firstName} ${contact.lastName}`}</span>
                                <span class="text-gray-500 text-xs">${new Date().toLocaleTimeString()}</span>
                            </div>
                            <div class="text-gray-400 text-sm">${contact.phone}</div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Erreur lors du chargement des contacts:', error);
            this.modalSystem.error('Erreur lors du chargement des contacts.');
        }
    }

    showDefaultMessage() {
        if (this.messagesContainer) {
            this.messagesContainer.innerHTML = `
                <div class="text-center text-gray-400 p-4">
                    Sélectionnez une discussion pour commencer
                </div>
            `;
        }
    }

    updateCharCount(text) {
        const count = text.length;
        this.charCount.textContent = `${count}`;
        if (count > 0) {
            this.sendIcon.className = 'fas fa-paper-plane text-xl';
        } else {
            this.sendIcon.className = 'fas fa-microphone text-xl';
        }
    }

    async selectContact(contactId) {
        this.currentChatId = contactId;
        const contacts = await getContacts();
        this.currentContact = contacts.find(contact => contact.id === contactId);
        if (this.currentContact) {
            const chatHeader = document.querySelector('.bg-gray-900 p-4 .text-white .font-semibold');
            const chatAvatar = document.querySelector('.bg-gray-900 p-4 img');
            if (chatHeader) chatHeader.textContent = this.currentContact.fullName || `${this.currentContact.firstName} ${this.currentContact.lastName}`;
            if (chatAvatar) chatAvatar.src = `https://randomuser.me/api/portraits/${this.currentContact.id % 2 === 0 ? 'men' : 'women'}/${parseInt(this.currentContact.id) % 10 + 1}.jpg`;
            this.loadMessages();
        }
    }

    async loadMessages() {
        if (!this.currentChatId) return;
        try {
            const messages = await getMessages(this.currentChatId);
            this.messagesContainer.innerHTML = '';
            if (messages.length === 0) {
                this.messagesContainer.innerHTML = `
                    <div class="text-center text-gray-500 text-sm py-4">
                        <div class="flex items-center justify-center gap-2">
                            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Vous êtes maintenant connecté avec ${this.currentContact.fullName || `${this.currentContact.firstName} ${this.currentContact.lastName}`}</span>
                            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                `;
            } else {
                messages.forEach(message => this.addMessage(message));
            }
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        } catch (error) {
            console.error('Erreur lors du chargement des messages:', error);
            this.modalSystem.error('Erreur lors du chargement des messages.');
        }
    }

    handleSend() {
        const message = this.messageInput.value.trim();
        if (!message || !this.currentChatId) return;
        const messageData = { id: Date.now().toString(), chatId: this.currentChatId, sender: 'me', content: message, timestamp: new Date().toISOString(), status: 'sent' };
        this.addMessage(messageData);
        this.messageInput.value = '';
        this.updateCharCount('');
        this.simulateTypingIndicator();
        saveMessage(messageData).catch(error => console.error('Erreur lors de l\'envoi du message:', error));
    }

    addMessage(messageData) {
        if (!this.messagesContainer) return;
        if (this.messagesContainer.children.length === 1 && this.messagesContainer.firstChild.textContent.includes('Sélectionnez une discussion')) {
            this.messagesContainer.innerHTML = '';
        }
        const messageElement = document.createElement('div');
        messageElement.className = `p-3 rounded-lg max-w-[70%] ${messageData.sender === 'me' ? 'bg-green-600 self-end' : 'bg-gray-700 self-start'}`;
        messageElement.innerHTML = `
            <div class="text-white">${messageData.content}</div>
            <div class="text-xs text-gray-300 mt-1">${new Date(messageData.timestamp).toLocaleTimeString()}</div>
        `;
        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    simulateTypingIndicator() {
        if (!this.typingIndicator) return;
        this.typingIndicator.classList.remove('hidden');
        setTimeout(() => this.typingIndicator.classList.add('hidden'), 2000);
    }

    toggleEmojiPanel() {
        if (!this.emojiPanel) return;
        this.emojiPanel.classList.toggle('hidden');
    }

    addEmoji(emoji) {
        if (!this.messageInput) return;
        this.messageInput.value += emoji;
        this.updateCharCount(this.messageInput.value);
        this.emojiPanel.classList.add('hidden');
    }

    showAttachmentOptions() {
        this.modalSystem.info('Option d\'attachement non implémentée.');
    }

    toggleChatMenu() {
        const contextMenu = document.getElementById('contextMenu');
        if (contextMenu) {
            const rect = document.getElementById('chatMenuBtn').getBoundingClientRect();
            contextMenu.style.left = `${rect.left - 150}px`;
            contextMenu.style.top = `${rect.bottom + 5}px`;
            this.navigationSystem.toggleContextMenu();
        }
    }

    handleContextMenuAction(action) {
        switch (action) {
            case 'Nouveau groupe':
                this.modalSystem.info('Fonctionnalité "Nouveau groupe" non implémentée.');
                break;
            case 'Archiver le chat':
                this.modalSystem.info('Chat archivé.');
                break;
            case 'Épingler le chat':
                this.modalSystem.info('Chat épinglé.');
                break;
            case 'Supprimer le chat':
                this.modalSystem.confirm('Supprimer le chat', 'Voulez-vous vraiment supprimer ce chat ?', () => this.modalSystem.success('Chat supprimé avec succès.'));
                break;
            case 'Se déconnecter':
                this.logout();
                break;
        }
        this.navigationSystem.hideContextMenu();
    }

    logout() {
        this.modalSystem.confirm('Déconnexion', 'Voulez-vous vous déconnecter ?', () => {
            this.modalSystem.success('Déconnexion réussie.');
            setTimeout(() => window.location.href = '/login.html', 1000);
        }, 'question');
    }
}

document.addEventListener('DOMContentLoaded', () => new ChatSystem());