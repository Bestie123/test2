// scripts/integration.js
class KnowledgeBaseIntegration {
    constructor() {
        this.universalEditor = null;
        this.isEditorInitialized = false;
    }

    init() {
        this.patchKnowledgeManager();
        this.addUniversalEditorStyles();
        console.log('KnowledgeBaseIntegration initialized');
    }

    // Добавляем необходимые стили
    addUniversalEditorStyles() {
        const styles = `
            .universal-editor-modal .modal-content {
                padding: 0 !important;
                border-radius: 10px !important;
                overflow: hidden;
                width: 95% !important;
                height: 90vh !important;
                max-width: none !important;
            }
            
            .universal-editor-modal .editor-control-panel {
                border-radius: 10px 10px 0 0;
            }
            
            .universal-editor-modal .status-bar {
                border-radius: 0 0 10px 10px;
            }
            
            @media (max-width: 768px) {
                .universal-editor-modal .modal-content {
                    width: 100% !important;
                    height: 100% !important;
                    margin: 0 !important;
                    border-radius: 0 !important;
                }
            }
            
            #universal-editor-instance {
                height: 100% !important;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Замена оригинального метода открытия базы знаний
    patchKnowledgeManager() {
        if (!window.knowledgeManager) {
            console.warn('knowledgeManager not found, retrying in 1 second');
            setTimeout(() => this.patchKnowledgeManager(), 1000);
            return;
        }

        const originalOpenKnowledgeBase = window.knowledgeManager.openKnowledgeBase;
        
        window.knowledgeManager.openKnowledgeBase = (pathStr, index) => {
            const path = JSON.parse(pathStr);
            const item = window.dataManager.getNodeAtIndex(path, index);
            
            if (!item) {
                window.uiManager.showNotification('Элемент не найден', 'error');
                return;
            }
            
            // Используем универсальный редактор
            this.openWithUniversalEditor(item, path, index);
        };
        
        console.log('KnowledgeManager patched successfully');
    }

    openWithUniversalEditor(item, path, index) {
        // Скрываем существующее модальное окно знаний
        const existingModal = document.getElementById('knowledgeModal');
        if (existingModal) {
            existingModal.style.display = 'none';
        }
        
        // Создаем модальное окно для универсального редактора
        this.createEditorModal(item);
    }

    createEditorModal(item) {
        // Удаляем существующее модальное окно если есть
        const existingModal = document.querySelector('.universal-editor-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Создаем новое модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal universal-editor-modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📚 База знаний: ${this.escapeHtml(item.name)}</h3>
                    <button onclick="window.knowledgeIntegration.closeEditor()">✕</button>
                </div>
                <div class="editor-container-wrapper">
                    <div id="universal-editor-instance" style="height: calc(100vh - 150px); min-height: 500px;"></div>
                </div>
                <div class="modal-actions" style="padding: 15px; border-top: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <button onclick="window.knowledgeIntegration.saveContent()" class="success" style="padding: 8px 16px;">💾 Сохранить</button>
                        <button onclick="window.knowledgeIntegration.closeEditor()" style="padding: 8px 16px; margin-left: 10px;">Отмена</button>
                    </div>
                    <div style="color: #6c757d; font-size: 0.9em;">
                        Универсальный редактор • <span id="editor-mode-info">Markdown</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Инициализируем редактор
        this.initializeEditorInModal(item);
    }

    async initializeEditorInModal(item) {
        const container = document.getElementById('universal-editor-instance');
        
        if (!container) {
            console.error('Editor container not found');
            return;
        }
        
        try {
            // Создаем HTML структуру редактора
            container.innerHTML = this.getEditorHTML();
            
            // Ждем немного чтобы DOM обновился
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Инициализируем редактор
            this.universalEditor = new EditorCore();
            
            // Ждем инициализации редактора
            await this.waitForEditorInitialization();
            
            // Загружаем контент элемента
            if (item.content) {
                this.universalEditor.setContent(item.content);
            }
            
            // Сохраняем ссылку на элемент
            this.currentKnowledgeItem = item;
            this.isEditorInitialized = true;
            
            console.log('Universal editor initialized in modal');
            
        } catch (error) {
            console.error('Error initializing universal editor:', error);
            this.showError('Не удалось загрузить редактор: ' + error.message);
        }
    }

    getEditorHTML() {
        return `
            <div class="universal-editor">
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
                        <button class="mode-btn" data-mode="split">
                            <span class="icon">🔄</span>
                            <span class="label">Split View</span>
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

                <div class="editor-container">
                    <div id="toastui-editor" class="editor-view active"></div>
                    <div id="monaco-editor" class="editor-view"></div>
                    <div id="editorjs-container" class="editor-view"></div>
                    <div id="split-view" class="editor-view split-view">
                        <div class="split-pane code-pane">
                            <div id="split-monaco"></div>
                        </div>
                        <div class="split-pane preview-pane">
                            <div id="split-preview"></div>
                        </div>
                    </div>
                </div>

                <div class="status-bar">
                    <div class="status-info">
                        <span id="charCount">0</span> символов • 
                        <span id="wordCount">0</span> слов •
                        Режим: <span id="currentMode">markdown</span>
                    </div>
                    <div class="sync-status">
                        <span id="syncStatus">⚪ Готов</span>
                    </div>
                </div>
            </div>
        `;
    }

    waitForEditorInitialization() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 секунд
            
            const checkInitialization = () => {
                attempts++;
                
                if (this.universalEditor && this.universalEditor.isInitialized) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Editor initialization timeout'));
                } else {
                    setTimeout(checkInitialization, 100);
                }
            };
            
            checkInitialization();
        });
    }

    // Методы для кнопок модального окна
    saveContent() {
        if (!this.universalEditor || !this.currentKnowledgeItem) {
            this.showError('Редактор не готов для сохранения');
            return;
        }
        
        try {
            const content = this.universalEditor.getCurrentContent();
            this.currentKnowledgeItem.content = content;
            
            // Используем существующую систему сохранения
            if (window.dataManager) {
                window.dataManager.saveToLocalStorage();
            }
            
            if (window.authManager) {
                window.authManager.scheduleAutoSave();
            }
            
            if (window.accordionManager) {
                window.accordionManager.renderAccordion();
            }
            
            this.showNotification('Контент сохранен!', 'success');
            
        } catch (error) {
            console.error('Error saving content:', error);
            this.showError('Ошибка сохранения: ' + error.message);
        }
    }

    closeEditor() {
        const modal = document.querySelector('.universal-editor-modal');
        if (modal) {
            modal.remove();
        }
        
        // Очищаем ресурсы редактора
        if (this.universalEditor) {
            this.universalEditor.destroy();
            this.universalEditor = null;
        }
        
        this.isEditorInitialized = false;
        this.currentKnowledgeItem = null;
    }

    // Вспомогательные методы
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        if (window.uiManager && window.uiManager.showNotification) {
            window.uiManager.showNotification(message, type);
        } else {
            // Fallback уведомление
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
                color: white;
                border-radius: 5px;
                z-index: 10000;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => notification.remove(), 3000);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Глобальная инициализация
window.knowledgeIntegration = new KnowledgeBaseIntegration();

// Запускаем интеграцию когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.knowledgeIntegration.init();
    });
} else {
    window.knowledgeIntegration.init();
}
