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
        
        this.currentContent = '';
        this.currentFormat = 'markdown';
        this.isInitialized = false;
        
        this.setupCore();
    }

    async setupCore() {
        try {
            // Показываем индикатор загрузки
            this.showLoading();
            
            // Загружаем все плагины
            const success = await this.pluginLoader.loadAll();
            if (!success) {
                throw new Error('Не удалось загрузить необходимые плагины');
            }
            
            // Инициализируем редакторы
            await this.initializeEditors();
            
            // Инициализируем менеджер режимов
            this.modeManager = new ModeManager(this);
            
            // Настраиваем обработчики событий
            this.setupEventHandlers();
            
            // Скрываем индикатор загрузки
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('EditorCore инициализирован');
            
            // Загружаем начальный контент
            this.loadInitialContent();
            
        } catch (error) {
            console.error('Ошибка инициализации EditorCore:', error);
            this.showError('Не удалось инициализировать редактор: ' + error.message);
        }
    }

    async initializeEditors() {
        // Инициализируем Toast UI Editor
        this.editors.toastui = await this.pluginLoader.loadToastUI();
        
        // Инициализируем Monaco Editor
        await this.initializeMonaco();
        
        // Инициализируем Editor.js
        this.editors.editorjs = await this.pluginLoader.loadEditorJS();
        
        // Настраиваем Split View
        this.initializeSplitView();
    }

    async initializeMonaco() {
        const monaco = await this.pluginLoader.loadMonaco();
        
        this.editors.monaco = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: '# Начните писать ваш Markdown здесь...\n\n',
            language: 'markdown',
            theme: 'vs-light',
            fontSize: 14,
            lineNumbers: 'on',
            lineHeight: 1.5,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: 'on',
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            snippetSuggestions: 'none'
        });

        // События изменения контента
        this.editors.monaco.onDidChangeModelContent(() => {
            this.handleContentChange('monaco');
        });
    }

    initializeSplitView() {
        const monaco = this.editors.monaco;
        if (!monaco) return;

        // Создаем Monaco для split view
        this.splitMonaco = monaco.editor.create(document.getElementById('split-monaco'), {
            value: '# Split View Editor\n\n',
            language: 'markdown',
            theme: 'vs-light',
            fontSize: 14,
            lineNumbers: 'on',
            minimap: { enabled: false },
            automaticLayout: true
        });

        // Синхронизация изменений между основным и split редактором
        this.splitMonaco.onDidChangeModelContent(() => {
            const content = this.splitMonaco.getValue();
            this.updateSplitPreview(content);
        });
    }

    updateSplitPreview(markdownContent) {
        const html = this.converter.markdownToHtml(markdownContent);
        document.getElementById('split-preview').innerHTML = 
            `<div class="preview-content">${html}</div>`;
    }

    setupEventHandlers() {
        // Кнопка сохранения
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveContent();
        });

        // Кнопка экспорта
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportContent();
        });

        // Кнопка импорта
        document.getElementById('importBtn').addEventListener('click', () => {
            this.importContent();
        });

        // Обработчики изменения контента
        this.setupContentChangeHandlers();
        
        // Автосохранение
        this.setupAutoSave();
    }

    setupContentChangeHandlers() {
        // Toast UI Editor
        this.editors.toastui.on('change', () => {
            this.handleContentChange('toastui');
        });

        // Editor.js
        // (Editor.js не имеет встроенного события change, поэтому используем таймер)
        this.setupEditorJSWatcher();
    }

    setupEditorJSWatcher() {
        let lastContent = '';
        const checkContent = async () => {
            try {
                const content = await this.editors.editorjs.save();
                const contentString = JSON.stringify(content);
                
                if (contentString !== lastContent) {
                    lastContent = contentString;
                    this.handleContentChange('editorjs');
                }
            } catch (error) {
                // Игнорируем ошибки при сохранении
            }
        };
        
        // Проверяем изменения каждые 2 секунды
        setInterval(checkContent, 2000);
    }

    setupAutoSave() {
        let saveTimeout = null;
        
        const scheduleSave = () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            
            saveTimeout = setTimeout(() => {
                this.autoSave();
            }, 3000); // Автосохранение через 3 секунды после изменения
        };

        // Слушаем все события изменения контента
        document.addEventListener('editor-content-changed', scheduleSave);
    }

    handleContentChange(source) {
        // Обновляем статистику
        if (this.modeManager) {
            this.modeManager.updateStats();
        }
        
        // Генерируем кастомное событие
        const event = new CustomEvent('editor-content-changed', {
            detail: { source, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    // Основные методы работы с контентом

    getContent(format = 'markdown') {
        if (!this.isInitialized) return '';
        
        const currentMode = this.modeManager ? this.modeManager.currentMode : 'markdown';
        let content = '';
        
        try {
            switch (currentMode) {
                case 'markdown':
                case 'wysiwyg':
                    content = this.editors.toastui.getMarkdown();
                    break;
                case 'code':
                    content = this.editors.monaco.getValue();
                    break;
                case 'blocks':
                    // Для Editor.js нужно асинхронное сохранение
                    return this.getEditorJSContent(format);
                case 'split':
                    content = this.splitMonaco ? this.splitMonaco.getValue() : '';
                    break;
            }
            
            // Конвертируем в нужный формат если необходимо
            if (format !== 'markdown') {
                content = this.converter.convert(content, 'markdown', format);
            }
            
            this.currentContent = content;
            this.currentFormat = format;
            
            return content;
            
        } catch (error) {
            console.error('Ошибка получения контента:', error);
            return this.currentContent;
        }
    }

    async getEditorJSContent(format) {
        try {
            const content = await this.editors.editorjs.save();
            
            if (format === 'editorjs') {
                return content;
            } else if (format === 'markdown') {
                return this.converter.editorJsToMarkdown(content.blocks);
            } else {
                const markdown = this.converter.editorJsToMarkdown(content.blocks);
                return this.converter.convert(markdown, 'markdown', format);
            }
        } catch (error) {
            console.error('Ошибка получения контента из Editor.js:', error);
            return '';
        }
    }

    setContent(content, format = 'markdown') {
        if (!this.isInitialized) return;
        
        try {
            let targetContent = content;
            let targetFormat = format;
            
            // Конвертируем в markdown для редакторов
            if (format !== 'markdown') {
                targetContent = this.converter.convert(content, format, 'markdown');
                targetFormat = 'markdown';
            }
            
            this.currentContent = targetContent;
            this.currentFormat = targetFormat;
            
            // Устанавливаем контент во все редакторы
            this.setContentToAllEditors(targetContent);
            
            // Обновляем статистику
            if (this.modeManager) {
                this.modeManager.updateStats();
            }
            
        } catch (error) {
            console.error('Ошибка установки контента:', error);
        }
    }

    setContentToAllEditors(content) {
        // Toast UI Editor
        if (this.editors.toastui) {
            this.editors.toastui.setMarkdown(content);
        }
        
        // Monaco Editor
        if (this.editors.monaco) {
            this.editors.monaco.setValue(content);
        }
        
        // Split View Monaco
        if (this.splitMonaco) {
            this.splitMonaco.setValue(content);
            this.updateSplitPreview(content);
        }
        
        // Editor.js (асинхронно)
        this.setContentToEditorJS(content);
    }

    async setContentToEditorJS(content) {
        if (!this.editors.editorjs) return;
        
        try {
            const editorJSData = this.converter.markdownToEditorJs(content);
            await this.editors.editorjs.clear();
            await this.editors.editorjs.render(editorJSData);
        } catch (error) {
            console.error('Ошибка установки контента в Editor.js:', error);
        }
    }

    // Методы работы с файлами

    async saveContent() {
        try {
            const content = this.getContent();
            this.currentContent = content;
            
            // Здесь интеграция с вашей системой сохранения
            if (window.knowledgeManager && window.knowledgeManager.currentItem) {
                window.knowledgeManager.currentItem.content = content;
                window.knowledgeManager.scheduleSave();
            }
            
            this.showNotification('Контент сохранен!', 'success');
            this.updateSyncStatus('✅ Сохранено');
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showNotification('Ошибка сохранения: ' + error.message, 'error');
        }
    }

    async autoSave() {
        try {
            const content = this.getContent();
            
            if (content !== this.lastAutoSaveContent) {
                this.lastAutoSaveContent = content;
                
                if (window.knowledgeManager) {
                    window.knowledgeManager.currentItem.content = content;
                    // Только сохраняем в localStorage для автосохранения
                    localStorage.setItem('auto-save-content', content);
                }
                
                this.updateSyncStatus('💾 Автосохранено');
            }
        } catch (error) {
            console.error('Ошибка автосохранения:', error);
        }
    }

    exportContent() {
        const content = this.getContent();
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `content-${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('Контент экспортирован!', 'success');
    }

    importContent() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.txt,.html';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                this.setContent(e.target.result, this.getFormatFromFilename(file.name));
                this.showNotification('Контент импортирован!', 'success');
            };
            reader.readAsText(file);
        };
        input.click();
    }

    getFormatFromFilename(filename) {
        if (filename.endsWith('.html')) return 'html';
        if (filename.endsWith('.md')) return 'markdown';
        return 'markdown';
    }

    // Вспомогательные методы

    loadInitialContent() {
        // Пытаемся загрузить из автосохранения
        const autoSaved = localStorage.getItem('auto-save-content');
        if (autoSaved) {
            this.setContent(autoSaved);
        }
        
        // Или загружаем демо-контент
        else {
            const demoContent = `# Добро пожаловать в универсальный редактор!

Это **демонстрационный контент**. Вы можете:

- Писать в **Markdown** режиме
- Переключаться в **WYSIWYG** для визуального редактирования  
- Использовать **Code** режим с подсветкой синтаксиса
- Работать с **блоками** в Editor.js
- Смотреть **Split View** с предпросмотром

## Возможности редактора

\`\`\`javascript
// Подсветка кода
function hello() {
    console.log("Hello, World!");
}
\`\`\`

> Цитаты и форматирование поддерживаются

- Списки
- Таблицы
- Изображения
- И многое другое!`;

            this.setContent(demoContent);
        }
    }

    showLoading() {
        const container = document.querySelector('.editor-container');
        container.innerHTML = '<div class="editor-loading">Загрузка редактора...</div>';
    }

    hideLoading() {
        // Восстанавливаем оригинальную структуру
        // (в реальном проекте нужно сохранить оригинальный HTML)
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `editor-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    updateSyncStatus(status) {
        const element = document.getElementById('syncStatus');
        if (element) {
            element.textContent = status;
        }
    }

    // Публичные методы для интеграции

    setKnowledgeItem(item) {
        if (item && item.content) {
            this.setContent(item.content);
        }
    }

    getCurrentContent() {
        return this.getContent();
    }

    // Очистка ресурсов
    destroy() {
        if (this.editors.monaco) {
            this.editors.monaco.dispose();
        }
        if (this.splitMonaco) {
            this.splitMonaco.dispose();
        }
        if (this.pluginLoader) {
            this.pluginLoader.destroy();
        }
    }
}

// Глобальная инициализация
let universalEditor = null;

document.addEventListener('DOMContentLoaded', function() {
    universalEditor = new EditorCore();
});

// Экспорт для использования в других модулях
window.UniversalEditor = EditorCore;
window.universalEditor = universalEditor;
