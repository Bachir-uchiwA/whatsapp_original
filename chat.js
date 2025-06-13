// JS principal pour la page chat (nécessaire pour éviter l'erreur MIME lors du déploiement Vercel)
// Ajoute ici ton code JS spécifique à la page chat si besoin.

console.log("chat.js chargé !");

// Configuration de l'API
const API_BASE_URL = 'https://projet-json-server-4.onrender.com';

// Fonctions utilitaires pour l'API
async function apiRequest(endpoint, options = {}) {
    try {
        console.log(`Requête API: ${API_BASE_URL}${endpoint}`, options);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        console.log('Réponse API:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Données reçues:', data);
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Fonction pour sauvegarder un contact
async function saveContact(contactData) {
    return await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify(contactData)
    });
}

// Fonction pour récupérer tous les contacts
async function getContacts() {
    return await apiRequest('/contacts');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM entièrement chargé !");

    // Sélection des éléments DOM
    const sidebarSettings = document.getElementById('sidebarSettings');
    const sidebarChats = document.getElementById('sidebarChats');
    const settingsIcon = document.getElementById('settingsIcon');
    const sidebarChatIcon = document.getElementById('sidebarChatIcon');
    const mainContent = document.querySelector('.flex-1.bg-gray-800.flex.items-center.justify-center');

    // Sauvegarde pour restauration (une seule instance globale)
    let sidebarChatsBackup = null;
    let newChatBackup = null;

    // Fonction pour charger et afficher les contacts dans la vue "Nouvelle discussion"
    async function loadAndDisplayContacts() {
        try {
            console.log('Chargement des contacts...');
            const contacts = await getContacts();
            console.log('Contacts récupérés:', contacts);
            
            // Trouver la section des contacts
            const contactsSection = document.querySelector('#newChatPanel .px-4.mt-6');
            if (contactsSection) {
                let contactsHTML = `
                    <h2 class="text-gray-400 text-sm font-medium mb-4">Contacts sur WhatsApp</h2>
                    <div class="flex items-center py-2">
                        <div class="w-10 h-10 rounded-full overflow-hidden mr-4">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" 
                                alt="Profile" class="w-full h-full object-cover">
                        </div>
                        <div class="flex-1">
                            <div class="text-gray-200 text-base">BACHIR IIR💻🏠 (vous)</div>
                            <div class="text-gray-400 text-sm">Envoyez-vous un message</div>
                        </div>
                    </div>
                `;
                
                // Ajouter les contacts sauvegardés
                if (contacts && contacts.length > 0) {
                    contacts.forEach(contact => {
                        const displayName = contact.fullName || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.phone;
                        const phoneDisplay = `+${contact.country === 'SN' ? '221' : ''}${contact.phone}`;
                        
                        contactsHTML += `
                            <div class="flex items-center py-2 cursor-pointer hover:bg-gray-800 rounded-lg px-2">
                                <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                                    <i class="fas fa-user text-white text-sm"></i>
                                </div>
                                <div class="flex-1">
                                    <div class="text-gray-200 text-base">${displayName}</div>
                                    <div class="text-gray-400 text-sm">${phoneDisplay}</div>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    contactsHTML += `
                        <div class="text-gray-500 text-sm text-center py-4">
                            Aucun contact ajouté pour le moment
                        </div>
                    `;
                }
                
                contactsSection.innerHTML = contactsHTML;
            }
        } catch (error) {
            console.error('Erreur lors du chargement des contacts:', error);
            // Afficher un message d'erreur dans l'interface
            const contactsSection = document.querySelector('#newChatPanel .px-4.mt-6');
            if (contactsSection) {
                contactsSection.innerHTML = `
                    <h2 class="text-gray-400 text-sm font-medium mb-4">Contacts sur WhatsApp</h2>
                    <div class="text-red-400 text-sm text-center py-4">
                        Erreur lors du chargement des contacts
                    </div>
                `;
            }
        }
    }

    // Fonction pour initialiser tous les event listeners
    function initializeEventListeners() {
        // Gestion menu contextuel
        setupContextMenu();
        
        // Gestion des clics sur les chats
        setupChatListeners();
        
        // Gestion du bouton nouvelle discussion
        setupNewChatButton();
    }

    // Fonction pour gérer le menu contextuel
    function setupContextMenu() {
        const menuBtn = document.getElementById('menuBtn');
        const contextMenu = document.getElementById('contextMenu');

        if (menuBtn && contextMenu) {
            // Supprimer les anciens listeners pour éviter les doublons
            const newMenuBtn = menuBtn.cloneNode(true);
            menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);

            newMenuBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const isHidden = contextMenu.classList.contains('hidden');
                if (isHidden) {
                    contextMenu.classList.remove('hidden');
                } else {
                    contextMenu.classList.add('hidden');
                }
            });

            document.addEventListener('click', (e) => {
                if (!contextMenu.classList.contains('hidden')) {
                    if (!contextMenu.contains(e.target) && !newMenuBtn.contains(e.target)) {
                        contextMenu.classList.add('hidden');
                    }
                }
            });

            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                        window.location.href = '/';
                    }
                });
            }
        }
    }

    // Fonction pour gérer le bouton nouvelle discussion
    function setupNewChatButton() {
        const newChatBtn = document.getElementById('newChatBtn');
        if (newChatBtn && sidebarChats) {
            // Supprimer l'ancien listener pour éviter les doublons
            const newNewChatBtn = newChatBtn.cloneNode(true);
            newChatBtn.parentNode.replaceChild(newNewChatBtn, newChatBtn);

            newNewChatBtn.addEventListener('click', function () {
                if (!sidebarChatsBackup) {
                    sidebarChatsBackup = sidebarChats.innerHTML;
                }
                
                const newChatHTML = `
                    <div class="flex flex-col h-full bg-gray-900" id="newChatPanel">
                        <!-- Header -->
                        <div class="flex items-center p-4 bg-gray-800">
                            <button id="backToChats" class="mr-4 focus:outline-none">
                                <i class="fas fa-arrow-left text-gray-300 text-xl"></i>
                            </button>
                            <h1 class="text-lg font-medium text-gray-200">Nouvelle discussion</h1>
                        </div>
                        <!-- Search Bar -->
                        <div class="px-4 py-3">
                            <div class="relative">
                                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                                <input type="text" placeholder="Rechercher un nom ou un numéro" 
                                    class="w-full bg-gray-800 text-gray-300 pl-10 pr-4 py-2 rounded-lg placeholder-gray-500 text-sm border-none focus:outline-none focus:ring-1 focus:ring-green-500">
                            </div>
                        </div>
                        <!-- Action Items -->
                        <div class="px-4">
                            <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg" id="addContactBtn">
                                <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                    <i class="fas fa-user-plus text-white text-sm"></i>
                                </div>
                                <span class="text-gray-200 text-base">Nouveau contact</span>
                            </div>
                            <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg">
                                <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                    <i class="fas fa-users text-white text-sm"></i>
                                </div>
                                <span class="text-gray-200 text-base">Nouveau groupe</span>
                            </div>
                            <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg">
                                <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                    <i class="fas fa-users text-white text-sm"></i>
                                </div>
                                <span class="text-gray-200 text-base">Nouvelle communauté</span>
                            </div>
                        </div>
                        <!-- Contacts Section -->
                        <div class="px-4 mt-6">
                            <div class="text-gray-500 text-sm text-center py-4">
                                Chargement des contacts...
                            </div>
                        </div>
                        <!-- Bottom Section -->
                        <div class="px-4 mt-8">
                            <div class="text-gray-500 text-sm">#</div>
                        </div>
                    </div>
                `;
                
                sidebarChats.innerHTML = newChatHTML;
                newChatBackup = newChatHTML;
                
                // Charger les contacts depuis l'API
                setTimeout(() => {
                    loadAndDisplayContacts();
                }, 500);
                
                setupNewChatListeners();
            });
        }
    }

    // Afficher les paramètres et masquer la liste des chats
    if (settingsIcon && sidebarSettings && sidebarChats) {
        settingsIcon.addEventListener('click', () => {
            if (!sidebarChatsBackup) {
                sidebarChatsBackup = sidebarChats.innerHTML;
            }
            sidebarChats.classList.add('hidden');
            sidebarSettings.classList.remove('hidden');
        });
    }

    // Bouton retour vers la liste des chats depuis les paramètres
    if (sidebarChatIcon && sidebarSettings && sidebarChats) {
        sidebarChatIcon.addEventListener('click', () => {
            sidebarSettings.classList.add('hidden');
            sidebarChats.classList.remove('hidden');
            
            // Réinitialiser tous les event listeners après le retour
            setTimeout(() => {
                initializeEventListeners();
            }, 100);
        });
    }

    // Gestion déconnexion depuis les paramètres
    const settingsLogout = document.getElementById('settingsLogout');
    if (settingsLogout) {
        settingsLogout.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                window.location.href = '/';
            }
        });
    }

    // Fonction pour gérer les clics sur les chats
    function setupChatListeners() {
        const chatItems = document.querySelectorAll('.flex.items-center.p-3.hover\\:bg-gray-700.cursor-pointer.border-gray-600');

        if (chatItems.length > 0 && mainContent) {
            chatItems.forEach((chatItem, index) => {
                // Supprimer l'ancien listener pour éviter les doublons
                const newChatItem = chatItem.cloneNode(true);
                chatItem.parentNode.replaceChild(newChatItem, chatItem);

                newChatItem.addEventListener('click', () => {
                    const chatName = newChatItem.querySelector('.text-white.font-medium.text-sm.truncate')?.textContent || 'Contact';
                    const chatAvatar = newChatItem.querySelector('img')?.src || null;
                    const chatBgColor = newChatItem.querySelector('.rounded-full')?.classList.toString().match(/bg-\w+-\d+/)?.[0] || 'bg-gray-600';
                    mainContent.innerHTML = createChatInterface(chatName, chatAvatar, chatBgColor);
                    setupChatInterface();
                });
            });
        }
    }

    function createChatInterface(contactName, avatarSrc, bgColor) {
        return `
            <div class="flex-1 flex flex-col h-full">
                <!-- Chat Header -->
                <div class="bg-gray-800 p-3 flex items-center justify-between border-b border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 ${bgColor} rounded-full flex items-center justify-center overflow-hidden">
                            ${avatarSrc ? 
                                `<img src="${avatarSrc}" alt="Profile" class="w-full h-full object-cover">` : 
                                `<i class="fas fa-user text-gray-400"></i>`
                            }
                        </div>
                        <div>
                            <div class="text-white text-sm font-medium">${contactName}</div>
                            <div class="text-gray-400 text-xs">cliquez ici pour les informations du contact</div>
                        </div>
                    </div>
                    <div class="flex space-x-2">
                        <div class="p-2 rounded-full hover:bg-gray-600 cursor-pointer">
                            <i class="fas fa-search text-gray-400 text-sm"></i>
                        </div>
                        <div class="p-2 rounded-full hover:bg-gray-600 cursor-pointer">
                            <i class="fas fa-ellipsis-v text-gray-400 text-sm"></i>
                        </div>
                    </div>
                </div>

                <!-- Messages Area -->
                <div class="flex-1 bg-gray-900 overflow-y-auto relative">
                    <div class="p-6 space-y-4">
                        <!-- Day Separator -->
                        <div class="flex justify-center my-6">
                            <div class="bg-gray-800 bg-opacity-80 text-gray-400 text-xs px-3 py-1.5 rounded-xl">Aujourd'hui</div>
                        </div>

                        <!-- Message d'exemple -->
                        <div class="flex justify-start">
                            <div class="max-w-xs">
                                <div class="bg-gray-700 rounded-lg p-3 relative">
                                    <div class="absolute top-0 -left-2 w-0 h-0 border-r-8 border-r-gray-700 border-t-8 border-t-transparent"></div>
                                    <div class="text-white text-sm">Salut ! Comment ça va ?</div>
                                </div>
                                <div class="flex justify-start items-center mt-1">
                                    <span class="text-gray-500 text-xs">10:30</span>
                                </div>
                            </div>
                        </div>

                        <!-- Message envoyé -->
                        <div class="flex justify-end">
                            <div class="max-w-xs">
                                <div class="bg-green-600 rounded-lg p-3 relative">
                                    <div class="absolute top-0 -right-2 w-0 h-0 border-l-8 border-l-green-600 border-t-8 border-t-transparent"></div>
                                    <div class="text-white text-sm">Salut ! Ça va bien, merci ! Et toi ?</div>
                                </div>
                                <div class="flex justify-end items-center mt-1">
                                    <span class="text-gray-500 text-xs">10:32</span>
                                    <i class="fas fa-check-double text-blue-400 text-sm ml-1"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Message Input Area -->
                <div class="bg-gray-800 p-4 border-t border-gray-700">
                    <div class="flex items-center space-x-3">
                        <div class="p-2 rounded-full hover:bg-gray-600 cursor-pointer">
                            <i class="fas fa-plus text-gray-400 text-lg"></i>
                        </div>
                        <div class="flex-1 relative">
                            <div class="bg-gray-700 rounded-lg px-4 py-3 flex items-center">
                                <input 
                                    type="text" 
                                    id="messageInput"
                                    placeholder="Entrez un message"
                                    class="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-400"
                                >
                                <i class="fas fa-face-smile text-gray-400 text-lg cursor-pointer hover:text-gray-300 ml-3"></i>
                            </div>
                        </div>
                        <div class="p-2 rounded-full hover:bg-gray-600 cursor-pointer" id="sendButton">
                            <i class="fas fa-paper-plane text-gray-400 text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function setupChatInterface() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const messagesArea = document.querySelector('.flex-1.bg-gray-900.overflow-y-auto .p-6.space-y-4');

        if (messageInput && sendButton && messagesArea) {
            function sendMessage() {
                const messageText = messageInput.value.trim();
                if (messageText) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'flex justify-end';
                    messageElement.innerHTML = `
                        <div class="max-w-xs">
                            <div class="bg-green-600 rounded-lg p-3 relative">
                                <div class="absolute top-0 -right-2 w-0 h-0 border-l-8 border-l-green-600 border-t-8 border-t-transparent"></div>
                                <div class="text-white text-sm">${messageText}</div>
                            </div>
                            <div class="flex justify-end items-center mt-1">
                                <span class="text-gray-500 text-xs">${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}</span>
                                <i class="fas fa-check text-gray-400 text-sm ml-1"></i>
                            </div>
                        </div>
                    `;
                    messagesArea.appendChild(messageElement);
                    messageInput.value = '';
                    messagesArea.parentElement.scrollTop = messagesArea.parentElement.scrollHeight;
                }
            }
            sendButton.addEventListener('click', sendMessage);
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    }

    // Nouvelle discussion : bouton + (remplace sidebarChats)
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn && sidebarChats) {
        newChatBtn.addEventListener('click', function () {
            if (!sidebarChatsBackup) {
                sidebarChatsBackup = sidebarChats.innerHTML;
            }
            
            const newChatHTML = `
                <div class="flex flex-col h-full bg-gray-900" id="newChatPanel">
                    <!-- Header -->
                    <div class="flex items-center p-4 bg-gray-800">
                        <button id="backToChats" class="mr-4 focus:outline-none">
                            <i class="fas fa-arrow-left text-gray-300 text-xl"></i>
                        </button>
                        <h1 class="text-lg font-medium text-gray-200">Nouvelle discussion</h1>
                    </div>
                    <!-- Search Bar -->
                    <div class="px-4 py-3">
                        <div class="relative">
                            <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                            <input type="text" placeholder="Rechercher un nom ou un numéro" 
                                class="w-full bg-gray-800 text-gray-300 pl-10 pr-4 py-2 rounded-lg placeholder-gray-500 text-sm border-none focus:outline-none focus:ring-1 focus:ring-green-500">
                        </div>
                    </div>
                    <!-- Action Items -->
                    <div class="px-4">
                        <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg" id="addContactBtn">
                            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-user-plus text-white text-sm"></i>
                            </div>
                            <span class="text-gray-200 text-base">Nouveau contact</span>
                        </div>
                        <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg">
                            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-users text-white text-sm"></i>
                            </div>
                            <span class="text-gray-200 text-base">Nouveau groupe</span>
                        </div>
                        <div class="flex items-center py-3 cursor-pointer hover:bg-gray-800 rounded-lg">
                            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                                <i class="fas fa-users text-white text-sm"></i>
                            </div>
                            <span class="text-gray-200 text-base">Nouvelle communauté</span>
                        </div>
                    </div>
                    <!-- Contacts Section -->
                    <div class="px-4 mt-6">
                        <h2 class="text-gray-400 text-sm font-medium mb-4">Contacts sur WhatsApp</h2>
                        <div class="flex items-center py-2">
                            <div class="w-10 h-10 rounded-full overflow-hidden mr-4">
                                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face" 
                                    alt="Profile" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1">
                                <div class="text-gray-200 text-base">BACHIR IIR💻🏠 (vous)</div>
                                <div class="text-gray-400 text-sm">Envoyez-vous un message</div>
                            </div>
                        </div>
                    </div>
                    <!-- Bottom Section -->
                    <div class="px-4 mt-8">
                        <div class="text-gray-500 text-sm">#</div>
                    </div>
                </div>
            `;
            
            sidebarChats.innerHTML = newChatHTML;
            newChatBackup = newChatHTML; // Sauvegarder la vue "Nouvelle discussion"
            
            // Bouton retour vers la liste des chats
            const backBtn = document.getElementById('backToChats');
            if (backBtn) {
                backBtn.addEventListener('click', function () {
                    if (sidebarChatsBackup) {
                        sidebarChats.innerHTML = sidebarChatsBackup;
                        // Réinitialiser les event listeners pour les chats
                        setupChatListeners();
                    }
                });
            }

            // Gestion du clic sur "Nouveau contact"
            const addContactBtn = document.getElementById('addContactBtn');
            if (addContactBtn) {
                addContactBtn.addEventListener('click', function () {
                    // Remplacer par la vue "Nouveau contact"
                    sidebarChats.innerHTML = `
                        <div class="flex flex-col h-full bg-gray-900" id="addContactPanel">
                            <!-- Header -->
                            <div class="flex items-center px-4 py-6">
                                <button id="backToNewChat" class="mr-4 text-gray-300 hover:text-white transition-colors">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                    </svg>
                                </button>
                                <h1 class="text-lg text-gray-300 font-normal">Nouveau contact</h1>
                            </div>
                            <!-- Form -->
                            <div class="px-6 pt-8 space-y-12">
                                <!-- Prénom -->
                                <div class="relative">
                                    <div class="flex items-center mb-4">
                                        <svg class="w-5 h-5 text-gray-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                                        </svg>
                                        <span class="text-gray-400 text-sm">Prénom</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        id="firstName"
                                        class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                                        placeholder="Entrez le prénom"
                                    >
                                </div>
                                <!-- Nom -->
                                <div class="relative">
                                    <div class="mb-4">
                                        <span class="text-gray-400 text-sm">Nom</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        id="lastName"
                                        class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                                        placeholder="Entrez le nom"
                                    >
                                </div>
                                <!-- Téléphone -->
                                <div class="relative">
                                    <div class="flex items-center mb-4">
                                        <svg class="w-5 h-5 text-gray-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                                        </svg>
                                        <div class="flex space-x-20">
                                            <span class="text-gray-400 text-sm">Pays</span>
                                            <span class="text-gray-400 text-sm">Téléphone</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-6">
                                        <div class="flex items-center cursor-pointer hover:bg-gray-800 rounded px-2 py-1">
                                            <span class="text-white text-lg mr-2">SN +221</span>
                                            <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                            </svg>
                                        </div>
                                        <div class="flex-1">
                                            <input 
                                                type="tel" 
                                                id="phoneNumber"
                                                class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                                                placeholder="Numéro de téléphone"
                                            >
                                        </div>
                                    </div>
                                </div>
                                <!-- Bouton Sauvegarder -->
                                <div class="pt-8">
                                    <button id="saveContactBtn" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                                        Sauvegarder le contact
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    setupAddContactListeners();
                });
            }
        });
    }
    
    // Fonction pour réattacher les event listeners de "Nouvelle discussion"
    function setupNewChatListeners() {
        const backBtn = document.getElementById('backToChats');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                if (sidebarChatsBackup) {
                    sidebarChats.innerHTML = sidebarChatsBackup;
                    // Réinitialiser tous les event listeners
                    setTimeout(() => {
                        initializeEventListeners();
                    }, 100);
                }
            });
        }

        const addContactBtn = document.getElementById('addContactBtn');
        if (addContactBtn) {
            addContactBtn.addEventListener('click', function () {
                // Remplacer par la vue "Nouveau contact"
                sidebarChats.innerHTML = `
                    <div class="flex flex-col h-full bg-gray-900" id="addContactPanel">
                        <!-- Header -->
                        <div class="flex items-center px-4 py-6">
                            <button id="backToNewChat" class="mr-4 text-gray-300 hover:text-white transition-colors">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                                </svg>
                            </button>
                            <h1 class="text-lg text-gray-300 font-normal">Nouveau contact</h1>
                        </div>
                        <!-- Form -->
                        <div class="px-6 pt-8 space-y-12">
                            <!-- Prénom -->
                            <div class="relative">
                                <div class="flex items-center mb-4">
                                    <svg class="w-5 h-5 text-gray-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span class="text-gray-400 text-sm">Prénom</span>
                                </div>
                                <input 
                                    type="text" 
                                    id="firstName"
                                    class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                                    placeholder="Entrez le prénom"
                                >
                            </div>
                            <!-- Nom -->
                            <div class="relative">
                                <div class="mb-4">
                                    <span class="text-gray-400 text-sm">Nom</span>
                                </div>
                                <input 
                                    type="text" 
                                    id="lastName"
                                    class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                                    placeholder="Entrez le nom"
                                >
                            </div>
                            <!-- Téléphone -->
                            <div class="relative">
                                <div class="flex items-center mb-4">
                                    <svg class="w-5 h-5 text-gray-500 mr-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>
                                    </svg>
                                    <div class="flex space-x-20">
                                        <span class="text-gray-400 text-sm">Pays</span>
                                        <span class="text-gray-400 text-sm">Téléphone</span>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-6">
                                    <div class="flex items-center cursor-pointer hover:bg-gray-800 rounded px-2 py-1">
                                        <span class="text-white text-lg mr-2">SN +221</span>
                                        <svg class="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                        </svg>
                                    </div>
                                    <div class="flex-1">
                                        <input 
                                            type="tel" 
                                            id="phoneNumber"
                                            class="w-full bg-transparent border-0 border-b border-gray-600 focus:border-gray-500 outline-none pb-3 text-white text-lg"
                                            placeholder="Numéro de téléphone"
                                        >
                                    </div>
                                </div>
                            </div>
                            <!-- Bouton Sauvegarder -->
                            <div class="pt-8">
                                <button id="saveContactBtn" class="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                                    Sauvegarder le contact
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                setupAddContactListeners();
            });
        }
    }

    // Fonction pour gérer les listeners de la vue "Nouveau contact"
    function setupAddContactListeners() {
        // Bouton retour vers "Nouvelle discussion"
        const backToNewChat = document.getElementById('backToNewChat');
        if (backToNewChat) {
            backToNewChat.addEventListener('click', function () {
                // Retourner à la vue "Nouvelle discussion"
                if (newChatBackup) {
                    sidebarChats.innerHTML = newChatBackup;
                    // Recharger les contacts
                    setTimeout(() => {
                        loadAndDisplayContacts();
                        setupNewChatListeners();
                    }, 100);
                }
            });
        }
        
        // Gestion de la sauvegarde du contact
        const saveContactBtn = document.getElementById('saveContactBtn');
        if (saveContactBtn) {
            saveContactBtn.addEventListener('click', async function () {
                const firstName = document.getElementById('firstName').value.trim();
                const lastName = document.getElementById('lastName').value.trim();
                const phoneNumber = document.getElementById('phoneNumber').value.trim();
                
                if (!firstName && !lastName) {
                    alert('Veuillez entrer au moins un prénom ou un nom.');
                    return;
                }
                
                if (!phoneNumber) {
                    alert('Veuillez entrer un numéro de téléphone.');
                    return;
                }
                
                // Désactiver le bouton pendant la sauvegarde
                saveContactBtn.disabled = true;
                saveContactBtn.textContent = 'Sauvegarde en cours...';
                saveContactBtn.classList.add('opacity-50');
                
                try {
                    // Préparer les données du contact
                    const contactData = {
                        phone: phoneNumber,
                        country: "SN",
                        firstName: firstName,
                        lastName: lastName,
                        fullName: `${firstName} ${lastName}`.trim(),
                        createdAt: new Date().toISOString()
                    };
                    
                    console.log('Données à sauvegarder:', contactData);
                    
                    // Sauvegarder via l'API
                    const savedContact = await saveContact(contactData);
                    
                    console.log('Contact sauvegardé:', savedContact);
                    alert(`Contact ${firstName} ${lastName} ajouté avec succès !`);
                    
                    // Retourner à la vue "Nouvelle discussion" et recharger les contacts
                    if (newChatBackup) {
                        sidebarChats.innerHTML = newChatBackup;
                        setTimeout(() => {
                            loadAndDisplayContacts();
                            setupNewChatListeners();
                        }, 100);
                    }
                } catch (error) {
                    console.error('Erreur lors de la sauvegarde:', error);
                    alert('Erreur lors de la sauvegarde du contact. Veuillez réessayer.');
                } finally {
                    // Réactiver le bouton
                    saveContactBtn.disabled = false;
                    saveContactBtn.textContent = 'Sauvegarder le contact';
                    saveContactBtn.classList.remove('opacity-50');
                }
            });
        }
    }

    // Initialiser tous les event listeners au chargement
    initializeEventListeners();
});

export {};