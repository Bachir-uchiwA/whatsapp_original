// JS principal pour la page chat
console.log("chat.js chargé !");

const API_BASE_URL = 'https://projet-json-server-4.onrender.com';

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

    showNewContactFormInPreview() {
        const tempPreview = document.getElementById('tempPreview');
        if (!tempPreview) return;
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
        tempPreview.innerHTML = newContactHTML;
        tempPreview.style.display = 'flex';
        const backBtn = tempPreview.querySelector('#newContactBack');
        backBtn?.addEventListener('click', () => this.hideNewContactFormInPreview());
        const saveBtn = tempPreview.querySelector('#saveContactBtn');
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
            const contactData = { id: Date.now(), name: `${firstName} ${lastName}`, phone, avatar: { color: 'bg-green-500', initial: firstName.charAt(0).toUpperCase() }, createdAt: new Date().toISOString() };
            this.loading('Ajout du contact...');
            saveContact(contactData).then(() => {
                this.hideLoading();
                this.success(`Contact ${contactData.name} ajouté avec succès !`);
                this.hideNewContactFormInPreview();
                this.showToast(`Nouveau contact : ${contactData.name}`, 'success');
            }).catch(error => { console.error('Erreur lors de l\'ajout du contact:', error); this.hideLoading(); this.error('Erreur lors de l\'ajout du contact. Veuillez réessayer.'); });
        });
    }

    hideNewContactFormInPreview() {
        const tempPreview = document.getElementById('tempPreview');
        const sidebarChats = document.getElementById('sidebarChats');
        const navigationSystem = window.WhatsAppSystems?.navigationSystem;
        if (tempPreview && sidebarChats && navigationSystem) {
            navigationSystem.animateTransition(() => {
                tempPreview.style.display = 'none';
                tempPreview.innerHTML = '';
                sidebarChats.style.display = 'flex';
            });
        }
    }

    showToast(message, type = 'info') {
        if (!this.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `p-3 rounded-lg text-white shadow-lg animate-slide-down ${type === 'success' ? 'bg-green-600' : 'bg-blue-600'} max-w-xs`;
        toast.innerHTML = `${message} <button class="ml-4 text-white hover:text-gray-200">&times;</button>`;
        this.toastContainer.appendChild(toast);
        setTimeout(() => this.removeToast(toast), 5000);
        toast.querySelector('button')?.addEventListener('click', () => this.removeToast(toast));
    }

    removeToast(toast) {
        if (!toast) return;
        toast.classList.add('animate-slide-up');
        setTimeout(() => toast.remove(), 300);
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
        this.sidebarSettings = document.getElementById('sidebarSettings');
        this.tempPreview = document.getElementById('tempPreview');
        this.newChatPreview = document.getElementById('newChatPreview');
        this.currentView = 'chats';
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('sidebarChatIcon')?.addEventListener('click', () => this.showChats());
        document.getElementById('settingsIcon')?.addEventListener('click', () => this.showSettings());
        document.getElementById('menuBtn')?.addEventListener('click', (e) => { e.stopPropagation(); this.toggleContextMenu(); });
        document.getElementById('newChatBtn')?.addEventListener('click', () => this.showNewChatPreview());
        document.getElementById('closePreview')?.addEventListener('click', () => this.hideNewChatPreview());
        document.addEventListener('click', () => this.hideContextMenu());
        document.getElementById('contextMenu')?.addEventListener('click', (e) => e.stopPropagation());
        document.getElementById('newContactBtn')?.addEventListener('click', () => {
            const modalSystem = window.WhatsAppSystems?.modalSystem;
            modalSystem?.showNewContactFormInPreview();
        });
    }

    showChats() {
        if (this.currentView === 'chats') return;
        this.animateTransition(() => {
            this.sidebarSettings?.classList.add('hidden');
            this.tempPreview?.classList.add('hidden');
            this.newChatPreview?.classList.add('hidden');
            this.sidebarChats?.classList.remove('hidden');
            this.currentView = 'chats';
        });
    }

    showSettings() {
        if (this.currentView === 'settings') return;
        this.animateTransition(() => {
            this.sidebarChats?.classList.add('hidden');
            this.tempPreview?.classList.add('hidden');
            this.newChatPreview?.classList.add('hidden');
            this.sidebarSettings?.classList.remove('hidden');
            this.currentView = 'settings';
        });
    }

    showNewChatPreview() {
        if (this.currentView === 'newChat') return;
        this.animateTransition(() => {
            this.sidebarChats?.classList.add('hidden');
            this.tempPreview?.classList.add('hidden');
            this.sidebarSettings?.classList.add('hidden');
            this.newChatPreview?.classList.remove('hidden');
            this.currentView = 'newChat';
        });
    }

    hideNewChatPreview() {
        if (this.currentView !== 'newChat') return;
        this.animateTransition(() => {
            this.newChatPreview?.classList.add('hidden');
            this.sidebarChats?.classList.remove('hidden');
            this.currentView = 'chats';
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
        const elements = [this.sidebarChats, this.sidebarSettings, this.tempPreview, this.newChatPreview].filter(el => el);
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
        this.messagesContainer = document.getElementById('messagesContainer');
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
        this.eventSource = new EventSource(`${API_BASE_URL}/events`);
        window.WhatsAppSystems = { modalSystem: this.modalSystem, navigationSystem: this.navigationSystem };
        this.setupEventListeners();
        this.loadInitialData();
        this.setupRealTimeUpdates();
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
        document.getElementById('settingsLogout')?.addEventListener('click', () => this.logout());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
    }

    async loadInitialData() {
        try {
            const contacts = await getContacts();
            const contactsList = document.getElementById('contactsList');
            if (contactsList) {
                contactsList.innerHTML = contacts.map(contact => `
                    <div class="p-3 flex items-center space-x-3 hover:bg-gray-800 cursor-pointer" data-contact-id="${contact.id}">
                        <div class="${contact.avatar.color} w-12 h-12 rounded-full flex items-center justify-center mr-3">
                            <span class="text-white font-bold">${contact.avatar.initial}</span>
                        </div>
                        <div class="flex-1">
                            <div class="flex justify-between items-center">
                                <span class="text-white font-semibold">${contact.name}</span>
                                <span class="text-gray-500 text-xs">${new Date(contact.createdAt).toLocaleTimeString()}</span>
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

    updateCharCount(text) {
        const count = text.length;
        this.charCount.textContent = `${count}`;
        if (count > 0) {
            this.sendIcon.className = 'fas fa-paper-plane text-xl';
        } else {
            this.sendIcon.className = 'fas fa-microphone text-xl';
        }
    }

    handleSend() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        const messageData = { id: Date.now(), chatId: '1', sender: 'me', content: message, timestamp: new Date().toISOString(), status: 'sent' };
        this.addMessage(messageData);
        this.messageInput.value = '';
        this.updateCharCount('');
        this.simulateTypingIndicator();
        saveMessage(messageData).catch(error => console.error('Erreur lors de l\'envoi du message:', error));
    }

    addMessage(messageData) {
        if (!this.messagesContainer) return;
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

    setupRealTimeUpdates() {
        this.eventSource.addEventListener('new-message', (event) => {
            const messageData = JSON.parse(event.data);
            if (messageData.chatId === '1') {
                this.addMessage(messageData);
                this.modalSystem.showToast(`Nouveau message de ${messageData.sender}`, 'success');
            }
        });

        this.eventSource.addEventListener('contact-updated', (event) => {
            const contactData = JSON.parse(event.data);
            this.updateContactList(contactData);
            this.modalSystem.showToast(`Contact mis à jour : ${contactData.name}`, 'info');
        });

        this.eventSource.addEventListener('error', () => {
            console.error('Erreur de connexion SSE');
            this.modalSystem.error('Perte de connexion en temps réel. Réessayez plus tard.');
            this.eventSource.close();
            setTimeout(() => this.setupRealTimeUpdates(), 5000);
        });
    }

    updateContactList(contact) {
        const contactsList = document.getElementById('contactsList');
        if (!contactsList) return;
        let contactElement = contactsList.querySelector(`[data-contact-id="${contact.id}"]`);
        if (contactElement) {
            contactElement.outerHTML = `
                <div class="p-3 flex items-center space-x-3 hover:bg-gray-800 cursor-pointer" data-contact-id="${contact.id}">
                    <div class="${contact.avatar.color} w-12 h-12 rounded-full flex items-center justify-center mr-3">
                        <span class="text-white font-bold">${contact.avatar.initial}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center">
                            <span class="text-white font-semibold">${contact.name}</span>
                            <span class="text-gray-500 text-xs">${new Date(contact.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div class="text-gray-400 text-sm">${contact.phone}</div>
                    </div>
                </div>
            `;
        } else {
            contactsList.innerHTML += `
                <div class="p-3 flex items-center space-x-3 hover:bg-gray-800 cursor-pointer" data-contact-id="${contact.id}">
                    <div class="${contact.avatar.color} w-12 h-12 rounded-full flex items-center justify-center mr-3">
                        <span class="text-white font-bold">${contact.avatar.initial}</span>
                    </div>
                    <div class="flex-1">
                        <div class="flex justify-between items-center">
                            <span class="text-white font-semibold">${contact.name}</span>
                            <span class="text-gray-500 text-xs">${new Date(contact.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div class="text-gray-400 text-sm">${contact.phone}</div>
                    </div>
                </div>
            `;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new ChatSystem());