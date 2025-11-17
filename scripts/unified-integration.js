// scripts/unified-integration.js
class UnifiedKnowledgeEditor {
    constructor() {
        this.editor = null;
        this.currentItem = null;
    }

    init() {
        this.patchKnowledgeManager();
        this.addStyles();
        console.log('UnifiedKnowledgeEditor initialized');
    }

    addStyles() {
        const styles = `
            .unified-knowledge-modal .modal-content {
                padding: 0 !important;
                border-radius: 10px !important;
                overflow: hidden;
                width: 95% !important;
                height: 90vh !important;
                max-width: none !important;
            }
            
            #unified-editor-container {
                height: calc(100% - 60px) !important;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    patchKnowledgeManager() {
        if (!window.knowledgeManager) {
            setTimeout(() => this.patchKnowledgeManager(), 1000);
            return;
        }

        const originalOpen = window.knowledgeManager.openKnowledgeBase;
        
        window.knowledgeManager.openKnowledgeBase = (pathStr, index) => {
            const path = JSON.parse(pathStr);
            const item = window.dataManager.getNodeAtIndex(path, index);
            
            if (!item) {
                window.uiManager.showNotification('Элемент не найден', 'error');
                return;
            }
            
            this.openWithUnifiedEditor(item);
        };
    }

    openWithUnifiedEditor(item) {
        this.currentItem = item;
        this.createEditorModal(item);
    }

    createEditorModal(item) {
        // Закрываем существующие модальные окна
        this.closeEditor();
        
        const modal = document.createElement('div');
        modal.className = 'modal unified-knowledge-modal';
        modal.style.display = 'block';
        modal.id = 'unified-knowledge-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📚 ${this.escapeHtml(item.name)} - Универсальный редактор</h3>
                    <button onclick="window.unifiedKnowledgeEditor.closeEditor()">✕</button>
                </div>
                <div id="unified-editor-container" style="height: calc(100vh - 150px);"></div>
                <div style="padding: 15px; border-top: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <button onclick="window.unifiedKnowledgeEditor.saveToKnowledgeBase()" 
                                style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            💾 Сохранить в базу знаний
                        </button>
                        <button onclick="window.unifiedKnowledgeEditor.closeEditor()" 
                                style="padding: 8px 16px; margin-left: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Закрыть
                        </button>
                    </div>
                    <div style="color: #6c757d; font-size: 0.9em;">
                        Мощный универсальный редактор
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Инициализируем редактор
        this.initializeEditor(item);
    }

    initializeEditor(item) {
        const container = document.getElementById('unified-editor-container');
        if (!container) return;

        // Создаем редактор
        this.editor = new UnifiedEditor('unified-editor-container', {
            initialContent: item.content || '',
            autoSave: true,
            syncDelay: 3000
        });

        // Сохраняем ссылку на элемент
        this.currentItem = item;
    }

    saveToKnowledgeBase() {
        if (!this.currentItem || !this.editor) {
            this.showError('Редактор не готов для сохранения');
            return;
        }
        
        try {
            const content = this.editor.getContent();
            this.currentItem.content = content;
            
            // Используем существующую систему
            if (window.dataManager) {
                window.dataManager.saveToLocalStorage();
            }
            
            if (window.authManager) {
                window.authManager.scheduleAutoSave();
            }
            
            if (window.accordionManager) {
                window.accordionManager.renderAccordion();
            }
            
            this.showNotification('Контент сохранен в базу знаний!', 'success');
            
        } catch (error) {
            console.error('Error saving to knowledge base:', error);
            this.showError('Ошибка сохранения: ' + error.message);
        }
    }

    closeEditor() {
        const modal = document.getElementById('unified-knowledge-modal');
        if (modal) {
            modal.remove();
        }
        
        if (this.editor) {
            this.editor.destroy();
            this.editor = null;
        }
        
        this.currentItem = null;
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
            alert(message);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Инициализация
window.unifiedKnowledgeEditor = new UnifiedKnowledgeEditor();

// Автоматическая инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.unifiedKnowledgeEditor.init();
    });
} else {
    window.unifiedKnowledgeEditor.init();
}
