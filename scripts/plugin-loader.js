class PluginLoader {
    constructor() {
        this.loadedPlugins = new Map();
        this.pluginQueue = [];
        this.isLoading = false;
    }

    // Загрузка Monaco Editor
    async loadMonaco() {
        if (this.loadedPlugins.has('monaco')) {
            return this.loadedPlugins.get('monaco');
        }

        return new Promise((resolve, reject) => {
            if (window.monaco) {
                resolve(window.monaco);
                return;
            }

            // Конфигурация Monaco
            require.config({ 
                paths: { 
                    'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.33.0/min/vs' 
                } 
            });

            require(['vs/editor/editor.main'], () => {
                this.loadedPlugins.set('monaco', window.monaco);
                resolve(window.monaco);
            }, (error) => {
                reject(new Error(`Ошибка загрузки Monaco: ${error}`));
            });
        });
    }

    // Загрузка Editor.js
    async loadEditorJS() {
        if (this.loadedPlugins.has('editorjs')) {
            return this.loadedPlugins.get('editorjs');
        }

        if (!window.EditorJS) {
            throw new Error('Editor.js не загружен');
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
                image: {
                    class: ImageTool
                },
                warning: {
                    class: Warning
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
    }

    // Загрузка Toast UI Editor
    async loadToastUI() {
        if (this.loadedPlugins.has('toastui')) {
            return this.loadedPlugins.get('toastui');
        }

        if (!window.toastui) {
            throw new Error('Toast UI Editor не загружен');
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
    }

    // Загрузка дополнительных библиотек
    async loadHighlightJS() {
        if (this.loadedPlugins.has('highlight')) {
            return;
        }

        return new Promise((resolve) => {
            if (window.hljs) {
                this.loadedPlugins.set('highlight', window.hljs);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js';
            script.onload = () => {
                this.loadedPlugins.set('highlight', window.hljs);
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    async loadMarked() {
        if (this.loadedPlugins.has('marked')) {
            return;
        }

        return new Promise((resolve) => {
            if (window.marked) {
                this.loadedPlugins.set('marked', window.marked);
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js';
            script.onload = () => {
                this.loadedPlugins.set('marked', window.marked);
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    // Основной метод загрузки всех плагинов
    async loadAll() {
        const loaders = [
            this.loadMarked(),
            this.loadHighlightJS(),
            this.loadMonaco(),
            this.loadToastUI(),
            this.loadEditorJS()
        ];

        try {
            await Promise.all(loaders);
            console.log('Все плагины загружены');
            return true;
        } catch (error) {
            console.error('Ошибка загрузки плагинов:', error);
            return false;
        }
    }

    // Получение загруженного плагина
    getPlugin(name) {
        return this.loadedPlugins.get(name);
    }

    // Проверка загружен ли плагин
    isLoaded(name) {
        return this.loadedPlugins.has(name);
    }

    // Очистка плагинов
    destroy() {
        this.loadedPlugins.forEach((plugin, name) => {
            if (plugin.destroy) {
                plugin.destroy();
            }
        });
        this.loadedPlugins.clear();
    }
}
