class AutomatedTester {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
        this.passed = 0;
        this.failed = 0;
        this.warnings = 0;
    }

    async runAllTests() {
        console.log('🧪 Aksiyon Takip Sistemi - Otomatik Test Süreci Başlıyor\n');

        await this.testDOMElements();
        await this.testJSFunctions();
        await this.testLocalStorage();
        await this.testUIComponents();
        await this.testResponsiveness();

        this.generateTestReport();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString('tr-TR');
        const emoji = type === 'pass' ? '✅' : type === 'fail' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';

        console.log(`${emoji} [${timestamp}] ${message}`);

        this.testResults.push({
            timestamp,
            message,
            type,
            test: this.currentTest
        });

        if (type === 'pass') this.passed++;
        else if (type === 'fail') this.failed++;
        else if (type === 'warn') this.warnings++;
    }

    async testDOMElements() {
        this.currentTest = 'DOM Elements';
        this.log('DOM Element testleri başlıyor...', 'info');

        // Ana konteynerler
        const containers = [
            'login-container',
            'app-container',
            'actionsContainerWrapper',
            'modernUserDropdown'
        ];

        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.log(`${id} elementi bulundu`, 'pass');
            } else {
                this.log(`${id} elementi bulunamadı`, 'fail');
            }
        });

        // Modal'lar
        const modals = [
            'actionModal',
            'personModal',
            'detailModal',
            'passwordModal',
            'addNoteModal',
            'postponeModal',
            'backupModal'
        ];

        modals.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.log(`${id} modalı bulundu`, 'pass');
            } else {
                this.log(`${id} modalı bulunamadı`, 'fail');
            }
        });

        // Form elementleri
        const forms = [
            'loginForm',
            'actionForm',
            'addPersonForm',
            'passwordForm'
        ];

        forms.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.log(`${id} formu bulundu`, 'pass');
            } else {
                this.log(`${id} formu bulunamadı`, 'fail');
            }
        });
    }

    async testJSFunctions() {
        this.currentTest = 'JavaScript Functions';
        this.log('JavaScript fonksiyon testleri başlıyor...', 'info');

        // Kritik fonksiyonlar
        const criticalFunctions = [
            'signIn',
            'signOut',
            'loadActions',
            'openModal',
            'closeModal',
            'exportToExcel',
            'exportToWord',
            'filterActions',
            'searchActions'
        ];

        criticalFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                this.log(`${funcName} fonksiyonu mevcut`, 'pass');
            } else {
                this.log(`${funcName} fonksiyonu bulunamadı`, 'fail');
            }
        });

        // Firebase kontrolü
        if (typeof firebase !== 'undefined') {
            this.log('Firebase SDK yüklendi', 'pass');

            if (firebase.auth) {
                this.log('Firebase Auth modülü mevcut', 'pass');
            } else {
                this.log('Firebase Auth modülü bulunamadı', 'fail');
            }

            if (firebase.database) {
                this.log('Firebase Database modülü mevcut', 'pass');
            } else {
                this.log('Firebase Database modülü bulunamadı', 'fail');
            }
        } else {
            this.log('Firebase SDK bulunamadı', 'fail');
        }

        // Google API kontrolü
        if (typeof gapi !== 'undefined') {
            this.log('Google API SDK yüklendi', 'pass');
        } else {
            this.log('Google API SDK bulunamadı', 'warn');
        }

        // External library kontrolü
        if (typeof XLSX !== 'undefined') {
            this.log('XLSX kütüphanesi yüklendi', 'pass');
        } else {
            this.log('XLSX kütüphanesi bulunamadı', 'fail');
        }
    }

    async testLocalStorage() {
        this.currentTest = 'Local Storage';
        this.log('Local Storage testleri başlıyor...', 'info');

        try {
            // LocalStorage okuma/yazma testi
            const testKey = 'aksiyon_test_key';
            const testValue = 'test_value_' + Date.now();

            localStorage.setItem(testKey, testValue);
            const retrievedValue = localStorage.getItem(testKey);

            if (retrievedValue === testValue) {
                this.log('Local Storage okuma/yazma testi başarılı', 'pass');
                localStorage.removeItem(testKey);
            } else {
                this.log('Local Storage okuma/yazma testi başarısız', 'fail');
            }

            // Mevcut veri kontrolü
            const existingData = localStorage.getItem('aksiyonlar');
            if (existingData) {
                try {
                    const parsed = JSON.parse(existingData);
                    this.log(`Local Storage'da ${Array.isArray(parsed) ? parsed.length : 'geçersiz'} aksiyon verisi bulundu`, 'info');
                } catch (e) {
                    this.log('Local Storage verisi bozuk', 'warn');
                }
            } else {
                this.log('Local Storage\'da aksiyon verisi bulunamadı', 'info');
            }

        } catch (error) {
            this.log(`Local Storage testi hatası: ${error.message}`, 'fail');
        }
    }

    async testUIComponents() {
        this.currentTest = 'UI Components';
        this.log('UI bileşen testleri başlıyor...', 'info');

        // Filter butonları
        const filterButtons = document.querySelectorAll('.filter-pill');
        if (filterButtons.length > 0) {
            this.log(`${filterButtons.length} filter butonu bulundu`, 'pass');
        } else {
            this.log('Filter butonları bulunamadı', 'fail');
        }

        // View switcher
        const viewTabs = document.querySelectorAll('.view-tab');
        if (viewTabs.length >= 4) {
            this.log(`${viewTabs.length} görünüm sekmesi bulundu`, 'pass');
        } else {
            this.log('Görünüm sekmeleri eksik', 'fail');
        }

        // Export butonları
        const exportButtons = document.querySelectorAll('.export-btn');
        if (exportButtons.length >= 2) {
            this.log(`${exportButtons.length} export butonu bulundu`, 'pass');
        } else {
            this.log('Export butonları eksik', 'fail');
        }

        // FAB (Floating Action Button)
        const fab = document.querySelector('.fab');
        if (fab) {
            this.log('Floating Action Button bulundu', 'pass');
        } else {
            this.log('Floating Action Button bulunamadı', 'fail');
        }

        // Stats kartları
        const statsCards = document.querySelectorAll('.team-stats');
        if (statsCards.length >= 3) {
            this.log(`${statsCards.length} istatistik kartı bulundu`, 'pass');
        } else {
            this.log('İstatistik kartları eksik', 'fail');
        }
    }

    async testResponsiveness() {
        this.currentTest = 'Responsiveness';
        this.log('Responsive tasarım testleri başlıyor...', 'info');

        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;

        // Mobil boyut testi (375px)
        try {
            if (window.innerWidth <= 768) {
                this.log('Mobil boyut algılandı', 'info');

                // Header kontrolü
                const header = document.querySelector('.modern-header');
                if (header) {
                    const headerStyle = window.getComputedStyle(header);
                    if (headerStyle.display !== 'none') {
                        this.log('Header mobilde görünür', 'pass');
                    } else {
                        this.log('Header mobilde gizli', 'warn');
                    }
                }

                // Navigation kontrolü
                const toolbar = document.querySelector('.smart-toolbar');
                if (toolbar) {
                    this.log('Toolbar mobilde mevcut', 'pass');
                } else {
                    this.log('Toolbar mobilde bulunamadı', 'fail');
                }
            } else {
                this.log('Desktop boyut algılandı', 'info');
            }

            // CSS Grid/Flexbox kontrolü
            const gridContainers = document.querySelectorAll('.stats-grid, .filter-pills');
            let flexSupport = true;
            gridContainers.forEach(container => {
                const style = window.getComputedStyle(container);
                if (!style.display.includes('flex') && !style.display.includes('grid')) {
                    flexSupport = false;
                }
            });

            if (flexSupport) {
                this.log('CSS Grid/Flexbox düzgün çalışıyor', 'pass');
            } else {
                this.log('CSS Grid/Flexbox sorunlu', 'warn');
            }

        } catch (error) {
            this.log(`Responsive test hatası: ${error.message}`, 'fail');
        }
    }

    simulateUserInteraction() {
        this.currentTest = 'User Interaction Simulation';
        this.log('Kullanıcı etkileşim simülasyonu başlıyor...', 'info');

        // Modal açma simülasyonu
        try {
            const fabButton = document.querySelector('.fab');
            if (fabButton) {
                fabButton.click();
                this.log('FAB butonu tıklama simülasyonu başarılı', 'pass');

                setTimeout(() => {
                    const modal = document.getElementById('actionModal');
                    if (modal && modal.style.display !== 'none') {
                        this.log('Modal açma işlemi başarılı', 'pass');

                        // Modal kapatma
                        const closeBtn = modal.querySelector('.modal-btn.cancel');
                        if (closeBtn) {
                            closeBtn.click();
                            this.log('Modal kapatma simülasyonu başarılı', 'pass');
                        }
                    } else {
                        this.log('Modal açılmadı', 'fail');
                    }
                }, 100);
            }
        } catch (error) {
            this.log(`Modal test hatası: ${error.message}`, 'fail');
        }

        // Filter buton simülasyonu
        try {
            const filterBtn = document.querySelector('.filter-pill[data-team="Anadolu Bakır"]');
            if (filterBtn) {
                filterBtn.click();
                this.log('Filter butonu tıklama simülasyonu başarılı', 'pass');
            }
        } catch (error) {
            this.log(`Filter test hatası: ${error.message}`, 'fail');
        }
    }

    generateTestReport() {
        const total = this.passed + this.failed + this.warnings;
        const successRate = ((this.passed / total) * 100).toFixed(1);

        const report = `
# 🧪 Aksiyon Takip Sistemi - Test Raporu

## 📊 Test Özeti

- **Toplam Test:** ${total}
- **Başarılı:** ${this.passed} ✅
- **Başarısız:** ${this.failed} ❌
- **Uyarı:** ${this.warnings} ⚠️
- **Başarı Oranı:** ${successRate}%

## 📋 Test Kategorileri

### DOM Elements Testleri
${this.getTestsByCategory('DOM Elements')}

### JavaScript Functions Testleri
${this.getTestsByCategory('JavaScript Functions')}

### Local Storage Testleri
${this.getTestsByCategory('Local Storage')}

### UI Components Testleri
${this.getTestsByCategory('UI Components')}

### Responsiveness Testleri
${this.getTestsByCategory('Responsiveness')}

## 🎯 Sonuç ve Öneriler

${this.generateRecommendations()}

---
*Test Tarihi: ${new Date().toLocaleString('tr-TR')}*
`;

        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RAPORU');
        console.log('='.repeat(60));
        console.log(`✅ Başarılı: ${this.passed}`);
        console.log(`❌ Başarısız: ${this.failed}`);
        console.log(`⚠️  Uyarı: ${this.warnings}`);
        console.log(`🎯 Başarı Oranı: ${successRate}%`);
        console.log('='.repeat(60));

        // Raporu dosyaya kaydet
        try {
            require('fs').writeFileSync('./TEST_REPORT.md', report, 'utf-8');
            console.log('📄 Detaylı test raporu kaydedildi: TEST_REPORT.md');
        } catch (error) {
            console.log('⚠️ Test raporu kaydedilemedi:', error.message);
        }
    }

    getTestsByCategory(category) {
        return this.testResults
            .filter(result => result.test === category)
            .map(result => `- ${result.type === 'pass' ? '✅' : result.type === 'fail' ? '❌' : '⚠️'} ${result.message}`)
            .join('\n');
    }

    generateRecommendations() {
        let recommendations = [];

        if (this.failed > 0) {
            recommendations.push('🚨 **Kritik:** Başarısız testler incelenip düzeltilmeli');
        }

        if (this.warnings > 0) {
            recommendations.push('⚠️ **Dikkat:** Uyarı mesajları değerlendirilmeli');
        }

        if (this.passed / (this.passed + this.failed + this.warnings) > 0.9) {
            recommendations.push('🎉 **Mükemmel:** Sistem genel olarak stabil çalışıyor');
        }

        recommendations.push('🔍 **Sürekli İyileştirme:** Testler düzenli aralıklarla çalıştırılmalı');
        recommendations.push('📱 **Mobil Test:** Farklı cihazlarda manuel test yapılmalı');
        recommendations.push('🌐 **Browser Test:** Farklı tarayıcılarda uyumluluk test edilmeli');

        return recommendations.join('\n');
    }
}

// Test başlatma fonksiyonu
async function runTests() {
    if (typeof window === 'undefined') {
        console.log('⚠️ Bu testler browser ortamında çalışmalıdır');
        console.log('🌐 Lütfen tarayıcıda Developer Console\'da şu komutu çalıştırın:');
        console.log('📋 fetch("./automated-tester.js").then(r=>r.text()).then(eval)');
        return;
    }

    const tester = new AutomatedTester();
    await tester.runAllTests();

    // Kullanıcı etkileşim testleri (opsiyonel)
    setTimeout(() => {
        tester.simulateUserInteraction();
    }, 1000);
}

// Node.js ortamında değilse direkt çalıştır
if (typeof window !== 'undefined') {
    window.runAutomatedTests = runTests;
    console.log('🧪 Otomatik test sistemi yüklendi');
    console.log('📋 Testleri başlatmak için: runAutomatedTests()');
} else {
    runTests();
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomatedTester;
}