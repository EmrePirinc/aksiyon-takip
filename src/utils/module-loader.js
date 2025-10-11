// Modern Module Loader
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
            `src/styles/components/${name}.css`
        ];

        const jsFiles = [
            `src/components/${name}/${name}.controller.js`
        ];

        await this.loadCSS(cssFiles);
        await this.loadJS(jsFiles);

        // Template'i yükle
        const templateResponse = await fetch(`src/components/${name}/${name}.template.html`);
        const template = await templateResponse.text();

        const component = {
            name,
            template,
            mount: (element) => {
                element.innerHTML = template;
                // Component-specific initialization
                if (window[`${name}Controller`]) {
                    window[`${name}Controller`].init(element);
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
});