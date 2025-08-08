class NunjucksPreview {
    constructor() {
        this.variables = new Map();
        this.debounceTimer = null;
        this.editor = null;
        this.lastRenderedContent = '';
        this.init();
    }

    init() {
        this.setupEditor();
        this.bindEvents();
        this.parseInitialTemplate();
    }

    setupEditor() {
        const textarea = document.getElementById('template-editor');
        this.editor = CodeMirror.fromTextArea(textarea, {
            mode: 'htmlmixed',
            theme: 'monokai',
            lineNumbers: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2,
            lineWrapping: true
        });

        this.editor.on('change', () => {
            this.debounceUpdate();
        });
    }

    bindEvents() {
        // Listen for JSON input changes
        const jsonArea = document.getElementById('variables-json');
        if (jsonArea) {
            jsonArea.addEventListener('input', () => this.debounceUpdate());
        }
        const modeSelect = document.getElementById('render-mode');
        if (modeSelect) {
            modeSelect.addEventListener('change', () => this.debounceUpdate());
        }

        // Copy buttons
        const copyTemplateBtn = document.getElementById('copy-template-btn');
        if (copyTemplateBtn) {
            copyTemplateBtn.addEventListener('click', () => this.copyTemplate());
        }

        const copyPreviewBtn = document.getElementById('copy-preview-btn');
        if (copyPreviewBtn) {
            copyPreviewBtn.addEventListener('click', () => this.copyPreview());
        }
    }

    debounceUpdate() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.updatePreview();
        }, 300);
    }

    parseInitialTemplate() {
        setTimeout(() => {
            this.updatePreview();
        }, 100);
    }

    extractVariables(template) {
        // Remove raw blocks so that variables inside are ignored
        const cleanedTemplate = template.replace(/\{%\s*raw\s*%}[\s\S]*?\{%\s*endraw\s*%}/g, '');

        const variables = new Set();
        const internalVars = new Set();

        // Handle set statements separately to distinguish internal vars and external references
        const setStatementRegex = /\{%\s*set\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([\s\S]*?)%}/g;
        let setMatch;
        while ((setMatch = setStatementRegex.exec(cleanedTemplate)) !== null) {
            const definedVar = setMatch[1];
            internalVars.add(definedVar);

            const rhsExpression = setMatch[2];
            const rhsTrim = rhsExpression.trim();
            // If RHS is a quoted constant, skip variable extraction
            if (!(rhsTrim.startsWith('"') || rhsTrim.startsWith("'"))) {
                // Remove quoted string literals from RHS before searching for identifiers
                const rhsNoStrings = rhsExpression.replace(/(['"]).*?\1/g, ' ');
                const rhsVars = rhsNoStrings.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
                rhsVars.forEach(v => {
                    if (!this.isBuiltinOrFilter(v)) {
                        variables.add(v);
                    }
                });
            }
        }

        // Regex patterns for other Nunjucks variable usages
        const patterns = [
            /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s*(?:\|[^}]*)?\}\}/g,
            /\{%\s*if\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g,
            /\{%\s*for\s+[a-zA-Z_][a-zA-Z0-9_]*\s+in\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)/g
        ];
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(cleanedTemplate)) !== null) {
                const variable = match[1];
                if (!this.isBuiltinOrFilter(variable)) {
                    variables.add(variable);
                }
            }
        });

        // Remove any variables that were defined via {% set %}
        internalVars.forEach(v => variables.delete(v));

        return Array.from(variables).sort();
    }

    isBuiltinOrFilter(variable) {
        const builtins = [
            'loop', 'super', 'self', 'varargs', 'kwargs',
            'true', 'false', 'null', 'undefined',
            // logical / keyword-like tokens
            'or', 'and', 'not', 'in', 'is', 'empty', 'none'
        ];
        const commonFilters = [
            'default', 'escape', 'safe', 'upper', 'lower', 'title',
            'length', 'first', 'last', 'random', 'join', 'replace',
            'trim', 'truncate', 'wordwrap', 'center', 'int', 'float',
            'string', 'list', 'attr', 'batch', 'groupby', 'reject',
            'rejectattr', 'select', 'selectattr', 'slice', 'sort',
            'dictsort', 'xmlattr', 'tojson', 'round', 'abs', 'sum'
        ];
        return builtins.includes(variable.toLowerCase()) || commonFilters.includes(variable.toLowerCase()) || variable.includes('.');
    }

    updateVariablesUI(detectedVars) {
        const container = document.getElementById('variables-container');
        if (detectedVars.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path>
                    </svg>
                    <p>No variables detected</p>
                    <small>Variables will appear here when you write your template</small>
                </div>
            `;
            return;
        }
        const existingValues = this.getExistingValues();
        const variablesHTML = detectedVars.map(varName => {
            const currentValue = existingValues[varName] || this.getDefaultValue(varName);
            const inputType = this.guessInputType(varName, currentValue);
            return `
                <div class="variable-item">
                    <label for="var_${varName}">${varName}</label>
                    ${inputType === 'textarea' ? `<textarea id="var_${varName}" name="${varName}" placeholder="Enter ${varName} value...">${currentValue}</textarea>` : `<input type="${inputType}" id="var_${varName}" name="${varName}" value="${currentValue}" placeholder="Enter ${varName} value...">`}
                </div>`;
        }).join('');
        container.innerHTML = variablesHTML;
    }

    getExistingValues() {
        const values = {};
        document.querySelectorAll('#variables-container input, #variables-container textarea').forEach(input => {
            if (input.name) values[input.name] = input.value;
        });
        return values;
    }

    getDefaultValue(varName) {
        const defaults = {
            'name': 'John Doe',
            'title': 'Sample Title',
            'description': 'Sample description',
            'currentTime': new Date().toLocaleString(),
            'showList': 'true',
            'items': JSON.stringify([
                { title: 'Item 1', description: 'First item' },
                { title: 'Item 2', description: 'Second item' }
            ], null, 2)
        };
        if (varName.toLowerCase().includes('time') || varName.toLowerCase().includes('date')) return new Date().toLocaleString();
        if (/(show|is|has)/i.test(varName)) return 'true';
        if (/(list|items|array)/i.test(varName)) return JSON.stringify(['Item 1', 'Item 2', 'Item 3'], null, 2);
        if (/(count|number)/i.test(varName)) return '5';
        return defaults[varName] || '';
    }

    guessInputType(varName, value) {
        if (value && (value.startsWith('[') || value.startsWith('{'))) return 'textarea';
        if (/email/i.test(varName)) return 'email';
        if (/(url|link)/i.test(varName)) return 'url';
        if (/(count|number)/i.test(varName)) return 'number';
        if (/(time|date)/i.test(varName)) return 'datetime-local';
        if (value && value.length > 50) return 'textarea';
        return 'text';
    }

    collectVariableValues() {
        const values = {};
        document.querySelectorAll('#variables-container input, #variables-container textarea').forEach(input => {
            if (!input.name) return;
            let value = input.value;
            if (value.startsWith('[') || value.startsWith('{')) {
                try { value = JSON.parse(value); } catch {}
            } else if (/^(true|false)$/i.test(value)) {
                value = value.toLowerCase() === 'true';
            } else if (!isNaN(value) && value !== '') {
                value = parseFloat(value);
            }
            values[input.name] = value;
        });
        return values;
    }

    updateStatus(status, isError = false) {
        document.getElementById('status-dot').className = `status-dot ${isError ? 'error' : ''}`;
        document.getElementById('status-text').textContent = status;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    parseMarkdown(text) {
        // Simple Markdown parser for basic formatting
        let html = this.escapeHtml(text);
        
        // Headers
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2">$1</a>');
        
        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        
        return html;
    }

    async copyTemplate() {
        try {
            const templateContent = this.editor.getValue();
            await navigator.clipboard.writeText(templateContent);
            this.showCopySuccess('copy-template-btn');
        } catch (err) {
            console.error('Failed to copy template:', err);
            this.showCopyError('copy-template-btn');
        }
    }

    async copyPreview() {
        try {
            if (!this.lastRenderedContent) {
                throw new Error('No content to copy');
            }
            await navigator.clipboard.writeText(this.lastRenderedContent);
            this.showCopySuccess('copy-preview-btn');
        } catch (err) {
            console.error('Failed to copy preview:', err);
            this.showCopyError('copy-preview-btn');
        }
    }

    showCopySuccess(buttonId) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            const originalText = btn.querySelector('span:last-child').textContent;
            btn.classList.add('success');
            btn.querySelector('span:last-child').textContent = 'Copied!';
            setTimeout(() => {
                btn.classList.remove('success');
                btn.querySelector('span:last-child').textContent = originalText;
            }, 2000);
        }
    }

    showCopyError(buttonId) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            const originalText = btn.querySelector('span:last-child').textContent;
            btn.querySelector('span:last-child').textContent = 'Failed';
            setTimeout(() => {
                btn.querySelector('span:last-child').textContent = originalText;
            }, 2000);
        }
    }

    async updatePreview() {
        const template = this.editor.getValue();
        const previewContent = document.getElementById('preview-content');
        const emptyState = document.getElementById('empty-state');
        const frame = document.getElementById('preview-frame');
        if (!template.trim()) {
            if (frame) {
                frame.style.display = 'none';
                frame.src = 'about:blank';
            }
            if (emptyState) emptyState.style.display = '';
            this.updateStatus('Ready');
            return;
        }
        let variables = {};
        try {
            const jsonText = document.getElementById('variables-json').value;
            variables = jsonText.trim() ? JSON.parse(jsonText) : {};
        } catch (err) {
            previewContent.innerHTML = `<div class="error"><strong>JSON Error:</strong><br>${err.message}</div>`;
            this.updateStatus('JSON Error', true);
            return;
        }
        try {
            this.updateStatus('Rendering...');
            const res = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ template, variables }) });
            const result = await res.json();
            if (result.success) {
                const content = result.html;
                this.lastRenderedContent = content; // Store for copying
                const renderMode = document.getElementById('render-mode')?.value || 'text';
                
                if (emptyState) emptyState.style.display = 'none';
                
                if (renderMode === 'markdown') {
                    // Render as HTML in iframe for Markdown
                    if (frame) {
                        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 20px; padding-bottom: 40px; max-width: 800px; margin: 0 auto; }
        h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
        h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 10px; }
        h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 8px; }
        p { margin-bottom: 16px; }
        code { background: #f6f8fa; padding: 2px 4px; border-radius: 3px; font-family: 'SF Mono', Monaco, monospace; font-size: 85%; }
        pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow: auto; }
        pre code { background: none; padding: 0; }
        blockquote { margin: 0; padding: 0 16px; color: #6a737d; border-left: 4px solid #dfe2e5; }
        ul, ol { padding-left: 30px; margin-bottom: 16px; }
        li { margin-bottom: 4px; }
        a { color: #0366d6; text-decoration: none; }
        a:hover { text-decoration: underline; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
        th, td { border: 1px solid #dfe2e5; padding: 6px 13px; }
        th { background: #f6f8fa; font-weight: 600; }
    </style>
</head>
<body>${this.parseMarkdown(content)}</body>
</html>`;
                        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        frame.style.display = 'block';
                        frame.onload = () => URL.revokeObjectURL(url);
                        frame.src = url;
                    }
                } else {
                    // Text mode - show plain text with line numbers in iframe
                    if (frame) {
                        const lines = content.split('\n');
                        const numberedContent = lines.map((line, index) => {
                            const lineNumber = (index + 1).toString().padStart(3, ' ');
                            return `<div class="line"><span class="line-number">${lineNumber}</span><span class="line-content">${this.escapeHtml(line)}</span></div>`;
                        }).join('');
                        
                        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; 
            line-height: 1.2; 
            padding: 0;
            padding-bottom: 40px;
            margin: 0; 
            white-space: pre-wrap; 
            word-wrap: break-word;
            font-size: 14px;
            background: #fafbfc;
        }
        .line {
            display: flex;
            min-height: 18px;
        }
        .line:nth-child(even) {
            background: rgba(0, 0, 0, 0.02);
        }
        .line:hover {
            background: rgba(59, 130, 246, 0.05);
        }
        .line-number {
            background: #f6f8fa;
            color: #656d76;
            padding: 2px 8px;
            text-align: right;
            user-select: none;
            border-right: 1px solid #e1e4e8;
            min-width: 40px;
            flex-shrink: 0;
            font-size: 13px;
            font-weight: 400;
        }
        .line-content {
            padding: 2px 16px;
            flex: 1;
            background: transparent;
        }
        .line-content:empty::before {
            content: " ";
        }
    </style>
</head>
<body>${numberedContent}</body>
</html>`;
                        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        frame.style.display = 'block';
                        frame.onload = () => URL.revokeObjectURL(url);
                        frame.src = url;
                    }
                }
                this.updateStatus('Rendered');
            } else {
                if (frame) frame.style.display = 'none';
                if (emptyState) emptyState.style.display = '';
                previewContent.innerHTML = `<div class="error"><strong>Rendering Error:</strong><br>${result.error}</div>`;
                this.updateStatus('Error', true);
            }
        } catch (err) {
            if (frame) frame.style.display = 'none';
            if (emptyState) emptyState.style.display = '';
            previewContent.innerHTML = `<div class="error"><strong>Network Error:</strong><br>${err.message}</div>`;
            this.updateStatus('Network Error', true);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new NunjucksPreview());