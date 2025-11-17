// scripts/unified-editor.js
class UnifiedEditor {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            initialContent: '',
            autoSave: true,
            syncDelay: 2000,
            enableImages: true,
            enableCode: true,
            enableTables: true,
            ...options
        };
        
        this.modes = ['markdown', 'wysiwyg', 'code', 'split'];
        this.currentMode = 'markdown';
        this.content = this.options.initialContent;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        try {
            this.createEditorStructure();
            this.setupEventHandlers();
            this.loadContent();
            this.setupAutoSave();
            this.isInitialized = true;
            
            console.log('UnifiedEditor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize UnifiedEditor:', error);
            this.showFallbackEditor();
        }
    }

    createEditorStructure() {
        this.container.innerHTML = `
            <div class="unified-editor">
                <!-- Панель управления -->
                <div class="ue-control-panel">
                    <div class="ue-mode-selector">
                        <button class="ue-mode-btn active" data-mode="markdown" title="Markdown редактор">
                            <span class="ue-icon">📝</span>
                            <span class="ue-label">Markdown</span>
                        </button>
                        <button class="ue-mode-btn" data-mode="wysiwyg" title="Визуальный редактор">
                            <span class="ue-icon">👁️</span>
                            <span class="ue-label">Визуальный</span>
                        </button>
                        <button class="ue-mode-btn" data-mode="code" title="Редактор кода">
                            <span class="ue-icon">💻</span>
                            <span class="ue-label">Код</span>
                        </button>
                        <button class="ue-mode-btn" data-mode="split" title="Разделенный вид">
                            <span class="ue-icon">🔄</span>
                            <span class="ue-label">Раздельно</span>
                        </button>
                    </div>

                    <!-- Панель инструментов -->
                    <div class="ue-toolbar">
                        <div class="ue-format-tools">
                            <button class="ue-tool-btn" data-command="bold" title="Жирный (Ctrl+B)"><b>B</b></button>
                            <button class="ue-tool-btn" data-command="italic" title="Курсив (Ctrl+I)"><i>I</i></button>
                            <button class="ue-tool-btn" data-command="underline" title="Подчеркивание (Ctrl+U)"><u>U</u></button>
                            <span class="ue-separator"></span>
                            <button class="ue-tool-btn" data-command="h1" title="Заголовок 1">H1</button>
                            <button class="ue-tool-btn" data-command="h2" title="Заголовок 2">H2</button>
                            <button class="ue-tool-btn" data-command="h3" title="Заголовок 3">H3</button>
                            <span class="ue-separator"></span>
                            <button class="ue-tool-btn" data-command="ul" title="Маркированный список">•</button>
                            <button class="ue-tool-btn" data-command="ol" title="Нумерованный список">1.</button>
                            <button class="ue-tool-btn" data-command="blockquote" title="Цитата">❝</button>
                            <span class="ue-separator"></span>
                            <button class="ue-tool-btn" data-command="code" title="Блок кода">{ }</button>
                            <button class="ue-tool-btn" data-command="link" title="Ссылка">🔗</button>
                            <button class="ue-tool-btn" data-command="image" title="Изображение">🖼️</button>
                            <button class="ue-tool-btn" data-command="table" title="Таблица">⧠</button>
                        </div>
                        
                        <div class="ue-action-tools">
                            <button class="ue-action-btn ue-save-btn" title="Сохранить (Ctrl+S)">💾 Сохранить</button>
                            <button class="ue-action-btn ue-export-btn" title="Экспорт">📥 Экспорт</button>
                            <button class="ue-action-btn ue-import-btn" title="Импорт">📤 Импорт</button>
                        </div>
                    </div>
                </div>

                <!-- Основная область редактора -->
                <div class="ue-editor-area">
                    <!-- Markdown редактор -->
                    <div class="ue-editor-view active" data-mode="markdown">
                        <div class="ue-md-editor">
                            <textarea class="ue-md-textarea" placeholder="# Начните писать Markdown...&#10;&#10;Используйте **жирный**, *курсив*, \`код\`, [ссылки](https://example.com) и многое другое!"></textarea>
                            <div class="ue-md-preview"></div>
                        </div>
                    </div>

                    <!-- WYSIWYG редактор -->
                    <div class="ue-editor-view" data-mode="wysiwyg">
                        <div class="ue-wysiwyg-editor" contenteditable="true">
                            <!-- Контент будет здесь -->
                        </div>
                    </div>

                    <!-- Code редактор -->
                    <div class="ue-editor-view" data-mode="code">
                        <div class="ue-code-editor">
                            <textarea class="ue-code-textarea" placeholder="// Режим кода с подсветкой синтаксиса&#10;// Идеально для программирования и конфигураций"></textarea>
                            <div class="ue-code-highlight"></div>
                        </div>
                    </div>

                    <!-- Split View -->
                    <div class="ue-editor-view" data-mode="split">
                        <div class="ue-split-view">
                            <div class="ue-split-pane ue-split-editor">
                                <textarea class="ue-split-textarea"></textarea>
                            </div>
                            <div class="ue-split-pane ue-split-preview">
                                <div class="ue-split-preview-content"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Статус бар -->
                <div class="ue-status-bar">
                    <div class="ue-stats">
                        <span class="ue-stat" id="ue-char-count">0 символов</span>
                        <span class="ue-stat" id="ue-word-count">0 слов</span>
                        <span class="ue-stat" id="ue-line-count">1 строка</span>
                    </div>
                    <div class="ue-status-info">
                        <span class="ue-mode-indicator">Режим: Markdown</span>
                        <span class="ue-sync-status" id="ue-sync-status">⚪ Готов</span>
                    </div>
                </div>

                <!-- Модальные окна -->
                <div class="ue-modal" id="ue-link-modal">
                    <div class="ue-modal-content">
                        <h3>Вставить ссылку</h3>
                        <input type="text" class="ue-modal-input" id="ue-link-url" placeholder="URL">
                        <input type="text" class="ue-modal-input" id="ue-link-text" placeholder="Текст ссылки">
                        <div class="ue-modal-actions">
                            <button class="ue-modal-btn ue-confirm-btn">Вставить</button>
                            <button class="ue-modal-btn ue-cancel-btn">Отмена</button>
                        </div>
                    </div>
                </div>

                <div class="ue-modal" id="ue-image-modal">
                    <div class="ue-modal-content">
                        <h3>Вставить изображение</h3>
                        <input type="text" class="ue-modal-input" id="ue-image-url" placeholder="URL изображения">
                        <input type="text" class="ue-modal-input" id="ue-image-alt" placeholder="Описание">
                        <div class="ue-modal-actions">
                            <button class="ue-modal-btn ue-confirm-btn">Вставить</button>
                            <button class="ue-modal-btn ue-cancel-btn">Отмена</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Инициализируем элементы
        this.elements = {
            // Текстовые области
            mdTextarea: this.container.querySelector('.ue-md-textarea'),
            codeTextarea: this.container.querySelector('.ue-code-textarea'),
            splitTextarea: this.container.querySelector('.ue-split-textarea'),
            wysiwygEditor: this.container.querySelector('.ue-wysiwyg-editor'),
            
            // Preview области
            mdPreview: this.container.querySelector('.ue-md-preview'),
            splitPreview: this.container.querySelector('.ue-split-preview-content'),
            
            // Статус элементы
            charCount: this.container.querySelector('#ue-char-count'),
            wordCount: this.container.querySelector('#ue-word-count'),
            lineCount: this.container.querySelector('#ue-line-count'),
            syncStatus: this.container.querySelector('#ue-sync-status'),
            modeIndicator: this.container.querySelector('.ue-mode-indicator'),
            
            // Модальные окна
            linkModal: this.container.querySelector('#ue-link-modal'),
            imageModal: this.container.querySelector('#ue-image-modal')
        };
    }

    setupEventHandlers() {
        // Переключение режимов
        this.container.querySelectorAll('.ue-mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

        // Обработчики инструментов форматирования
        this.container.querySelectorAll('.ue-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.currentTarget.dataset.command;
                this.executeCommand(command);
            });
        });

        // Кнопки действий
        this.container.querySelector('.ue-save-btn').addEventListener('click', () => this.save());
        this.container.querySelector('.ue-export-btn').addEventListener('click', () => this.exportContent());
        this.container.querySelector('.ue-import-btn').addEventListener('click', () => this.importContent());

        // Обработчики изменения контента
        this.setupContentChangeHandlers();

        // Горячие клавиши
        this.setupKeyboardShortcuts();

        // Модальные окна
        this.setupModals();
    }

    setupContentChangeHandlers() {
        // Markdown редактор
        this.elements.mdTextarea.addEventListener('input', () => {
            this.handleContentChange('markdown');
            this.updateMarkdownPreview();
        });

        // Code редактор
        this.elements.codeTextarea.addEventListener('input', () => {
            this.handleContentChange('code');
        });

        // Split редактор
        this.elements.splitTextarea.addEventListener('input', () => {
            this.handleContentChange('split');
            this.updateSplitPreview();
        });

        // WYSIWYG редактор
        this.elements.wysiwygEditor.addEventListener('input', () => {
            this.handleContentChange('wysiwyg');
        });

        // WYSIWYG дополнительные события
        this.elements.wysiwygEditor.addEventListener('paste', (e) => this.handleWysiwygPaste(e));
        this.elements.wysiwygEditor.addEventListener('keydown', (e) => this.handleWysiwygKeydown(e));
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) {
                switch(e.key) {
                    case '1': case '2': case '3': case '4':
                        e.preventDefault();
                        const modes = ['markdown', 'wysiwyg', 'code', 'split'];
                        this.switchMode(modes[parseInt(e.key) - 1]);
                        break;
                    case 'b':
                        e.preventDefault();
                        this.executeCommand('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.executeCommand('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.executeCommand('underline');
                        break;
                    case 's':
                        e.preventDefault();
                        this.save();
                        break;
                }
            }
        });
    }

    setupModals() {
        // Закрытие модальных окон
        this.container.querySelectorAll('.ue-cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });

        // Подтверждение ссылки
        this.container.querySelector('#ue-link-modal .ue-confirm-btn').addEventListener('click', () => {
            this.insertLink();
        });

        // Подтверждение изображения
        this.container.querySelector('#ue-image-modal .ue-confirm-btn').addEventListener('click', () => {
            this.insertImage();
        });
    }

    switchMode(newMode) {
        if (this.currentMode === newMode) return;

        // Сохраняем контент текущего режима
        this.saveCurrentContent();

        // Обновляем UI
        this.updateModeUI(newMode);

        // Загружаем контент в новый режим
        this.loadContentToMode(newMode);

        this.currentMode = newMode;
        this.updateStatus();
        
        console.log(`Переключен режим: ${newMode}`);
    }

    saveCurrentContent() {
        switch(this.currentMode) {
            case 'markdown':
                this.content = this.elements.mdTextarea.value;
                break;
            case 'wysiwyg':
                this.content = this.elements.wysiwygEditor.innerHTML;
                break;
            case 'code':
                this.content = this.elements.codeTextarea.value;
                break;
            case 'split':
                this.content = this.elements.splitTextarea.value;
                break;
        }
    }

    updateModeUI(newMode) {
        // Обновляем активные кнопки режимов
        this.container.querySelectorAll('.ue-mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === newMode);
        });

        // Обновляем активные вью
        this.container.querySelectorAll('.ue-editor-view').forEach(view => {
            view.classList.toggle('active', view.dataset.mode === newMode);
        });

        // Обновляем индикатор режима
        this.elements.modeIndicator.textContent = `Режим: ${this.getModeDisplayName(newMode)}`;
    }

    getModeDisplayName(mode) {
        const names = {
            'markdown': 'Markdown',
            'wysiwyg': 'Визуальный',
            'code': 'Код',
            'split': 'Раздельный'
        };
        return names[mode] || mode;
    }

    loadContentToMode(mode) {
        const content = this.content || '';

        switch(mode) {
            case 'markdown':
                this.elements.mdTextarea.value = content;
                this.updateMarkdownPreview();
                break;
            case 'wysiwyg':
                this.elements.wysiwygEditor.innerHTML = this.markdownToHtml(content);
                break;
            case 'code':
                this.elements.codeTextarea.value = content;
                break;
            case 'split':
                this.elements.splitTextarea.value = content;
                this.updateSplitPreview();
                break;
        }
    }

    executeCommand(command) {
        switch(command) {
            case 'bold':
                this.insertText('**', '**');
                break;
            case 'italic':
                this.insertText('*', '*');
                break;
            case 'underline':
                this.insertText('<u>', '</u>');
                break;
            case 'h1':
                this.insertText('# ', '', true);
                break;
            case 'h2':
                this.insertText('## ', '', true);
                break;
            case 'h3':
                this.insertText('### ', '', true);
                break;
            case 'ul':
                this.insertText('- ', '', true);
                break;
            case 'ol':
                this.insertText('1. ', '', true);
                break;
            case 'blockquote':
                this.insertText('> ', '', true);
                break;
            case 'code':
                this.insertText('```\n', '\n```', true);
                break;
            case 'link':
                this.showLinkModal();
                break;
            case 'image':
                this.showImageModal();
                break;
            case 'table':
                this.insertTable();
                break;
        }
    }

    insertText(before, after, lineStart = false) {
        const activeElement = this.getActiveTextArea();
        if (!activeElement) return;

        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const text = activeElement.value;
        const selectedText = text.substring(start, end);

        let newText, newCursorPos;

        if (lineStart) {
            // Для элементов, которые должны быть в начале строки
            const lines = text.split('\n');
            let currentLine = 0;
            let charCount = 0;
            
            for (let i = 0; i < lines.length; i++) {
                charCount += lines[i].length + 1;
                if (charCount > start) {
                    currentLine = i;
                    break;
                }
            }
            
            lines[currentLine] = before + lines[currentLine];
            newText = lines.join('\n');
            newCursorPos = start + before.length;
        } else {
            // Обычная вставка вокруг выделенного текста
            newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
            newCursorPos = start + before.length + selectedText.length + after.length;
        }

        activeElement.value = newText;
        activeElement.setSelectionRange(newCursorPos, newCursorPos);
        activeElement.focus();
        
        this.handleContentChange(this.currentMode);
    }

    getActiveTextArea() {
        switch(this.currentMode) {
            case 'markdown': return this.elements.mdTextarea;
            case 'code': return this.elements.codeTextarea;
            case 'split': return this.elements.splitTextarea;
            default: return null;
        }
    }

    showLinkModal() {
        this.elements.linkModal.style.display = 'flex';
        this.container.querySelector('#ue-link-url').focus();
    }

    showImageModal() {
        this.elements.imageModal.style.display = 'flex';
        this.container.querySelector('#ue-image-url').focus();
    }

    closeModals() {
        this.elements.linkModal.style.display = 'none';
        this.elements.imageModal.style.display = 'none';
        
        // Очищаем поля
        this.container.querySelectorAll('.ue-modal-input').forEach(input => {
            input.value = '';
        });
    }

    insertLink() {
        const url = this.container.querySelector('#ue-link-url').value;
        const text = this.container.querySelector('#ue-link-text').value || url;
        
        if (url) {
            this.insertText(`[${text}](${url})`, '');
            this.closeModals();
        }
    }

    insertImage() {
        const url = this.container.querySelector('#ue-image-url').value;
        const alt = this.container.querySelector('#ue-image-alt').value || 'Изображение';
        
        if (url) {
            this.insertText(`![${alt}](${url})`, '');
            this.closeModals();
        }
    }

    insertTable() {
        const tableMarkdown = `\n| Заголовок 1 | Заголовок 2 | Заголовок 3 |\n|-------------|-------------|-------------|\n| Ячейка 1    | Ячейка 2    | Ячейка 3    |\n| Ячейка 4    | Ячейка 5    | Ячейка 6    |\n\n`;
        this.insertText(tableMarkdown, '');
    }

    handleContentChange(source) {
        this.updateStats();
        this.updateSyncStatus('⚫ Изменения не сохранены');
        
        // Авто-обновление preview
        if (source === 'markdown') {
            if (this.currentMode === 'split') {
                this.updateSplitPreview();
            }
        }
    }

    updateMarkdownPreview() {
        const markdown = this.elements.mdTextarea.value;
        this.elements.mdPreview.innerHTML = this.markdownToHtml(markdown);
    }

    updateSplitPreview() {
        const markdown = this.elements.splitTextarea.value;
        this.elements.splitPreview.innerHTML = this.markdownToHtml(markdown);
    }

    markdownToHtml(markdown) {
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`(.*)`/gim, '<code>$1</code>')
            .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2" style="max-width: 100%; border-radius: 4px; margin: 10px 0;">')
            .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" style="color: #007bff; text-decoration: none;">$1</a>')
            .replace(/^> (.*$)/gim, '<blockquote style="border-left: 4px solid #007bff; padding-left: 15px; margin: 10px 0; color: #666;">$1</blockquote>')
            .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
            .replace(/^(\d+)\. (.*$)/gim, '<ol><li>$2</li></ol>')
            .replace(/\n\n/gim, '</p><p>')
            .replace(/\n/gim, '<br>')
            .replace(/<ul>\s*<li>/gim, '<ul><li>')
            .replace(/<\/li>\s*<ul>/gim, '</li></ul><ul>')
            .replace(/<ol>\s*<li>/gim, '<ol><li>')
            .replace(/<\/li>\s*<ol>/gim, '</li></ol><ol>');
    }

    updateStats() {
        const content = this.getContent();
        const charCount = content.length;
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        const lineCount = content.split('\n').length;

        this.elements.charCount.textContent = `${charCount} символов`;
        this.elements.wordCount.textContent = `${wordCount} слов`;
        this.elements.lineCount.textContent = `${lineCount} строк`;
    }

    updateSyncStatus(status) {
        this.elements.syncStatus.textContent = status;
    }

    updateStatus() {
        this.updateStats();
        this.updateSyncStatus('⚪ Готов');
    }

    // WYSIWYG обработчики
    handleWysiwygPaste(e) {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    }

    handleWysiwygKeydown(e) {
        // Автоматическое преобразование Markdown в WYSIWYG
        if (e.key === 'Enter') {
            // Обработка списков
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const node = range.startContainer;
                
                if (node.nodeType === Node.TEXT_NODE && node.textContent.match(/^[-*]\s/)) {
                    e.preventDefault();
                    document.execCommand('insertUnorderedList', false, null);
                } else if (node.nodeType === Node.TEXT_NODE && node.textContent.match(/^\d+\.\s/)) {
                    e.preventDefault();
                    document.execCommand('insertOrderedList', false, null);
                }
            }
        }
    }

    // Основные методы API
    getContent() {
        switch(this.currentMode) {
            case 'markdown': return this.elements.mdTextarea.value;
            case 'wysiwyg': return this.elements.wysiwygEditor.innerHTML;
            case 'code': return this.elements.codeTextarea.value;
            case 'split': return this.elements.splitTextarea.value;
            default: return this.content;
        }
    }

    setContent(content) {
        this.content = content;
        
        // Устанавливаем во все редакторы
        this.elements.mdTextarea.value = content;
        this.elements.wysiwygEditor.innerHTML = this.markdownToHtml(content);
        this.elements.codeTextarea.value = content;
        this.elements.splitTextarea.value = content;
        
        this.updateMarkdownPreview();
        this.updateSplitPreview();
        this.updateStats();
        this.updateSyncStatus('⚪ Готов');
    }

    save() {
        try {
            const content = this.getContent();
            this.content = content;
            
            // Сохраняем в localStorage
            localStorage.setItem('unified-editor-content', content);
            
            this.showNotification('Контент сохранен!', 'success');
            this.updateSyncStatus('✅ Сохранено');
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showNotification('Ошибка сохранения', 'error');
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
                this.setContent(e.target.result);
                this.showNotification('Контент импортирован!', 'success');
            };
            reader.readAsText(file);
        };
        input.click();
    }

    loadContent() {
        const saved = localStorage.getItem('unified-editor-content');
        if (saved) {
            this.setContent(saved);
        } else if (this.options.initialContent) {
            this.setContent(this.options.initialContent);
        }
    }

    setupAutoSave() {
        if (!this.options.autoSave) return;

        let saveTimeout;
        
        const scheduleSave = () => {
            if (saveTimeout) clearTimeout(saveTimeout);
            
            saveTimeout = setTimeout(() => {
                this.save();
            }, this.options.syncDelay);
        };

        // Слушаем все события изменения
        this.container.addEventListener('input', scheduleSave);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `ue-notification ue-notification-${type}`;
        notification.innerHTML = `
            <div class="ue-notification-content">
                <span class="ue-notification-message">${message}</span>
            </div>
        `;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('ue-notification-show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('ue-notification-show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    showFallbackEditor() {
        this.container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #dc3545;">
                <h3>⚠️ Ошибка загрузки редактора</h3>
                <p>Используется упрощенная версия</p>
                <textarea style="width: 100%; height: 400px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; font-family: monospace;"
                         placeholder="Начните писать...">${this.content}</textarea>
                <div style="margin-top: 15px;">
                    <button onclick="window.unifiedEditor.save()" 
                            style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        💾 Сохранить
                    </button>
                </div>
            </div>
        `;
    }

    // Публичные методы
    getMode() { return this.currentMode; }
    setMode(mode) { this.switchMode(mode); }
    getContent() { return this.getContent(); }
    setContent(content) { this.setContent(content); }
    destroy() { /* Очистка ресурсов */ }
}

// Глобальный экспорт
window.UnifiedEditor = UnifiedEditor;
