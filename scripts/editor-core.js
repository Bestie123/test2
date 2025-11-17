// scripts/editor-core.js
class EditorCore {
    constructor() {
        this.currentContent = '';
        this.currentMode = 'markdown';
        this.isInitialized = false;
        this.editors = {};
        
        this.init();
    }

    async init() {
        try {
            console.log('Инициализация EditorCore...');
            
            // Создаем базовую структуру редактора
            this.createEditorStructure();
            
            // Инициализируем режимы
            this.setupModes();
            
            // Загружаем контент
            this.loadInitialContent();
            
            this.isInitialized = true;
            console.log('EditorCore успешно инициализирован');
            
        } catch (error) {
            console.error('Ошибка инициализации EditorCore:', error);
            this.showFallbackEditor();
        }
    }

    createEditorStructure() {
        const container = document.querySelector('.editor-container');
        if (!container) {
            console.error('Контейнер редактора не найден');
            return;
        }

        // Базовая HTML структура
        container.innerHTML = `
            <div class="editor-control-panel">
                <div class="mode-selector">
                    <button class="mode-btn active" data-mode="markdown">
                        <span class="icon">📝</span>
                        <span class="label">Markdown</span>
                    </button>
                    <button class="mode-btn" data-mode="wysiwyg">
                        <span class="icon">👁️</span>
                        <span class="label">WYSIWYG</span>
                    </button>
                    <button class="mode-btn" data-mode="code">
                        <span class="icon">💻</span>
                        <span class="label">Code</span>
                    </button>
                </div>
                
                <div class="editor-tools">
                    <button id="editor-save-btn" class="tool-btn success">
                        <span class="icon">💾</span>
                        Сохранить
                    </button>
                    <div class="format-info">
                        Формат: <span id="currentFormat">markdown</span>
                    </div>
                </div>
            </div>

            <div class="editor-views">
                <!-- Markdown Editor -->
                <div id="markdown-view" class="editor-view active">
                    <textarea id="markdown-editor" 
                              placeholder="# Начните писать Markdown здесь...&#10;&#10;## Пример:&#10;- **Жирный текст**&#10;- *Курсив*&#10;- \`код\`&#10;- [Ссылка](https://example.com)"
                              style="width: 100%; height: 100%; border: none; padding: 20px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5; resize: none;"></textarea>
                </div>
                
                <!-- WYSIWYG Preview -->
                <div id="wysiwyg-view" class="editor-view">
                    <div id="wysiwyg-preview" style="padding: 20px; height: 100%; overflow-y: auto;"></div>
                </div>
                
                <!-- Code Editor -->
                <div id="code-view" class="editor-view">
                    <textarea id="code-editor" 
                              placeholder="// Режим кода с подсветкой синтаксиса&#10;// Простой текстовый редактор для кода"
                              style="width: 100%; height: 100%; border: none; padding: 20px; font-family: 'Courier New', monospace; font-size: 14px; line-height: 1.5; resize: none; background: #f6f8fa;"></textarea>
                </div>
            </div>

            <div class="status-bar">
                <div class="status-info">
                    <span id="charCount">0</span> символов • 
                    <span id="wordCount">0</span> слов •
                    Режим: <span id="currentModeDisplay">markdown</span>
                </div>
                <div class="sync-status">
                    <span id="syncStatus">⚪ Готов</span>
                </div>
            </div>
        `;

        // Инициализируем редакторы
        this.editors.markdown = document.getElementById('markdown-editor');
        this.editors.wysiwyg = document.getElementById('wysiwyg-preview');
        this.editors.code = document.getElementById('code-editor');
    }

    setupModes() {
        // Обработчики кнопок режимов
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mode-btn')) {
                const button = e.target.closest('.mode-btn');
                const mode = button.dataset.mode;
                this.switchMode(mode);
            }
        });

        // Обработчик сохранения
        document.getElementById('editor-save-btn').addEventListener('click', () => {
            this.saveContent();
        });

        // Обработчики изменений контента
        this.editors.markdown.addEventListener('input', () => {
            this.handleContentChange();
        });

        this.editors.code.addEventListener('input', () => {
            this.handleContentChange();
        });

        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchMode('markdown');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchMode('wysiwyg');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchMode('code');
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveContent();
                        break;
                }
            }
        });
    }

    switchMode(newMode) {
        if (this.currentMode === newMode) return;

        console.log(`Переключение режима: ${this.currentMode} -> ${newMode}`);

        // Сохраняем контент из текущего режима
        this.saveCurrentContent();

        // Обновляем UI
        this.updateModeUI(newMode);

        // Загружаем контент в новый режим
        this.loadContentToMode(newMode);

        this.currentMode = newMode;
        this.updateStatus();
    }

    saveCurrentContent() {
        switch(this.currentMode) {
            case 'markdown':
                this.currentContent = this.editors.markdown.value;
                break;
            case 'code':
                this.currentContent = this.editors.code.value;
                break;
            case 'wysiwyg':
                // Контент для WYSIWYG берется из markdown
                break;
        }
    }

    updateModeUI(newMode) {
        // Обновляем активные кнопки
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === newMode);
        });

        // Обновляем активные вью
        document.querySelectorAll('.editor-view').forEach(view => {
            view.classList.remove('active');
        });
        
        document.getElementById(`${newMode}-view`).classList.add('active');

        // Обновляем информацию о формате
        document.getElementById('currentFormat').textContent = newMode === 'code' ? 'plaintext' : 'markdown';
    }

    loadContentToMode(newMode) {
        const content = this.currentContent || '';

        switch(newMode) {
            case 'markdown':
                this.editors.markdown.value = content;
                break;
            case 'wysiwyg':
                this.editors.wysiwyg.innerHTML = this.markdownToHtml(content);
                break;
            case 'code':
                this.editors.code.value = content;
                break;
        }
    }

    handleContentChange() {
        this.updateStats();
        
        // Автоматическое обновление WYSIWYG если он активен
        if (this.currentMode === 'markdown') {
            const content = this.editors.markdown.value;
            if (document.getElementById('wysiwyg-view').classList.contains('active')) {
                this.editors.wysiwyg.innerHTML = this.markdownToHtml(content);
            }
        }
        
        this.updateSyncStatus('⚫ Изменения не сохранены');
    }

    markdownToHtml(markdown) {
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`(.*)`/gim, '<code>$1</code>')
            .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" style="max-width: 100%;">')
            .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>')
            .replace(/\n/gim, '<br>');
    }

    updateStats() {
        const content = this.getCurrentContent();
        const charCount = content.length;
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        
        document.getElementById('charCount').textContent = charCount;
        document.getElementById('wordCount').textContent = wordCount;
        document.getElementById('currentModeDisplay').textContent = this.currentMode;
    }

    updateSyncStatus(status) {
        document.getElementById('syncStatus').textContent = status;
    }

    updateStatus() {
        this.updateStats();
        this.updateSyncStatus('⚪ Готов');
    }

    getCurrentContent() {
        switch(this.currentMode) {
            case 'markdown':
                return this.editors.markdown.value;
            case 'code':
                return this.editors.code.value;
            case 'wysiwyg':
                return this.currentContent; // Возвращаем markdown версию
            default:
                return this.currentContent;
        }
    }

    setContent(content) {
        this.currentContent = content;
        
        // Устанавливаем контент во все редакторы
        this.editors.markdown.value = content;
        this.editors.code.value = content;
        this.editors.wysiwyg.innerHTML = this.markdownToHtml(content);
        
        this.updateStats();
        this.updateSyncStatus('⚪ Готов');
    }

    saveContent() {
        try {
            const content = this.getCurrentContent();
            this.currentContent = content;
            
            // Сохраняем в localStorage
            localStorage.setItem('editor-content', content);
            
            // Интеграция с основной системой
            if (window.knowledgeManager && window.knowledgeManager.currentItem) {
                window.knowledgeManager.currentItem.content = content;
            }
            
            this.showNotification('Контент сохранен!', 'success');
            this.updateSyncStatus('✅ Сохранено');
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showNotification('Ошибка сохранения', 'error');
        }
    }

    loadInitialContent() {
        // Пробуем загрузить из localStorage
        const saved = localStorage.getItem('editor-content');
        if (saved) {
            this.setContent(saved);
        } else {
            // Демо контент
            const demoContent = `# Добро пожаловать в редактор!

Это **демонстрационный контент**. Вы можете:

- Писать в **Markdown** режиме
- Смотреть **WYSIWYG** предпросмотр  
- Использовать **Code** режим для чистого текста

## Поддерживаемый синтаксис:

\\`\\`\\`javascript
// Блоки кода
function hello() {
    console.log("Hello World!");
}
\\`\\`\\`

> Цитаты также работают

- Списки
- **Жирный текст**
- *Курсив*
- [Ссылки](https://example.com)`;

            this.setContent(demoContent);
        }
    }

    showNotification(message, type = 'success') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
            color: white;
            border-radius: 5px;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showFallbackEditor() {
        const container = document.querySelector('.editor-container');
        if (!container) return;

        container.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h3 style="color: #dc3545;">⚠️ Ошибка инициализации редактора</h3>
                <p>Используется упрощенная версия</p>
                <textarea id="fallback-editor" 
                          style="width: 100%; height: 400px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace;"
                          placeholder="Начните писать ваш текст здесь..."></textarea>
                <div style="margin-top: 15px;">
                    <button onclick="window.editorInstance.saveContent()" 
                            style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        💾 Сохранить
                    </button>
                </div>
            </div>
        `;

        const editor = document.getElementById('fallback-editor');
        if (editor) {
            editor.value = this.currentContent;
            editor.addEventListener('input', () => {
                this.currentContent = editor.value;
            });
        }
    }

    // Публичные методы для интеграции
    getContent() {
        return this.getCurrentContent();
    }

    setContent(content) {
        this.setContent(content);
    }
}

// Глобальная инициализация
window.editorInstance = new EditorCore();
