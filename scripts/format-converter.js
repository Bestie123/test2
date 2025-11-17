class FormatConverter {
    constructor() {
        this.marked = window.marked || null;
        this.initMarked();
    }

    initMarked() {
        if (this.marked) {
            this.marked.setOptions({
                highlight: function(code, lang) {
                    if (window.hljs) {
                        const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                        return hljs.highlight(code, { language }).value;
                    }
                    return code;
                },
                langPrefix: 'hljs language-',
                breaks: true,
                gfm: true
            });
        }
    }

    // Markdown to HTML
    markdownToHtml(markdown) {
        if (this.marked) {
            return this.marked.parse(markdown);
        }
        
        // Простой парсер если marked не загружен
        return markdown
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            .replace(/`(.*)`/gim, '<code>$1</code>')
            .replace(/\n/gim, '<br>');
    }

    // HTML to Markdown (упрощенный)
    htmlToMarkdown(html) {
        return html
            .replace(/<h1>(.*?)<\/h1>/gim, '# $1\n\n')
            .replace(/<h2>(.*?)<\/h2>/gim, '## $1\n\n')
            .replace(/<h3>(.*?)<\/h3>/gim, '### $1\n\n')
            .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
            .replace(/<em>(.*?)<\/em>/gim, '*$1*')
            .replace(/<code>(.*?)<\/code>/gim, '`$1`')
            .replace(/<br\s*\/?>/gim, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    // Editor.js JSON to Markdown
    editorJsToMarkdown(blocks) {
        if (!blocks || !Array.isArray(blocks)) return '';
        
        return blocks.map(block => {
            switch(block.type) {
                case 'header':
                    return '#'.repeat(block.data.level) + ' ' + block.data.text + '\n\n';
                case 'paragraph':
                    return block.data.text + '\n\n';
                case 'list':
                    return block.data.items
                        .map((item, index) => 
                            block.data.style === 'ordered' 
                                ? `${index + 1}. ${item}` 
                                : `- ${item}`
                        )
                        .join('\n') + '\n\n';
                case 'code':
                    return '```' + (block.data.language || '') + '\n' + 
                           block.data.code + '\n```\n\n';
                case 'quote':
                    return '> ' + block.data.text + '\n\n';
                default:
                    return '';
            }
        }).join('');
    }

    // Markdown to Editor.js JSON
    markdownToEditorJs(markdown) {
        const lines = markdown.split('\n');
        const blocks = [];
        let currentParagraph = '';
        
        lines.forEach(line => {
            line = line.trim();
            
            if (!line) {
                if (currentParagraph) {
                    blocks.push({
                        type: 'paragraph',
                        data: { text: currentParagraph.trim() }
                    });
                    currentParagraph = '';
                }
                return;
            }
            
            // Заголовки
            const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
            if (headerMatch) {
                if (currentParagraph) {
                    blocks.push({
                        type: 'paragraph',
                        data: { text: currentParagraph.trim() }
                    });
                    currentParagraph = '';
                }
                
                blocks.push({
                    type: 'header',
                    data: {
                        level: headerMatch[1].length,
                        text: headerMatch[2]
                    }
                });
                return;
            }
            
            // Код блоки
            if (line.startsWith('```')) {
                if (currentParagraph) {
                    blocks.push({
                        type: 'paragraph',
                        data: { text: currentParagraph.trim() }
                    });
                    currentParagraph = '';
                }
                // Пропускаем обработку код блоков для простоты
                currentParagraph += line + '\n';
                return;
            }
            
            // Цитаты
            if (line.startsWith('> ')) {
                if (currentParagraph) {
                    blocks.push({
                        type: 'paragraph',
                        data: { text: currentParagraph.trim() }
                    });
                    currentParagraph = '';
                }
                
                blocks.push({
                    type: 'quote',
                    data: { text: line.substring(2) }
                });
                return;
            }
            
            // Списки
            if (line.match(/^[-*]\s+/)) {
                if (currentParagraph) {
                    blocks.push({
                        type: 'paragraph',
                        data: { text: currentParagraph.trim() }
                    });
                    currentParagraph = '';
                }
                
                // Упрощенная обработка списков
                blocks.push({
                    type: 'list',
                    data: {
                        style: 'unordered',
                        items: [line.replace(/^[-*]\s+/, '')]
                    }
                });
                return;
            }
            
            // Обычный текст
            currentParagraph += line + ' ';
        });
        
        // Добавляем последний параграф
        if (currentParagraph.trim()) {
            blocks.push({
                type: 'paragraph',
                data: { text: currentParagraph.trim() }
            });
        }
        
        return {
            time: Date.now(),
            blocks: blocks
        };
    }

    // Универсальный конвертер
    convert(content, fromFormat, toFormat) {
        if (fromFormat === toFormat) return content;
        
        try {
            switch(fromFormat + '_to_' + toFormat) {
                case 'markdown_to_html':
                    return this.markdownToHtml(content);
                case 'html_to_markdown':
                    return this.htmlToMarkdown(content);
                case 'editorjs_to_markdown':
                    return this.editorJsToMarkdown(content.blocks || content);
                case 'markdown_to_editorjs':
                    return this.markdownToEditorJs(content);
                case 'html_to_editorjs':
                    const md = this.htmlToMarkdown(content);
                    return this.markdownToEditorJs(md);
                case 'editorjs_to_html':
                    const mdFromEditor = this.editorJsToMarkdown(content.blocks || content);
                    return this.markdownToHtml(mdFromEditor);
                default:
                    console.warn(`Конвертация из ${fromFormat} в ${toFormat} не поддерживается`);
                    return content;
            }
        } catch (error) {
            console.error('Ошибка конвертации:', error);
            return content;
        }
    }
}
