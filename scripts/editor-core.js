// scripts/editor-core.js
class EditorCore {
    constructor() {
        this.converter = new FormatConverter();
        this.pluginLoader = new PluginLoader();
        this.modeManager = null;
        
        this.editors = {
            toastui: null,
            monaco: null,
            editorjs: null
        };
        
        this.availableModes = new Set(['markdown', 'wysiwyg']); // По умолчанию только базовые режимы
        this.currentContent = '';
        this.currentFormat = 'markdown';
        this.isInitialized = false;
        
        this.setupCore();
    }

    async setupCore() {
        try {
            this.showLoading();
            
            const success = await this.pluginLoader.loadAll();
            if (!success) {
                throw new Error('Не удалось загрузить необходимые плагины');
            }
            
            await this.initializeEditors();
            this.updateAvailableModes();
            
            this.modeManager = new ModeManager(this);
            this.setupEventHandlers();
            
            this.hideLoading();
            this.isInitialized = true;
            
            console.log('EditorCore инициализирован. Доступные режимы:', Array.from(this.availableModes));
            
            this.loadInitialContent();
            
        } catch (error) {
            console.error('Ошибка инициализации EditorCore:', error);
            this.showError('Не удалось инициализировать редактор: ' + error.message);
            this.showFallbackEditor();
        }
    }

    async initializeEditors() {
        // Toast UI Editor (обязательный)
        try {
            this.editors.toastui = await this.pluginLoader.loadToastUI();
            console.log('Toast UI Editor инициализирован');
        } catch (error) {
            console.error('Не удалось инициализировать Toast UI Editor:', error);
            throw new Error('Не удалось загрузить основной редактор');
        }

        // Monaco Editor (опциональный)
        if (this.pluginLoader.isLoaded('monaco')) {
            try {
                await this.initializeMonaco();
                this.availableModes.add('code');
                this.availableModes.add('split');
                console.log('Monaco Editor инициализирован');
            } catch (error) {
                console.warn('Не удалось инициализировать Monaco Editor:', error);
            }
        }

        // Editor.js (опциональный)
        if (this.pluginLoader.isLoaded('editorjs')) {
            try {
                this.editors.editorjs = await this.pluginLoader.loadEditorJS();
                this.availableModes.add('blocks');
                console.log('Editor.js инициализирован');
            } catch (error) {
                console.warn('Не удалось инициализировать Editor.js:', error);
            }
        }
    }

    updateAvailableModes() {
        // Обновляем UI чтобы показать только доступные режимы
        document.querySelectorAll('.mode-btn').forEach(btn => {
            const mode = btn.dataset.mode;
            if (!this.availableModes.has(mode) && mode !== 'markdown' && mode !== 'wysiwyg') {
                btn.style.display = 'none';
            }
        });
    }

    showFallbackEditor() {
        const container = document.querySelector('.editor-container');
        if (!container) return;

        container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3>⚠️ Не удалось загрузить расширенный редактор</h3>
                <p>Используется упрощенная версия редактора</p>
                <textarea id="fallback-editor" 
                          style="width: 100%; height: 400px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace;"
                          placeholder="Начните писать ваш Markdown здесь..."></textarea>
                <div style="margin-top: 15px;">
                    <button onclick="universalEditor.saveContent()" class="tool-btn success">💾 Сохранить</button>
                    <button onclick="universalEditor.exportContent()" class="tool-btn">📥 Экспорт</button>
                </div>
                <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    <p><strong>Поддерживается Markdown разметка:</strong></p>
                    <p>**жирный** *курсив* `код` # Заголовок</p>
                </div>
            </div>
        `;

        // Простая обработка изменений
        const textarea = document.getElementById('fallback-editor');
        if (textarea) {
            textarea.addEventListener('input', () => {
                this.currentContent = textarea.value;
                this.updateStats();
            });
        }
    }

    // Остальные методы остаются такими же, но с дополнительными проверками
    getContent(format = 'markdown') {
        if (!this.isInitialized) {
            // Для fallback редактора
            const fallbackEditor = document.getElementById('fallback-editor');
            if (fallbackEditor) {
                return fallbackEditor.value;
            }
            return this.currentContent;
        }
        
        // ... остальной код без изменений
    }

    // Добавляем метод для обновления статистики
    updateStats() {
        const content = this.getContent();
        const charCount = content.length;
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        
        const charElement = document.getElementById('charCount');
        const wordElement = document.getElementById('wordCount');
        
        if (charElement) charElement.textContent = charCount;
        if (wordElement) wordElement.textContent = wordCount;
    }
}

// Остальной код без изменений...
