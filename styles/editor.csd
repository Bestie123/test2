/* Toast UI Editor кастомизация */
.toastui-editor-defaultUI {
    border: none !important;
    border-radius: 0 !important;
}

.toastui-editor-defaultUI-toolbar {
    background: #f8f9fa !important;
    border-bottom: 1px solid #e9ecef !important;
    padding: 10px !important;
}

.toastui-editor-mode-switch {
    background: white !important;
    border: 1px solid #e9ecef !important;
}

/* Monaco Editor кастомизация */
.monaco-editor {
    padding: 20px;
}

.monaco-editor .view-lines {
    font-family: 'Fira Code', 'Courier New', monospace !important;
}

/* Editor.js кастомизация */
.codex-editor {
    padding: 20px;
}

.codex-editor__redactor {
    padding-bottom: 100px !important;
}

.ce-block__content {
    max-width: none !important;
}

.ce-toolbar__content {
    max-width: none !important;
}

/* Split View Preview */
#split-preview {
    padding: 20px;
    overflow-y: auto;
    background: white;
}

.preview-content {
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
}

.preview-content h1,
.preview-content h2,
.preview-content h3,
.preview-content h4 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    color: #2c3e50;
}

.preview-content h1 {
    font-size: 2em;
    border-bottom: 2px solid #3498db;
    padding-bottom: 10px;
}

.preview-content h2 {
    font-size: 1.5em;
    border-bottom: 1px solid #bdc3c7;
    padding-bottom: 5px;
}

.preview-content code {
    background: #f8f9fa;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
}

.preview-content pre {
    background: #2c3e50;
    color: #ecf0f1;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
}

.preview-content pre code {
    background: none;
    padding: 0;
    color: inherit;
}

/* Анимации переключения */
.editor-view {
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.editor-view.active {
    opacity: 1;
    transform: translateY(0);
}

/* Уведомления */
.editor-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    color: white;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
}

.editor-notification.show {
    transform: translateX(0);
}

.editor-notification.success {
    background: #28a745;
}

.editor-notification.error {
    background: #dc3545;
}

.editor-notification.warning {
    background: #ffc107;
    color: #212529;
}

/* Loading states */
.editor-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 16px;
    color: #6c757d;
}

.editor-loading::after {
    content: '';
    width: 20px;
    height: 20px;
    margin-left: 10px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #007bff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
