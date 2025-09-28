// --- YOUR FIREBASE CONFIG ---
        const firebaseConfig = {
          apiKey: "AIzaSyAFc4_sZ-gVimMsBUjQ-RGwJ90yQyxA0zI",
          authDomain: "aksiyon-takip.firebaseapp.com",
          projectId: "aksiyon-takip",
          storageBucket: "aksiyon-takip.firebasestorage.app",
          messagingSenderId: "692213499754",
          appId: "1:692213499754:web:2fea07badfd8eb7c978713",
          databaseURL: "https://aksiyon-takip-default-rtdb.europe-west1.firebasedatabase.app"
        };
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const database = firebase.database();

        // --- GOOGLE API CREDENTIALS MANAGEMENT ---
        let googleApiCredentials = {
            clientId: null,
            apiKey: null
        };

        // Initialize Google API credentials (run once to store in Firebase)
        async function initializeGoogleCredentials() {
            try {
                // Store credentials securely in Firebase Database
                const credentials = {
                    clientId: "598838942977-2ormcvf1k5sbsn469j5ia1355rl7ual5.apps.googleusercontent.com",
                    apiKey: "AIzaSyBQk65tQHizhFDqh-CpuAfYOM8ngJ6SGeI"
                };

                await database.ref('config/google').set(credentials);
                console.log("Google API credentials stored securely in Firebase");

                // Load the credentials immediately after storing
                await loadGoogleCredentials();
                return true;
            } catch (error) {
                console.error("Error storing Google credentials:", error);
                return false;
            }
        }

        // Retrieve Google API credentials from Firebase
        async function loadGoogleCredentials() {
            try {
                const snapshot = await database.ref('config/google').once('value');
                const credentials = snapshot.val();
                if (credentials) {
                    googleApiCredentials.clientId = credentials.clientId;
                    googleApiCredentials.apiKey = credentials.apiKey;
                    console.log("Google API credentials loaded from Firebase");
                    return true;
                }
                return false;
            } catch (error) {
                console.error("Error loading Google credentials:", error);
                return false;
            }
        }

        // Get Google Client ID (for use in code)
        function getGoogleClientId() {
            return googleApiCredentials.clientId;
        }

        // Get Google API Key (for use in code)
        function getGoogleApiKey() {
            return googleApiCredentials.apiKey;
        }

        // Example function for Google Drive integration
        async function initializeGoogleDriveAPI() {
            const apiKey = getGoogleApiKey();
            const clientId = getGoogleClientId();

            if (!apiKey || !clientId) {
                console.error("Google credentials not loaded yet");
                return false;
            }

            // TODO: Add Google Drive API initialization here
            // gapi.load('client:auth2', () => {
            //     gapi.client.init({
            //         apiKey: apiKey,
            //         clientId: clientId,
            //         discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            //         scope: 'https://www.googleapis.com/auth/drive.file'
            //     });
            // });

            console.log("Google Drive API ready to be initialized with secure credentials");
            return true;
        }

        // --- GOOGLE DRIVE CONFIG (Legacy support) ---
        const GOOGLE_DRIVE_CONFIG = {
            CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID', // Bu değer kullanıcı tarafından ayarlanmalı
            API_KEY: 'YOUR_GOOGLE_API_KEY', // Bu değer kullanıcı tarafından ayarlanmalı
            DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            SCOPES: 'https://www.googleapis.com/auth/drive.file'
        };

        let gapi_loaded = false;
        let google_drive_ready = false;

        // --- GLOBAL STATE ---
        let actions = [];
        let persons = [];
        let editingId = null;
        let postponingId = null;
        let currentPostponeId = null;
        let currentStatusFilter = 'all';
        let currentTeamFilter = 'all';
        let priorityFilterActive = false;
        let currentView = 'grouped';
        let calendarDate = new Date();
        
        // --- ICONS ---
        const ICONS = {
            edit: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
            priority: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
            postpone: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
            delete: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
            user: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
            add: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`
        };


        // --- AUTHENTICATION ---
        const loginContainer = document.getElementById('login-container');
        const appContainer = document.getElementById('app-container');
        const loginError = document.getElementById('login-error');

        auth.onAuthStateChanged((user) => {
            if (user) {
                loginContainer.style.display = 'none';
                document.body.style.background = 'var(--gray-50)';
                appContainer.style.display = 'block';
                
                const email = user.email || 'Kullanıcı';
                const userName = email.split('@')[0];
                const capitalizedUsername = userName.charAt(0).toUpperCase() + userName.slice(1);

                // Eski user elements varsa güncelle
                const currentUserName = document.getElementById('currentUserName');
                if (currentUserName) {
                    currentUserName.textContent = capitalizedUsername;
                }

                const userAvatar = document.getElementById('userAvatar');
                if (userAvatar) {
                    userAvatar.textContent = capitalizedUsername.charAt(0);
                }

                // Modern user display güncelle
                const userDisplayName = document.getElementById('userDisplayName');
                if (userDisplayName) {
                    userDisplayName.textContent = 'emre.pirinc';
                }

                const userDisplayNameDropdown = document.getElementById('userDisplayNameDropdown');
                if (userDisplayNameDropdown) {
                    userDisplayNameDropdown.textContent = 'emre.pirinc';
                }

                loadActions();
                loadPersons();

                // Load Google API credentials from Firebase
                loadGoogleCredentials().then((loaded) => {
                    if (!loaded) {
                        console.warn("Google credentials not found, initializing...");
                        // Initialize credentials if they don't exist (run once)
                        initializeGoogleCredentials().then((success) => {
                            if (success) {
                                // Test credentials after initialization
                                console.log("🔑 Test - Client ID:", getGoogleClientId() ? "✅ Loaded" : "❌ Failed");
                                console.log("🔑 Test - API Key:", getGoogleApiKey() ? "✅ Loaded" : "❌ Failed");

                                // Ready for Google Drive integration
                                initializeGoogleDriveAPI();
                            }
                        });
                    } else {
                        // Test credentials after loading
                        console.log("🔑 Test - Client ID:", getGoogleClientId() ? "✅ Loaded" : "❌ Failed");
                        console.log("🔑 Test - API Key:", getGoogleApiKey() ? "✅ Loaded" : "❌ Failed");

                        // Ready for Google Drive integration
                        initializeGoogleDriveAPI();
                    }
                });
            } else {
                loginContainer.style.display = 'flex';
                appContainer.style.display = 'none';
                document.body.style.background = 'linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%)';
            }
        });

        function signIn() {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            loginError.textContent = "";

            if (!email || !password) {
                loginError.textContent = "E-posta ve şifre alanları boş bırakılamaz.";
                return;
            }
            
            const persistence = document.getElementById('rememberMe').checked 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;

            auth.setPersistence(persistence)
              .then(() => auth.signInWithEmailAndPassword(email, password))
              .catch((error) => {
                  console.error("Giriş hatası:", error);
                  loginError.textContent = "Hatalı e-posta veya şifre.";
              });
        }

        function signOut() {
            auth.signOut();
        }

        // --- FORGOT PASSWORD FUNCTIONS ---
        function showForgotPasswordModal() {
            document.getElementById('forgotPasswordModal').classList.add('active');
            document.getElementById('forgotPasswordError').style.display = 'none';
            document.getElementById('forgotPasswordSuccess').style.display = 'none';
            document.getElementById('forgotEmail').value = '';
        }

        function closeForgotPasswordModal() {
            document.getElementById('forgotPasswordModal').classList.remove('active');
        }

        function sendPasswordResetEmail() {
            const email = document.getElementById('forgotEmail').value;
            const errorDiv = document.getElementById('forgotPasswordError');
            const successDiv = document.getElementById('forgotPasswordSuccess');

            errorDiv.style.display = 'none';
            successDiv.style.display = 'none';

            if (!email) {
                errorDiv.textContent = 'Lütfen e-posta adresinizi girin.';
                errorDiv.style.display = 'block';
                return;
            }

            // Send password reset email with Firebase
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    successDiv.innerHTML = `
                        <div style="text-align: center;">
                            <p style="color: #10b981; font-weight: 600; margin-bottom: 8px;">✅ Şifre sıfırlama linki gönderildi!</p>
                            <p style="font-size: 0.9em; color: #6b7280;">
                                E-posta adresinize gönderilen linke tıklayarak şifrenizi sıfırlayabilirsiniz.<br>
                                <strong>Spam klasörünüzü de kontrol etmeyi unutmayın.</strong>
                            </p>
                            <p style="font-size: 0.8em; color: #9ca3af; margin-top: 8px;">
                                Link gelmedi mi? Spam klasörünü kontrol edin veya birkaç dakika sonra tekrar deneyin.
                            </p>
                        </div>
                    `;
                    successDiv.style.display = 'block';

                    // Auto close modal after 8 seconds
                    setTimeout(() => {
                        closeForgotPasswordModal();
                    }, 8000);
                })
                .catch((error) => {
                    console.error('Password reset error:', error);
                    if (error.code === 'auth/user-not-found') {
                        errorDiv.textContent = 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.';
                    } else if (error.code === 'auth/invalid-email') {
                        errorDiv.textContent = 'Geçersiz e-posta adresi.';
                    } else {
                        errorDiv.textContent = 'Bir hata oluştu. Lütfen tekrar deneyin.';
                    }
                    errorDiv.style.display = 'block';
                });
        }


        // --- DATA HANDLING (FIREBASE) ---
        function loadActions() {
            const actionsRef = database.ref('actions');
            actionsRef.on('value', (snapshot) => {
                const data = snapshot.val();
                actions = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
                renderActions();
                updateStats();
            });
        }
        
        
        function loadPersons() {
            const personsRef = database.ref('persons');
            personsRef.on('value', (snapshot) => {
                const data = snapshot.val();
                persons = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
                updatePersonDropdown();
                renderPersonList();
            });
        }

        document.getElementById("actionForm").addEventListener("submit", async e => {
            e.preventDefault();

            // Upload files to Google Drive if any
            let uploadedFiles = [];
            if (selectedActionFiles.length > 0) {
                for (const fileData of selectedActionFiles) {
                    try {
                        const uploadedFile = await uploadFileToGoogleDrive(fileData.file);
                        uploadedFiles.push({
                            name: fileData.name,
                            type: fileData.type,
                            size: fileData.size,
                            url: uploadedFile.url || uploadedFile.webViewLink,
                            driveId: uploadedFile.id
                        });
                    } catch (error) {
                        console.error('File upload failed:', error);
                        // Continue with other files
                    }
                }
            }

            const actionData = {
                title: document.getElementById("actionTitle").value,
                responsible: document.getElementById("actionResponsible").value,
                description: document.getElementById("actionDescription").value,
                status: document.getElementById("actionStatus").value,
                date: document.getElementById("actionDate").value,
                assignedPerson: document.getElementById('assignedPerson').value,
                priority: editingId ? (actions.find(a => a.id === editingId)?.priority || false) : false,
                attachments: uploadedFiles // Add uploaded files
            };

            if (editingId) {
                database.ref('actions/' + editingId).update(actionData);
            } else {
                database.ref('actions').push(actionData);
            }

            // Reset selected files
            selectedActionFiles = [];
            const previewContainer = document.getElementById('actionFilePreview');
            if (previewContainer) previewContainer.innerHTML = '';

            closeModal();
        });
        
        function deleteAction(id) {
            if (confirm("Bu aksiyonu silmek istediğinizden emin misiniz?")) {
                database.ref('actions/' + id).remove();
            }
        }
        
        function togglePriority(id) {
            const action = actions.find(a => String(a.id) === String(id));

            if(action) {
                const newPriority = !(action.priority || false);

                // Önce local array'i güncelle
                action.priority = newPriority;

                // Sonra Firebase'e kaydet
                database.ref('actions/' + action.id).update({ priority: newPriority })
                    .then(() => {
                        // Show notification
                        showNotification(
                            newPriority ? '⭐ Öncelikli olarak işaretlendi!' : '☆ Öncelik kaldırıldı',
                            newPriority ? 'success' : 'info'
                        );

                        // Manuel olarak UI'yi güncelle
                        renderActions();
                    })
                    .catch((error) => {
                        console.error('Error updating priority:', error);
                        // Hata durumunda local değişikliği geri al
                        action.priority = !newPriority;
                        showNotification('❌ Öncelik güncellenirken hata oluştu!', 'warning');
                    });
            } else {
                showNotification('⚠️ Aksiyon bulunamadı!', 'warning');
            }
        }
        

        // Notification function
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `toast-notification ${type}`;
            notification.innerHTML = `
                <div class="toast-content">
                    <span class="toast-message">${message}</span>
                    <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;
            
            // Toast notification CSS'i ekle
            if (!document.querySelector('#toast-styles')) {
                const toastStyles = document.createElement('style');
                toastStyles.id = 'toast-styles';
                toastStyles.textContent = `
                    .toast-notification {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        padding: 15px 20px;
                        border-radius: 12px;
                        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                        z-index: 3000;
                        animation: slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s;
                        max-width: 350px;
                        backdrop-filter: blur(10px);
                    }
                    .toast-notification.success {
                        background: linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%);
                        color: white;
                        border: 1px solid rgba(16, 185, 129, 0.3);
                    }
                    .toast-notification.info {
                        background: linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.95) 100%);
                        color: white;
                        border: 1px solid rgba(59, 130, 246, 0.3);
                    }
                    .toast-notification.warning {
                        background: linear-gradient(135deg, rgba(245, 158, 11, 0.95) 0%, rgba(217, 119, 6, 0.95) 100%);
                        color: white;
                        border: 1px solid rgba(245, 158, 11, 0.3);
                    }
                    .toast-content {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 15px;
                    }
                    .toast-message {
                        font-weight: 600;
                        font-size: 0.9rem;
                    }
                    .toast-close {
                        background: none;
                        border: none;
                        color: currentColor;
                        cursor: pointer;
                        font-size: 1.2rem;
                        opacity: 0.8;
                        transition: opacity 0.2s;
                    }
                    .toast-close:hover {
                        opacity: 1;
                    }
                    @keyframes slideInRight {
                        from { transform: translateX(100%); opacity: 0; }
                        to { transform: translateX(0); opacity: 1; }
                    }
                    @keyframes fadeOut {
                        to { opacity: 0; transform: translateX(100%); }
                    }
                `;
                document.head.appendChild(toastStyles);
            }
            
            document.body.appendChild(notification);
            
            // 3 saniye sonra otomatik kaldır
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 3000);
        }

        // --- POSTPONE ACTION LOGIC ---
        // --- ADD NOTE/ACTION LOGIC ---
        let currentActionId = null;
        let selectedNoteFiles = [];
        let selectedPostponeImages = [];

        function openAddNoteModal(id) {
            currentActionId = id;
            selectedNoteFiles = [];

            // Reset form
            const form = document.getElementById('addNoteForm');
            if (form) {
                form.reset();
                document.getElementById('noteColor').value = '#3498db';
                document.getElementById('noteFilePreview').innerHTML = '';
                document.getElementById('postponeDateGroup').style.display = 'none';
            }

            // Set date if postpone type
            const action = actions.find(a => a.id === id);
            if (action && action.date) {
                document.getElementById('notePostponeDate').value = action.date;
            }

            // Show modal
            const modal = document.getElementById('addNoteModal');
            modal.classList.add('active');
            modal.style.display = 'flex';

            // Initialize upload handler
            noteFileUploadInitialized = false; // Reset to allow re-initialization
            handleNoteFileUpload();
        }

        function closeAddNoteModal() {
            const modal = document.getElementById('addNoteModal');
            modal.classList.remove('active');
            modal.style.display = 'none';
            currentActionId = null;
            selectedNoteFiles = [];
        }

        // Color picker functionality
        function setupColorPicker() {
            const colorInput = document.getElementById('noteColor');
            const colorPresets = document.querySelectorAll('.color-preset');

            colorPresets.forEach(preset => {
                preset.addEventListener('click', () => {
                    const color = preset.getAttribute('data-color');
                    colorInput.value = color;
                    colorPresets.forEach(p => p.classList.remove('selected'));
                    preset.classList.add('selected');
                });
            });
        }

        // File handling functions
        let actionFilesInitialized = false;
        let selectedActionFiles = []; // Store selected action files

        function handleActionFileUpload() {
            if (actionFilesInitialized) return; // Prevent duplicate event listeners

            const fileInput = document.getElementById('actionFiles');
            const filePreview = document.getElementById('actionFilePreview');

            if (!fileInput) return;

            fileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);

                for (const file of files) {
                    const fileData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                        file: file, // Keep original file for upload later
                        url: URL.createObjectURL(file) // Temporary URL for preview
                    };

                    selectedActionFiles.push(fileData);
                    displayActionFilePreview(fileData);
                }

                fileInput.value = ''; // Reset input
            });

            actionFilesInitialized = true;
        }

        function displayActionFilePreview(fileData) {
            const previewContainer = document.getElementById('actionFilePreview');
            if (!previewContainer) return;

            const fileItem = document.createElement('div');
            fileItem.className = fileData.type.startsWith('image/') ? 'file-preview-item image' : 'file-preview-item';

            if (fileData.type.startsWith('image/')) {
                fileItem.innerHTML = `
                    <div style="position: relative; display: flex; flex-direction: column; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; max-width: 280px;">
                        <div onclick="handleAttachmentClick('${fileData.url}', '${fileData.name}', '${fileData.type}')" style="cursor: pointer; margin-bottom: 8px;">
                            <img src="${fileData.url}" alt="${fileData.name}" style="width: 100%; max-width: 260px; height: auto; max-height: 150px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-size: 12px; color: #374151; word-break: break-word;" title="${fileData.name}">${fileData.name}</span>
                            <button class="remove-file" onclick="removeActionFile('${fileData.name}')" style="padding: 4px 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; font-size: 12px; color: #dc2626; cursor: pointer; margin-left: 8px;" title="Dosyayı kaldır">×</button>
                        </div>
                    </div>
                `;
            } else {
                const fileIcon = getFileIcon(fileData.type);
                fileItem.innerHTML = `
                    <div class="file-icon">${fileIcon}</div>
                    <div class="file-name">${fileData.name}</div>
                    <button class="remove-file" onclick="removeActionFile('${fileData.name}')" title="Dosyayı kaldır">×</button>
                `;
            }

            previewContainer.appendChild(fileItem);
        }

        function removeActionFile(fileName) {
            selectedActionFiles = selectedActionFiles.filter(f => f.name !== fileName);

            // Remove from preview
            const previewContainer = document.getElementById('actionFilePreview');
            const fileItems = previewContainer.children;
            for (let i = 0; i < fileItems.length; i++) {
                const item = fileItems[i];
                if (item.querySelector('.file-name')?.textContent === fileName ||
                    item.querySelector('img')?.alt === fileName) {
                    item.remove();
                    break;
                }
            }
        }

        function getFileIcon(fileType) {
            if (fileType.includes('pdf')) return '📄';
            if (fileType.includes('word') || fileType.includes('document')) return '📝';
            if (fileType.includes('sheet') || fileType.includes('excel')) return '📊';
            if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📊';
            if (fileType.includes('text')) return '📄';
            if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️';
            return '📎';
        }

        // Note file upload handler (same as action file upload)
        let noteFileUploadInitialized = false;

        function handleNoteFileUpload() {
            if (noteFileUploadInitialized) return;

            const fileInput = document.getElementById('noteFiles');
            const filePreview = document.getElementById('noteFilePreview');

            if (!fileInput) return;

            fileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);

                for (const file of files) {
                    const fileData = {
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        lastModified: file.lastModified,
                        file: file,
                        url: URL.createObjectURL(file)
                    };

                    selectedNoteFiles.push(fileData);
                    displayNoteFilePreview(fileData);
                }

                fileInput.value = '';
            });

            noteFileUploadInitialized = true;
        }

        function displayNoteFilePreview(fileData) {
            const previewContainer = document.getElementById('noteFilePreview');
            if (!previewContainer) return;

            const fileItem = document.createElement('div');
            fileItem.className = fileData.type.startsWith('image/') ? 'file-preview-item image' : 'file-preview-item';

            if (fileData.type.startsWith('image/')) {
                fileItem.innerHTML = `
                    <div style="position: relative; display: flex; flex-direction: column; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; max-width: 280px;">
                        <div onclick="handleAttachmentClick('${fileData.url}', '${fileData.name}', '${fileData.type}')" style="cursor: pointer; margin-bottom: 8px;">
                            <img src="${fileData.url}" alt="${fileData.name}" style="width: 100%; max-width: 260px; height: auto; max-height: 150px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-size: 12px; color: #374151; word-break: break-word;" title="${fileData.name}">${fileData.name}</span>
                            <button onclick="removeNoteFile('${fileData.name}')" style="padding: 4px 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; font-size: 12px; color: #dc2626; cursor: pointer; margin-left: 8px;" title="Dosyayı kaldır">×</button>
                        </div>
                    </div>
                `;
            } else {
                const fileIcon = getFileIcon(fileData.type);
                fileItem.innerHTML = `
                    <div class="file-icon">${fileIcon}</div>
                    <div class="file-name">${fileData.name}</div>
                    <button onclick="removeNoteFile('${fileData.name}')" title="Dosyayı kaldır">×</button>
                `;
            }

            previewContainer.appendChild(fileItem);
        }

        function removeNoteFile(fileName) {
            selectedNoteFiles = selectedNoteFiles.filter(f => f.name !== fileName);

            // Remove from preview
            const previewContainer = document.getElementById('noteFilePreview');
            const fileItems = previewContainer.children;
            for (let i = 0; i < fileItems.length; i++) {
                const item = fileItems[i];
                if (item.querySelector('div div').textContent === fileName) {
                    item.remove();
                    break;
                }
            }
        }

        // Google Drive API initialization
        async function initGoogleDriveAPI() {
            if (!GOOGLE_DRIVE_CONFIG.CLIENT_ID || GOOGLE_DRIVE_CONFIG.CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
                console.log('Google Drive API not configured');
                return false;
            }

            try {
                await gapi.load('auth2:client', async () => {
                    await gapi.client.init({
                        apiKey: GOOGLE_DRIVE_CONFIG.API_KEY,
                        clientId: GOOGLE_DRIVE_CONFIG.CLIENT_ID,
                        discoveryDocs: [GOOGLE_DRIVE_CONFIG.DISCOVERY_DOC],
                        scope: GOOGLE_DRIVE_CONFIG.SCOPES
                    });

                    google_drive_ready = true;
                    console.log('Google Drive API initialized');
                });
                return true;
            } catch (error) {
                console.error('Google Drive API initialization failed:', error);
                return false;
            }
        }

        async function authenticateGoogleDrive() {
            if (!google_drive_ready) {
                await initGoogleDriveAPI();
            }

            if (!google_drive_ready) return false;

            try {
                const authInstance = gapi.auth2.getAuthInstance();
                if (!authInstance.isSignedIn.get()) {
                    await authInstance.signIn();
                }
                return true;
            } catch (error) {
                console.error('Google Drive authentication failed:', error);
                return false;
            }
        }

        async function uploadToGoogleDriveAPI(file) {
            try {
                const authenticated = await authenticateGoogleDrive();
                if (!authenticated) {
                    throw new Error('Google Drive authentication failed');
                }

                // Create file metadata
                const metadata = {
                    name: `aksiyon-takip-${Date.now()}-${file.name}`,
                    parents: [] // You can specify a folder ID here if needed
                };

                // Convert file to base64
                const base64Data = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result.split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                // Upload to Google Drive
                const response = await gapi.client.request({
                    path: 'https://www.googleapis.com/upload/drive/v3/files',
                    method: 'POST',
                    params: {
                        uploadType: 'multipart'
                    },
                    headers: {
                        'Content-Type': 'multipart/related; boundary="foo_bar_baz"'
                    },
                    body: `--foo_bar_baz\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--foo_bar_baz\r\nContent-Type: ${file.type}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64Data}\r\n--foo_bar_baz--`
                });

                // Make the file publicly viewable
                await gapi.client.drive.permissions.create({
                    fileId: response.result.id,
                    resource: {
                        role: 'reader',
                        type: 'anyone'
                    }
                });

                return {
                    id: response.result.id,
                    name: file.name,
                    url: `https://drive.google.com/uc?id=${response.result.id}`,
                    driveId: response.result.id
                };

            } catch (error) {
                console.error('Google Drive upload failed:', error);
                throw error;
            }
        }

        async function uploadToGoogleDrive(file) {
            // Try Google Drive upload first
            if (google_drive_ready || GOOGLE_DRIVE_CONFIG.CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
                try {
                    const result = await uploadToGoogleDriveAPI(file);
                    showNotification('📁 Google Drive\'a yüklendi', 'success');
                    return result;
                } catch (error) {
                    console.error('Google Drive upload failed, using local storage:', error);
                    showNotification('⚠️ Google Drive yüklenemedi, yerel önizleme kullanılıyor', 'warning');
                }
            }

            // Fallback to local preview
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        id: Date.now() + Math.random(),
                        name: file.name,
                        url: e.target.result,
                        type: file.type,
                        driveId: null
                    });
                };
                reader.readAsDataURL(file);
            });
        }

        async function uploadFileToGoogleDrive(file) {
            // Use same logic as existing uploadToGoogleDrive
            return await uploadToGoogleDrive(file);
        }


        // Note type change handler
        function setupNoteTypeHandler() {
            const noteType = document.getElementById('noteType');
            const postponeDateGroup = document.getElementById('postponeDateGroup');

            noteType.addEventListener('change', () => {
                if (noteType.value === 'postpone') {
                    postponeDateGroup.style.display = 'block';
                    document.getElementById('notePostponeDate').required = true;
                } else {
                    postponeDateGroup.style.display = 'none';
                    document.getElementById('notePostponeDate').required = false;
                }
            });

            // Add handler for inline note type
            const inlineNoteType = document.getElementById('inlineNoteType');
            const inlinePostponeDateGroup = document.getElementById('inlinePostponeDateGroup');

            if (inlineNoteType && inlinePostponeDateGroup) {
                inlineNoteType.addEventListener('change', () => {
                    if (inlineNoteType.value === 'postpone') {
                        inlinePostponeDateGroup.style.display = 'block';
                        document.getElementById('inlineNotePostponeDate').required = true;
                    } else {
                        inlinePostponeDateGroup.style.display = 'none';
                        document.getElementById('inlineNotePostponeDate').required = false;
                    }
                });
            }

            // Add handler for edit status change to update view status color
            const editStatusSelect = document.getElementById('editActionStatus');
            if (editStatusSelect) {
                editStatusSelect.addEventListener('change', () => {
                    const newStatus = editStatusSelect.value;
                    const viewStatusSpan = document.getElementById('viewActionStatus');
                    if (viewStatusSpan) {
                        viewStatusSpan.textContent = getStatusText(newStatus);
                        viewStatusSpan.className = `status-badge ${newStatus}`;
                    }
                });
            }
        }

        // Image modal functions with zoom
        let currentZoom = 1;
        let currentX = 0;
        let currentY = 0;
        let isDragging = false;
        let startX = 0;
        let startY = 0;

        function openImageModal(imageUrl) {
            const modal = document.getElementById('imageModal');
            const modalImage = document.getElementById('modalImage');

            modalImage.src = imageUrl;
            modal.style.display = 'flex';

            // Reset zoom and position
            currentZoom = 1;
            currentX = 0;
            currentY = 0;
            updateImageTransform();

            // Prevent body scroll
            document.body.style.overflow = 'hidden';

            // Add event listeners for image interaction
            addImageEventListeners();
        }

        function closeImageModal() {
            const modal = document.getElementById('imageModal');
            modal.style.display = 'none';

            // Restore body scroll
            document.body.style.overflow = 'auto';

            // Remove event listeners
            removeImageEventListeners();
        }

        function zoomIn() {
            currentZoom = Math.min(currentZoom * 1.5, 5);
            updateImageTransform();
        }

        function zoomOut() {
            currentZoom = Math.max(currentZoom / 1.5, 0.5);
            updateImageTransform();
        }

        function resetZoom() {
            currentZoom = 1;
            currentX = 0;
            currentY = 0;
            updateImageTransform();
        }

        function updateImageTransform() {
            const modalImage = document.getElementById('modalImage');
            modalImage.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentZoom})`;
        }

        function addImageEventListeners() {
            const modalImage = document.getElementById('modalImage');
            const imageContainer = document.querySelector('.image-container');

            // Mouse wheel zoom
            imageContainer.addEventListener('wheel', handleWheel, { passive: false });

            // Mouse drag
            imageContainer.addEventListener('mousedown', handleMouseDown);
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            // Touch events for mobile
            imageContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            imageContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            imageContainer.addEventListener('touchend', handleTouchEnd);
        }

        function removeImageEventListeners() {
            const imageContainer = document.querySelector('.image-container');
            if (imageContainer) {
                imageContainer.removeEventListener('wheel', handleWheel);
                imageContainer.removeEventListener('mousedown', handleMouseDown);
                imageContainer.removeEventListener('touchstart', handleTouchStart);
                imageContainer.removeEventListener('touchmove', handleTouchMove);
                imageContainer.removeEventListener('touchend', handleTouchEnd);
            }
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        function handleWheel(e) {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 1.1 : 0.9;
            currentZoom = Math.min(Math.max(currentZoom * delta, 0.5), 5);
            updateImageTransform();
        }

        function handleMouseDown(e) {
            if (currentZoom > 1) {
                isDragging = true;
                startX = e.clientX - currentX;
                startY = e.clientY - currentY;
                e.preventDefault();
            }
        }

        function handleMouseMove(e) {
            if (isDragging && currentZoom > 1) {
                currentX = e.clientX - startX;
                currentY = e.clientY - startY;
                updateImageTransform();
            }
        }

        function handleMouseUp() {
            isDragging = false;
        }

        // Touch events for mobile
        let lastTouch = null;
        let lastDistance = 0;

        function handleTouchStart(e) {
            e.preventDefault();
            if (e.touches.length === 1 && currentZoom > 1) {
                isDragging = true;
                startX = e.touches[0].clientX - currentX;
                startY = e.touches[0].clientY - currentY;
            } else if (e.touches.length === 2) {
                lastDistance = getDistance(e.touches[0], e.touches[1]);
            }
        }

        function handleTouchMove(e) {
            e.preventDefault();
            if (e.touches.length === 1 && isDragging && currentZoom > 1) {
                currentX = e.touches[0].clientX - startX;
                currentY = e.touches[0].clientY - startY;
                updateImageTransform();
            } else if (e.touches.length === 2) {
                const distance = getDistance(e.touches[0], e.touches[1]);
                if (lastDistance > 0) {
                    const scale = distance / lastDistance;
                    currentZoom = Math.min(Math.max(currentZoom * scale, 0.5), 5);
                    updateImageTransform();
                }
                lastDistance = distance;
            }
        }

        function handleTouchEnd() {
            isDragging = false;
            lastDistance = 0;
        }

        function getDistance(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeImageModal();
            }
        });

        // --- PASSWORD CHANGE FUNCTIONS ---
        function openPasswordChange() {
            const modal = document.getElementById('passwordModal');
            modal.classList.add('active');
            modal.style.display = 'flex';

            // Close modern user dropdown
            const modernUserDropdown = document.getElementById('modernUserDropdown');
            if (modernUserDropdown) {
                modernUserDropdown.classList.remove('active');
            }
        }

        function closePasswordModal() {
            const modal = document.getElementById('passwordModal');
            modal.classList.remove('active');
            modal.style.display = 'none';
            const passwordForm = document.getElementById('passwordForm');
            if (passwordForm) {
                passwordForm.reset();
            }

            // Reset user dropdown display
            const modernUserDropdown = document.getElementById('modernUserDropdown');
            if (modernUserDropdown) {
                modernUserDropdown.style.display = '';
            }
        }

        document.getElementById("addNoteForm").addEventListener("submit", async e => {
            e.preventDefault();
            if (!currentActionId) return;

            const noteType = document.getElementById('noteType').value;
            const noteText = document.getElementById('noteText').value;
            const noteColor = document.getElementById('noteColor').value;
            const currentAction = actions.find(a => a.id === currentActionId);

            if (!currentAction) return;

            // Upload note files to Google Drive if any
            let uploadedNoteFiles = [];
            if (selectedNoteFiles.length > 0) {
                for (const fileData of selectedNoteFiles) {
                    try {
                        const uploadedFile = await uploadFileToGoogleDrive(fileData.file);
                        uploadedNoteFiles.push({
                            name: fileData.name,
                            type: fileData.type,
                            size: fileData.size,
                            url: uploadedFile.url || uploadedFile.webViewLink,
                            driveId: uploadedFile.id
                        });
                    } catch (error) {
                        console.error('File upload failed:', error);
                        // Continue with other files
                    }
                }
            }

            // Create note object
            const noteData = {
                id: Date.now(),
                type: noteType,
                text: noteText,
                color: noteColor,
                attachments: uploadedNoteFiles,
                timestamp: new Date().toISOString(),
                author: auth.currentUser ? auth.currentUser.email : 'unknown'
            };

            // Handle postpone type specially
            if (noteType === 'postpone') {
                const newDate = document.getElementById('notePostponeDate').value;
                if (!newDate) {
                    showNotification('🚫 Erteleme için yeni tarih gerekli!', 'error');
                    return;
                }

                // Handle postpone history
                const postponeHistory = currentAction.postponeHistory || [];

                if (currentAction.postponed && currentAction.postponeReason && currentAction.originalDate) {
                    postponeHistory.push({
                        reason: currentAction.postponeReason,
                        originalDate: currentAction.originalDate,
                        postponeDate: currentAction.date,
                        timestamp: new Date().toISOString()
                    });
                } else if (currentAction.postponed && currentAction.postponeReason) {
                    postponeHistory.push({
                        reason: currentAction.postponeReason,
                        originalDate: currentAction.date,
                        postponeDate: currentAction.date,
                        timestamp: new Date().toISOString()
                    });
                }

                postponeHistory.push({
                    reason: noteText,
                    originalDate: currentAction.originalDate || currentAction.date,
                    postponeDate: newDate,
                    timestamp: new Date().toISOString()
                });

                // Update action with postpone data
                await database.ref('actions/' + currentActionId).update({
                    date: newDate,
                    postponed: true,
                    postponeReason: noteText,
                    originalDate: currentAction.originalDate || currentAction.date,
                    postponeHistory: postponeHistory
                });
            }

            // Add note to action's notes array
            const actionNotes = currentAction.notes || [];
            actionNotes.push(noteData);

            await database.ref('actions/' + currentActionId + '/notes').set(actionNotes);

            showNotification(`✅ ${noteType.charAt(0).toUpperCase() + noteType.slice(1)} eklendi!`, 'success');
            closeAddNoteModal();
        });

        document.getElementById("passwordForm").addEventListener("submit", e => {
            e.preventDefault();

            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('changeNewPassword').value;
            const confirmPassword = document.getElementById('changeConfirmPassword').value;

            // Şifre kontrolü
            if (newPassword !== confirmPassword) {
                showNotification('🚫 Yeni şifreler uyuşmuyor!', 'error');
                return;
            }

            if (newPassword.length < 6) {
                showNotification('🚫 Şifre en az 6 karakter olmalı!', 'error');
                return;
            }

            const user = auth.currentUser;
            if (!user) {
                showNotification('🚫 Kullanıcı oturumu bulunamadı!', 'error');
                return;
            }

            // Firebase ile şifre değiştirme - önce mevcut şifreyi doğrula
            const email = user.email;
            const credential = firebase.auth.EmailAuthProvider.credential(email, currentPassword);

            // Kullanıcının kimliğini tekrar doğrula
            user.reauthenticateWithCredential(credential)
                .then(() => {
                    // Mevcut şifre doğru, yeni şifreyi güncelle
                    return user.updatePassword(newPassword);
                })
                .then(() => {
                    showNotification('✅ Şifre başarıyla değiştirildi!', 'success');
                    closePasswordModal();
                })
                .catch((error) => {
                    console.error('Şifre değiştirme hatası:', error);
                    if (error.code === 'auth/wrong-password') {
                        showNotification('🚫 Mevcut şifre yanlış!', 'error');
                    } else if (error.code === 'auth/weak-password') {
                        showNotification('🚫 Yeni şifre çok zayıf!', 'error');
                    } else {
                        showNotification('🚫 Şifre değiştirme başarısız: ' + error.message, 'error');
                    }
                });
        });
        
        // --- UI RENDERING ---
        function getFilteredActions() {
            const searchTerm = document.getElementById("searchInput").value.toLowerCase();
            let filteredActions = [...actions]; // Create a copy to avoid modifying original

            // Öncelik filtresi
            if (priorityFilterActive) {
                 filteredActions = filteredActions.filter(a => a.priority === true);
            }
            
            // Takım filtresi
            if (currentTeamFilter !== 'all') {
                filteredActions = filteredActions.filter(a => a.responsible && a.responsible.includes(currentTeamFilter));
            }
            
            // Durum filtresi
            if (currentStatusFilter !== 'all') {
                filteredActions = filteredActions.filter(a => a.status === currentStatusFilter);
            }
            
            // Arama filtresi
            if (searchTerm) {
                filteredActions = filteredActions.filter(a => 
                    (a.title && a.title.toLowerCase().includes(searchTerm)) ||
                    (a.description && a.description.toLowerCase().includes(searchTerm)) ||
                    (a.responsible && a.responsible.toLowerCase().includes(searchTerm))
                );
            }
            
            // console.log('Filtered actions:', filteredActions.length, 'Priority filter active:', priorityFilterActive);
            return filteredActions;
        }
        
        function renderActions() {
            const filteredActions = getFilteredActions();
            
            // Tüm görünümleri gizle
            document.querySelectorAll('.actions-view-container').forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
            });

            if (filteredActions.length === 0) {
                 const noResultsEl = document.getElementById('noResults');
                 noResultsEl.innerHTML = `<p>Bu filtreler ile eşleşen aksiyon bulunamadı.</p>`;
                 noResultsEl.classList.add('active');
                 noResultsEl.style.display = 'block';
                 return;
            }

            const viewContainerId = `actionsContainer${currentView.charAt(0).toUpperCase() + currentView.slice(1)}`;
            const containerElement = document.getElementById(viewContainerId);
            
            if (containerElement) {
                containerElement.classList.add('active');
                containerElement.style.display = 'block';
                
                switch(currentView) {
                    case 'grouped': 
                        renderGroupedView(filteredActions); 
                        break;
                    case 'list': 
                        renderListView(filteredActions); 
                        break;
                    case 'kanban': 
                        renderKanbanView(filteredActions); 
                        break;
                    case 'calendar': 
                        renderCalendarView(filteredActions); 
                        break;
                }
            }
        }

        function renderGroupedView(data) {
            const container = document.getElementById("actionsContainerGrouped");
            const grouped = {
                anadolu: data.filter(a => a.responsible === "Anadolu Bakır"),
                aifteam: data.filter(a => a.responsible === "AIFTEAM"),
                ortak: data.filter(a => a.responsible && a.responsible.includes("Ortak"))
            };

            const createSection = (title, team, sectionData) => {
                if (sectionData.length === 0) return '';
                return `
                    <div class="team-section">
                        <div class="team-header ${team}">
                            <h2>${title}</h2>
                            <span>${sectionData.length} aksiyon</span>
                        </div>
                        <div class="team-actions">${sectionData.map(createActionCard).join("")}</div>
                    </div>`;
            };
            container.innerHTML = createSection('🏢 Anadolu Bakır', 'anadolu', grouped.anadolu) +
                                createSection('💻 AIFTEAM', 'aifteam', grouped.aifteam) +
                                createSection('🤝 Ortak Aksiyonlar', 'ortak', grouped.ortak);
        }

        function createActionCard(action) {
            // Action objesi geçerli mi kontrol et
            if (!action || !action.id) {
                console.error('Invalid action object:', action);
                return '';
            }
            
            const { id, title, responsible, description, status, date, priority, postponed, postponeReason, assignedPerson } = action;
            const teamType = getTeamType(responsible);
            
            const personName = assignedPerson ? (persons.find(p => p.id === assignedPerson)?.name || '') : '';
            
            const today = new Date();
            today.setHours(0,0,0,0);
            const actionDate = date ? new Date(date + 'T00:00:00') : null; // Ensure local timezone
            const isOverdue = actionDate && actionDate < today && status !== 'completed';

            // Boş action'ları filtrele
            if (!title || !responsible) {
                console.warn('Skipping empty action:', action);
                return '';
            }

            return `
                <div class="action-card ${teamType} ${postponed ? 'postponed' : ''}" draggable="true" data-action-id="${id}" ondragstart="drag(event, '${id}')">
                    <div class="action-header" onclick="openDetailView('${id}')" style="cursor: pointer;">
                        <div class="action-title-block">
                            <div class="action-title">${priority ? '⭐ ' : ''}${title || 'Başlıksız Aksiyon'}</div>
                            <div class="responsible">${responsible || 'Atanmamış'}</div>
                             ${personName ? `<div class="assigned-person">${ICONS.user} ${personName}</div>` : ''}
                        </div>
                        <span class="status-badge ${status}" onclick="event.stopPropagation(); quickStatusChange('${id}', '${status}')">${getStatusText(status)}</span>
                    </div>

                    <div class="action-body" onclick="openDetailView('${id}')" style="cursor: pointer;">
                        <div class="action-description">${description || 'Açıklama yok'}</div>

                        ${action.attachments && action.attachments.length > 0 ? `
                            <div class="action-attachments" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                                <small style="color: #666; font-weight: 500; font-size: 0.75rem;">📎 Ekler (${action.attachments.length})</small>
                                <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                                    ${action.attachments.map(file => {
                                        if (file.type && file.type.startsWith('image/')) {
                                            return `
                                                <div class="attachment-item image-attachment" onclick="event.stopPropagation(); handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="cursor: pointer; border-radius: 6px; overflow: hidden; position: relative; width: 50px; height: 50px; margin: 2px;" title="${file.name} - Görüntüle">
                                                    <img src="${file.url}" alt="${file.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;">
                                                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white; font-size: 0.6rem; text-align: center; padding: 2px 0; border-radius: 0 0 4px 4px;">📷</div>
                                                </div>
                                            `;
                                        } else {
                                            return `
                                                <div class="attachment-item" style="display: flex; align-items: center; padding: 2px 5px; background: #f8f9fa; border-radius: 3px; font-size: 0.7rem;">
                                                    <span style="margin-right: 3px; font-size: 0.8rem;">${getFileIcon(file.type)}</span>
                                                    <span onclick="event.stopPropagation(); handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="color: #007bff; cursor: pointer; text-decoration: underline; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${file.name} - Görüntüle/İndir">${file.name}</span>
                                                </div>
                                            `;
                                        }
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${action.notes && action.notes.length > 0 ?
                            action.notes.map(note => {
                                const typeNames = {
                                    'postpone': 'Erteleme',
                                    'note': 'Not',
                                    'update': 'Güncelleme',
                                    'reminder': 'Hatırlatma'
                                };
                                const typeName = typeNames[note.type] || note.type;
                                const noteDate = new Date(note.timestamp).toLocaleDateString('tr-TR');
                                const softBg = getSoftColor(note.color, 0.12);
                                const textColor = getSoftTextColor(note.color);
                                const borderColor = getMutedColor(note.color);

                                return `<div class="update-box" style="margin-bottom: 8px; border-left: 3px solid ${borderColor}; background: ${softBg}; color: ${textColor}; padding: 12px; border-radius: 8px; border: 1px solid ${getSoftColor(note.color, 0.2)};">
                                    <strong style="color: ${note.color}; font-weight: 600;">${typeName}:</strong>
                                    <span style="color: ${textColor}; margin-left: 6px; line-height: 1.4;">${note.text}</span>
                                    ${note.attachments && note.attachments.length > 0 ? `
                                        <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid ${getSoftColor(note.color, 0.3)};">
                                            <small style="color: #6b7280; font-size: 0.7rem; margin-bottom: 4px; display: block;">📎 Ekli Dosyalar (${note.attachments.length})</small>
                                            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                                                ${note.attachments.map(file => {
                                                    if (file.type && file.type.startsWith('image/')) {
                                                        return `
                                                            <div onclick="event.stopPropagation(); handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="cursor: pointer; border-radius: 4px; overflow: hidden; position: relative; width: 40px; height: 40px; border: 1px solid rgba(255,255,255,0.5);" title="${file.name} - Görüntüle">
                                                                <img src="${file.url}" alt="${file.name}" style="width: 100%; height: 100%; object-fit: cover;">
                                                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; font-size: 0.5rem; text-align: center; padding: 1px 0;">📷</div>
                                                            </div>
                                                        `;
                                                    } else {
                                                        return `
                                                            <div onclick="event.stopPropagation(); handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="display: flex; align-items: center; padding: 2px 4px; background: rgba(255,255,255,0.6); border-radius: 3px; font-size: 0.65rem; cursor: pointer; border: 1px solid rgba(0,0,0,0.1);" title="${file.name} - Görüntüle/İndir">
                                                                <span style="margin-right: 2px; font-size: 0.7rem;">${getFileIcon(file.type)}</span>
                                                                <span style="max-width: 50px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
                                                            </div>
                                                        `;
                                                    }
                                                }).join('')}
                                            </div>
                                        </div>
                                    ` : ''}
                                    <br><small style="color: #6b7280; margin-top: 6px; display: inline-block; font-size: 0.75rem;">${noteDate}
                                    <button class="note-delete-btn" onclick="deleteNote('${id}', ${note.id})" title="Notu sil" style="margin-left: 10px; background: rgba(107, 114, 128, 0.1); color: #6b7280; border: 1px solid rgba(107, 114, 128, 0.2); border-radius: 4px; padding: 3px 6px; cursor: pointer; font-size: 11px; transition: all 0.2s;">🗑️</button>
                                    </small>
                                </div>`;
                            }).join('')
                            : ''
                        }
                    </div>

                    <div class="action-footer">
                        <div class="date ${isOverdue ? 'overdue' : ''}" onclick="openDetailView('${id}')" style="cursor: pointer;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            <span>${date ? formatDate(date) : "Tarih Yok"}</span>
                        </div>
                        <div class="action-buttons">
                            <button class="action-btn ${priority ? 'priority-active' : ''}" data-action="priority" data-action-id="${id}" title="Öncelik">${ICONS.priority}</button>
                            <button class="action-btn" data-action="add-note" data-action-id="${id}" title="Aksiyon Ekle">${ICONS.add}</button>
                            <button class="action-btn" data-action="delete" data-action-id="${id}" title="Sil">${ICONS.delete}</button>
                        </div>
                    </div>
                </div>`;
        }
        
        function updateStats() {
            document.getElementById("anadoluTotal").textContent = actions.filter(a => a.responsible === "Anadolu Bakır").length;
            document.getElementById("anadoluProgress").textContent = actions.filter(a => a.responsible === "Anadolu Bakır" && a.status === 'in-progress').length;
            document.getElementById("anadoluWaiting").textContent = actions.filter(a => a.responsible === "Anadolu Bakır" && a.status === 'waiting').length;

            document.getElementById("aifteamTotal").textContent = actions.filter(a => a.responsible === "AIFTEAM").length;
            document.getElementById("aifteamProgress").textContent = actions.filter(a => a.responsible === "AIFTEAM" && a.status === 'in-progress').length;
            document.getElementById("aifteamWaiting").textContent = actions.filter(a => a.responsible === "AIFTEAM" && a.status === 'waiting').length;

            const ortak = actions.filter(a => a.responsible && a.responsible.includes("Ortak"));
            document.getElementById("ortakTotal").textContent = ortak.length;
            document.getElementById("ortakProgress").textContent = ortak.filter(a => a.status === 'in-progress').length;
            document.getElementById("ortakWaiting").textContent = ortak.filter(a => a.status === 'waiting').length;
        }

        // --- UI HELPERS & EVENT LISTENERS ---
        function getTeamType(responsible) {
            if (!responsible) return '';
            if (responsible.includes("Ortak")) return "ortak";
            if (responsible === "AIFTEAM") return "aifteam";
            if (responsible === "Anadolu Bakır") return "anadolu";
            return '';
        }

        function getStatusText(status) {
            return { completed: "Tamamlandı", "in-progress": "Devam Ediyor", waiting: "Bekliyor" }[status] || status;
        }
        
        function formatDate(dateStr) {
            if (!dateStr) return "";
            const [year, month, day] = dateStr.split('-');
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', year: 'numeric' });
        }
        
        function openModal() {
            editingId = null;
            const actionForm = document.getElementById("actionForm");
            if (actionForm) {
                actionForm.reset();
            }

            // Clear file preview and selected files
            selectedActionFiles = [];
            const previewContainer = document.getElementById('actionFilePreview');
            if (previewContainer) previewContainer.innerHTML = '';


            document.getElementById("modalTitle").textContent = "Yeni Aksiyon Ekle";
            const modal = document.getElementById("actionModal");
            modal.classList.add("active");
            modal.style.display = "flex";
        }

        function closeModal() {
            const modal = document.getElementById("actionModal");
            modal.classList.remove("active");
            modal.style.display = "none";
            editingId = null;
        }
        
        function editAction(id) {
            const action = actions.find(a => String(a.id) === String(id));
            if (!action) {
                console.error('Action not found with id:', id);
                alert('Aksiyon bulunamadı!');
                return;
            }

            editingId = id;
            document.getElementById("modalTitle").textContent = "Aksiyonu Düzenle";
            document.getElementById("actionTitle").value = action.title || "";
            document.getElementById("actionResponsible").value = action.responsible || "";
            document.getElementById("actionDescription").value = action.description || "";
            document.getElementById("actionStatus").value = action.status || "waiting";
            document.getElementById("actionDate").value = action.date || "";
            document.getElementById('assignedPerson').value = action.assignedPerson || "";

            // Clear file preview and selected files
            selectedActionFiles = [];
            const previewContainer = document.getElementById('actionFilePreview');
            if (previewContainer) previewContainer.innerHTML = '';

            // Show existing attachments if any
            if (action.attachments && action.attachments.length > 0) {
                action.attachments.forEach(file => {
                    selectedActionFiles.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: file.url,
                        existing: true // Mark as existing attachment
                    });
                    displayActionFilePreview({
                        name: file.name,
                        type: file.type,
                        url: file.url,
                        existing: true
                    });
                });
            }


            // Modal'ı göster
            const modal = document.getElementById("actionModal");
            modal.classList.add("active");
            modal.style.display = "flex";

            console.log('Edit modal opened for action:', action.title);
        }

        function renderPostponeHistory(postponeHistory, actionId) {
            const container = document.getElementById('postponeHistoryContainer');

            if (!postponeHistory || postponeHistory.length === 0) {
                container.innerHTML = '<p style="color: var(--gray-500); font-style: italic;">Henüz erteleme geçmişi bulunmuyor.</p>';
                return;
            }

            container.innerHTML = postponeHistory.map((postpone, index) => {
                const postponeDate = new Date(postpone.postponeDate);
                const originalDate = new Date(postpone.originalDate);
                const timestamp = postpone.timestamp ? new Date(postpone.timestamp).toLocaleDateString('tr-TR') : 'Bilinmiyor';

                return `
                    <div class="postpone-history-item" data-index="${index}">
                        <div class="postpone-history-header">
                            <div class="postpone-date-info">
                                <strong>${originalDate.toLocaleDateString('tr-TR')}</strong> → <strong>${postponeDate.toLocaleDateString('tr-TR')}</strong>
                                <span style="margin-left: var(--space-2); color: var(--gray-400);">(${timestamp})</span>
                            </div>
                            <div class="postpone-actions">
                                <button class="postpone-edit-btn" onclick="editPostpone('${actionId}', ${index})">Düzenle</button>
                                <button class="postpone-delete-btn" onclick="deletePostpone('${actionId}', ${index})">Sil</button>
                            </div>
                        </div>
                        <div class="postpone-reason">${postpone.reason || 'Sebep belirtilmemiş'}</div>
                    </div>
                `;
            }).join('');
        }

        let currentEditingPostpone = { actionId: null, postponeIndex: null };

        function editPostpone(actionId, postponeIndex) {
            const action = actions.find(a => String(a.id) === String(actionId));
            if (!action || !action.postponeHistory || !action.postponeHistory[postponeIndex]) {
                alert('Erteleme verisi bulunamadı!');
                return;
            }

            const postpone = action.postponeHistory[postponeIndex];
            const postponeItem = document.querySelector(`[data-postpone-id="${actionId}-${postponeIndex}"]`);

            if (!postponeItem) return;

            // Safe date parsing
            function formatDateForInput(dateStr) {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0];
            }

            const originalDateFormatted = formatDateForInput(postpone.originalDate);
            const postponeDateFormatted = formatDateForInput(postpone.postponeDate);

            postponeItem.innerHTML = `
                <div class="postpone-edit-form" style="padding: 12px; background: #fff8f0; border-left: 4px solid #f39c12; border-radius: 6px;">
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-weight: 600; color: #e67e22; margin-bottom: 5px;">Eski Tarih:</label>
                        <input type="date" id="editOriginal-${actionId}-${postponeIndex}" value="${originalDateFormatted}" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; width: 150px;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-weight: 600; color: #e67e22; margin-bottom: 5px;">Yeni Tarih:</label>
                        <input type="date" id="editPostpone-${actionId}-${postponeIndex}" value="${postponeDateFormatted}" style="padding: 6px; border: 1px solid #ddd; border-radius: 4px; width: 150px;">
                    </div>
                    <div style="margin-bottom: 12px;">
                        <label style="display: block; font-weight: 600; color: #e67e22; margin-bottom: 5px;">Erteleme Sebebi:</label>
                        <textarea id="editReason-${actionId}-${postponeIndex}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%; min-height: 60px; resize: vertical;">${postpone.reason || ''}</textarea>
                    </div>
                    <div style="display: flex; gap: 8px; margin-top: 10px;">
                        <button onclick="savePostponeEdit('${actionId}', ${postponeIndex})" style="padding: 6px 12px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Kaydet</button>
                        <button onclick="cancelPostponeEdit('${actionId}', ${postponeIndex})" style="padding: 6px 12px; background: #95a5a6; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">İptal</button>
                        <button onclick="deletePostpone('${actionId}', ${postponeIndex})" style="padding: 6px 12px; background: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Sil</button>
                    </div>
                </div>
            `;
        }

        function savePostponeEdit(actionId, postponeIndex) {
            const action = actions.find(a => String(a.id) === String(actionId));
            if (!action || !action.postponeHistory || !action.postponeHistory[postponeIndex]) {
                alert('Erteleme verisi bulunamadı!');
                return;
            }

            const newReason = document.getElementById(`editReason-${actionId}-${postponeIndex}`).value.trim();
            const newOriginalDate = document.getElementById(`editOriginal-${actionId}-${postponeIndex}`).value;
            const newPostponeDate = document.getElementById(`editPostpone-${actionId}-${postponeIndex}`).value;

            if (!newReason || !newOriginalDate || !newPostponeDate) {
                alert('Lütfen tüm alanları doldurun!');
                return;
            }

            // Update postpone data
            action.postponeHistory[postponeIndex].reason = newReason;
            action.postponeHistory[postponeIndex].originalDate = newOriginalDate;
            action.postponeHistory[postponeIndex].postponeDate = newPostponeDate;

            // Update in Firebase
            database.ref(`actions/${actionId}`).set(action).then(() => {
                showNotification('✅ Erteleme başarıyla güncellendi!', 'success');
                // Refresh detail view
                openDetailView(actionId);
            }).catch(error => {
                console.error('Update error:', error);
                showNotification('❌ Güncellerken hata oluştu!', 'error');
            });
        }

        function cancelPostponeEdit(actionId, postponeIndex) {
            // Simply refresh the detail view to show original data
            openDetailView(actionId);
        }

        function closePostponeEditModal() {
            const modal = document.getElementById('postponeEditModal');
            modal.classList.remove('active');
            modal.style.display = 'none';
            currentEditingPostpone = { actionId: null, postponeIndex: null };
        }

        function deleteNote(actionId, noteId) {
            if (!confirm('Bu notu silmek istediğinizden emin misiniz?')) {
                return;
            }

            const action = actions.find(a => String(a.id) === String(actionId));
            if (!action || !action.notes) {
                alert('Not bulunamadı!');
                return;
            }

            // Remove note from array
            action.notes = action.notes.filter(note => note.id !== noteId);

            // Update database
            database.ref('actions/' + actionId).update({
                notes: action.notes
            }).then(() => {
                renderActions(); // Refresh UI

                // If detail modal is open for this action, refresh notes display
                if (currentDetailActionId === actionId) {
                    displayActionNotes(action);
                }

                showNotification('✅ Not başarıyla silindi!', 'success');
            }).catch(error => {
                console.error('Error deleting note:', error);
                showNotification('❌ Not silinirken hata oluştu!', 'error');
            });
        }

        function deleteNoteImage(actionId, noteId, imageIndex) {
            if (!confirm('Bu resmi silmek istediğinizden emin misiniz?')) {
                return;
            }

            const action = actions.find(a => String(a.id) === String(actionId));
            if (!action || !action.notes) {
                alert('Not bulunamadı!');
                return;
            }

            const note = action.notes.find(n => n.id === noteId);
            if (!note || !note.images || !note.images[imageIndex]) {
                alert('Resim bulunamadı!');
                return;
            }

            // Remove image from note
            note.images.splice(imageIndex, 1);

            // Update database
            database.ref('actions/' + actionId).update({
                notes: action.notes
            }).then(() => {
                renderActions(); // Refresh UI
                showNotification('✅ Resim başarıyla silindi!', 'success');
            }).catch(error => {
                console.error('Error deleting image:', error);
                showNotification('❌ Resim silinirken hata oluştu!', 'error');
            });
        }

        function handleAttachmentClick(fileUrl, fileName, fileType) {
            if (fileType.startsWith('image/')) {
                // Open image in modal for preview
                openImageModal(fileUrl);
            } else {
                // Download file for non-image types
                downloadFile(fileUrl, fileName);
            }
        }

        function downloadFile(url, filename) {
            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('📁 Dosya indiriliyor...', 'info');
            } catch (error) {
                console.error('Download failed:', error);
                // Fallback: open in new tab
                window.open(url, '_blank');
                showNotification('🔗 Dosya yeni sekmede açıldı', 'info');
            }
        }

        function deletePostpone(actionId, postponeIndex) {
            if (!confirm('Bu erteleme kaydını silmek istediğinizden emin misiniz?')) {
                return;
            }

            const action = actions.find(a => String(a.id) === String(actionId));
            if (!action || !action.postponeHistory) {
                alert('Erteleme verisi bulunamadı!');
                return;
            }

            // Erteleme kaydını sil
            action.postponeHistory.splice(postponeIndex, 1);

            // Save to storage
            saveToLocalStorage();

            // Refresh displays
            displayActions();
            
            alert('✅ Erteleme kaydı silindi!');
        }
        
        function quickStatusChange(id, currentStatus) {
            const statuses = ['waiting', 'in-progress', 'completed'];
            const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];
            database.ref('actions/' + id).update({ status: nextStatus });
        }

        function saveToLocalStorage() {
            // Firebase kullanıldığı için bu fonksiyon gerekmiyor
            // Eski kodla uyumluluk için boş bırakıldı
        }
        
        function updatePersonDropdown() {
            const dropdown = document.getElementById('assignedPerson');
            dropdown.innerHTML = '<option value="">Kişi seçilmedi</option>';
            persons.forEach(p => {
                dropdown.innerHTML += `<option value="${p.id}">${p.name} (${p.team})</option>`;
            });
        }
        
        // --- DETAIL VIEW MODAL ---
        let currentDetailActionId = null;

        function openDetailView(id) {
            const action = actions.find(a => String(a.id) === String(id));
            if (!action) {
                console.error('Action not found for view:', id);
                return;
            }

            currentDetailActionId = id;
            currentEditingActionId = null; // Reset editing state

            // Set modal title and show detail view
            document.getElementById('detailTitle').textContent = action.title;

            // Show detail view, hide edit form
            document.getElementById('detailViewForm').style.display = 'block';
            document.getElementById('detailEditForm').style.display = 'none';
            document.getElementById('editToggleBtn').style.display = 'block';
            document.getElementById('saveBtn').style.display = 'none';

            // Hide inline note form initially
            document.getElementById('inlineNoteForm').style.display = 'none';

            // Fill detail view fields
            document.getElementById('viewActionTitle').textContent = action.title || '';
            document.getElementById('viewActionResponsible').textContent = action.responsible || '';
            document.getElementById('viewActionAssignedPerson').textContent = action.assignedPerson || 'Kişi seçilmedi';
            const statusElement = document.getElementById('viewActionStatus');
            statusElement.textContent = getStatusText(action.status || 'waiting');
            statusElement.className = `status-badge ${action.status || 'waiting'}`;
            document.getElementById('viewActionDate').textContent = action.date ? formatDate(action.date) : 'Tarih yok';
            document.getElementById('viewActionDescription').textContent = action.description || 'Açıklama yok';
            document.getElementById('viewActionPriority').textContent = action.priority ? 'Evet' : 'Hayır';

            // Update person dropdown for potential editing later
            updatePersonDropdown();

            // Show attachments if any
            displayActionAttachments(action);

            // Show postpone history if any
            
            // Show notes if any
            displayActionNotes(action);

            // Show the modal
            const modal = document.getElementById('detailModal');
            modal.style.display = 'flex';
        }

        function displayActionAttachments(action) {
            const attachmentsSection = document.getElementById('detailAttachments');
            const attachmentsList = document.getElementById('detailAttachmentsList');

            if (action.attachments && action.attachments.length > 0) {
                attachmentsSection.style.display = 'block';

                // Check if we're in edit mode
                const isEditMode = document.getElementById('detailEditForm').style.display === 'block';

                attachmentsList.innerHTML = action.attachments.map((file, index) => {
                    if (file.type && file.type.startsWith('image/')) {
                        return `<div class="attachment-item image-attachment-detail" style="display: flex; flex-direction: column; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; max-width: 300px;">
                            <div onclick="handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="cursor: pointer; margin-bottom: 8px;">
                                <img src="${file.url}" alt="${file.name}" style="width: 100%; max-width: 280px; height: auto; max-height: 200px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span class="attachment-name" style="font-size: 14px; color: #374151; word-break: break-word;" title="${file.name}">${file.name}</span>
                                <div style="display: flex; gap: 6px;">
                                    <button onclick="downloadFile('${file.url}', '${file.name}')" style="padding: 6px 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; color: #374151; cursor: pointer; transition: background-color 0.2s;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7,10 12,15 17,10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                    </button>
                                    ${isEditMode ? `<button onclick="deleteAttachment('${action.id}', ${index})" style="padding: 6px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; font-size: 12px; color: #dc2626; cursor: pointer; transition: background-color 0.2s;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3,6 5,6 21,6"/>
                                            <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2v2"/>
                                        </svg>
                                    </button>` : ''}
                                </div>
                            </div>
                        </div>`;
                    } else {
                        return `<div class="attachment-item" style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 6px; margin-bottom: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #6b7280;">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                            </svg>
                            <span class="attachment-name" style="font-size: 14px; color: #374151;">${file.name}</span>
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <button onclick="downloadFile('${file.url}', '${file.name}')" style="padding: 6px 12px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; color: #374151; cursor: pointer; transition: background-color 0.2s;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7,10 12,15 17,10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                            </button>
                            ${isEditMode ? `<button onclick="deleteAttachment('${action.id}', ${index})" style="padding: 6px 12px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; font-size: 12px; color: #dc2626; cursor: pointer; transition: background-color 0.2s;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3,6 5,6 21,6"/>
                                    <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                                </svg>
                            </button>` : ''}
                        </div>
                    </div>`;
                    }
                }).join('');
            } else {
                attachmentsSection.style.display = 'none';
            }
        }

        function deleteAttachment(actionId, attachmentIndex) {
            if (!confirm('Bu eki silmek istediğinizden emin misiniz?')) {
                return;
            }

            const action = actions.find(a => a.id === actionId);
            if (!action || !action.attachments || !action.attachments[attachmentIndex]) {
                showNotification('❌ Ek bulunamadı!', 'error');
                return;
            }

            // Remove attachment from array
            action.attachments.splice(attachmentIndex, 1);

            // Update in Firebase
            database.ref('actions/' + actionId + '/attachments').set(action.attachments).then(() => {
                showNotification('✅ Ek başarıyla silindi!', 'success');
                displayActionAttachments(action); // Refresh display
            }).catch(error => {
                console.error('Error deleting attachment:', error);
                showNotification('❌ Ek silinirken hata oluştu!', 'error');
            });
        }

        function editNote(actionId, noteIndex) {
            const action = actions.find(a => a.id === actionId);
            if (!action || !action.notes || !action.notes[noteIndex]) {
                showNotification('❌ Not bulunamadı!', 'error');
                return;
            }

            const note = action.notes[noteIndex];
            const noteTextElement = document.getElementById(`noteText-${actionId}-${noteIndex}`);

            if (!noteTextElement) return;

            // Save original values for cancel functionality
            const originalText = note.text;
            const originalType = note.type;
            const originalColor = note.color;

            // Replace text with comprehensive edit form
            noteTextElement.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 12px; background: #f8f9fa; padding: 16px; border-radius: 6px; border: 1px solid #e9ecef;">
                    <!-- Type Selection -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <div>
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Tip</label>
                            <select id="editNoteType-${actionId}-${noteIndex}" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: white;">
                                <option value="postpone" ${originalType === 'postpone' ? 'selected' : ''}>Erteleme</option>
                                <option value="note" ${originalType === 'note' ? 'selected' : ''}>Not</option>
                                <option value="update" ${originalType === 'update' ? 'selected' : ''}>Güncelleme</option>
                                <option value="reminder" ${originalType === 'reminder' ? 'selected' : ''}>Hatırlatma</option>
                            </select>
                        </div>
                        <div>
                            <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Renk</label>
                            <div style="display: flex; gap: 4px; align-items: center;">
                                <input type="color" id="editNoteColor-${actionId}-${noteIndex}" value="${originalColor}" style="width: 40px; height: 32px; border: 1px solid #d1d5db; border-radius: 4px; padding: 0; cursor: pointer;">
                                <div style="display: flex; gap: 2px;">
                                    <button type="button" onclick="setEditNoteColor('${actionId}', ${noteIndex}, '#3498db')" style="width: 24px; height: 24px; background: #3498db; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;"></button>
                                    <button type="button" onclick="setEditNoteColor('${actionId}', ${noteIndex}, '#e74c3c')" style="width: 24px; height: 24px; background: #e74c3c; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;"></button>
                                    <button type="button" onclick="setEditNoteColor('${actionId}', ${noteIndex}, '#f39c12')" style="width: 24px; height: 24px; background: #f39c12; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;"></button>
                                    <button type="button" onclick="setEditNoteColor('${actionId}', ${noteIndex}, '#2ecc71')" style="width: 24px; height: 24px; background: #2ecc71; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;"></button>
                                    <button type="button" onclick="setEditNoteColor('${actionId}', ${noteIndex}, '#9b59b6')" style="width: 24px; height: 24px; background: #9b59b6; border: 1px solid #ccc; border-radius: 3px; cursor: pointer;"></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Text Area -->
                    <div>
                        <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Açıklama</label>
                        <textarea id="editNoteText-${actionId}-${noteIndex}" style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; resize: vertical; min-height: 70px; line-height: 1.4; background: white;">${originalText}</textarea>
                    </div>

                    <!-- File Upload Section -->
                    <div>
                        <label style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; display: block;">Dosya Ekle</label>
                        <input type="file" id="editNoteFiles-${actionId}-${noteIndex}" multiple accept="*/*" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; background: white;">
                        <div id="editNoteFilePreview-${actionId}-${noteIndex}" class="file-preview-container" style="display: none;">
                            <!-- Hidden preview container - files shown in attachments section below -->
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="cancelNoteEdit('${actionId}', ${noteIndex})" style="padding: 8px 16px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; cursor: pointer; transition: background-color 0.2s;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            İptal
                        </button>
                        <button onclick="saveNoteEdit('${actionId}', ${noteIndex})" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; transition: background-color 0.2s;">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                                <polyline points="20,6 9,17 4,12"/>
                            </svg>
                            Kaydet
                        </button>
                    </div>
                </div>
            `;

            // Initialize file upload functionality
            setupEditNoteFileUpload(actionId, noteIndex);

            // Focus on textarea
            const textarea = noteTextElement.querySelector('textarea');
            if (textarea) {
                textarea.focus();
                textarea.setSelectionRange(textarea.value.length, textarea.value.length);
            }
        }

        function setEditNoteColor(actionId, noteIndex, color) {
            const colorInput = document.getElementById(`editNoteColor-${actionId}-${noteIndex}`);
            if (colorInput) {
                colorInput.value = color;
            }
        }

        function saveNoteEdit(actionId, noteIndex) {
            const action = actions.find(a => a.id === actionId);
            if (!action || !action.notes || !action.notes[noteIndex]) {
                showNotification('❌ Not bulunamadı!', 'error');
                return;
            }

            // Get form elements
            const typeSelect = document.getElementById(`editNoteType-${actionId}-${noteIndex}`);
            const colorInput = document.getElementById(`editNoteColor-${actionId}-${noteIndex}`);
            const textarea = document.getElementById(`editNoteText-${actionId}-${noteIndex}`);

            if (!typeSelect || !colorInput || !textarea) {
                showNotification('❌ Form elemanları bulunamadı!', 'error');
                return;
            }

            const newType = typeSelect.value;
            const newColor = colorInput.value;
            const newText = textarea.value.trim();

            if (!newText) {
                showNotification('❌ Not metni boş olamaz!', 'error');
                return;
            }

            // Collect files from preview container
            const previewContainer = document.getElementById(`editNoteFilePreview-${actionId}-${noteIndex}`);
            const fileItems = previewContainer ? previewContainer.querySelectorAll('.file-preview-item') : [];

            const files = Array.from(fileItems).map(item => ({
                name: item.dataset.fileName || '',
                url: item.dataset.fileUrl || '',
                type: item.dataset.fileType || '',
                isExisting: item.dataset.isExisting === 'true'
            })).filter(file => file.name && file.url); // Only include valid files

            // Update note with all new values
            action.notes[noteIndex].type = newType;
            action.notes[noteIndex].color = newColor;
            action.notes[noteIndex].text = newText;
            action.notes[noteIndex].attachments = files; // Use 'attachments' to match display function
            action.notes[noteIndex].editedAt = new Date().toISOString();

            // Update in Firebase
            database.ref('actions/' + actionId + '/notes').set(action.notes).then(() => {
                showNotification('✅ Not başarıyla güncellendi!', 'success');
                displayActionNotes(action); // Refresh display
            }).catch(error => {
                console.error('Error updating note:', error);
                showNotification('❌ Not güncellenirken hata oluştu!', 'error');
            });
        }

        function cancelNoteEdit(actionId, noteIndex) {
            const action = actions.find(a => a.id === actionId);
            if (action) {
                displayActionNotes(action); // Refresh display to original state
            }
        }

        // File upload functionality for edit note
        function setupEditNoteFileUpload(actionId, noteIndex) {
            const fileInput = document.getElementById(`editNoteFiles-${actionId}-${noteIndex}`);
            if (!fileInput) return;

            fileInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                const action = actions.find(a => a.id === actionId);

                if (!action || !action.notes || !action.notes[noteIndex]) {
                    showNotification('❌ Not bulunamadı!', 'error');
                    return;
                }

                for (const file of files) {
                    try {
                        const fileData = await uploadToGoogleDrive(file);
                        if (fileData && fileData.url) {
                            // Add to note attachments
                            if (!action.notes[noteIndex].attachments) {
                                action.notes[noteIndex].attachments = [];
                            }
                            action.notes[noteIndex].attachments.push(fileData);

                            // Update in Firebase
                            await database.ref(`actions/${actionId}/notes/${noteIndex}/attachments`).set(action.notes[noteIndex].attachments);

                            // Show success notification
                            showNotification(`✅ ${file.name} başarıyla eklendi!`, 'success');

                            // Refresh the notes display to show new attachment
                            displayActionNotes(action);
                        } else {
                            showNotification(`❌ ${file.name} yüklenemedi!`, 'error');
                        }
                    } catch (error) {
                        console.error('Error uploading file:', error);
                        showNotification(`❌ ${file.name} yüklenirken hata oluştu!`, 'error');
                    }
                }

                fileInput.value = ''; // Reset input
            });
        }

        // Display file preview in edit note section
        function displayEditNoteFilePreview(actionId, noteIndex, fileData, isExisting = true) {
            const previewContainer = document.getElementById(`editNoteFilePreview-${actionId}-${noteIndex}`);
            if (!previewContainer) return;

            // Check for duplicates by name and url
            const existingItems = previewContainer.querySelectorAll('.file-preview-item');
            for (let item of existingItems) {
                if (item.dataset.fileName === fileData.name) {
                    console.log('Duplicate file name detected, skipping:', fileData.name);
                    return; // Skip if same name found
                }
            }

            const fileItem = document.createElement('div');
            const fileType = fileData.type || '';
            fileItem.className = fileType.startsWith('image/') ? 'file-preview-item image' : 'file-preview-item';
            fileItem.dataset.fileName = fileData.name;
            fileItem.dataset.fileUrl = fileData.url;
            fileItem.dataset.fileType = fileType;
            fileItem.dataset.isExisting = isExisting;

            if (fileType.startsWith('image/')) {
                fileItem.innerHTML = `
                    <div style="position: relative; display: flex; flex-direction: column; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; max-width: 280px;">
                        <div onclick="handleAttachmentClick('${fileData.url}', '${fileData.name}', '${fileType}')" style="cursor: pointer; margin-bottom: 8px;">
                            <img src="${fileData.url}" alt="${fileData.name}" style="width: 100%; max-width: 260px; height: auto; max-height: 150px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-size: 12px; color: #374151; word-break: break-word;" title="${fileData.name}">${fileData.name}</span>
                            <button class="remove-file-btn" data-action-id="${actionId}" data-note-index="${noteIndex}" data-file-name="${fileData.name}"
                                    style="padding: 4px 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; font-size: 12px; color: #dc2626; cursor: pointer; margin-left: 8px;"
                                    onclick="removeEditNoteFile('${actionId}', '${noteIndex}', '${fileData.name}', this)" title="Dosyayı kaldır">×</button>
                        </div>
                    </div>
                `;
            } else {
                const fileIcon = getFileIcon(fileType);
                fileItem.innerHTML = `
                    <div style="position: relative; display: flex; align-items: center; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px;">
                        <div onclick="handleAttachmentClick('${fileData.url}', '${fileData.name}', '${fileType}')" style="cursor: pointer; flex: 1; display: flex; align-items: center;">
                            <span style="font-size: 24px; margin-right: 12px;">${fileIcon}</span>
                            <span style="font-size: 12px; color: #374151; word-break: break-word;" title="${fileData.name}">${fileData.name}</span>
                        </div>
                        <button class="remove-file-btn" data-action-id="${actionId}" data-note-index="${noteIndex}" data-file-name="${fileData.name}"
                                style="padding: 4px 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; font-size: 12px; color: #dc2626; cursor: pointer; margin-left: 8px;"
                                onclick="removeEditNoteFile('${actionId}', '${noteIndex}', '${fileData.name}', this)" title="Dosyayı kaldır">×</button>
                    </div>
                `;
            }

            // Add event listener for remove button
            const removeBtn = fileItem.querySelector('.remove-file-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const actionId = removeBtn.dataset.actionId;
                    const noteIndex = parseInt(removeBtn.dataset.noteIndex);
                    const fileName = removeBtn.dataset.fileName;
                    removeEditNoteFile(actionId, noteIndex, fileName);
                });
            }

            previewContainer.appendChild(fileItem);
        }

        // Display existing files in edit note section
        function displayEditNoteExistingFiles(actionId, noteIndex, files) {
            if (!files || !Array.isArray(files)) return;

            files.forEach(file => {
                displayEditNoteFilePreview(actionId, noteIndex, file, true);
            });
        }

        // Remove file from edit note preview and update database
        function removeEditNoteFile(actionId, noteIndex, fileName) {
            console.log('removeEditNoteFile called:', { actionId, noteIndex, fileName });

            // Find the action
            const action = actions.find(a => a.id === actionId);
            if (!action || !action.notes || !action.notes[noteIndex]) {
                console.error('Action or note not found:', { actionId, noteIndex });
                showNotification('❌ Not bulunamadı!', 'error');
                return;
            }

            // Remove file from note attachments
            if (action.notes[noteIndex].attachments) {
                action.notes[noteIndex].attachments = action.notes[noteIndex].attachments.filter(file => file.name !== fileName);
            }

            // Update in Firebase
            database.ref(`actions/${actionId}/notes/${noteIndex}/attachments`).set(action.notes[noteIndex].attachments || []).then(() => {
                showNotification('📎 Dosya başarıyla silindi!', 'success');

                // Remove from preview container if it exists
                const previewContainer = document.getElementById(`editNoteFilePreview-${actionId}-${noteIndex}`);
                if (previewContainer) {
                    const fileItems = previewContainer.querySelectorAll('.file-preview-item');
                    fileItems.forEach(item => {
                        if (item.dataset.fileName === fileName) {
                            item.remove();
                        }
                    });
                }

                // Refresh the notes display to update the attachments count and view
                displayActionNotes(action);
            }).catch(error => {
                console.error('Error removing file:', error);
                showNotification('❌ Dosya silinirken hata oluştu!', 'error');
            });
        }

        // Helper function to determine if a color is light or dark
        function isLightColor(color) {
            // Convert hex to RGB
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            // Calculate luminance
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            // Return true if light (needs dark text), false if dark (needs light text)
            return luminance > 0.5;
        }

        // Get contrasting text color
        function getContrastingTextColor(backgroundColor) {
            return isLightColor(backgroundColor) ? '#1f2937' : '#ffffff';
        }

        // Convert any color to a softer, more eye-friendly version
        function getSoftColor(color, opacity = 0.15) {
            // For light backgrounds, use the color with low opacity
            return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
        }

        // Get a muted version of the color for borders
        function getMutedColor(color) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            // Make it more muted by blending with gray
            const mutedR = Math.round(r * 0.7 + 128 * 0.3);
            const mutedG = Math.round(g * 0.7 + 128 * 0.3);
            const mutedB = Math.round(b * 0.7 + 128 * 0.3);

            return `#${mutedR.toString(16).padStart(2, '0')}${mutedG.toString(16).padStart(2, '0')}${mutedB.toString(16).padStart(2, '0')}`;
        }

        // Get text color for soft backgrounds (always darker for readability)
        function getSoftTextColor(backgroundColor) {
            const hex = backgroundColor.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);

            // Make it darker for better readability
            const darkR = Math.round(r * 0.3);
            const darkG = Math.round(g * 0.3);
            const darkB = Math.round(b * 0.3);

            return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`;
        }


        function displayActionNotes(action) {
            const notesSection = document.getElementById('detailNotes');
            const notesList = document.getElementById('detailNotesList');

            if (action.notes && action.notes.length > 0) {
                notesSection.style.display = 'block';

                // Check if we're in edit mode or detail view mode
                const isEditMode = document.getElementById('detailEditForm').style.display === 'block';

                if (isEditMode) {
                    // Edit mode: show with edit/delete buttons using soft colors
                    notesList.innerHTML = action.notes.map((note, index) => {
                        const softBg = getSoftColor(note.color, 0.1);
                        const borderColor = getMutedColor(note.color);

                        return `<div class="note-item" style="border-left: 3px solid ${borderColor}; padding: 14px; margin-bottom: 10px; background: ${softBg}; border: 1px solid ${getSoftColor(note.color, 0.2)}; border-radius: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                                <div class="note-type" style="background: ${note.color}; color: white; padding: 3px 8px; border-radius: 10px; font-weight: 500; font-size: 0.75rem;">${getNoteTypeText(note.type)}</div>
                                <div style="display: flex; gap: 6px;">
                                    <button onclick="editNote('${action.id}', ${index})" style="padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; color: #64748b; cursor: pointer; transition: all 0.2s;">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                            <path d="m18.5 2.5-3 3L12 9l-4 1 1-4 3.5-3.5a2.121 2.121 0 0 1 3 3z"/>
                                        </svg>
                                    </button>
                                    <button onclick="deleteNote('${action.id}', ${note.id})" style="padding: 6px 8px; background: #fef8f8; border: 1px solid #fecaca; border-radius: 6px; font-size: 12px; color: #dc2626; cursor: pointer; transition: all 0.2s;">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3,6 5,6 21,6"/>
                                            <path d="m19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div class="note-text" id="noteText-${action.id}-${index}" style="margin: 8px 0; line-height: 1.5; color: #374151;">${note.text}</div>
                            ${note.attachments && note.attachments.length > 0 ? `
                                <div style="margin: 8px 0;">
                                    <div style="font-size: 0.75rem; color: #6b7280; margin-bottom: 6px;">📎 Ekli Dosyalar (${note.attachments.length})</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                        ${note.attachments.map((file, fileIndex) => {
                                            if (file.type && file.type.startsWith('image/')) {
                                                return `
                                                    <div style="position: relative; max-width: 120px; border: 1px solid #ddd; border-radius: 6px; overflow: hidden;">
                                                        <div onclick="handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="cursor: pointer;">
                                                            <img src="${file.url}" alt="${file.name}" style="width: 100%; height: 80px; object-fit: cover;">
                                                            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white; font-size: 0.6rem; text-align: center; padding: 2px 0;">📷</div>
                                                        </div>
                                                        <button onclick="removeEditNoteFile('${action.id}', ${index}, '${file.name}')" style="position: absolute; top: 2px; right: 2px; background: rgba(220, 38, 38, 0.9); color: white; border: none; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
                                                    </div>
                                                `;
                                            } else {
                                                return `
                                                    <div style="display: flex; align-items: center; padding: 6px 10px; background: rgba(255,255,255,0.8); border-radius: 6px; font-size: 0.75rem; border: 1px solid rgba(0,0,0,0.15); min-width: 100px; position: relative;">
                                                        <span onclick="handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="display: flex; align-items: center; cursor: pointer; flex: 1;">
                                                            <span style="margin-right: 6px; font-size: 1rem;">${getFileIcon(file.type)}</span>
                                                            <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${file.name}">${file.name}</span>
                                                        </span>
                                                        <button onclick="removeEditNoteFile('${action.id}', ${index}, '${file.name}')" style="background: rgba(220, 38, 38, 0.7); color: white; border: none; border-radius: 50%; width: 16px; height: 16px; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-left: 4px;">×</button>
                                                    </div>
                                                `;
                                            }
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            <div class="note-timestamp" style="font-size: 0.75rem; color: #6b7280;">${new Date(note.timestamp).toLocaleDateString('tr-TR')}</div>
                        </div>`;
                    }).join('');
                } else {
                    // Detail view mode: show as soft cards with gentle colors
                    notesList.innerHTML = action.notes.map(note => {
                        const softBg = getSoftColor(note.color, 0.15);
                        const textColor = getSoftTextColor(note.color);
                        const borderColor = getMutedColor(note.color);

                        return `<div class="note-card" style="background: ${softBg}; color: ${textColor}; padding: 16px; margin-bottom: 12px; border-radius: 10px; border: 1px solid ${getSoftColor(note.color, 0.25)}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                                <div style="background: ${note.color}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; margin-right: 12px;">${getNoteTypeText(note.type)}</div>
                                <div style="font-size: 0.8rem; color: #6b7280;">${new Date(note.timestamp).toLocaleDateString('tr-TR')}</div>
                            </div>
                            <div style="line-height: 1.5; color: ${textColor}; font-size: 0.95rem;">${note.text}</div>
                            ${note.attachments && note.attachments.length > 0 ? `
                                <div style="margin: 10px 0;">
                                    <div style="font-size: 0.8rem; color: #6b7280; margin-bottom: 8px;">📎 Ekli Dosyalar (${note.attachments.length})</div>
                                    <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                                        ${note.attachments.map(file => {
                                            if (file.type && file.type.startsWith('image/')) {
                                                return `
                                                    <div onclick="handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="cursor: pointer; border-radius: 8px; overflow: hidden; position: relative; max-width: 140px; border: 2px solid rgba(255,255,255,0.5); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                                        <img src="${file.url}" alt="${file.name}" style="width: 100%; height: 90px; object-fit: cover;">
                                                        <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.8)); color: white; font-size: 0.65rem; text-align: center; padding: 3px 0; font-weight: 500;">📷 ${file.name.length > 15 ? file.name.substring(0, 15) + '...' : file.name}</div>
                                                    </div>
                                                `;
                                            } else {
                                                return `
                                                    <div onclick="handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="display: flex; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.9); border-radius: 8px; font-size: 0.8rem; cursor: pointer; border: 1px solid rgba(0,0,0,0.1); min-width: 120px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
                                                        <span style="margin-right: 8px; font-size: 1.1rem;">${getFileIcon(file.type)}</span>
                                                        <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${file.name}">${file.name}</span>
                                                    </div>
                                                `;
                                            }
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>`;
                    }).join('');
                }
            } else {
                notesSection.style.display = 'none';
            }
        }

        function getNoteTypeText(type) {
            const types = {
                'note': '📝 Not',
                'postpone': '⏰ Erteleme',
                'update': '🔄 Güncelleme',
                'reminder': '🔔 Hatırlatma'
            };
            return types[type] || '📝 Not';
        }

        function addPostponeFromEdit() {
            const originalDate = document.getElementById('postponeOriginalDate').value;
            const newDate = document.getElementById('postponeNewDate').value;
            const reason = document.getElementById('postponeReason').value.trim();

            if (!newDate || !reason) {
                alert('Lütfen yeni tarih ve erteleme sebebini girin!');
                return;
            }

            if (!currentDetailActionId) {
                alert('Aksiyon bulunamadı!');
                return;
            }

            const action = actions.find(a => String(a.id) === String(currentDetailActionId));
            if (!action) {
                alert('Aksiyon bulunamadı!');
                return;
            }

            // Initialize postpone history if it doesn't exist
            if (!action.postponeHistory) action.postponeHistory = [];

            // Add new postpone entry
            const postponeEntry = {
                oldDate: originalDate || action.date,
                newDate: newDate,
                reason: reason,
                timestamp: new Date().toISOString()
            };

            action.postponeHistory.push(postponeEntry);

            // Update the action's date to the new date
            action.date = newDate;

            // Save to storage
            saveToLocalStorage();

            // Refresh displays
            displayActions();
            
            // Update the edit form's original date field with the new date for next postpone
            document.getElementById('postponeOriginalDate').value = newDate;

            // Clear the form
            document.getElementById('postponeNewDate').value = '';
            document.getElementById('postponeReason').value = '';

            alert('Erteleme başarıyla eklendi!');
        }

        function toggleEditMode() {
            if (!currentDetailActionId) return;

            const action = actions.find(a => String(a.id) === String(currentDetailActionId));
            if (!action) return;

            // Toggle between view and edit modes
            const isCurrentlyEditing = document.getElementById('detailEditForm').style.display === 'block';

            if (isCurrentlyEditing) {
                // Switch to view mode
                document.getElementById('detailViewForm').style.display = 'block';
                document.getElementById('detailEditForm').style.display = 'none';
                document.getElementById('editToggleBtn').style.display = 'block';
                document.getElementById('saveBtn').style.display = 'none';
                document.getElementById('detailTitle').textContent = action.title;
                currentEditingActionId = null;
            } else {
                // Switch to edit mode
                document.getElementById('detailViewForm').style.display = 'none';
                document.getElementById('detailEditForm').style.display = 'block';
                document.getElementById('editToggleBtn').style.display = 'none';
                document.getElementById('saveBtn').style.display = 'block';
                document.getElementById('detailTitle').textContent = `${action.title} - Düzenleniyor`;
                currentEditingActionId = currentDetailActionId;

                // Fill edit form fields
                document.getElementById('editActionTitle').value = action.title || '';
                document.getElementById('editActionResponsible').value = action.responsible || '';
                document.getElementById('editActionAssignedPerson').value = action.assignedPerson || '';
                document.getElementById('editActionStatus').value = action.status || 'waiting';
                document.getElementById('editActionDate').value = action.date || '';
                document.getElementById('editActionDescription').value = action.description || '';
                document.getElementById('editActionPriority').checked = action.priority || false;

                // Initialize file upload for edit modal
                initializeEditFileUpload();
            }

            // Refresh postpone history and notes display for the new mode
                        displayActionNotes(action);
        }

        function openComprehensiveEdit(id) {
            const action = actions.find(a => String(a.id) === String(id));
            if (!action) {
                console.error('Action not found for edit:', id);
                return;
            }

            currentEditingActionId = id;
            currentDetailActionId = id;

            // Set modal title to show we're editing
            document.getElementById('detailTitle').textContent = `${action.title} - Düzenleniyor`;

            // Fill edit form fields
            document.getElementById('editActionTitle').value = action.title || '';
            document.getElementById('editActionResponsible').value = action.responsible || '';
            document.getElementById('editActionAssignedPerson').value = action.assignedPerson || '';
            document.getElementById('editActionStatus').value = action.status || 'waiting';
            document.getElementById('editActionDate').value = action.date || '';
            document.getElementById('editActionDescription').value = action.description || '';
            document.getElementById('editActionPriority').checked = action.priority || false;

            // Update person dropdown
            updatePersonDropdown();

            // Initialize file upload for edit modal
            initializeEditFileUpload();

            // Clear postpone form fields
            document.getElementById('postponeOriginalDate').value = action.date || '';
            document.getElementById('postponeNewDate').value = '';
            document.getElementById('postponeReason').value = '';

            // Show existing file attachments in preview
            showExistingAttachments(action);

            // Attachments
            const attachmentsSection = document.getElementById('detailAttachments');
            const attachmentsList = document.getElementById('detailAttachmentsList');

            if (action.attachments && action.attachments.length > 0) {
                attachmentsSection.style.display = 'block';
                attachmentsList.innerHTML = action.attachments.map(file => {
                    if (file.type && file.type.startsWith('image/')) {
                        return `
                            <div class="attachment-item-detail image-attachment-detail" style="display: flex; flex-direction: column; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; max-width: 300px;">
                                <div onclick="handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')" style="cursor: pointer; margin-bottom: 8px;">
                                    <img src="${file.url}" alt="${file.name}" style="width: 100%; max-width: 280px; height: auto; max-height: 200px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                                </div>
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <span class="attachment-name" style="font-size: 14px; color: #374151; word-break: break-word;" title="${file.name}">${file.name}</span>
                                    <button onclick="event.stopPropagation(); downloadFile('${file.url}', '${file.name}')" style="padding: 6px 8px; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; color: #374151; cursor: pointer; margin-left: 8px;" title="İndir">
                                        📥
                                    </button>
                                </div>
                            </div>
                        `;
                    } else {
                        return `
                            <div class="attachment-item-detail" onclick="handleAttachmentClick('${file.url}', '${file.name}', '${file.type}')">
                                <span class="attachment-icon">${getFileIcon(file.type)}</span>
                                <span class="attachment-name" title="${file.name}">${file.name}</span>
                            </div>
                        `;
                    }
                }).join('');
            } else {
                attachmentsSection.style.display = 'none';
            }


            // Notes
            const notesSection = document.getElementById('detailNotes');
            const notesList = document.getElementById('detailNotesList');

            if (action.notes && action.notes.length > 0) {
                notesSection.style.display = 'block';
                notesList.innerHTML = action.notes.map(note => {
                    const noteDate = new Date(note.timestamp);
                    return `
                        <div class="note-item type-${note.type}" style="margin-bottom: 15px; padding: 12px; border-left: 4px solid ${note.color}; border-radius: 6px; background: ${note.color}15;">
                            <div class="note-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span class="note-type" style="color: ${note.color}; font-weight: bold; font-size: 0.8rem; text-transform: uppercase;">${note.type}</span>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <small style="color: #666; font-size: 0.75rem;">${noteDate.toLocaleDateString('tr-TR')} ${noteDate.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</small>
                                    <button class="note-delete-btn" onclick="deleteNote('${id}', ${note.id})" style="background: none; border: none; cursor: pointer; opacity: 0.6; font-size: 0.8rem;">🗑️</button>
                                </div>
                            </div>
                            <div style="color: #333; line-height: 1.4; margin-bottom: 8px;">${note.text}</div>
                            ${note.images && note.images.length > 0 ? `
                                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                                    ${note.images.map((img, imgIndex) => `
                                        <div style="position: relative;">
                                            <img src="${img.url}" alt="${img.name}" onclick="openImageModal('${img.url}')" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px; cursor: pointer;">
                                            <button class="image-delete-btn" onclick="deleteNoteImage('${id}', ${note.id}, ${imgIndex})" style="position: absolute; top: -5px; right: -5px; background: rgba(231,76,60,0.9); color: white; border: none; width: 18px; height: 18px; border-radius: 50%; cursor: pointer; font-size: 10px; opacity: 0; transition: opacity 0.2s;">×</button>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('');
            } else {
                notesSection.style.display = 'none';
            }

            const modal = document.getElementById('detailModal');
            modal.classList.add('active');
            modal.style.display = 'flex';
        }

        function saveComprehensiveEdit() {
            if (!currentEditingActionId) {
                alert('Düzenlenecek aksiyon bulunamadı!');
                return;
            }

            const title = document.getElementById('editActionTitle').value.trim();
            const responsible = document.getElementById('editActionResponsible').value;
            const assignedPerson = document.getElementById('editActionAssignedPerson').value;
            const status = document.getElementById('editActionStatus').value;
            const date = document.getElementById('editActionDate').value;
            const description = document.getElementById('editActionDescription').value.trim();
            const priority = document.getElementById('editActionPriority').checked;

            if (!title || !responsible) {
                alert('Lütfen başlık ve sorumlu alanlarını doldurun!');
                return;
            }

            const actionData = {
                title,
                responsible,
                assignedPerson,
                status,
                date,
                description,
                priority
            };

            // Find the action and preserve existing data
            const existingAction = actions.find(a => String(a.id) === String(currentEditingActionId));
            if (existingAction) {
                // Preserve existing data that shouldn't be lost
                actionData.id = existingAction.id;
                actionData.createdAt = existingAction.createdAt;
                actionData.notes = existingAction.notes || [];
                actionData.postponeHistory = existingAction.postponeHistory || [];
                actionData.attachments = existingAction.attachments || [];
                actionData.postponed = existingAction.postponed;
                actionData.postponeReason = existingAction.postponeReason;
            }

            // Handle file uploads if any
            if (editUploadedFiles.length > 0) {
                uploadEditFilesAndSaveAction(actionData);
            } else {
                // No new files, just update the action
                updateActionInFirebase(actionData);
            }
        }

        function editActionFromDetail() {
            if (currentDetailActionId) {
                closeDetailModal();
                editAction(currentDetailActionId);
            }
        }

        function closeDetailModal() {
            // Check if in edit mode
            const detailEditForm = document.getElementById('detailEditForm');
            const isInEditMode = detailEditForm && detailEditForm.style.display === 'block';

            if (isInEditMode) {
                // Check for changes before closing
                if (hasUnsavedChanges()) {
                    const shouldSave = confirm('Düzenleme modundasınız ve kaydedilmemiş değişiklikleriniz var. Kaydetmek istiyor musunuz?');

                    if (shouldSave) {
                        // Save changes first
                        saveDetailChanges();
                        return; // Exit early, modal will close after save
                    } else {
                        // User chose not to save, ask for confirmation
                        const shouldClose = confirm('Değişiklikler kaydedilmeyecek. Yine de çıkmak istiyor musunuz?');
                        if (!shouldClose) {
                            return; // Don't close modal
                        }
                    }
                }

                // Exit edit mode first
                toggleEditMode();
            }

            const modal = document.getElementById('detailModal');
            modal.classList.remove('active');
            modal.style.display = 'none';
            // Reset inline note form
            document.getElementById('inlineNoteForm').style.display = 'none';
        }

        // Function to check if there are unsaved changes
        function hasUnsavedChanges() {
            const action = actions.find(a => a.id === currentDetailActionId);
            if (!action) return false;

            // Get current form values
            const titleInput = document.getElementById('editActionTitle');
            const responsibleInput = document.getElementById('editActionResponsible');
            const statusSelect = document.getElementById('editActionStatus');
            const prioritySelect = document.getElementById('editActionPriority');
            const descriptionTextarea = document.getElementById('editActionDescription');
            const dueDateInput = document.getElementById('editActionDueDate');
            const tagsInput = document.getElementById('editActionTags');

            if (!titleInput || !responsibleInput || !statusSelect || !prioritySelect ||
                !descriptionTextarea || !dueDateInput || !tagsInput) {
                return false;
            }

            // Compare with original values
            return (
                titleInput.value.trim() !== (action.title || '') ||
                responsibleInput.value.trim() !== (action.responsible || '') ||
                statusSelect.value !== (action.status || 'pending') ||
                prioritySelect.value !== (action.priority || 'medium') ||
                descriptionTextarea.value.trim() !== (action.description || '') ||
                dueDateInput.value !== (action.dueDate || '') ||
                tagsInput.value.trim() !== (action.tags ? action.tags.join(', ') : '')
            );
        }

        function toggleInlineNoteForm() {
            const form = document.getElementById('inlineNoteForm');

            if (form.style.display === 'none' || form.style.display === '') {
                form.style.display = 'block';

                // Clear form
                document.getElementById('inlineNoteType').value = '';
                document.getElementById('inlineNoteColor').value = '#3498db';
                document.getElementById('inlineNoteText').value = '';
                document.getElementById('inlineNotePostponeDate').value = '';
                document.getElementById('inlinePostponeDateGroup').style.display = 'none';
                document.getElementById('inlineImagePreview').innerHTML = '';
                document.getElementById('inlineNoteImages').value = '';

            } else {
                form.style.display = 'none';
            }
        }

        function setInlineNoteColor(color) {
            document.getElementById('inlineNoteColor').value = color;
        }

        function saveInlineNote() {
            const type = document.getElementById('inlineNoteType').value;
            const color = document.getElementById('inlineNoteColor').value;
            const text = document.getElementById('inlineNoteText').value.trim();
            const postponeDate = document.getElementById('inlineNotePostponeDate').value;

            if (!type || !text) {
                alert('Lütfen tip ve açıklama alanlarını doldurun!');
                return;
            }

            if (type === 'postpone' && !postponeDate) {
                alert('Erteleme için yeni hedef tarih gerekli!');
                return;
            }

            if (!currentDetailActionId) {
                alert('Aksiyon bulunamadı!');
                return;
            }

            // Create note object
            const note = {
                id: Date.now(),
                type: type,
                color: color,
                text: text,
                timestamp: new Date().toISOString(),
                images: [] // TODO: Handle image uploads
            };

            // Find the action and add the note
            const action = actions.find(a => String(a.id) === String(currentDetailActionId));
            if (action) {
                if (!action.notes) action.notes = [];
                action.notes.push(note);

                // If it's a postpone, update the action date and add to postpone history
                if (type === 'postpone' && postponeDate) {
                    if (!action.postponeHistory) action.postponeHistory = [];
                    action.postponeHistory.push({
                        oldDate: action.date,
                        newDate: postponeDate,
                        reason: text,
                        timestamp: new Date().toISOString()
                    });
                    action.date = postponeDate;
                }

                // Save to Firebase
                database.ref('actions/' + currentDetailActionId).update({
                    notes: action.notes,
                    ...(type === 'postpone' && postponeDate ? {
                        date: action.date,
                        postponeHistory: action.postponeHistory
                    } : {})
                }).then(() => {
                    // Refresh displays
                    renderActions();
                    displayActionNotes(action);

                    // Close the inline form
                    toggleInlineNoteForm();

                    showNotification('✅ Not başarıyla eklendi!', 'success');
                }).catch(error => {
                    console.error('Error saving note:', error);
                    showNotification('❌ Not kaydedilirken hata oluştu!', 'error');
                });
            }
        }

        // --- RENDER FUNCTIONS FOR DIFFERENT VIEWS ---
        function renderListView(data) {
            const container = document.getElementById('actionsContainerList');
            const header = `
                <div class="list-header">
                    <div class="title">Başlık</div>
                    <div class="responsible">Sorumlu</div>
                    <div class="person">Atanan Kişi</div>
                    <div class="status">Durum</div>
                    <div class="date">Hedef Tarih</div>
                    <div class="actions">İşlemler</div>
                </div>`;
            
            const items = data.map(action => {
                const personName = action.assignedPerson ? (persons.find(p => p.id === action.assignedPerson)?.name || '-') : '-';
                const teamType = getTeamType(action.responsible);
                // Check for note attachments
                const noteAttachments = [];
                if (action.notes && action.notes.length > 0) {
                    action.notes.forEach(note => {
                        if (note.attachments && note.attachments.length > 0) {
                            noteAttachments.push(...note.attachments);
                        }
                    });
                }

                const attachmentIndicator = noteAttachments.length > 0 ?
                    `<div style="margin-top: 2px; font-size: 0.7rem; color: #6b7280;">
                        📎 ${noteAttachments.length} dosya
                        ${noteAttachments.filter(f => f.type && f.type.startsWith('image/')).slice(0, 3).map(img =>
                            `<span onclick="event.stopPropagation(); handleAttachmentClick('${img.url}', '${img.name}', '${img.type}')" style="display: inline-block; width: 16px; height: 16px; margin-left: 4px; border-radius: 2px; overflow: hidden; vertical-align: middle; cursor: pointer;" title="${img.name}">
                                <img src="${img.url}" style="width: 100%; height: 100%; object-fit: cover;">
                            </span>`
                        ).join('')}
                    </div>` : '';

                return `
                    <div class="list-item" style="border-left: 5px solid var(--${teamType});">
                        <div class="title" onclick="openDetailView('${action.id}')" style="cursor: pointer;">
                            ${action.priority ? '⭐ ' : ''}${action.title}
                            ${attachmentIndicator}
                        </div>
                        <div class="responsible" onclick="openDetailView('${action.id}')" style="cursor: pointer;">${action.responsible}</div>
                        <div class="person" onclick="openDetailView('${action.id}')" style="cursor: pointer;">${personName}</div>
                        <div class="status"><span class="status-badge ${action.status}" onclick="event.stopPropagation(); quickStatusChange('${action.id}', '${action.status}')">${getStatusText(action.status)}</span></div>
                        <div class="date" onclick="openDetailView('${action.id}')" style="cursor: pointer;">${action.date ? formatDate(action.date) : '-'}</div>
                        <div class="actions action-buttons">
                           <button class="action-btn ${action.priority ? 'priority-active' : ''}" data-action="priority" data-action-id="${action.id}" title="Öncelik">${ICONS.priority}</button>
                           <button class="action-btn" data-action="delete" data-action-id="${action.id}" title="Sil">${ICONS.delete}</button>
                        </div>
                    </div>`;
            }).join('');
            
            container.innerHTML = header + items;
        }

        function renderKanbanView(data) {
            const container = document.getElementById('actionsContainerKanban');
            container.innerHTML = `
                <div class="kanban-col" id="kanban-waiting" data-status="waiting" ondragover="allowDrop(event)" ondrop="drop(event)" ondragleave="dragLeave(event)">
                    <div class="kanban-col-header">Bekliyor</div>
                </div>
                <div class="kanban-col" id="kanban-in-progress" data-status="in-progress" ondragover="allowDrop(event)" ondrop="drop(event)" ondragleave="dragLeave(event)">
                    <div class="kanban-col-header">Devam Ediyor</div>
                </div>
                <div class="kanban-col" id="kanban-completed" data-status="completed" ondragover="allowDrop(event)" ondrop="drop(event)" ondragleave="dragLeave(event)">
                    <div class="kanban-col-header">Tamamlandı</div>
                </div>
            `;
            data.forEach(action => {
                const cardHtml = createActionCard(action);
                const colId = `kanban-${action.status}`;
                const col = container.querySelector(`#${colId}`);
                if (col) {
                    col.insertAdjacentHTML('beforeend', cardHtml);
                }
            });
        }
        
        function renderCalendarView(data) {
            const container = document.getElementById('actionsContainerCalendar');
            const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

            const month = calendarDate.getMonth();
            const year = calendarDate.getFullYear();

            const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            let html = `<div class="calendar-header">
                <button class="btn" onclick="changeMonth(-1)">‹ Önceki</button>
                <h2>${monthNames[month]} ${year}</h2>
                <button class="btn" onclick="changeMonth(1)">Sonraki ›</button>
            </div>`;
            html += `<div class="calendar-grid">`;
            dayNames.forEach(day => html += `<div class="calendar-day-header">${day}</div>`);

            for (let i = 0; i < firstDay; i++) {
                html += `<div class="calendar-day other-month"></div>`;
            }

            for (let day = 1; day <= daysInMonth; day++) {
                const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const actionsForDay = data.filter(a => a.date === currentDateStr);

                html += `<div class="calendar-day">
                    <div class="day-number">${day}</div>
                    <div class="day-actions">
                        ${actionsForDay.map(action => {
                            // Check for note attachments
                            const hasNoteAttachments = action.notes && action.notes.some(note => note.attachments && note.attachments.length > 0);
                            return `<div class="day-action-item ${getTeamType(action.responsible)}" onclick="event.stopPropagation(); event.preventDefault(); openDetailView('${action.id}')" title="${action.title}">
                                ${hasNoteAttachments ? '📎 ' : ''}${action.title}
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }
            html += `</div></div>`;
            container.innerHTML = html;
        }
        
        function changeMonth(direction) {
            calendarDate.setMonth(calendarDate.getMonth() + direction);
            renderActions();
        }

        // --- KANBAN DRAG & DROP ---
        function allowDrop(ev) {
            ev.preventDefault();
            ev.currentTarget.classList.add('drag-over');
        }

        function dragLeave(ev) {
            ev.currentTarget.classList.remove('drag-over');
        }
        
        function drag(ev, id) {
            ev.dataTransfer.setData("text/plain", id);
            ev.dataTransfer.effectAllowed = "move";
            
            // Drag başladığında card'ı işaretle
            const card = ev.target.closest('.action-card');
            if (card) {
                card.classList.add('dragging');
            }
        }
        
        function drop(ev) {
            ev.preventDefault();
            ev.currentTarget.classList.remove('drag-over');
            const id = ev.dataTransfer.getData("text/plain");
            const newStatus = ev.currentTarget.dataset.status;
            
            // Dragged element'i temizle
            const draggedEl = document.querySelector('.action-card.dragging');
            if (draggedEl) {
                draggedEl.classList.remove('dragging');
            }

            // Action'ı bul ve güncelle
            const action = actions.find(a => String(a.id) === String(id));
            
            if (action && action.status !== newStatus) {
                // Firebase'de güncelle - listener otomatik UI'yi güncelleyecek
                database.ref('actions/' + id).update({ status: newStatus })
                    .then(() => {
                        showNotification(`✅ Aksiyon "${action.title}" ${getStatusText(newStatus)} durumuna taşındı`, 'success');
                    })
                    .catch((error) => {
                        console.error('Error updating action status:', error);
                        showNotification('❌ Aksiyon durumu güncellenirken hata oluştu', 'warning');
                    });
            }
        }
        
        document.addEventListener('dragend', (e) => {
            // Tüm dragging class'larını temizle
            document.querySelectorAll('.action-card.dragging').forEach(el => {
                el.classList.remove('dragging');
            });
            
            // Tüm drag-over class'larını temizle
            document.querySelectorAll('.kanban-col.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });

        // --- KİŞİ YÖNETİMİ ---
        function openPersonManagement() {
            const modal = document.getElementById('personModal');
            if (modal) {
                modal.classList.add('active');
                modal.style.display = 'flex';
            } else {
                console.error('Person modal not found');
            }

            // Close user dropdown
            const modernUserDropdown = document.getElementById('modernUserDropdown');
            if (modernUserDropdown) {
                modernUserDropdown.classList.remove('active');
            }
        }

        function closePersonManagement() {
            const modal = document.getElementById('personModal');
            if (modal) {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }

            // Reset user dropdown display
            const modernUserDropdown = document.getElementById('modernUserDropdown');
            if (modernUserDropdown) {
                modernUserDropdown.style.display = '';
            }
        }

        function renderPersonList() {
            const container = document.getElementById('personListContainer');
            if (!persons || persons.length === 0) {
                container.innerHTML = '<p>Kayıtlı kişi bulunamadı.</p>';
                return;
            }
            container.innerHTML = persons.map(p => `
                <div class="person-item">
                    <div class="person-info">
                        <span>${p.name}</span> <small>${p.team}</small>
                    </div>
                    <button class="delete-person-btn" onclick="deletePerson('${p.id}')" title="Sil">${ICONS.delete}</button>
                </div>
            `).join('');
        }
        
        document.getElementById('addPersonForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('personName').value;
            const team = document.getElementById('personTeam').value;
            if (name && team) {
                database.ref('persons').push({ name, team });
                if (e.target) {
                    e.target.reset();
                }
            }
        });

        function deletePerson(id) {
            if (confirm("Bu kişiyi silmek istediğinizden emin misiniz?")) {
                database.ref('persons/' + id).remove();
            }
        }

        // --- Event Listeners for filters ---
        function togglePriorityFilter() {
            priorityFilterActive = !priorityFilterActive;
            document.getElementById('priorityFilterBtn').classList.toggle('active', priorityFilterActive);
            renderActions();
        }

        // Modern Filter Pills - Team Filter
        document.querySelectorAll("[data-team]").forEach(btn => btn.addEventListener("click", e => {
            document.querySelectorAll("[data-team]").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentTeamFilter = e.currentTarget.dataset.team;
            renderActions();
        }));

        // Modern Filter Pills - Status Filter
        document.querySelectorAll("[data-filter]").forEach(btn => btn.addEventListener("click", e => {
            document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentStatusFilter = e.currentTarget.dataset.filter;
            renderActions();
        }));

        // Modern View Switcher - Toolbar
        document.querySelectorAll(".view-tab[data-view]").forEach(btn => btn.addEventListener("click", e => {
            document.querySelectorAll(".view-tab[data-view]").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentView = e.currentTarget.dataset.view;
            renderActions();
        }));

        // Export Menu Functions
        function toggleExportMenu() {
            // Header dropdown (eski)
            const headerDropdown = document.getElementById('exportDropdown');
            if (headerDropdown) {
                headerDropdown.classList.toggle('active');
            }

            // Toolbar dropdown (yeni)
            const toolbarDropdown = document.getElementById('exportDropdownToolbar');
            if (toolbarDropdown) {
                toolbarDropdown.classList.toggle('active');
            }
        }

        function closeExportMenu() {
            // Header dropdown (eski)
            const headerDropdown = document.getElementById('exportDropdown');
            if (headerDropdown) {
                headerDropdown.classList.remove('active');
            }

            // Toolbar dropdown (yeni)
            const toolbarDropdown = document.getElementById('exportDropdownToolbar');
            if (toolbarDropdown) {
                toolbarDropdown.classList.remove('active');
            }
        }

        // Close export menu when clicking outside
        document.addEventListener('click', function(e) {
            const exportWrapper = e.target.closest('.export-menu-wrapper');
            if (!exportWrapper) {
                closeExportMenu();
            }
        });

        // General View Selector (for any data-view elements)
        document.querySelectorAll("[data-view]").forEach(btn => btn.addEventListener("click", e => {
            document.querySelectorAll("[data-view]").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentView = e.currentTarget.dataset.view;
            renderActions();
        }));

        // Legacy filter support (for backward compatibility)
        document.querySelectorAll(".team-filters .filter-btn").forEach(btn => btn.addEventListener("click", e => {
            document.querySelectorAll(".team-filters .filter-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentTeamFilter = e.currentTarget.dataset.team;
            renderActions();
        }));

        document.querySelectorAll(".status-filters .filter-btn").forEach(btn => btn.addEventListener("click", e => {
            document.querySelectorAll(".status-filters .filter-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentStatusFilter = e.currentTarget.dataset.filter;
            renderActions();
        }));

        document.querySelectorAll(".view-toggle .filter-btn").forEach(btn => btn.addEventListener("click", e => {
            document.querySelectorAll(".view-toggle .filter-btn").forEach(b => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            currentView = e.currentTarget.dataset.view;
            renderActions();
        }));

        document.getElementById("searchInput").addEventListener("input", renderActions);

        // Header hide on scroll
        let lastScrollTop = 0;
        window.addEventListener('scroll', function() {
            const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const header = document.querySelector('.modern-header');
            const dropdown = document.getElementById('modernUserDropdown');

            if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
                // Scrolling down - hide header and close dropdown
                header.classList.add('hide-on-scroll');
                if (dropdown) {
                    dropdown.classList.remove('active');
                }
            } else {
                // Scrolling up - show header
                header.classList.remove('hide-on-scroll');
            }

            lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop;
        });
        
        function toggleUserMenu(event) {
            // Event propagation'ı durdur
            if (event) {
                event.stopPropagation();
            }

            // Modern dropdown'ı toggle et
            const modernDropdown = document.getElementById('modernUserDropdown');
            if (modernDropdown) {
                modernDropdown.classList.toggle('active');
            }
        }

        // Initialize user profile
        function initUserProfile() {
            // Bu kısım Firebase auth'dan gelecek
            const userName = auth.currentUser?.email || "Kullanıcı";
            const userInitials = userName.charAt(0).toUpperCase();

            // Update header profile
            document.getElementById('userDisplayName').textContent = userName;
            document.getElementById('userInitials').textContent = userInitials;

            // Update dropdown profile
            document.getElementById('userDisplayNameDropdown').textContent = userName;
            document.getElementById('userInitialsDropdown').textContent = userInitials;
        }

        // Close user menu when clicking outside
        document.addEventListener('click', function(e) {
            const userMenu = e.target.closest('.user-menu-modern');
            if (!userMenu) {
                const modernDropdown = document.getElementById('modernUserDropdown');
                if (modernDropdown) {
                    modernDropdown.classList.remove('active');
                }
            }
        });
        
        // Event delegation for action buttons
        document.addEventListener('click', function(e) {
            const button = e.target.closest('.action-btn');
            if (button && button.dataset.action && button.dataset.actionId) {
                e.stopPropagation();
                e.preventDefault();
                e.stopImmediatePropagation();

                const action = button.dataset.action;
                const id = button.dataset.actionId;

                switch(action) {
                    case 'priority':
                        togglePriority(id);
                        break;
                    case 'delete':
                        deleteAction(id);
                        break;
                    case 'add-note':
                        openAddNoteModal(id);
                        break;
                }
                return false; // Prevent any further event handling
            }
        });

        // ESC key handler for closing modals and Tab key handler for form submission
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const activeModal = document.querySelector('.modal.active');
                if (activeModal) {
                    // Close the active modal
                    activeModal.classList.remove('active');
                    activeModal.style.display = 'none';

                    // Reset any form data if needed
                    if (activeModal.id === 'actionModal') {
                        const actionForm = document.getElementById('actionForm');
                        if (actionForm) {
                            actionForm.reset();
                        }
                        editingId = null;
                    } else if (activeModal.id === 'personModal') {
                        const personForm = document.getElementById('personForm');
                        if (personForm) {
                            personForm.reset();
                            delete personForm.dataset.editId;
                        }
                    } else if (activeModal.id === 'postponeModal') {
                        const postponeForm = document.getElementById('postponeForm');
                        if (postponeForm) {
                            postponeForm.reset();
                        }
                        currentPostponeId = null;
                    } else if (activeModal.id === 'passwordModal') {
                        const passwordForm = document.getElementById('passwordForm');
                        if (passwordForm) {
                            passwordForm.reset();
                        }
                    } else if (activeModal.id === 'postponeEditModal') {
                        const postponeEditForm = document.getElementById('postponeEditForm');
                        if (postponeEditForm) {
                            postponeEditForm.reset();
                        }
                        currentEditingPostpone = { actionId: null, postponeIndex: null };
                    } else if (activeModal.id === 'detailModal') {
                        // Prevent default modal closing behavior and use our custom close function
                        e.preventDefault();
                        closeDetailModal();
                        return; // Exit early since closeDetailModal handles cleanup
                    }
                    
                    // Close user dropdown if open
                    const userDropdown = document.getElementById('userDropdown');
                    if (userDropdown && userDropdown.classList.contains('active')) {
                        userDropdown.classList.remove('active');
                        document.querySelector('.user-profile').classList.remove('active');
                    }
                    
                    // Close backup settings if open
                    const backupSettings = document.getElementById('backupSettings');
                    if (backupSettings && backupSettings.classList.contains('active')) {
                        backupSettings.classList.remove('active');
                    }
                    
                    // Close backup notification if open
                    const backupNotification = document.getElementById('backupNotification');
                    if (backupNotification && backupNotification.classList.contains('active')) {
                        backupNotification.classList.remove('active');
                    }
                }
            }

            // Tab key handler for form submission (SAP style)
            if (e.key === 'Tab') {
                const activeElement = document.activeElement;
                if (!activeElement) return;

                // Check if we're in a form input field
                const isFormInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName);
                if (!isFormInput) return;

                // Get the form that contains the active element
                const form = activeElement.closest('form');
                if (!form) return;

                // Check if this is a submit-on-tab enabled form
                const enabledForms = ['actionForm', 'personForm', 'postponeForm'];
                if (!enabledForms.includes(form.id)) return;

                // Check if all required fields are filled
                const requiredFields = form.querySelectorAll('[required]');
                let allFieldsValid = true;

                for (let field of requiredFields) {
                    if (!field.value.trim()) {
                        allFieldsValid = false;
                        break;
                    }
                }

                // If all required fields are filled, submit the form
                if (allFieldsValid) {
                    e.preventDefault(); // Prevent default tab behavior

                    // Trigger form submission
                    const submitEvent = new Event('submit', {
                        bubbles: true,
                        cancelable: true
                    });
                    form.dispatchEvent(submitEvent);

                    // Show a subtle indication that form was submitted via Tab
                    showNotification('📋 Form kaydedildi (Tab ile)', 'success');
                }
            }
        });

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            const userMenu = e.target.closest('.user-menu-modern');
            const activeModal = document.querySelector('.modal.active');
            if (!userMenu) {
                const modernDropdown = document.getElementById('modernUserDropdown');
                if (modernDropdown) {
                    modernDropdown.classList.remove('active');
                }
            }
            if (activeModal && e.target === activeModal) {
                 activeModal.classList.remove('active');
                 activeModal.style.display = 'none';
            }
        });

        // --- DATA EXPORT FUNCTIONS ---
        function exportToExcel() {
            if (actions.length === 0) {
                alert("Dışa aktarılacak aksiyon bulunamadı.");
                return;
            }
            const dataToExport = actions.map(action => {
                const person = persons.find(p => p.id === action.assignedPerson);
                return {
                    'Başlık': action.title,
                    'Sorumlu Takım': action.responsible,
                    'Atanan Kişi': person ? person.name : 'Atanmamış',
                    'Açıklama': action.description,
                    'Durum': getStatusText(action.status),
                    'Hedef Tarih': action.date ? formatDate(action.date) : 'Yok',
                    'Öncelikli': action.priority ? 'Evet' : 'Hayır',
                    'Ertelenme Sebebi': action.postponeReason || '-'
                };
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Aksiyonlar");
            XLSX.writeFile(workbook, "AksiyonListesi.xlsx");
        }

        function exportToWord() {
            if (actions.length === 0) {
                alert("Dışa aktarılacak aksiyon bulunamadı.");
                return;
            }

            const anadoluActions = actions.filter(a => a.responsible === "Anadolu Bakır");
            const aifteamActions = actions.filter(a => a.responsible === "AIFTEAM");
            const ortakActions = actions.filter(a => a.responsible && a.responsible.includes("Ortak"));
            
            const reportDate = new Date().toLocaleDateString('tr-TR');
            
            let htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                      xmlns:w='urn:schemas-microsoft-com:office:word'
                      xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <meta charset='utf-8'>
                    <title>Aksiyon Takip Raporu</title>
                    
                </head>
                <body>
                    <h1>📋 Aksiyon Takip Raporu</h1>
                    <p><strong>Rapor Tarihi:</strong> ${reportDate}</p>
                    
                    <h2>📊 Özet İstatistikler</h2>
                    <table class="stats-table">
                        <thead>
                            <tr>
                                <th>Takım</th>
                                <th>Toplam</th>
                                <th>Tamamlanan</th>
                                <th>Devam Eden</th>
                                <th>Bekleyen</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Anadolu Bakır</td>
                                <td>${anadoluActions.length}</td>
                                <td>${anadoluActions.filter(a => a.status === 'completed').length}</td>
                                <td>${anadoluActions.filter(a => a.status === 'in-progress').length}</td>
                                <td>${anadoluActions.filter(a => a.status === 'waiting').length}</td>
                            </tr>
                            <tr>
                                <td>AIFTEAM</td>
                                <td>${aifteamActions.length}</td>
                                <td>${aifteamActions.filter(a => a.status === 'completed').length}</td>
                                <td>${aifteamActions.filter(a => a.status === 'in-progress').length}</td>
                                <td>${aifteamActions.filter(a => a.status === 'waiting').length}</td>
                            </tr>
                            <tr>
                                <td>Ortak</td>
                                <td>${ortakActions.length}</td>
                                <td>${ortakActions.filter(a => a.status === 'completed').length}</td>
                                <td>${ortakActions.filter(a => a.status === 'in-progress').length}</td>
                                <td>${ortakActions.filter(a => a.status === 'waiting').length}</td>
                            </tr>
                            <tr style="font-weight: bold; background-color: #ecf0f1;">
                                <td>TOPLAM</td>
                                <td>${actions.length}</td>
                                <td>${actions.filter(a => a.status === 'completed').length}</td>
                                <td>${actions.filter(a => a.status === 'in-progress').length}</td>
                                <td>${actions.filter(a => a.status === 'waiting').length}</td>
                            </tr>
                        </tbody>
                    </table>
            `;
            
            if (anadoluActions.length > 0) {
                htmlContent += `<h2>🏢 Anadolu Bakır Aksiyonları (${anadoluActions.length})</h2>`;
                anadoluActions.forEach((action, index) => {
                    htmlContent += `
                        <div class="action-item team-anadolu">
                            <div class="action-title">${index + 1}. ${action.title}</div>
                            <div class="action-field">
                                <span class="field-label">Durum:</span>
                                <span class="status ${action.status}">${getStatusText(action.status)}</span>
                            </div>
                            <div class="action-field">
                                <span class="field-label">Tarih:</span>
                                ${action.date ? formatDate(action.date) : "Belirtilmemiş"}
                            </div>
                            <div class="action-field">
                                <span class="field-label">Açıklama:</span><br>
                                ${action.description}
                            </div>
                        </div>
                    `;
                });
            }
            
            if (aifteamActions.length > 0) {
                htmlContent += `<h2>💻 AIFTEAM Aksiyonları (${aifteamActions.length})</h2>`;
                aifteamActions.forEach((action, index) => {
                    htmlContent += `
                        <div class="action-item team-aifteam">
                            <div class="action-title">${index + 1}. ${action.title}</div>
                            <div class="action-field">
                                <span class="field-label">Durum:</span>
                                <span class="status ${action.status}">${getStatusText(action.status)}</span>
                            </div>
                            <div class="action-field">
                                <span class="field-label">Tarih:</span>
                                ${action.date ? formatDate(action.date) : "Belirtilmemiş"}
                            </div>
                            <div class="action-field">
                                <span class="field-label">Açıklama:</span><br>
                                ${action.description}
                            </div>
                        </div>
                    `;
                });
            }
            
            if (ortakActions.length > 0) {
                htmlContent += `<h2>🤝 Ortak Aksiyonlar (${ortakActions.length})</h2>`;
                ortakActions.forEach((action, index) => {
                    htmlContent += `
                        <div class="action-item team-ortak">
                            <div class="action-title">${index + 1}. ${action.title}</div>
                            <div class="action-field">
                                <span class="field-label">Durum:</span>
                                <span class="status ${action.status}">${getStatusText(action.status)}</span>
                            </div>
                            <div class="action-field">
                                <span class="field-label">Tarih:</span>
                                ${action.date ? formatDate(action.date) : "Belirtilmemiş"}
                            </div>
                            <div class="action-field">
                                <span class="field-label">Açıklama:</span><br>
                                ${action.description}
                            </div>
                        </div>
                    `;
                });
            }
            
            htmlContent += `
                </body>
                </html>
            `;
            
            // Simple Word export using blob
            const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const fileName = `Aksiyon_Takip_Raporu_${new Date().toISOString().split('T')[0]}.doc`;
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('📄 Word raporu başarıyla oluşturuldu!', 'success');
        }

        // Missing function definitions
        function openPasswordModal() {
            const modal = document.getElementById('passwordModal');
            modal.classList.add('active');
            modal.style.display = 'flex';
            modal.style.zIndex = '10000'; // Ensure it's on top

            // Close user dropdown
            const modernUserDropdown = document.getElementById('modernUserDropdown');
            if (modernUserDropdown) {
                modernUserDropdown.classList.remove('active');
            }
        }

        function showBackupSettings() {
            const modal = document.getElementById('backupModal');
            modal.classList.add('active');
            modal.style.display = 'flex';
            modal.style.zIndex = '10000'; // Ensure it's on top

            // Close user dropdown
            const modernUserDropdown = document.getElementById('modernUserDropdown');
            if (modernUserDropdown) {
                modernUserDropdown.classList.remove('active');
            }
        }

        function closeBackupModal() {
            const modal = document.getElementById('backupModal');
            modal.classList.remove('active');
            modal.style.display = 'none';

            // Reset user dropdown display
            const modernUserDropdown = document.getElementById('modernUserDropdown');
            if (modernUserDropdown) {
                modernUserDropdown.style.display = '';
            }
        }

        function exportAllData() {
            const allData = {
                actions: actions,
                persons: persons,
                exportDate: new Date().toISOString(),
                version: "1.0"
            };

            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `aksiyon-takip-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showNotification('📁 Veriler başarıyla dışa aktarıldı!', 'success');
        }

        function importData(event) {
            const file = event.target.files[0];
            if (!file) return;

            if (!confirm('⚠️ Bu işlem mevcut tüm verilerinizin üzerine yazacaktır. Devam etmek istediğinizden emin misiniz?')) {
                event.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);

                    if (importedData.actions && importedData.persons) {
                        // Update Firebase with imported data
                        const updates = {};

                        // Import actions
                        importedData.actions.forEach(action => {
                            updates[`actions/${action.id}`] = action;
                        });

                        // Import persons
                        importedData.persons.forEach(person => {
                            updates[`persons/${person.id}`] = person;
                        });

                        database.ref().update(updates).then(() => {
                            showNotification('📂 Veriler başarıyla içe aktarıldı! Sayfa yenileniyor...', 'success');
                            setTimeout(() => location.reload(), 1500);
                        }).catch(error => {
                            console.error('Import error:', error);
                            showNotification('❌ İçe aktarma sırasında hata oluştu!', 'error');
                        });
                    } else {
                        showNotification('❌ Geçersiz dosya formatı!', 'error');
                    }
                } catch (error) {
                    console.error('Parse error:', error);
                    showNotification('❌ Dosya okunamadı! Geçerli bir JSON dosyası seçin.', 'error');
                }
            };
            reader.readAsText(file);
            event.target.value = '';
        }

        // File upload functions for edit modal
        // Using editUploadedFiles declared above
        let editFileUploadInitialized = false;

        function initializeEditFileUpload() {
            if (editFileUploadInitialized) return;
            editFileUploadInitialized = true;

            const fileInput = document.getElementById('editActionFiles');
            if (!fileInput) return;

            fileInput.addEventListener('change', handleEditActionFileSelect);
        }

        function handleEditActionFileSelect(event) {
            const files = event.target.files;
            for (let file of files) {
                editSelectedFiles.push(file);
                displayEditActionFilePreview(file);
            }
        }

        function displayEditActionFilePreview(file) {
            const preview = document.getElementById('editActionFilePreview');
            if (!preview) return;

            const fileItem = document.createElement('div');
            const fileURL = URL.createObjectURL(file);

            if (file.type.startsWith('image/')) {
                fileItem.className = 'file-preview-item image';
                fileItem.innerHTML = `
                    <div style="position: relative; display: flex; flex-direction: column; padding: 12px; background: white; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 8px; max-width: 280px;">
                        <div onclick="handleAttachmentClick('${fileURL}', '${file.name}', '${file.type}')" style="cursor: pointer; margin-bottom: 8px;">
                            <img src="${fileURL}" alt="${file.name}" style="width: 100%; max-width: 260px; height: auto; max-height: 150px; object-fit: cover; border-radius: 6px; border: 1px solid #ddd;">
                        </div>
                        <div style="display: flex; align-items: center; justify-content: space-between;">
                            <span style="font-size: 12px; color: #374151; word-break: break-word;" title="${file.name}">${file.name}</span>
                            <button type="button" onclick="removeEditActionFile('${file.name}')" style="padding: 4px 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; font-size: 12px; color: #dc2626; cursor: pointer; margin-left: 8px;">×</button>
                        </div>
                    </div>
                `;
            } else {
                fileItem.className = 'file-preview-item';
                fileItem.innerHTML = `
                    <div class="file-info">
                        <span class="file-icon">${getFileIcon(file.type)}</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button type="button" onclick="removeEditActionFile('${file.name}')" class="remove-file-btn">×</button>
                `;
            }

            preview.appendChild(fileItem);
        }

        function removeEditActionFile(fileName) {
            editSelectedFiles = editSelectedFiles.filter(file => file.name !== fileName);
            const preview = document.getElementById('editActionFilePreview');
            const fileItems = preview.querySelectorAll('.file-preview-item');
            fileItems.forEach(item => {
                if (item.querySelector('.file-name').textContent === fileName) {
                    item.remove();
                }
            });
        }

        function showExistingAttachments(action) {
            const preview = document.getElementById('editActionFilePreview');
            if (!preview || !action.attachments) return;

            preview.innerHTML = ''; // Clear existing preview

            action.attachments.forEach(file => {
                const fileItem = document.createElement('div');
                fileItem.className = 'file-preview-item existing-file';
                fileItem.innerHTML = `
                    <div class="file-info">
                        <span class="file-icon">${getFileIcon(file.type)}</span>
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">(Mevcut dosya)</span>
                    </div>
                    <button type="button" onclick="removeExistingAttachment('${currentEditingActionId}', '${file.name}')" class="remove-file-btn">×</button>
                `;
                preview.appendChild(fileItem);
            });
        }

        function removeExistingAttachment(actionId, fileName) {
            if (!confirm('Bu dosyayı silmek istediğinizden emin misiniz?')) {
                return;
            }

            const action = actions.find(a => String(a.id) === String(actionId));
            if (action && action.attachments) {
                action.attachments = action.attachments.filter(att => att.name !== fileName);

                database.ref(`actions/${actionId}/attachments`).set(action.attachments).then(() => {
                    showNotification('📎 Dosya başarıyla silindi!', 'success');
                    showExistingAttachments(action);
                }).catch(error => {
                    console.error('Delete error:', error);
                    showNotification('❌ Dosya silinirken hata oluştu!', 'error');
                });
            }
        }

        function uploadEditFilesAndSaveAction(actionData) {
            if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
                showNotification('❌ Google Drive API hazır değil! Lütfen biraz bekleyin.', 'error');
                return;
            }

            showNotification('📤 Dosyalar yükleniyor...', 'info');

            const uploadPromises = editUploadedFiles.map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const fileMetadata = {
                            name: file.name,
                            parents: [GOOGLE_DRIVE_FOLDER_ID]
                        };

                        const form = new FormData();
                        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], {type: 'application/json'}));
                        form.append('file', file);

                        fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
                            method: 'POST',
                            headers: new Headers({
                                'Authorization': `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
                            }),
                            body: form
                        }).then(response => response.json())
                        .then(result => {
                            if (result.id) {
                                const publicUrl = `https://drive.google.com/uc?id=${result.id}&export=view`;
                                resolve({
                                    id: result.id,
                                    name: file.name,
                                    url: publicUrl,
                                    type: file.type,
                                    size: file.size
                                });
                            } else {
                                reject(new Error('File upload failed'));
                            }
                        }).catch(reject);
                    };
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(uploadPromises).then(uploadedFiles => {
                // Add new files to existing attachments
                if (!actionData.attachments) {
                    actionData.attachments = [];
                }
                actionData.attachments = [...actionData.attachments, ...uploadedFiles];

                // Clear selected files for next time
                editSelectedFiles = [];

                // Update action in Firebase
                updateActionInFirebase(actionData);
                showNotification(`✅ ${uploadedFiles.length} dosya başarıyla yüklendi!`, 'success');
            }).catch(error => {
                console.error('File upload error:', error);
                showNotification('❌ Dosya yükleme hatası!', 'error');

                // Still save the action without files
                updateActionInFirebase(actionData);
            });
        }

        function updateActionInFirebase(actionData) {
            database.ref(`actions/${currentEditingActionId}`).set(actionData).then(() => {
                showNotification('✅ Aksiyon başarıyla güncellendi!', 'success');

                // Update local actions array
                const actionIndex = actions.findIndex(a => String(a.id) === String(currentEditingActionId));
                if (actionIndex !== -1) {
                    actions[actionIndex] = actionData;
                }

                // Close modal and refresh
                closeDetailModal();
                renderActions();
                currentEditingActionId = null;

                // Reset edit file upload state
                editSelectedFiles = [];
                editFileUploadInitialized = false;
            }).catch(error => {
                console.error('Update error:', error);
                showNotification('❌ Güncellerken hata oluştu!', 'error');
            });
        }

        // File upload functionality for edit modal
        let editUploadedFiles = [];

        function initializeEditFileUpload() {
            editUploadedFiles = []; // Reset array
            const fileInput = document.getElementById('editActionFiles');
            const previewContainer = document.getElementById('editActionFilePreview');

            if (fileInput && !fileInput.hasEventListener) {
                fileInput.addEventListener('change', handleEditFileUpload);
                fileInput.hasEventListener = true;
            }

            if (previewContainer) {
                previewContainer.innerHTML = '';
            }
        }

        function handleEditFileUpload(event) {
            const files = Array.from(event.target.files);
            const previewContainer = document.getElementById('editActionFilePreview');

            files.forEach(file => {
                editUploadedFiles.push(file);
                displayEditFilePreview(file, editUploadedFiles.length - 1);
            });

            event.target.value = '';
        }

        function displayEditFilePreview(file, index) {
            const previewContainer = document.getElementById('editActionFilePreview');
            const fileElement = document.createElement('div');
            fileElement.className = 'file-preview-item';
            fileElement.style.cssText = 'display: flex; align-items: center; padding: 8px; background: #f8f9fa; margin-bottom: 5px; border-radius: 4px;';

            const fileIcon = getFileIcon(file.type);
            const fileName = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;

            fileElement.innerHTML = `
                <span style="margin-right: 10px; font-size: 1.2em;">${fileIcon}</span>
                <span style="flex: 1; font-size: 0.9em;">${fileName}</span>
                <button type="button" onclick="removeEditFile(${index})" style="background: #dc3545; color: white; border: none; border-radius: 3px; padding: 2px 6px; cursor: pointer; font-size: 0.8em;">×</button>
            `;

            previewContainer.appendChild(fileElement);
        }

        function removeEditFile(index) {
            editUploadedFiles.splice(index, 1);
            const previewContainer = document.getElementById('editActionFilePreview');
            if (previewContainer.children[index]) {
                previewContainer.removeChild(previewContainer.children[index]);
            }

            // Update indexes in remaining items
            Array.from(previewContainer.children).forEach((child, newIndex) => {
                const button = child.querySelector('button');
                if (button) {
                    button.setAttribute('onclick', `removeEditFile(${newIndex})`);
                }
            });
        }

        function addPostponeFromEdit() {
            const originalDate = document.getElementById('postponeOriginalDate').value;
            const newDate = document.getElementById('postponeNewDate').value;
            const reason = document.getElementById('postponeReason').value.trim();

            if (!originalDate || !newDate || !reason) {
                alert('Lütfen tüm erteleme alanlarını doldurun!');
                return;
            }

            if (new Date(newDate) <= new Date(originalDate)) {
                alert('Yeni tarih eski tarihten sonra olmalıdır!');
                return;
            }

            const action = actions.find(a => String(a.id) === String(currentEditingActionId));
            if (!action) {
                alert('Aksiyon bulunamadı!');
                return;
            }

            if (!action.postponeHistory) {
                action.postponeHistory = [];
            }

            // Add postpone to history
            action.postponeHistory.push({
                originalDate: originalDate,
                postponeDate: newDate,
                reason: reason,
                timestamp: Date.now()
            });

            // Update action date to new date
            action.date = newDate;
            document.getElementById('actionDate').value = newDate;

            // Update in Firebase
            database.ref(`actions/${currentEditingActionId}`).set(action).then(() => {
                showNotification('✅ Erteleme başarıyla eklendi!', 'success');

                // Clear form fields
                document.getElementById('postponeOriginalDate').value = newDate; // Set for next postpone
                document.getElementById('postponeNewDate').value = '';
                document.getElementById('postponeReason').value = '';

                // Update postpone history display
                openComprehensiveEdit(currentEditingActionId);
            }).catch(error => {
                console.error('Postpone error:', error);
                showNotification('❌ Erteleme eklenirken hata oluştu!', 'error');
            });
        }

        // Initialize setup functions
        document.addEventListener('DOMContentLoaded', function() {
            setupColorPicker();
            handleActionFileUpload(); // Add action file upload handler
            setupNoteTypeHandler();

            // Initialize Google Drive API
            if (typeof gapi !== 'undefined') {
                initGoogleDriveAPI();
            }

            // Handle postpone edit form submission
            document.getElementById('postponeEditForm').addEventListener('submit', function(e) {
                e.preventDefault();

                const { actionId, postponeIndex } = currentEditingPostpone;
                if (!actionId || postponeIndex === null) {
                    alert('Düzenleme bilgisi bulunamadı!');
                    return;
                }

                const action = actions.find(a => a.id === actionId);
                if (!action || !action.postponeHistory || !action.postponeHistory[postponeIndex]) {
                    alert('Erteleme verisi bulunamadı!');
                    return;
                }

                const newReason = document.getElementById('postponeEditReason').value.trim();
                const newDate = document.getElementById('postponeEditNewDate').value;

                if (!newReason || !newDate) {
                    alert('Lütfen tüm zorunlu alanları doldurun!');
                    return;
                }

                // Update postpone data
                action.postponeHistory[postponeIndex] = {
                    ...action.postponeHistory[postponeIndex],
                    reason: newReason,
                    postponeDate: newDate,
                    editTimestamp: new Date().toISOString()
                };

                // Update database
                database.ref('actions/' + actionId).update({
                    postponeHistory: action.postponeHistory,
                    date: newDate // Update main date as well
                }).then(() => {
                    renderPostponeHistory(action.postponeHistory, actionId);
                    showNotification('✅ Erteleme başarıyla güncellendi!', 'success');
                    closePostponeEditModal();
                }).catch(error => {
                    console.error('Error updating postpone:', error);
                    showNotification('❌ Güncelleme sırasında hata oluştu!', 'error');
                });
            });
        });

        // Also call setup functions when modal is opened
        const originalOpenAddNoteModal = openAddNoteModal;
        openAddNoteModal = function(id) {
            originalOpenAddNoteModal(id);
            setTimeout(() => {
                setupColorPicker();
                handleImageUpload();
                setupNoteTypeHandler();
            }, 100);
        };

        // Postpone Action Functions
        function postponeAction(id) {
            const action = actions.find(a => a.id === id);
            if (!action) {
                showNotification('⚠️ Aksiyon bulunamadı!', 'warning');
                return;
            }

            currentPostponeId = id;
            selectedPostponeImages = [];

            // Reset form
            document.getElementById('postponeForm').reset();
            document.getElementById('postponeColor').value = '#7c3aed';
            document.getElementById('postponeImagePreview').innerHTML = '';

            // Minimum tarihi bugün yap
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('postponeDate').min = today;

            // Modal'a aksiyon bilgisini ekle
            const modalHeader = document.querySelector('#postponeModal .modal-header h2');
            modalHeader.innerHTML = `⏰ Görevi Ertele: "${action.title}"`;

            document.getElementById('postponeModal').classList.add('active');

            // Setup postpone modal functions
            setTimeout(() => {
                setupPostponeColorPicker();
                handlePostponeImageUpload();
            }, 100);
        }

        function closePostponeModal() {
            document.getElementById('postponeModal').classList.remove('active');
            document.getElementById('postponeForm').reset();
            currentPostponeId = null;
            selectedPostponeImages = [];
        }

        // Postpone color picker setup
        function setupPostponeColorPicker() {
            const colorInput = document.getElementById('postponeColor');
            const colorPresets = document.querySelectorAll('#postponeModal .color-preset');

            colorPresets.forEach(preset => {
                preset.addEventListener('click', () => {
                    const color = preset.getAttribute('data-color');
                    colorInput.value = color;
                    colorPresets.forEach(p => p.classList.remove('selected'));
                    preset.classList.add('selected');
                });
            });
        }

        // Postpone image upload handling
        let postponeImageUploadInitialized = false;

        function handlePostponeImageUpload() {
            if (postponeImageUploadInitialized) return;

            const imageInput = document.getElementById('postponeImages');
            const imagePreview = document.getElementById('postponeImagePreview');

            if (!imageInput) return;

            imageInput.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);

                for (const file of files) {
                    if (file.type.startsWith('image/') || file.type.startsWith('application/')) {
                        const fileData = await uploadToGoogleDrive(file);
                        selectedPostponeImages.push(fileData);
                        displayPostponeImagePreview(fileData);
                    }
                }

                imageInput.value = '';
            });

            postponeImageUploadInitialized = true;
        }

        function displayPostponeImagePreview(fileData) {
            const imagePreview = document.getElementById('postponeImagePreview');
            const previewItem = document.createElement('div');
            previewItem.className = 'preview-item';
            previewItem.innerHTML = `
                <img src="${fileData.url}" alt="${fileData.name}" onclick="openImageModal('${fileData.url}')">
                <button type="button" class="remove-preview" onclick="removePostponeImage('${fileData.id}')" title="Kaldır">×</button>
            `;
            imagePreview.appendChild(previewItem);
        }

        function removePostponeImage(imageId) {
            selectedPostponeImages = selectedPostponeImages.filter(img => img.id !== imageId);
            const imagePreview = document.getElementById('postponeImagePreview');
            const previewItems = imagePreview.querySelectorAll('.preview-item');
            previewItems.forEach(item => {
                const img = item.querySelector('img');
                if (img && selectedPostponeImages.find(i => i.url === img.src) === undefined) {
                    item.remove();
                }
            });
        }

        // Postpone form submit handler
        document.getElementById('postponeForm').addEventListener('submit', function(e) {
            e.preventDefault();

            if (!currentPostponeId) return;

            const postponeData = {
                postponed: true,
                postponeReason: document.getElementById('postponeReason').value,
                postponeDate: document.getElementById('postponeDate').value,
                postponePriority: document.getElementById('postponePriority').value,
                originalDate: actions.find(a => a.id === currentPostponeId)?.date,
                postponedAt: new Date().toISOString(),
                postponeColor: document.getElementById('postponeColor').value,
                postponeImages: selectedPostponeImages
            };

            // Mevcut notes dizisini koru ve erteleme notunu ekle
            const currentAction = actions.find(a => a.id === currentPostponeId);
            const existingNotes = currentAction?.notes || [];

            const postponeNote = {
                id: Date.now(),
                type: 'postpone',
                text: postponeData.postponeReason,
                color: postponeData.postponeColor,
                timestamp: new Date().toISOString(),
                images: selectedPostponeImages
            };

            // Aksiyonu güncelle - mevcut verileri koru
            database.ref('actions/' + currentPostponeId).update({
                ...postponeData,
                date: postponeData.postponeDate,
                status: 'waiting', // Ertelenen aksiyonları bekliyor durumuna al
                notes: [...existingNotes, postponeNote] // Mevcut notları koru ve yeni notu ekle
            });

            showNotification('⏰ Aksiyon ertelendi', 'warning');
            closePostponeModal();
        });

        // Function to convert all note types to postpone - Enhanced version
        function convertAllNoteTypesToPostpone() {
            console.log('=== Starting Note Type Conversion ===');

            let totalFound = 0;
            let updatedCount = 0;
            const promises = [];

            actions.forEach(action => {
                console.log(`Checking action: ${action.title}`);

                // Check notes array
                if (action.notes && action.notes.length > 0) {
                    console.log(`  Found ${action.notes.length} notes`);
                    let actionUpdated = false;

                    action.notes.forEach(note => {
                        totalFound++;
                        console.log(`    Note type: "${note.type}", text: "${note.text?.substring(0, 30)}..."`);

                        if (note.type && note.type !== 'postpone') {
                            console.log(`    -> Converting "${note.type}" to "postpone"`);
                            note.type = 'postpone';
                            actionUpdated = true;
                        }
                    });

                    if (actionUpdated) {
                        updatedCount++;
                        console.log(`  -> Updating action in Firebase`);
                        const promise = database.ref('actions/' + action.id + '/notes').set(action.notes);
                        promises.push(promise);
                    }
                } else {
                    console.log(`  No notes found`);
                }
            });

            console.log(`=== Summary ===`);
            console.log(`Total notes found: ${totalFound}`);
            console.log(`Actions to update: ${updatedCount}`);

            if (promises.length > 0) {
                Promise.all(promises)
                    .then(() => {
                        const message = `✅ ${updatedCount} aksiyon güncellendi! Toplam ${totalFound} not kontrol edildi.`;
                        showNotification(message, 'success');
                        console.log('✅ Conversion completed successfully');
                    })
                    .catch(error => {
                        console.error('❌ Error updating note types:', error);
                        showNotification('❌ Not tiplerini güncellerken hata oluştu!', 'error');
                    });
            } else {
                const message = `ℹ️ Güncellenecek not tipi bulunamadı. Toplam ${totalFound} not kontrol edildi.`;
                showNotification(message, 'info');
                console.log('ℹ️ No notes needed conversion');
            }
        }

        // Make the function globally accessible for manual execution
        window.convertAllNoteTypesToPostpone = convertAllNoteTypesToPostpone;

        // Console command: Call convertAllNoteTypesToPostpone() to run manually

        // Migration function to move postponeHistory to notes array
        function migratePostponeHistoryToNotes() {
            console.log('=== Starting postponeHistory Migration ===');

            let migratedCount = 0;
            const promises = [];

            actions.forEach(action => {
                console.log(`Checking action: ${action.title}`);

                if (action.postponeHistory && action.postponeHistory.length > 0) {
                    console.log(`  Found ${action.postponeHistory.length} postponeHistory entries`);

                    // Initialize notes array if it doesn't exist
                    if (!action.notes) action.notes = [];

                    let actionUpdated = false;

                    action.postponeHistory.forEach((postpone, index) => {
                        // Check if this postpone entry already exists as a note
                        const existsAsNote = action.notes.some(note =>
                            note.text === postpone.reason &&
                            note.type === 'postpone'
                        );

                        if (!existsAsNote) {
                            console.log(`    -> Converting postpone ${index + 1}: "${postpone.reason?.substring(0, 30)}..."`);

                            // Create note from postpone history
                            const noteFromPostpone = {
                                id: Date.now() + index, // Unique ID
                                type: 'postpone',
                                text: postpone.reason || 'Erteleme sebebi belirtilmemiş',
                                color: '#7c3aed', // Purple color
                                timestamp: postpone.timestamp || new Date().toISOString(),
                                author: 'migrated_from_history'
                            };

                            action.notes.push(noteFromPostpone);
                            actionUpdated = true;
                        } else {
                            console.log(`    -> Skipping duplicate postpone ${index + 1}`);
                        }
                    });

                    if (actionUpdated) {
                        migratedCount++;
                        console.log(`  -> Updating action in Firebase with ${action.notes.length} total notes`);
                        const promise = database.ref('actions/' + action.id + '/notes').set(action.notes);
                        promises.push(promise);
                    }
                } else {
                    console.log(`  No postponeHistory found`);
                }
            });

            console.log(`=== Migration Summary ===`);
            console.log(`Actions with postponeHistory: ${migratedCount}`);

            if (promises.length > 0) {
                Promise.all(promises)
                    .then(() => {
                        const message = `✅ ${migratedCount} aksiyon güncellendi! postponeHistory → notes migration tamamlandı.`;
                        showNotification(message, 'success');
                        console.log('✅ Migration completed successfully');

                        // Refresh the page to see changes
                        setTimeout(() => location.reload(), 2000);
                    })
                    .catch(error => {
                        console.error('❌ Error during migration:', error);
                        showNotification('❌ Migration sırasında hata oluştu!', 'error');
                    });
            } else {
                showNotification('ℹ️ Migration edilecek postponeHistory bulunamadı.', 'info');
                console.log('ℹ️ No postponeHistory found to migrate');
            }
        }

        // Make migration function globally accessible
        window.migratePostponeHistoryToNotes = migratePostponeHistoryToNotes;