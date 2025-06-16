const API_BASE_URL = 'https://projet-json-server-4.onrender.com';

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 
                'Content-Type': 'application/json', 
                ...options.headers 
            },
            ...options,
            credentials: 'omit' // Ajout pour éviter les problèmes de credentials si non nécessaires
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
        }
        return await response.json();
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

async function saveVoiceMessage(chatId, audioData) {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('audio', audioData, 'voice_message.webm');
    return await apiRequest('/voice-messages', {
        method: 'POST',
        body: formData
    });
}

class ModalSystem {
    constructor() {
        this.modal = document.getElementById('modal');
        this.confirmModal = document.getElementById('confirm-modal');
        this.loadingModal = document.getElementById('loading-modal');
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
        if (!this.modal) return;
        const messageEl = document.getElementById('modal-message');
        const iconEl = document.getElementById('modal-icon');
        if (!messageEl || !iconEl) return;
        messageEl.textContent = message;
        const icons = {
            success: '<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"><i class="fas fa-check text-white text-xl"></i></div>',
            error: '<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"><i class="fas fa-times text-white text-xl"></i></div>',
            warning: '<div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center"><i class="fas fa-exclamation text-white text-xl"></i></div>',
            info: '<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><i class="fas fa-info text-white text-xl"></i></div>'
        };
        iconEl.innerHTML = icons[type] || icons.info;
        this.modal.classList.remove('hidden');
        this.modal.classList.add('animate-fade-in');
        if (type === 'success') setTimeout(() => this.hideModal(), 3000);
    }

    hideModal() {
        if (!this.modal) return;
        this.modal.classList.add('animate-fade-out');
        setTimeout(() => {
            this.modal.classList.add('hidden');
            this.modal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
    }

    showConfirmModal(title, message, onConfirm, type = 'warning') {
        if (!this.confirmModal) return;
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const iconEl = document.getElementById('confirm-icon');
        const confirmBtn = document.getElementById('confirm-ok');
        if (!titleEl || !messageEl || !iconEl || !confirmBtn) return;
        titleEl.textContent = title;
        messageEl.textContent = message;
        const icons = {
            danger: '<div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"><i class="fas fa-exclamation-triangle text-white text-xl"></i></div>',
            warning: '<div class="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center"><i class="fas fa-exclamation text-white text-xl"></i></div>',
            question: '<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><i class="fas fa-question text-white text-xl"></i></div>'
        };
        iconEl.innerHTML = icons[type] || icons.warning;
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', () => { this.hideConfirmModal(); onConfirm && onConfirm(); });
        this.confirmModal.classList.remove('hidden');
        this.confirmModal.classList.add('animate-fade-in');
    }

    hideConfirmModal() {
        if (!this.confirmModal) return;
        this.confirmModal.classList.add('animate-fade-out');
        setTimeout(() => {
            this.confirmModal.classList.add('hidden');
            this.confirmModal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
    }

    showLoadingModal(message = 'Chargement...') {
        if (!this.loadingModal) return;
        const messageEl = document.getElementById('loading-message');
        if (!messageEl) return;
        messageEl.textContent = message;
        this.loadingModal.classList.remove('hidden');
        this.loadingModal.classList.add('animate-fade-in');
    }

    hideLoadingModal() {
        if (!this.loadingModal) return;
        this.loadingModal.classList.add('animate-fade-out');
        setTimeout(() => {
            this.loadingModal.classList.add('hidden');
            this.loadingModal.classList.remove('animate-fade-in', 'animate-fade-out');
        }, 200);
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
        saveBtn?.addEventListener('click', async () => {
            const firstName = document.getElementById('contactFirstName').value.trim();
            const lastName = document.getElementById('contactLastName').value.trim();
            const phone = document.getElementById('contactCountryCode').value + document.getElementById('contactPhone').value.trim().replace(/\s/g, '');
            const sync = document.getElementById('syncContact').checked;
            if (!firstName || !lastName || !phone) {
                this.showModal('Veuillez remplir tous les champs obligatoires.', 'warning');
                return;
            }
            const phoneRegex = /^[\+]?[0-9]{10,}$/;
            if (!phoneRegex.test(phone)) {
                this.showModal('Veuillez entrer un numéro de téléphone valide.', 'warning');
                return;
            }
            const contactData = {
                id: Date.now().toString(),
                firstName,
                lastName,
                fullName: `${firstName} ${lastName}`,
                phone,
                country: phone.slice(1, 3),
                avatar: { color: 'bg-green-500', initial: firstName.charAt(0).toUpperCase() },
                createdAt: new Date().toISOString()
            };
            this.showLoadingModal('Ajout du contact...');
            try {
                await saveContact(contactData);
                this.hideLoadingModal();
                this.showModal(`Contact ${contactData.fullName} ajouté avec succès !`, 'success');
                this.hideNewContactFormInPreview();
                this.showNewChatInPreview();
                const chatSystem = window.WhatsAppSystems?.chatSystem;
                if (chatSystem) await chatSystem.updateContactsList();
            } catch (error) {
                this.hideLoadingModal();
                this.showModal('Erreur lors de l\'ajout du contact. Vérifiez votre connexion ou le serveur.', 'error');
            }
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

    showNewChatInPreview() {
        if (!this.tempPreview) return;
        this.currentView = 'newChat';
        this.showLoadingModal('Chargement des contacts...');
        getContacts().then(contacts => {
            this.hideLoadingModal();
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
                                ${contacts.map(contact => {
                                    const avatar = contact.avatar || { color: 'bg-green-500', initial: (contact.firstName?.charAt(0) || 'A').toUpperCase() };
                                    return `
                                        <div class="flex items-center p-2 hover:bg-gray-700 rounded-lg cursor-pointer" data-contact-id="${contact.id}">
                                            <div class="${avatar.color} w-10 h-10 rounded-full flex items-center justify-center mr-3">
                                                <span class="text-white font-bold">${avatar.initial}</span>
                                            </div>
                                            <div>
                                                <p class="text-white">${contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`}</p>
                                                <p class="text-gray-400 text-sm">${contact.phone || ''}</p>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
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
        }).catch(error => {
            this.hideLoadingModal();
            this.showModal('Erreur lors du chargement des contacts. Vérifiez votre connexion ou le serveur.', 'error');
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
        this.chatArea = document.querySelector('.flex-1.flex.flex-col.bg-gray-800');
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.charCount = document.getElementById('charCount');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.emojiBtn = document.getElementById('emojiBtn');
        this.emojiPanel = document.getElementById('emojiPanel');
        this.attachBtn = document.getElementById('attachBtn');
        this.recordBtn = document.getElementById('recordBtn');
        this.modalSystem = new ModalSystem();
        this.navigationSystem = new NavigationSystem();
        this.currentChatId = null;
        this.currentContact = null;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        window.WhatsAppSystems = { modalSystem: this.modalSystem, navigationSystem: this.navigationSystem, chatSystem: this };
        this.setupEventListeners();
        this.loadInitialData();
        this.showDefaultView();
    }

    setupEventListeners() {
        this.sendBtn?.addEventListener('click', () => this.handleSendMessage());
        this.messageInput?.addEventListener('input', (e) => this.updateCharCount(e.target.value));
        this.messageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSendMessage();
            }
        });
        this.emojiBtn?.addEventListener('click', () => this.toggleEmojiPanel());
        this.emojiPanel?.addEventListener('click', (e) => e.target.tagName === 'BUTTON' && this.addEmoji(e.target.textContent));
        this.attachBtn?.addEventListener('click', () => this.showAttachmentOptions());
        this.recordBtn?.addEventListener('mousedown', () => this.startRecording());
        this.recordBtn?.addEventListener('mouseup', () => this.stopRecording());
        this.recordBtn?.addEventListener('touchstart', (e) => { e.preventDefault(); this.startRecording(); }, { passive: false });
        this.recordBtn?.addEventListener('touchend', (e) => { e.preventDefault(); this.stopRecording(); }, { passive: false });
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
        await this.updateContactsList();
    }

    async updateContactsList() {
        try {
            const contacts = await getContacts();
            const contactsList = document.getElementById('contactsList');
            if (contactsList) {
                contactsList.innerHTML = contacts.map(contact => {
                    const avatar = contact.avatar || { color: 'bg-green-500', initial: (contact.firstName?.charAt(0) || 'A').toUpperCase() };
                    const unreadCount = Math.floor(Math.random() * 10); // Simule un nombre de messages non lus
                    return `
                        <div class="p-3 flex items-center space-x-3 hover:bg-gray-800 cursor-pointer" data-contact-id="${contact.id}">
                            <div class="${avatar.color} w-12 h-12 rounded-full flex items-center justify-center mr-3">
                                <span class="text-white font-bold">${avatar.initial}</span>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-center">
                                    <span class="text-white font-semibold">${contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`}</span>
                                    <span class="text-gray-500 text-xs">01:40</span>
                                </div>
                                <div class="text-gray-400 text-sm">${contact.phone || ''}</div>
                            </div>
                            ${unreadCount > 0 ? `<div class="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">${unreadCount}</div>` : ''}
                        </div>
                    `;
                }).join('');
            }
        } catch (error) {
            this.modalSystem.error('Erreur lors du chargement des contacts. Vérifiez votre connexion ou le serveur.');
        }
    }

    showDefaultView() {
        if (this.chatArea) {
            this.chatArea.innerHTML = `
                <div class="flex-1 bg-gray-800 flex items-center justify-center">
                    <div class="text-center max-w-md">
                        <div class="mb-8 relative">
                            <div class="relative mx-auto w-80 h-60">
                                <svg class="absolute left-0 top-8 z-0" width="320" height="120" viewBox="0 0 320 120" fill="none">
                                    <ellipse cx="160" cy="60" rx="140" ry="55" fill="#23272b"/>
                                </svg>
                                <svg class="absolute left-16 top-32 z-10" width="40" height="20" viewBox="0 0 40 20" fill="none">
                                    <ellipse cx="20" cy="10" rx="18" ry="8" fill="#374151" opacity="0.7"/>
                                </svg>
                                <svg class="absolute left-32 top-20 z-10" width="30" height="14" viewBox="0 0 30 14" fill="none">
                                    <ellipse cx="15" cy="7" rx="13" ry="6" fill="#374151" opacity="0.7"/>
                                </svg>
                                <svg class="absolute right-16 top-16 z-10" width="30" height="14" viewBox="0 0 30 14" fill="none">
                                    <ellipse cx="15" cy="7" rx="13" ry="6" fill="#374151" opacity="0.7"/>
                                </svg>
                                <div class="absolute left-4 top-16 w-20 h-32 rounded-xl border-2 border-teal-200 bg-gray-900 shadow-lg z-20" style="transform: rotate(-10deg);">
                                    <div class="w-full h-full flex flex-col items-center justify-center">
                                        <div class="w-3 h-3 rounded-full border-2 border-gray-700 mt-2 mb-2"></div>
                                        <div class="flex flex-col items-center mt-2">
                                            <div class="flex space-x-0.5 mb-1">
                                                <div class="w-1 h-2 bg-gray-500 rounded"></div>
                                                <div class="w-1 h-3 bg-gray-500 rounded"></div>
                                                <div class="w-1 h-4 bg-gray-500 rounded"></div>
                                                <div class="w-1 h-5 bg-gray-500 rounded"></div>
                                            </div>
                                            <span class="text-red-400 text-lg font-bold -mt-2">×</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="absolute right-2 top-10 w-40 h-28 z-20" style="transform: rotate(3deg);">
                                    <div class="w-40 h-20 bg-gray-100 rounded-t-lg border-2 border-teal-200 flex items-center justify-center">
                                        <div class="w-12 h-12 bg-emerald-400 rounded-full flex items-center justify-center">
                                            <svg width="28" height="28" fill="none" viewBox="0 0 28 28">
                                                <circle cx="14" cy="14" r="14" fill="#34d399"/>
                                                <path d="M8 15.5l4 4 8-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                            </svg>
                                        </div>
                                    </div>
                                    <div class="w-44 h-3 bg-teal-200 rounded-b-lg -mt-1 mx-auto"></div>
                                </div>
                            </div>
                        </div>
                        <h2 class="text-2xl font-light text-white mb-4">WhatsApp Web</h2>
                        <p class="text-gray-300 text-sm leading-relaxed mb-2">
                            Envoyez et recevez des messages sans avoir à garder votre téléphone connecté.
                        </p>
                        <p class="text-gray-300 text-sm leading-relaxed">
                            Utilisez WhatsApp sur un maximum de 4 appareils et 1 téléphone, simultanément.
                        </p>
                        <div class="flex items-center justify-center mt-8 text-gray-400 text-xs">
                            <i class="fas fa-lock mr-2"></i>
                            <span>Vos messages personnels sont chiffrés de bout en bout</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    updateCharCount(text) {
        const count = text.length;
        this.charCount.textContent = `${count}`;
        if (count > 0) {
            this.sendBtn.classList.remove('hidden');
            this.recordBtn.classList.add('hidden');
        } else {
            this.sendBtn.classList.add('hidden');
            this.recordBtn.classList.remove('hidden');
        }
    }

    async selectContact(contactId) {
        this.currentChatId = contactId;
        const contacts = await getContacts();
        this.currentContact = contacts.find(contact => contact.id === contactId);
        if (this.currentContact && this.chatArea) {
            const avatar = this.currentContact.avatar || { color: 'bg-green-500', initial: (this.currentContact.firstName?.charAt(0) || 'A').toUpperCase() };
            this.chatArea.innerHTML = `
               
                <div class="flex-1 p-4 overflow-y-auto scrollbar-thin" id="messagesContainerWrapper">
                    <div id="messagesContainer" class="flex flex-col space-y-4">
                    </div>
                </div>
                <div class="bg-gray-900 p-4 border-t border-gray-700">
                    <div class="flex items-center space-x-4">
                        <button id="emojiBtn" class="text-gray-400 hover:text-white transition-colors duration-200">
                            <i class="far fa-smile text-xl"></i>
                        </button>
                        <button id="attachBtn" class="text-gray-400 hover:text-white transition-colors duration-200">
                            <i class="fas fa-paperclip text-xl"></i>
                        </button>
                        <div class="flex-1 relative">
                            <input id="messageInput" type="text" placeholder="Écrivez un message" class="w-full bg-gray-800 text-gray-200 placeholder-gray-500 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200">
                            <span id="charCount" class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">0</span>
                        </div>
                        <button id="sendBtn" class="bg-green-600 hover:bg-green-700 text-white rounded-full p-2 hidden transition-colors duration-200">
                            <i class="fas fa-paper-plane text-xl"></i>
                        </button>
                        <button id="recordBtn" class="bg-red-600 hover:bg-red-700 text-white rounded-full p-2 flex items-center justify-center transition-colors duration-200">
                            <i class="fas fa-microphone text-xl"></i>
                        </button>
                    </div>
                    <div id="emojiPanel" class="hidden absolute bottom-20 right-4 bg-gray-800 rounded-lg p-4 shadow-lg grid grid-cols-6 gap-2">
                        <button class="text-2xl">😊</button>
                        <button class="text-2xl">😂</button>
                        <button class="text-2xl">😍</button>
                        <button class="text-2xl">👍</button>
                        <button class="text-2xl">🙌</button>
                        <button class="text-2xl">🎉</button>
                    </div>
                    <div id="recordingIndicator" class="hidden text-red-400 text-sm mt-2">Enregistrement en cours... <span class="recording-dot animate-pulse"></span></div>
                </div>
            `;
            this.setupEventListeners();
            await this.loadMessages();
        }
    }

    async loadMessages() {
        if (!this.currentChatId || !this.messagesContainer) return;
        this.showLoadingModal('Chargement des messages...');
        try {
            const messages = await getMessages(this.currentChatId);
            this.messagesContainer.innerHTML = '';
            if (messages.length === 0) {
                this.messagesContainer.innerHTML = `
                    <div class="text-center text-gray-500 text-sm py-4">
                        <div class="flex items-center justify-center gap-2">
                            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                            <span>Vous êtes maintenant connecté avec ${this.currentContact.fullName || `${this.currentContact.firstName || ''} ${this.currentContact.lastName || ''}`}</span>
                            <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                        </div>
                    </div>
                `;
            } else {
                messages.forEach(message => {
                    if (message.content) {
                        this.addMessage(message);
                    } else if (message.audioUrl) {
                        this.addVoiceMessage(message);
                    }
                });
            }
            this.scrollToBottom();
        } catch (error) {
            this.modalSystem.error('Erreur lors du chargement des messages. Vérifiez votre connexion ou le serveur.');
        } finally {
            this.hideLoadingModal();
        }
    }

    async handleSendMessage() {
        const message = this.messageInput.value.trim();
        if (!message && !this.isRecording || !this.currentChatId || !this.messagesContainer) return;

        if (message) {
            const messageData = {
                id: Date.now().toString(),
                chatId: this.currentChatId,
                sender: 'me',
                content: message,
                timestamp: new Date().toISOString(),
                status: 'sent'
            };
            this.addMessage(messageData);
            this.messageInput.value = '';
            this.updateCharCount('');
            this.simulateTypingIndicator();
            this.showLoadingModal('Envoi du message...');
            try {
                const response = await saveMessage(messageData);
                if (response && response.id) {
                    this.hideLoadingModal();
                    this.modalSystem.success('Message envoyé !');
                } else {
                    throw new Error('Réponse inattendue du serveur');
                }
            } catch (error) {
                this.hideLoadingModal();
                this.modalSystem.error('Erreur lors de l\'envoi. Vérifiez votre connexion ou le serveur.');
                this.messagesContainer.removeChild(this.messagesContainer.lastChild);
            }
        }

        if (this.isRecording) {
            this.stopRecording();
        }
    }

    async startRecording() {
        if (this.isRecording) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const recordingIndicator = document.getElementById('recordingIndicator');
                recordingIndicator.classList.add('hidden');

                this.showLoadingModal('Envoi du message vocal...');
                try {
                    const response = await saveVoiceMessage(this.currentChatId, audioBlob);
                    if (response && response.id) {
                        this.hideLoadingModal();
                        this.modalSystem.success('Message vocal envoyé !');
                        this.addVoiceMessage({
                            id: Date.now().toString(),
                            chatId: this.currentChatId,
                            sender: 'me',
                            timestamp: new Date().toISOString(),
                            audioUrl: `${API_BASE_URL}/voice-messages/${response.id}.webm`
                        });
                    } else {
                        throw new Error('Réponse inattendue du serveur');
                    }
                } catch (error) {
                    this.hideLoadingModal();
                    this.modalSystem.error('Erreur lors de l\'envoi vocal. Vérifiez votre serveur.');
                }
                stream.getTracks().forEach(track => track.stop());
                this.isRecording = false;
                this.recordBtn.classList.remove('bg-red-700');
            };

            this.isRecording = true;
            this.recordBtn.classList.add('bg-red-700');
            document.getElementById('recordingIndicator').classList.remove('hidden');
            this.mediaRecorder.start();
        } catch (error) {
            this.modalSystem.error('Impossible d\'accéder au microphone. Autorisez l\'accès.');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        this.mediaRecorder.stop();
        this.recordBtn.classList.remove('bg-red-700');
        document.getElementById('recordingIndicator').classList.add('hidden');
    }

    addMessage(messageData) {
        if (!this.messagesContainer) return;
        if (this.messagesContainer.children.length === 1 && this.messagesContainer.firstChild.textContent.includes('Vous êtes maintenant connecté')) {
            this.messagesContainer.innerHTML = '';
        }
        const messageElement = document.createElement('div');
        messageElement.className = `p-3 rounded-lg max-w-[70%] ${messageData.sender === 'me' ? 'bg-green-600 self-end' : 'bg-gray-700 self-start'}`;
        messageElement.innerHTML = `
            <div class="text-white break-words">${messageData.content || 'Message vide'}</div>
            <div class="text-xs text-gray-300 mt-1">${new Date(messageData.timestamp).toLocaleTimeString()}</div>
            ${messageData.status === 'sent' ? '<i class="fas fa-check-double text-gray-300 text-xs ml-1"></i>' : ''}
        `;
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    addVoiceMessage(messageData) {
        if (!this.messagesContainer) return;
        if (this.messagesContainer.children.length === 1 && this.messagesContainer.firstChild.textContent.includes('Vous êtes maintenant connecté')) {
            this.messagesContainer.innerHTML = '';
        }
        const messageElement = document.createElement('div');
        messageElement.className = `p-3 rounded-lg max-w-[70%] ${messageData.sender === 'me' ? 'bg-green-600 self-end' : 'bg-gray-700 self-start'}`;
        messageElement.innerHTML = `
            <audio controls class="w-full">
                <source src="${messageData.audioUrl}" type="audio/webm">
                Votre navigateur ne supporte pas l'audio.
            </audio>
            <div class="text-xs text-gray-300 mt-1">${new Date(messageData.timestamp).toLocaleTimeString()}</div>
            ${messageData.status === 'sent' ? '<i class="fas fa-check-double text-gray-300 text-xs ml-1"></i>' : ''}
        `;
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
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

    scrollToBottom() {
        const wrapper = document.getElementById('messagesContainerWrapper');
        if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => new ChatSystem());