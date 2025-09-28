const fs = require('fs');

class FunctionAnalyzer {
    constructor() {
        this.jsFile = './src/app.js';
        this.htmlFile = './index.html';
        this.functions = [];
        this.htmlFunctions = [];
        this.features = [];
    }

    async analyze() {
        console.log('🔍 Aksiyon Takip Sistemi - Fonksiyon ve Özellik Analizi\n');

        console.log('📄 JavaScript dosyası analiz ediliyor...');
        this.analyzeJSFunctions();

        console.log('📄 HTML dosyası analiz ediliyor...');
        this.analyzeHTMLFunctions();

        console.log('🎯 Özellikler belirleniyor...');
        this.categorizeFeatures();

        console.log('📝 Rapor oluşturuluyor...');
        this.generateReport();

        console.log('✅ Analiz tamamlandı!\n');
    }

    analyzeJSFunctions() {
        const jsContent = fs.readFileSync(this.jsFile, 'utf-8');

        // Function tanımlarını bul
        const functionPatterns = [
            /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            /async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
            /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:function|\()/g,
            /let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:function|\()/g,
            /var\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(?:function|\()/g
        ];

        functionPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(jsContent)) !== null) {
                if (match[1] && !this.functions.find(f => f.name === match[1])) {
                    this.functions.push({
                        name: match[1],
                        type: 'JavaScript Function',
                        source: 'src/app.js'
                    });
                }
            }
        });

        // Event listener'ları bul
        const eventListenerPattern = /addEventListener\(['"]([^'"]+)['"],\s*([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let match;
        while ((match = eventListenerPattern.exec(jsContent)) !== null) {
            this.functions.push({
                name: match[2],
                type: 'Event Listener',
                event: match[1],
                source: 'src/app.js'
            });
        }
    }

    analyzeHTMLFunctions() {
        const htmlContent = fs.readFileSync(this.htmlFile, 'utf-8');

        // onclick, onsubmit vs. event handler'ları bul
        const eventHandlerPattern = /on[a-z]+\s*=\s*["']([^"']+)["']/g;
        let match;
        while ((match = eventHandlerPattern.exec(htmlContent)) !== null) {
            const functionCall = match[1];
            const functionName = functionCall.split('(')[0].trim();

            if (functionName && !functionName.includes('.') && !functionName.includes(';')) {
                this.htmlFunctions.push({
                    name: functionName,
                    type: 'HTML Event Handler',
                    call: functionCall,
                    source: 'index.html'
                });
            }
        }
    }

    categorizeFeatures() {
        const authFunctions = this.functions.filter(f =>
            f.name.includes('signIn') || f.name.includes('signOut') || f.name.includes('login') ||
            f.name.includes('logout') || f.name.includes('auth') || f.name.includes('password')
        );

        const actionFunctions = this.functions.filter(f =>
            f.name.includes('action') || f.name.includes('Action') || f.name.includes('create') ||
            f.name.includes('update') || f.name.includes('delete') || f.name.includes('save')
        );

        const modalFunctions = this.functions.filter(f =>
            f.name.includes('modal') || f.name.includes('Modal') || f.name.includes('open') ||
            f.name.includes('close') || f.name.includes('show')
        );

        const exportFunctions = this.functions.filter(f =>
            f.name.includes('export') || f.name.includes('Export') || f.name.includes('excel') ||
            f.name.includes('word') || f.name.includes('download')
        );

        const fileFunctions = this.functions.filter(f =>
            f.name.includes('file') || f.name.includes('File') || f.name.includes('upload') ||
            f.name.includes('attachment') || f.name.includes('image')
        );

        const filterFunctions = this.functions.filter(f =>
            f.name.includes('filter') || f.name.includes('Filter') || f.name.includes('search') ||
            f.name.includes('Search')
        );

        const uiFunctions = this.functions.filter(f =>
            f.name.includes('render') || f.name.includes('update') || f.name.includes('toggle') ||
            f.name.includes('show') || f.name.includes('hide')
        );

        this.features = [
            {
                category: '🔐 Kimlik Doğrulama',
                functions: authFunctions,
                description: 'Kullanıcı giriş/çıkış, şifre yönetimi'
            },
            {
                category: '📋 Aksiyon Yönetimi',
                functions: actionFunctions,
                description: 'Aksiyon oluşturma, düzenleme, silme'
            },
            {
                category: '🗂️ Modal Yönetimi',
                functions: modalFunctions,
                description: 'Popup pencereler, form modalleri'
            },
            {
                category: '📤 Export İşlemleri',
                functions: exportFunctions,
                description: 'Excel/Word export, veri aktarımı'
            },
            {
                category: '📁 Dosya Yönetimi',
                functions: fileFunctions,
                description: 'Dosya yükleme, indirme, görüntüleme'
            },
            {
                category: '🔍 Filtreleme & Arama',
                functions: filterFunctions,
                description: 'Aksiyon filtreleme, arama işlemleri'
            },
            {
                category: '🎨 UI/UX Fonksiyonları',
                functions: uiFunctions,
                description: 'Arayüz güncellemeleri, görünüm yönetimi'
            }
        ];
    }

    generateReport() {
        const report = `# 🎯 Aksiyon Takip Sistemi - Fonksiyon ve Özellik Raporu

## 📊 Genel İstatistikler

- **Toplam JavaScript Fonksiyonu:** ${this.functions.length}
- **HTML Event Handler:** ${this.htmlFunctions.length}
- **Toplam Fonksiyon:** ${this.functions.length + this.htmlFunctions.length}
- **Ana Özellik Kategorisi:** ${this.features.length}

---

## 🎯 Ana Özellikler ve Use Case'ler

${this.features.map(feature => `
### ${feature.category}
**Açıklama:** ${feature.description}
**Fonksiyon Sayısı:** ${feature.functions.length}

**Fonksiyonlar:**
${feature.functions.map(f => `- \`${f.name}\` - ${f.type}`).join('\n')}

**Use Case Senaryoları:**
${this.generateUseCases(feature.category)}

---`).join('\n')}

## 📝 Tüm Fonksiyonlar

### JavaScript Fonksiyonları (${this.functions.length} adet)
${this.functions.map((f, i) => `${i + 1}. **${f.name}** - ${f.type}${f.event ? ` (${f.event})` : ''}`).join('\n')}

### HTML Event Handlers (${this.htmlFunctions.length} adet)
${this.htmlFunctions.map((f, i) => `${i + 1}. **${f.name}** - ${f.call}`).join('\n')}

---

## 🧪 Test Senaryoları

${this.generateTestScenarios()}

---

*Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}*
`;

        fs.writeFileSync('./FUNCTION_ANALYSIS_REPORT.md', report, 'utf-8');
        console.log('📄 Detaylı rapor oluşturuldu: FUNCTION_ANALYSIS_REPORT.md');
    }

    generateUseCases(category) {
        const useCases = {
            '🔐 Kimlik Doğrulama': [
                '- Kullanıcı e-posta ve şifre ile giriş yapar',
                '- Kullanıcı "Beni Hatırla" seçeneğini kullanır',
                '- Kullanıcı şifresini unutur ve sıfırlar',
                '- Kullanıcı şifresini değiştirir',
                '- Kullanıcı oturumdan çıkar'
            ],
            '📋 Aksiyon Yönetimi': [
                '- Yeni aksiyon oluşturulur (başlık, açıklama, sorumlu)',
                '- Mevcut aksiyon düzenlenir',
                '- Aksiyon silinir',
                '- Aksiyon durumu değiştirilir (bekliyor → devam ediyor → tamamlandı)',
                '- Aksiyon önceliklendirilir',
                '- Aksiyon ertelenir'
            ],
            '🗂️ Modal Yönetimi': [
                '- Aksiyon ekleme modalı açılır',
                '- Kişi yönetimi modalı açılır',
                '- Detay görüntüleme modalı açılır',
                '- Modal ESC tuşu ile kapatılır',
                '- Modal overlay tıklaması ile kapatılır'
            ],
            '📤 Export İşlemleri': [
                '- Tüm aksiyonlar Excel formatında indirilir',
                '- Filtrelenmiş aksiyonlar Word formatında indirilir',
                '- Veriler JSON formatında yedeklenir',
                '- Yedek JSON dosyası içe aktarılır'
            ],
            '📁 Dosya Yönetimi': [
                '- Aksiyona dosya (PDF, Word, Excel) eklenir',
                '- Aksiyona resim eklenir',
                '- Dosya Google Drive\'a yüklenir',
                '- Dosya indirilir',
                '- Resim modal\'da büyütülerek görüntülenir'
            ],
            '🔍 Filtreleme & Arama': [
                '- Aksiyonlar takım bazında filtrelenir (Anadolu Bakır, AIFTEAM, Ortak)',
                '- Aksiyonlar durum bazında filtrelenir',
                '- Öncelikli aksiyonlar filtrelenir',
                '- Metin tabanlı arama yapılır',
                '- Tarih bazında filtreleme yapılır'
            ],
            '🎨 UI/UX Fonksiyonları': [
                '- Gruplu görünüm aktif edilir',
                '- Liste görünümü aktif edilir',
                '- Kanban görünümü aktif edilir',
                '- Takvim görünümü aktif edilir',
                '- Dark/Light mode geçişi yapılır',
                '- Responsive tasarım test edilir'
            ]
        };

        return useCases[category]?.join('\n') || '- Henüz tanımlanmamış';
    }

    generateTestScenarios() {
        return `
### 1. 🔐 Kimlik Doğrulama Testleri
- [ ] Geçerli email/şifre ile giriş
- [ ] Geçersiz email/şifre ile giriş denemesi
- [ ] Şifre sıfırlama maili gönderimi
- [ ] Şifre değiştirme işlemi
- [ ] Oturum kapatma

### 2. 📋 Aksiyon Yönetimi Testleri
- [ ] Yeni aksiyon oluşturma (tüm alanlarla)
- [ ] Boş alanlarla aksiyon oluşturma denemesi
- [ ] Aksiyon düzenleme
- [ ] Aksiyon silme
- [ ] Durum değiştirme (hızlı durum değişimi)
- [ ] Öncelik ekleme/kaldırma

### 3. 📁 Dosya Yönetimi Testleri
- [ ] PDF dosyası yükleme
- [ ] Resim dosyası yükleme
- [ ] Büyük dosya yükleme (limit testi)
- [ ] Desteklenmeyen format yükleme
- [ ] Dosya indirme
- [ ] Dosya silme

### 4. 🔍 Filtreleme Testleri
- [ ] Takım filtreleri (Anadolu Bakır, AIFTEAM, Ortak)
- [ ] Durum filtreleri (Tamamlandı, Devam Ediyor, Bekliyor)
- [ ] Öncelik filtresi
- [ ] Metin arama
- [ ] Birden fazla filtrenin birlikte çalışması

### 5. 📤 Export Testleri
- [ ] Excel export (tüm veriler)
- [ ] Word export (filtrelenmiş veriler)
- [ ] JSON yedekleme
- [ ] JSON içe aktarma
- [ ] Boş veri ile export

### 6. 🎨 Görünüm Testleri
- [ ] Gruplu görünüm
- [ ] Liste görünümü
- [ ] Kanban görünümü
- [ ] Takvim görünümü
- [ ] Görünüm geçişleri
- [ ] Responsive test (mobil, tablet, masaüstü)

### 7. 🌐 Browser Uyumluluk Testleri
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge
- [ ] Mobil browserlar

### 8. ⚡ Performans Testleri
- [ ] 100+ aksiyonla performans
- [ ] Büyük dosyalar ile performans
- [ ] Network kesintisi senaryoları
- [ ] Çoklu kullanıcı senaryoları
`;
    }
}

async function main() {
    const analyzer = new FunctionAnalyzer();
    await analyzer.analyze();
}

if (require.main === module) {
    main();
}

module.exports = FunctionAnalyzer;