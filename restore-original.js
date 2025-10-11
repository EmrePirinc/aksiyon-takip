const fs = require('fs');

class OriginalRestorer {
    constructor() {
        this.originalFile = './index 27.09.2025 Bölümlendirme yapılmadan.html';
        this.targetFile = './index.html';
    }

    async restore() {
        try {
            console.log('📄 Orijinal dosya okunuyor...');

            if (!fs.existsSync(this.originalFile)) {
                console.error('❌ Orijinal dosya bulunamadı:', this.originalFile);
                return;
            }

            const originalContent = fs.readFileSync(this.originalFile, 'utf-8');

            console.log('🎨 CSS ayıklanıyor...');
            const cssContent = this.extractCSS(originalContent);

            console.log('⚡ JavaScript ayıklanıyor...');
            const jsContent = this.extractJS(originalContent);

            console.log('📝 HTML temizleniyor...');
            const cleanHTML = this.createModernHTML(originalContent);

            console.log('💾 Dosyalar kaydediliyor...');

            // CSS dosyasını kaydet
            if (cssContent.trim()) {
                fs.writeFileSync('src/styles/main.css', cssContent, 'utf-8');
                console.log(`✅ CSS kaydedildi: ${(cssContent.length / 1024).toFixed(2)} KB`);
            }

            // JS dosyasını kaydet
            if (jsContent.trim()) {
                fs.writeFileSync('src/app.js', jsContent, 'utf-8');
                console.log(`✅ JS kaydedildi: ${(jsContent.length / 1024).toFixed(2)} KB`);
            }

            // Modern HTML'i kaydet
            fs.writeFileSync(this.targetFile, cleanHTML, 'utf-8');
            console.log(`✅ HTML güncellendi: ${(cleanHTML.length / 1024).toFixed(2)} KB`);

            console.log('\n🎉 Orijinal dosya başarıyla geri yüklendi ve modern yapıya dönüştürüldü!');

        } catch (error) {
            console.error('❌ Hata oluştu:', error.message);
        }
    }

    extractCSS(content) {
        const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let match;
        let cssContent = '';

        while ((match = styleRegex.exec(content)) !== null) {
            cssContent += match[1] + '\n\n';
        }

        return cssContent.trim();
    }

    extractJS(content) {
        const scriptRegex = /<script(?![^>]*src[^>]*>)[^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        let jsContent = '';

        while ((match = scriptRegex.exec(content)) !== null) {
            if (match[1].trim()) {
                jsContent += match[1] + '\n\n';
            }
        }

        return jsContent.trim();
    }

    createModernHTML(content) {
        // Style ve script etiketlerini kaldır
        let cleanHTML = content
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<script(?![^>]*src[^>]*>)[^>]*>[\s\S]*?<\/script>/gi, '');

        // Head'e modern linkler ekle
        const headCloseIndex = cleanHTML.indexOf('</head>');
        if (headCloseIndex !== -1) {
            const modernLinks = `
    <!-- Main Styles -->
    <link rel="stylesheet" href="src/styles/main.css">

    <!-- Main App Script -->
    <script src="src/app.js" defer></script>
`;

            cleanHTML =
                cleanHTML.slice(0, headCloseIndex) +
                modernLinks +
                cleanHTML.slice(headCloseIndex);
        }

        return cleanHTML;
    }
}

async function main() {
    const restorer = new OriginalRestorer();
    await restorer.restore();
}

if (require.main === module) {
    main();
}

module.exports = OriginalRestorer;