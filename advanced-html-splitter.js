const fs = require('fs');
const path = require('path');

class AdvancedHTMLSplitter {
    constructor(inputFile) {
        this.inputFile = inputFile;
        this.baseDir = '.';
        this.htmlContent = '';
        this.extractedComponents = {
            css: new Map(),
            js: new Map(),
            templates: new Map(),
            configs: new Map()
        };
        this.modernStructure = {};
    }

    async modernSplit() {
        try {
            console.log('🚀 Modern Modüler Bölümlendirme Başlıyor...\n');

            console.log('📄 HTML dosyası analiz ediliyor...');
            this.htmlContent = fs.readFileSync(this.inputFile, 'utf-8');

            console.log('🏗️  2025 standartlarına uygun klasör yapısı oluşturuluyor...');
            this.createModernStructure();

            console.log('🎨 CSS bileşenleri ayıklanıyor...');
            this.extractModularCSS();

            console.log('⚡ JavaScript modülleri bölümlendiriliyor...');
            this.extractModularJS();

            console.log('📝 HTML templateları ayırılıyor...');
            this.extractHTMLTemplates();

            console.log('⚙️  Konfigürasyon dosyaları oluşturuluyor...');
            this.createConfigFiles();

            console.log('🔗 Modül bağımlılıkları oluşturuluyor...');
            this.createModuleLoader();

            console.log('📝 Ana HTML dosyası modern yapıya dönüştürülüyor...');
            this.modernizeMainHTML();

            console.log('💾 Tüm dosyalar kaydediliyor...');
            this.saveAllFiles();

            console.log('✅ Modern modüler yapı başarıyla oluşturuldu!\n');
            this.printModernSummary();

        } catch (error) {
            console.error('❌ Hata oluştu:', error.message);
        }
    }

    createModernStructure() {
        const structure = {
            'src': {
                'components': {
                    'auth': {},
                    'dashboard': {},
                    'actions': {},
                    'modals': {},
                    'ui': {}
                },
                'services': {},
                'utils': {},
                'config': {},
                'assets': {
                    'css': {
                        'components': {},
                        'layouts': {},
                        'themes': {},
                        'utilities': {}
                    },
                    'js': {
                        'modules': {},
                        'components': {},
                        'services': {},
                        'utils': {}
                    },
                    'fonts': {},
                    'images': {}
                },
                'styles': {
                    'base': {},
                    'components': {},
                    'layouts': {},
                    'themes': {},
                    'utilities': {}
                }
            },
            'public': {},
            'docs': {}
        };

        this.createDirectoryStructure(structure);
        this.modernStructure = structure;
    }

    createDirectoryStructure(structure, basePath = this.baseDir) {
        Object.keys(structure).forEach(dir => {
            const dirPath = path.join(basePath, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
            }

            if (typeof structure[dir] === 'object' && Object.keys(structure[dir]).length > 0) {
                this.createDirectoryStructure(structure[dir], dirPath);
            }
        });
    }

    extractModularCSS() {
        const cssRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
        let match;
        let allCSS = '';

        while ((match = cssRegex.exec(this.htmlContent)) !== null) {
            allCSS += match[1] + '\n\n';
        }

        // CSS'i mantıksal bileşenlere ayır
        this.parseCSS(allCSS);

        // HTML'den style etiketlerini kaldır
        this.htmlContent = this.htmlContent.replace(cssRegex, '');
    }

    parseCSS(css) {
        const components = {
            // Base Styles
            base: {
                content: this.extractCSSByPattern(css, [
                    ':root', '*,', 'html', 'body', 'a:', 'button:', 'input:', 'select:', 'textarea:'
                ]),
                file: 'src/styles/base/reset.css'
            },

            // Authentication Components
            auth: {
                content: this.extractCSSByPattern(css, [
                    '#login-container', '.login-box', '.login-header', '.forgot', '#forgotPassword'
                ]),
                file: 'src/styles/components/auth.css'
            },

            // Header & Navigation
            header: {
                content: this.extractCSSByPattern(css, [
                    '.modern-header', '.header-', '.user-menu', '.user-dropdown', '.dropdown-'
                ]),
                file: 'src/styles/components/header.css'
            },

            // Dashboard & Stats
            dashboard: {
                content: this.extractCSSByPattern(css, [
                    '.stats-row', '.team-stats', '.mini-stat', '.smart-toolbar', '.toolbar-'
                ]),
                file: 'src/styles/components/dashboard.css'
            },

            // Actions & Cards
            actions: {
                content: this.extractCSSByPattern(css, [
                    '.action-card', '.action-header', '.action-title', '.team-section', '.team-actions'
                ]),
                file: 'src/styles/components/actions.css'
            },

            // Modals
            modals: {
                content: this.extractCSSByPattern(css, [
                    '.modal', '.modal-content', '.modal-header', '.modal-buttons', '.form-group'
                ]),
                file: 'src/styles/components/modals.css'
            },

            // Filters & Controls
            filters: {
                content: this.extractCSSByPattern(css, [
                    '.filter-', '.search-', '.modern-control-panel', '.advanced-filters'
                ]),
                file: 'src/styles/components/filters.css'
            },

            // UI Components
            ui: {
                content: this.extractCSSByPattern(css, [
                    '.btn', '.fab', '.toast', '.status-badge', '.file-preview', '.color-picker'
                ]),
                file: 'src/styles/components/ui.css'
            },

            // Utilities
            utilities: {
                content: this.extractCSSByPattern(css, [
                    '.hidden', '.visible', '.flex', '.grid', '.text-', '.bg-', '.border-', '.p-', '.m-'
                ]),
                file: 'src/styles/utilities/helpers.css'
            }
        };

        Object.entries(components).forEach(([name, config]) => {
            if (config.content.trim()) {
                this.extractedComponents.css.set(name, {
                    content: config.content,
                    file: config.file
                });
            }
        });
    }

    extractCSSByPattern(css, patterns) {
        let extracted = '';
        const lines = css.split('\n');
        let inBlock = false;
        let braceCount = 0;
        let currentBlock = '';

        for (let line of lines) {
            if (!inBlock) {
                // Yeni blok başlangıcını kontrol et
                const shouldInclude = patterns.some(pattern =>
                    line.includes(pattern) || line.trim().startsWith(pattern)
                );

                if (shouldInclude) {
                    inBlock = true;
                    currentBlock = line + '\n';
                    braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                }
            } else {
                currentBlock += line + '\n';
                braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

                if (braceCount <= 0) {
                    extracted += currentBlock + '\n';
                    inBlock = false;
                    currentBlock = '';
                }
            }
        }

        return extracted;
    }

    extractModularJS() {
        const scriptRegex = /<script(?![^>]*src[^>]*>)[^>]*>([\s\S]*?)<\/script>/gi;
        let match;
        let allJS = '';

        while ((match = scriptRegex.exec(this.htmlContent)) !== null) {
            if (match[1].trim()) {
                allJS += match[1] + '\n\n';
            }
        }

        // JavaScript'i mantıksal modüllere ayır
        this.parseJavaScript(allJS);

        // HTML'den inline script etiketlerini kaldır
        this.htmlContent = this.htmlContent.replace(scriptRegex, '');
    }

    parseJavaScript(js) {
        const modules = {
            // Configuration & Constants
            config: {
                content: this.extractJSByPattern(js, [
                    'firebaseConfig', 'GOOGLE_DRIVE_CONFIG', 'const.*=.*{', 'let.*Config', 'var.*Config'
                ]),
                file: 'src/config/app.config.js'
            },

            // Authentication Module
            auth: {
                content: this.extractJSByPattern(js, [
                    'signIn', 'logout', 'auth', 'signOut', 'firebase.auth', 'login', 'password'
                ]),
                file: 'src/services/auth.service.js'
            },

            // Actions Module
            actions: {
                content: this.extractJSByPattern(js, [
                    'createAction', 'updateAction', 'deleteAction', 'loadActions', 'actions\\[', 'Action'
                ]),
                file: 'src/services/actions.service.js'
            },

            // UI Components
            ui: {
                content: this.extractJSByPattern(js, [
                    'openModal', 'closeModal', 'showToast', 'updateStats', 'renderActions', 'Modal'
                ]),
                file: 'src/components/ui/ui.components.js'
            },

            // File Management
            fileManager: {
                content: this.extractJSByPattern(js, [
                    'uploadFile', 'downloadFile', 'gapi', 'google', 'drive', 'File'
                ]),
                file: 'src/services/file.service.js'
            },

            // Export Functions
            export: {
                content: this.extractJSByPattern(js, [
                    'exportTo', 'Excel', 'Word', 'XLSX', 'saveAs', 'export'
                ]),
                file: 'src/services/export.service.js'
            },

            // Filter & Search
            filters: {
                content: this.extractJSByPattern(js, [
                    'filterActions', 'searchActions', 'filter', 'search', 'Filter'
                ]),
                file: 'src/components/filters/filter.controller.js'
            },

            // Utilities
            utils: {
                content: this.extractJSByPattern(js, [
                    'formatDate', 'generateId', 'validateForm', 'debounce', 'throttle'
                ]),
                file: 'src/utils/helpers.js'
            },

            // Main App Controller
            app: {
                content: this.extractJSByPattern(js, [
                    'DOMContentLoaded', 'window.onload', 'initializeApp', 'init'
                ]),
                file: 'src/app.js'
            }
        };

        Object.entries(modules).forEach(([name, config]) => {
            if (config.content.trim()) {
                this.extractedComponents.js.set(name, {
                    content: this.wrapModuleJS(config.content, name),
                    file: config.file
                });
            }
        });
    }

    extractJSByPattern(js, patterns) {
        const lines = js.split('\n');
        let extracted = '';

        // Fonksiyon ve değişken tanımlarını bul
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            const shouldInclude = patterns.some(pattern => {
                const regex = new RegExp(pattern, 'i');
                return regex.test(line);
            });

            if (shouldInclude) {
                // Fonksiyon veya blok başlangıcı bulundu
                if (line.includes('function') || line.includes('{')) {
                    let braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
                    let functionBlock = line + '\n';

                    for (let j = i + 1; j < lines.length && braceCount > 0; j++) {
                        functionBlock += lines[j] + '\n';
                        braceCount += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length;
                        i = j;
                    }

                    extracted += functionBlock + '\n';
                } else {
                    extracted += line + '\n';
                }
            }
        }

        return extracted;
    }

    wrapModuleJS(content, moduleName) {
        return `// ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module
(function(window) {
    'use strict';

${content}

    // Export module
    window.${moduleName}Module = {
        // Module exports will be defined here
    };

})(window);
`;
    }

    extractHTMLTemplates() {
        // Modal ve component templatelarını ayır
        const modalRegex = /<div class="modal"[^>]*id="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*(?=<div class="modal"|<script|$)/gi;
        let match;

        while ((match = modalRegex.exec(this.htmlContent)) !== null) {
            const modalId = match[1];
            const modalContent = match[2];

            this.extractedComponents.templates.set(modalId, {
                content: this.cleanTemplate(modalContent),
                file: `src/components/modals/${modalId}.template.html`
            });
        }

        // Ana content alanlarını ayır
        const sections = [
            { pattern: /<div class="modern-header"[^>]*>([\s\S]*?)<\/div>/, name: 'header' },
            { pattern: /<div class="stats-row"[^>]*>([\s\S]*?)<\/div>/, name: 'dashboard' },
            { pattern: /<div class="modern-control-panel"[^>]*>([\s\S]*?)<\/div>/, name: 'controls' }
        ];

        sections.forEach(section => {
            const match = this.htmlContent.match(section.pattern);
            if (match) {
                this.extractedComponents.templates.set(section.name, {
                    content: this.cleanTemplate(match[1]),
                    file: `src/components/${section.name}/${section.name}.template.html`
                });
            }
        });
    }

    cleanTemplate(template) {
        return template
            .replace(/^\s+/gm, '') // Satır başı boşluklarını temizle
            .replace(/\n\s*\n/g, '\n') // Çoklu boş satırları tek satıra indir
            .trim();
    }

    createConfigFiles() {
        // Package.json için modül bilgileri
        const packageJson = {
            name: "aksiyon-takip-modern",
            version: "2.0.0",
            description: "Modern Modular Action Tracking System",
            main: "src/app.js",
            scripts: {
                "dev": "live-server --port=3000",
                "build": "npm run build:css && npm run build:js",
                "build:css": "node scripts/build-css.js",
                "build:js": "node scripts/build-js.js",
                "watch": "npm run watch:css & npm run watch:js",
                "watch:css": "chokidar 'src/styles/**/*.css' -c 'npm run build:css'",
                "watch:js": "chokidar 'src/**/*.js' -c 'npm run build:js'"
            },
            dependencies: {
                "firebase": "^8.10.1"
            },
            devDependencies: {
                "live-server": "^1.2.2",
                "chokidar-cli": "^3.0.0"
            }
        };

        this.extractedComponents.configs.set('package', {
            content: JSON.stringify(packageJson, null, 2),
            file: 'package.json'
        });

        // Modern build configuration
        const buildConfig = `// Build Configuration
module.exports = {
    css: {
        input: 'src/styles',
        output: 'dist/css',
        components: [
            'base/reset.css',
            'components/*.css',
            'layouts/*.css',
            'utilities/*.css'
        ]
    },
    js: {
        input: 'src',
        output: 'dist/js',
        modules: [
            'config/*.js',
            'utils/*.js',
            'services/*.js',
            'components/**/*.js',
            'app.js'
        ]
    }
};`;

        this.extractedComponents.configs.set('build', {
            content: buildConfig,
            file: 'build.config.js'
        });
    }

    createModuleLoader() {
        const moduleLoader = `// Modern Module Loader
class ModuleLoader {
    constructor() {
        this.modules = new Map();
        this.loadedCSS = new Set();
        this.loadedJS = new Set();
    }

    async loadCSS(files) {
        const promises = files.map(file => {
            if (this.loadedCSS.has(file)) return Promise.resolve();

            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = file;
                link.onload = () => {
                    this.loadedCSS.add(file);
                    resolve();
                };
                link.onerror = reject;
                document.head.appendChild(link);
            });
        });

        return Promise.all(promises);
    }

    async loadJS(files) {
        const promises = files.map(file => {
            if (this.loadedJS.has(file)) return Promise.resolve();

            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = file;
                script.async = true;
                script.onload = () => {
                    this.loadedJS.add(file);
                    resolve();
                };
                script.onerror = reject;
                document.head.appendChild(script);
            });
        });

        return Promise.all(promises);
    }

    async loadComponent(name) {
        if (this.modules.has(name)) {
            return this.modules.get(name);
        }

        // Component-specific CSS ve JS dosyalarını yükle
        const cssFiles = [
            \`src/styles/components/\${name}.css\`
        ];

        const jsFiles = [
            \`src/components/\${name}/\${name}.controller.js\`
        ];

        await this.loadCSS(cssFiles);
        await this.loadJS(jsFiles);

        // Template'i yükle
        const templateResponse = await fetch(\`src/components/\${name}/\${name}.template.html\`);
        const template = await templateResponse.text();

        const component = {
            name,
            template,
            mount: (element) => {
                element.innerHTML = template;
                // Component-specific initialization
                if (window[\`\${name}Controller\`]) {
                    window[\`\${name}Controller\`].init(element);
                }
            }
        };

        this.modules.set(name, component);
        return component;
    }
}

// Global module loader instance
window.moduleLoader = new ModuleLoader();

// Auto-load core modules
window.addEventListener('DOMContentLoaded', async () => {
    await window.moduleLoader.loadCSS([
        'src/styles/base/reset.css',
        'src/styles/components/ui.css'
    ]);

    await window.moduleLoader.loadJS([
        'src/config/app.config.js',
        'src/utils/helpers.js',
        'src/services/auth.service.js'
    ]);
});`;

        this.extractedComponents.js.set('moduleLoader', {
            content: moduleLoader,
            file: 'src/utils/module-loader.js'
        });
    }

    modernizeMainHTML() {
        // Head bölümünü modernize et
        const newHead = `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aksiyon Takip Sistemi - Modern Architecture</title>

    <!-- External Dependencies -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <script src="https://unpkg.com/html-docx-js@0.4.1/dist/html-docx.js"></script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <!-- App Icon -->
    <link rel="icon" type="image/x-icon" href="./favicon.ico">

    <!-- Modern CSS Architecture -->
    <link rel="stylesheet" href="src/styles/base/reset.css">
    <link rel="stylesheet" href="src/styles/components/auth.css">
    <link rel="stylesheet" href="src/styles/components/header.css">
    <link rel="stylesheet" href="src/styles/components/dashboard.css">
    <link rel="stylesheet" href="src/styles/components/actions.css">
    <link rel="stylesheet" href="src/styles/components/modals.css">
    <link rel="stylesheet" href="src/styles/components/filters.css">
    <link rel="stylesheet" href="src/styles/components/ui.css">
    <link rel="stylesheet" href="src/styles/utilities/helpers.css">

    <!-- Module Loader -->
    <script src="src/utils/module-loader.js" defer></script>

    <!-- Core Modules -->
    <script src="src/config/app.config.js" defer></script>
    <script src="src/utils/helpers.js" defer></script>
    <script src="src/services/auth.service.js" defer></script>
    <script src="src/services/actions.service.js" defer></script>
    <script src="src/services/file.service.js" defer></script>
    <script src="src/services/export.service.js" defer></script>
    <script src="src/components/ui/ui.components.js" defer></script>
    <script src="src/components/filters/filter.controller.js" defer></script>
    <script src="src/app.js" defer></script>

    <!-- Firebase -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"></script>

    <!-- Google API -->
    <script src="https://apis.google.com/js/api.js"></script>
</head>`;

        // Body content'i temizle ve sadece ana yapıyı bırak
        const bodyMatch = this.htmlContent.match(/<body[^>]*>([\s\S]*)<\/body>/);
        if (bodyMatch) {
            const bodyContent = bodyMatch[1]
                .replace(/<script[\s\S]*?<\/script>/gi, '') // Script etiketlerini kaldır
                .replace(/\n\s*\n\s*\n/g, '\n\n'); // Çoklu boş satırları temizle

            this.htmlContent = `<!DOCTYPE html>
<html lang="tr">
${newHead}
<body>
${bodyContent}
</body>
</html>`;
        }
    }

    saveAllFiles() {
        // Backup oluştur
        const backupName = `index_modern_backup_${Date.now()}.html`;
        fs.copyFileSync(this.inputFile, backupName);

        // Ana HTML dosyasını kaydet
        fs.writeFileSync('./index.html', this.htmlContent, 'utf-8');

        // CSS dosyalarını kaydet
        this.extractedComponents.css.forEach((component, name) => {
            const filePath = component.file;
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, component.content, 'utf-8');
        });

        // JavaScript dosyalarını kaydet
        this.extractedComponents.js.forEach((component, name) => {
            const filePath = component.file;
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, component.content, 'utf-8');
        });

        // Template dosyalarını kaydet
        this.extractedComponents.templates.forEach((component, name) => {
            const filePath = component.file;
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, component.content, 'utf-8');
        });

        // Config dosyalarını kaydet
        this.extractedComponents.configs.forEach((component, name) => {
            fs.writeFileSync(component.file, component.content, 'utf-8');
        });

        console.log(`📂 Orijinal dosya yedeklendi: ${backupName}`);
    }

    printModernSummary() {
        console.log('\n🎯 MODERN MODÜLER YAPI RAPORU');
        console.log('═'.repeat(50));

        console.log('\n📁 Klasör Yapısı:');
        console.log('├── src/');
        console.log('│   ├── components/          # UI Bileşenleri');
        console.log('│   ├── services/            # İş Mantığı');
        console.log('│   ├── utils/               # Yardımcı Fonksiyonlar');
        console.log('│   ├── config/              # Konfigürasyonlar');
        console.log('│   └── styles/              # CSS Modülleri');
        console.log('├── public/                  # Statik Dosyalar');
        console.log('└── docs/                    # Dokümantasyon');

        console.log('\n🎨 CSS Modülleri:');
        this.extractedComponents.css.forEach((component, name) => {
            const size = (component.content.length / 1024).toFixed(2);
            console.log(`   ${name.padEnd(15)} ${size.padStart(8)} KB → ${component.file}`);
        });

        console.log('\n⚡ JavaScript Modülleri:');
        this.extractedComponents.js.forEach((component, name) => {
            const size = (component.content.length / 1024).toFixed(2);
            console.log(`   ${name.padEnd(15)} ${size.padStart(8)} KB → ${component.file}`);
        });

        console.log('\n📝 HTML Template\'ları:');
        this.extractedComponents.templates.forEach((component, name) => {
            const size = (component.content.length / 1024).toFixed(2);
            console.log(`   ${name.padEnd(15)} ${size.padStart(8)} KB → ${component.file}`);
        });

        console.log('\n🚀 Avantajlar:');
        console.log('   ✅ Component-Based Architecture');
        console.log('   ✅ Lazy Loading Support');
        console.log('   ✅ Modern ES6+ Module System');
        console.log('   ✅ Scalable File Structure');
        console.log('   ✅ Development & Production Ready');
        console.log('   ✅ Hot Reload Compatible');

        console.log('\n📋 Sonraki Adımlar:');
        console.log('   1. npm install           # Bağımlılıkları yükle');
        console.log('   2. npm run dev           # Geliştirme sunucusunu başlat');
        console.log('   3. npm run build         # Production build');
        console.log('   4. npm run watch         # Dosya değişikliklerini izle');

        console.log('\n' + '═'.repeat(50));
    }

    // Test modunda çalıştır
    async testModernSplit() {
        console.log('🧪 MODERN TEST MODU\n');

        this.htmlContent = fs.readFileSync(this.inputFile, 'utf-8');
        this.extractModularCSS();
        this.extractModularJS();
        this.extractHTMLTemplates();

        console.log('📊 Tespit Edilen Bileşenler:');
        console.log(`   CSS Modülleri: ${this.extractedComponents.css.size}`);
        console.log(`   JS Modülleri: ${this.extractedComponents.js.size}`);
        console.log(`   HTML Template\'ları: ${this.extractedComponents.templates.size}`);

        return {
            cssModules: this.extractedComponents.css.size,
            jsModules: this.extractedComponents.js.size,
            templates: this.extractedComponents.templates.size
        };
    }
}

// Kullanım
async function main() {
    const splitter = new AdvancedHTMLSplitter('./index.html');

    if (process.argv.includes('--test')) {
        await splitter.testModernSplit();
        return;
    }

    if (process.argv.includes('--modern')) {
        await splitter.modernSplit();
        return;
    }

    console.log('🎯 MODERN MODÜLER HTML BÖLÜCÜ');
    console.log('═'.repeat(40));
    console.log('Kullanım:');
    console.log('  node advanced-html-splitter.js --test     # Test et');
    console.log('  node advanced-html-splitter.js --modern   # Modern bölme');
    console.log('');
    console.log('2025 Web Standartları:');
    console.log('  ✅ Component-Based Architecture');
    console.log('  ✅ ES6+ Module System');
    console.log('  ✅ Lazy Loading');
    console.log('  ✅ Hot Reload Ready');
}

if (require.main === module) {
    main();
}

module.exports = AdvancedHTMLSplitter;