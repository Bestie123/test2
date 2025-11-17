// scripts/integration.js
class KnowledgeBaseIntegration {
    constructor() {
        this.isInitialized = false;
        this.currentItem = null;
    }

    init() {
        if (this.isInitialized) return;
        
        this.patchKnowledgeManager();
        this.addStyles();
        this.isInitialized = true;
        
        console.log('KnowledgeBaseIntegration initialized');
    }

    addStyles() {
        const styles = `
            .universal-editor-modal .modal-content {
                padding: 0 !important;
                border-radius: 10px !important;
                overflow: hidden;
                width: 95% !important;
                height: 90vh !important;
                max-width: 1400px !important;
            }
            
            .editor-views {
                height: calc(100% - 100px);
                position: relative;
            }
            
            .editor-view {
                display: none;
                height: 100%;
            }
            
            .editor-view.active {
                display: block;
            }
            
            .mode-btn {
                padding: 8px 16px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .mode-btn.active {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
            
            .mode-btn:hover {
                background: #f8f9fa;
            }
            
            .mode-btn.active:hover {
                background: #0056b3;
            }
            
            .editor-control-panel {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                background: white;
                border-bottom: 1px solid #e9ecef;
            }
            
            .mode-selector {
                display: flex;
                gap: 8px;
            }
            
            .editor-tools {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .tool-btn {
                padding: 6px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                cursor: pointer;
            }
            
            .tool-btn.success {
                background: #28a745;
                color: white;
                border-color: #28a745;
            }
            
            .status-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 20px;
                background: white;
                border-top: 1px solid #e9ecef;
                font-size: 12px;
                color: #6c757d;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    patchKnowledgeManager() {
        if (!window.knowledgeManager) {
            console.warn('knowledgeManager not found, retrying...');
            setTimeout(() => this.patchKnowledgeManager(), 1000);
            return;
        }

        // Сохраняем оригинальный метод
        const originalOpen = window.knowledgeManager.openKnowledgeBase;
        
        // Заменяем метод
        window.knowledgeManager.openKnowledgeBase = (pathStr, index) => {
            const path = JSON.parse(pathStr);
            const item = window.dataManager.getNodeAtIndex(path, index);
            
            if (!item) {
                window.uiManager.showNotification('Элемент не найден', 'error');
                return;
            }
            
            // Используем наш редактор
            this.openWithUniversalEditor(item);
        };
        
        console.log('KnowledgeManager patched successfully');
    }

    openWithUniversalEditor(item) {
        this.currentItem = item;
        this.createEditorModal(item);
    }

    createEditorModal(item) {
        // Удаляем существующее модальное окно
        this.closeEditor();
        
        // Создаем новое модальное окно
        const modal = document.createElement('div');
        modal.className = 'modal universal-editor-modal';
        modal.style.display = 'block';
        modal.id = 'universal-editor-modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📚 ${this.escapeHtml(item.name)}</h3>
                    <button onclick="window.knowledgeIntegration.closeEditor()">✕</button>
                </div>
                
                <div id="universal-editor-container" style="height: calc(100vh - 150px);">
                    <!-- Редактор будет вставлен сюда -->
                </div>
                
                <div style="padding: 15px; border-top: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <button onclick="window.knowledgeIntegration.saveToKnowledgeBase()" 
                                style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            💾 Сохранить в базу знаний
                        </button>
                        <button onclick="window.knowledgeIntegration.closeEditor()" 
                                style="padding: 8px 16px; margin-left: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Закрыть
                        </button>
                    </div>
                    <div style="color: #6c757d; font-size: 0.9em;">
                        Универсальный редактор
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Инициализируем редактор
        this.initializeEditor(item);
    }

    initializeEditor(item) {
        const container = document.getElementById('universal-editor-container');
        if (!container) return;

        // Создаем экземпляр редактора
        window.editorInstance = new EditorCore();
        
        // Загружаем контент элемента
        if (item.content) {
            setTimeout(() => {
                window.editorInstance.setContent(item.content);
            }, 100);
        }
    }

    saveToKnowledgeBase() {
        if (!this.currentItem || !window.editorInstance) {
            this.showError('Не удалось сохранить: редактор не готов');
            return;
        }
        
        try {
            const content = window.editorInstance.getContent();
            this.currentItem.content = content;
            
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
            
            this.showNotification('Контент сохранен в базу знаний!', 'success');
            
        } catch (error) {
            console.error('Error saving to knowledge base:', error);
            this.showError('Ошибка сохранения: ' + error.message);
        }
    }

    closeEditor() {
        const modal = document.getElementById('universal-editor-modal');
        if (modal) {
            modal.remove();
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
            // Fallback
            alert(message);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Инициализация
window.knowledgeIntegration = new KnowledgeBaseIntegration();

// Автоматическая инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.knowledgeIntegration.init();
    });
} else {
    window.knowledgeIntegration.init();
}
