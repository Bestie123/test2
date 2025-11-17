// scripts/plugin-loader.js
class PluginLoader {
    constructor() {
        this.loadedPlugins = new Map();
        this.failedPlugins = new Set();
        this.loadAttempts = new Map();
    }

    // Загрузка Monaco Editor с резервными источниками
    async loadMonaco() {
        if (this.loadedPlugins.has('monaco')) {
            return this.loadedPlugins.get('monaco');
        }

        if (this.failedPlugins.has('monaco')) {
            throw new Error('Monaco ранее не удалось загрузить');
        }

        const attempts = this.loadAttempts.get('monaco') || 0;
        if (attempts >= 2) {
            this.failedPlugins.add('monaco');
            throw new Error('Превышено количество попыток загрузки Monaco');
        }

        this.loadAttempts.set('monaco', attempts + 1);

        return new Promise((resolve, reject) => {
            if (window.monaco) {
                this.loadedPlugins.set('monaco', window.monaco);
                resolve(window.monaco);
                return;
            }

            // Основной CDN
            const primaryCDN = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs';
            // Резервный CDN
            const backupCDN = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/min/vs';
            
            const tryLoad = (cdnUrl) => {
                const script = document.createElement('script');
                script.src = `${cdnUrl}/loader.js`;
                
                script.onload = () => {
                    require.config({ 
                        paths: { 'vs': cdnUrl },
                        waitSeconds: 10
                    });
                    
                    require(['vs/editor/editor.main'], () => {
                        console.log(`Monaco loaded from: ${cdnUrl}`);
                        this.loadedPlugins.set('monaco', window.monaco);
                        resolve(window.monaco);
                    }, (error) => {
                        console.warn(`Failed to load Monaco from ${cdnUrl}:`, error);
                        reject(error);
                    });
                };
                
                script.onerror = () => {
                    reject(new Error(`Failed to load Monaco loader from ${cdnUrl}`));
                };
                
                document.head.appendChild(script);
            };

            // Пытаемся загрузить с основного CDN, затем с резервного
            tryLoad(primaryCDN).catch(() => {
                console.log('Trying backup CDN for Monaco...');
                tryLoad(backupCDN);
            });
        });
    }

    // Загрузка Editor.js с резервными источниками
    async loadEditorJS() {
        if (this.loadedPlugins.has('editorjs')) {
            return this.loadedPlugins.get('editorjs');
        }

        if (this.failedPlugins.has('editorjs')) {
            throw new Error('Editor.js ранее не удалось загрузить');
        }

        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };

        const loadStylesheet = (href) => {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = resolve;
                link.onerror = resolve; // Не блокируем загрузку если CSS не загрузился
                document.head.appendChild(link);
            });
        };

        try {
            // Основной CDN
            const primaryBase = 'https://cdn.jsdelivr.net/npm';
            const backupBase = 'https://unpkg.com';

            const cdnBase = await this.testCDN(primaryBase) ? primaryBase : backupBase;
            console.log(`Using CDN for Editor.js: ${cdnBase}`);

            // Загружаем основные плагины
            await Promise.all([
                loadStylesheet(`${cdnBase}/@editorjs/editorjs@latest/dist/editor.css`),
                loadScript(`${cdnBase}/@editorjs/editorjs@latest`),
                loadScript(`${cdnBase}/@editorjs/header@latest`),
                loadScript(`${cdnBase}/@editorjs/list@latest`),
                loadScript(`${cdnBase}/@editorjs/code@latest`),
                loadScript(`${cdnBase}/@editorjs/embed@latest`),
                loadScript(`${cdnBase}/@editorjs/table@latest`),
                loadScript(`${cdnBase}/@editorjs/marker@latest`),
                loadScript(`${cdnBase}/@editorjs/inline-code@latest`)
            ]);

            if (!window.EditorJS) {
                throw new Error('Editor.js не загрузился');
            }

            const editor = new EditorJS({
                holder: 'editorjs-container',
                tools: {
                    header: {
                        class: Header,
                        inlineToolbar: true
                    },
                    list: {
                        class: List,
                        inlineToolbar: true
                    },
                    code: {
                        class: CodeTool
                    },
                    embed: {
                        class: Embed
                    },
                    table: {
                        class: Table
                    },
                    marker: {
                        class: Marker
                    },
                    inlineCode: {
                        class: InlineCode
                    }
                },
                onReady: () => {
                    console.log('Editor.js готов');
                }
            });

            this.loadedPlugins.set('editorjs', editor);
            return editor;

        } catch (error) {
            console.error('Ошибка загрузки Editor.js:', error);
            this.failedPlugins.add('editorjs');
            throw error;
        }
    }

    // Загрузка Toast UI Editor
    async loadToastUI() {
        if (this.loadedPlugins.has('toastui')) {
            return this.loadedPlugins.get('toastui');
        }

        if (this.failedPlugins.has('toastui')) {
            throw new Error('Toast UI ранее не удалось загрузить');
        }

        try {
            // Загружаем CSS
            await this.loadCSS('https://uicdn.toast.com/editor/latest/toastui-editor.min.css');
            
            // Загружаем JS
            await this.loadScript('https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js');

            if (!window.toastui) {
                throw new Error('Toast UI Editor не загрузился');
            }

            const editor = new toastui.Editor({
                el: document.getElementById('toastui-editor'),
                height: '100%',
                initialEditType: 'markdown',
                previewStyle: 'vertical',
                usageStatistics: false,
                hideModeSwitch: false,
                toolbarItems: [
                    ['heading', 'bold', 'italic', 'strike'],
                    ['hr', 'quote'],
                    ['ul', 'ol', 'task', 'indent', 'outdent'],
                    ['table', 'image', 'link'],
                    ['code', 'codeblock'],
                    ['scrollSync']
                ]
            });

            this.loadedPlugins.set('toastui', editor);
            return editor;

        } catch (error) {
            console.error('Ошибка загрузки Toast UI:', error);
            this.failedPlugins.add('toastui');
            throw error;
        }
    }

    // Улучшенная загрузка дополнительных библиотек
    async loadHighlightJS() {
        if (this.loadedPlugins.has('highlight')) return;

        try {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js');
            this.loadedPlugins.set('highlight', window.hljs);
        } catch (error) {
            console.warn('Highlight.js не загружен, код не будет подсвечиваться');
        }
    }

    async loadMarked() {
        if (this.loadedPlugins.has('marked')) return;

        try {
            await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js');
            this.loadedPlugins.set('marked', window.marked);
        } catch (error) {
            console.warn('Marked не загружен, используем простой парсер');
            // Создаем простой парсер как fallback
            window.marked = {
                parse: (text) => text
                    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
                    .replace(/\*(.*)\*/gim, '<em>$1</em>')
                    .replace(/`(.*)`/gim, '<code>$1</code>')
                    .replace(/\n/gim, '<br>')
            };
            this.loadedPlugins.set('marked', window.marked);
        }
    }

    // Вспомогательные методы
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadCSS(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = resolve; // Не блокируем загрузку если CSS не загрузился
            document.head.appendChild(link);
        });
    }

    async testCDN(url) {
        try {
            const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            return true;
        } catch (error) {
            return false;
        }
    }

    // Основной метод загрузки с улучшенной обработкой ошибок
    async loadAll() {
        const essentialPlugins = [
            { name: 'marked', loader: () => this.loadMarked(), required: true },
            { name: 'toastui', loader: () => this.loadToastUI(), required: true }
        ];

        const optionalPlugins = [
            { name: 'highlight', loader: () => this.loadHighlightJS(), required: false },
            { name: 'monaco', loader: () => this.loadMonaco(), required: false },
            { name: 'editorjs', loader: () => this.loadEditorJS(), required: false }
        ];

        console.log('Начинаем загрузку плагинов...');

        // Загружаем обязательные плагины
        for (const plugin of essentialPlugins) {
            try {
                await plugin.loader();
                console.log(`✅ ${plugin.name} загружен`);
            } catch (error) {
                console.error(`❌ Ошибка загрузки ${plugin.name}:`, error);
                if (plugin.required) {
                    throw new Error(`Обязательный плагин ${plugin.name} не загружен: ${error.message}`);
                }
            }
        }

        // Загружаем опциональные плагины (не блокируем основную загрузку)
        const optionalLoads = optionalPlugins.map(async (plugin) => {
            try {
                await plugin.loader();
                console.log(`✅ ${plugin.name} загружен`);
                return { name: plugin.name, status: 'loaded' };
            } catch (error) {
                console.warn(`⚠️ ${plugin.name} не загружен:`, error.message);
                return { name: plugin.name, status: 'failed', error };
            }
        });

        await Promise.allSettled(optionalLoads);

        // Проверяем что хотя бы один редактор загрузился
        const loadedEditors = Array.from(this.loadedPlugins.keys()).filter(key => 
            ['toastui', 'monaco', 'editorjs'].includes(key)
        );

        if (loadedEditors.length === 0) {
            throw new Error('Ни один редактор не удалось загрузить');
        }

        console.log('Загруженные редакторы:', loadedEditors);
        return true;
    }

    getPlugin(name) {
        return this.loadedPlugins.get(name);
    }

    isLoaded(name) {
        return this.loadedPlugins.has(name);
    }

    getFailedPlugins() {
        return Array.from(this.failedPlugins);
    }

    destroy() {
        this.loadedPlugins.forEach((plugin, name) => {
            if (plugin.destroy) {
                plugin.destroy();
            }
        });
        this.loadedPlugins.clear();
        this.failedPlugins.clear();
    }
}
