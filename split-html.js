const fs = require('fs');
const path = require('path');

class HTMLSplitter {
    constructor(inputFile) {
        this.inputFile = inputFile;
        this.outputDir = './src';
        this.cssDir = './src/css';
        this.jsDir = './src/js';
        this.htmlContent = '';
        this.extractedCSS = '';
        this.extractedJS = '';
    }

    async splitHTML() {
        try {
            console.log('📄 HTML dosyası okunuyor...');
            this.htmlContent = fs.readFileSync(this.inputFile, 'utf-8');

            console.log('📁 Klasör yapısı oluşturuluyor...');
            this.createDirectories();

            console.log('🎨 CSS içeriği ayıklanıyor...');
            this.extractCSS();

            console.log('⚡ JavaScript içeriği ayıklanıyor...');
            this.extractJavaScript();

            console.log('📝 HTML dosyası temizleniyor...');
            this.cleanHTML();

            console.log('💾 Dosyalar kaydediliyor...');
            this.saveFiles();

            console.log('✅ HTML başarıyla parçalara ayrıldı!');
            this.printSummary();

        } catch (error) {
            console.error('❌ Hata oluştu:', error.message);
        }
    }

    createDirectories() {
        const dirs = [this.outputDir, this.cssDir, this.jsDir];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    extractCSS() {
        // <style> etiketleri arasındaki CSS'i çıkar
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let match;
        let cssContent = '';

        while ((match = styleRegex.exec(this.htmlContent)) !== null) {
            cssContent += match[1] + '\n\n';
        }

        this.extractedCSS = cssContent.trim();

        // HTML'den style etiketlerini kaldır
        this.htmlContent = this.htmlContent.replace(styleRegex, '');
    }

    extractJavaScript() {
        // <script> etiketleri arasındaki JS'i çıkar (external script'ler hariç)
        const scriptRegex = /<script(?![^>]*src[^>]*>)[^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        let jsContent = '';

        while ((match = scriptRegex.exec(this.htmlContent)) !== null) {
            if (match[1].trim()) {
                jsContent += match[1] + '\n\n';
            }
        }

        this.extractedJS = jsContent.trim();

        // HTML'den inline script etiketlerini kaldır
        this.htmlContent = this.htmlContent.replace(scriptRegex, '');
    }

    cleanHTML() {
        // Gereksiz boşlukları temizle
        this.htmlContent = this.htmlContent
            .replace(/\n\s*\n\s*\n/g, '\n\n') // Çoklu boş satırları tek boş satıra indir
            .replace(/^\s+/gm, (match) => {
                // Satır başı boşluklarını kontrol et ve düzenle
                const spaces = match.length;
                return spaces > 0 ? ' '.repeat(Math.min(spaces, 4)) : '';
            });

        // CSS ve JS bağlantılarını head'e ekle
        const headCloseIndex = this.htmlContent.indexOf('</head>');
        if (headCloseIndex !== -1) {
            const cssLink = '    <link rel="stylesheet" href="./src/css/styles.css">\n';
            const jsScript = '    <script src="./src/js/app.js" defer></script>\n';

            this.htmlContent =
                this.htmlContent.slice(0, headCloseIndex) +
                cssLink +
                jsScript +
                this.htmlContent.slice(headCloseIndex);
        }
    }

    saveFiles() {
        // Ana HTML dosyasını kaydet
        fs.writeFileSync('./index.html', this.htmlContent, 'utf-8');

        // CSS dosyasını kaydet
        if (this.extractedCSS) {
            fs.writeFileSync(path.join(this.cssDir, 'styles.css'), this.extractedCSS, 'utf-8');
        }

        // JavaScript dosyasını kaydet
        if (this.extractedJS) {
            fs.writeFileSync(path.join(this.jsDir, 'app.js'), this.extractedJS, 'utf-8');
        }

        // Backup oluştur
        const backupName = `index_backup_${Date.now()}.html`;
        fs.copyFileSync(this.inputFile, backupName);
        console.log(`📂 Orijinal dosya yedeklendi: ${backupName}`);
    }

    printSummary() {
        const cssSize = this.extractedCSS ? (this.extractedCSS.length / 1024).toFixed(2) : '0';
        const jsSize = this.extractedJS ? (this.extractedJS.length / 1024).toFixed(2) : '0';
        const htmlSize = (this.htmlContent.length / 1024).toFixed(2);

        console.log('\n📊 Özet:');
        console.log('═'.repeat(40));
        console.log(`📝 HTML: ${htmlSize} KB → ./index.html`);
        console.log(`🎨 CSS:  ${cssSize} KB → ./src/css/styles.css`);
        console.log(`⚡ JS:   ${jsSize} KB → ./src/js/app.js`);
        console.log('═'.repeat(40));
        console.log('\n🚀 Yapılacaklar:');
        console.log('1. Yeni index.html dosyasını kontrol edin');
        console.log('2. CSS ve JS dosyalarının doğru çalıştığını test edin');
        console.log('3. Gerekirse ek optimizasyonlar yapın');
    }

    // Güvenli test fonksiyonu
    async testSplit() {
        console.log('🧪 Test modu - dosyalar kaydedilmeyecek...');

        this.htmlContent = fs.readFileSync(this.inputFile, 'utf-8');
        this.extractCSS();
        this.extractJavaScript();

        console.log(`📊 Bulunan CSS: ${(this.extractedCSS.length / 1024).toFixed(2)} KB`);
        console.log(`📊 Bulunan JS: ${(this.extractedJS.length / 1024).toFixed(2)} KB`);
        console.log(`📊 Temizlenmiş HTML: ${(this.htmlContent.length / 1024).toFixed(2)} KB`);

        return {
            cssSize: this.extractedCSS.length,
            jsSize: this.extractedJS.length,
            htmlSize: this.htmlContent.length
        };
    }
}

// Kullanım örneği
async function main() {
    const splitter = new HTMLSplitter('./index.html');

    // Test modunda çalıştır
    if (process.argv.includes('--test')) {
        await splitter.testSplit();
        return;
    }

    // Gerçek bölme işlemi
    if (process.argv.includes('--split')) {
        await splitter.splitHTML();
        return;
    }

    console.log('Kullanım:');
    console.log('  node split-html.js --test   # Test et (dosya oluşturmaz)');
    console.log('  node split-html.js --split  # Gerçek bölme işlemi');
}

// Eğer direkt çalıştırılıyorsa
if (require.main === module) {
    main();
}

module.exports = HTMLSplitter;