class ModeManager {
    constructor(editorCore) {
        this.core = editorCore;
        this.currentMode = 'markdown';
        this.previousMode = null;
        this.modeHistory = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Обработчики кнопок переключения режимов
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.switchMode(mode);
            });
        });

        // Горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
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
                    case '4':
                        e.preventDefault();
                        this.switchMode('blocks');
                        break;
                    case '5':
                        e.preventDefault();
                        this.switchMode('split');
                        break;
                }
            }
        });
    }

    async switchMode(newMode) {
        if (this.currentMode === newMode) return;
        
        // Сохраняем текущий контент
        await this.saveCurrentContent();
        
        // Обновляем историю
        this.modeHistory.push(this.currentMode);
        if (this.modeHistory.length > 10) {
            this.modeHistory.shift();
        }
        
        this.previousMode = this.currentMode;
        this.currentMode = newMode;
        
        // Переключаем UI
        this.updateUI();
        
        // Загружаем контент в новый режим
        await this.loadContentToNewMode();
        
        // Обновляем статус
        this.updateStatus();
        
        console.log(`Переключен режим: ${this.previousMode} → ${newMode}`);
    }

    updateUI() {
        // Обновляем кнопки
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });
        
        // Переключаем видимость редакторов
        document.querySelectorAll('.editor-view').forEach(view => {
            view.classList.remove('active');
        });
        
        const activeView = document.getElementById(this.getViewId(this.currentMode));
        if (activeView) {
            activeView.classList.add('active');
        }
        
        // Обновляем информацию о формате
        document.getElementById('currentFormat').textContent = this.getFormatForMode(this.currentMode);
    }

    getViewId(mode) {
        const viewMap = {
            'markdown': 'toastui-editor',
            'wysiwyg': 'toastui-editor',
            'code': 'monaco-editor',
            'blocks': 'editorjs-container',
            'split': 'split-view'
        };
        return viewMap[mode];
    }

    getFormatForMode(mode) {
        const formatMap = {
            'markdown': 'markdown',
            'wysiwyg': 'html',
            'code': 'markdown',
            'blocks': 'editorjs',
            'split': 'markdown'
        };
        return formatMap[mode];
    }

    async saveCurrentContent() {
        const content = this.core.getContent(this.getFormatForMode(this.currentMode));
        this.core.setContent(content, this.getFormatForMode(this.currentMode));
    }

    async loadContentToNewMode() {
        const content = this.core.getContent(this.getFormatForMode(this.previousMode));
        const targetFormat = this.getFormatForMode(this.currentMode);
        
        this.core.setContent(content, targetFormat);
        
        // Особые случаи
        if (this.currentMode === 'split') {
            this.updateSplitView();
        }
    }

    updateSplitView() {
        const content = this.core.getContent('markdown');
        const html = this.core.converter.markdownToHtml(content);
        document.getElementById('split-preview').innerHTML = 
            `<div class="preview-content">${html}</div>`;
    }

    updateStatus() {
        document.getElementById('currentMode').textContent = this.currentMode;
        this.updateStats();
    }

    updateStats() {
        const content = this.core.getContent('markdown');
        const charCount = content.length;
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        
        document.getElementById('charCount').textContent = charCount;
        document.getElementById('wordCount').textContent = wordCount;
    }

    // Возврат к предыдущему режиму
    goBack() {
        if (this.modeHistory.length > 0) {
            const previous = this.modeHistory.pop();
            this.switchMode(previous);
        }
    }

    // Получение текущего состояния
    getState() {
        return {
            currentMode: this.currentMode,
            previousMode: this.previousMode,
            history: [...this.modeHistory]
        };
    }
}
