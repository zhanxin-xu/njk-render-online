class NunjucksPreview {
    constructor() {
        this.variables = new Map();
        this.debounceTimer = null;
        this.editor = null;
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

    async updatePreview() {
        const template = this.editor.getValue();
        const previewContent = document.getElementById('preview-content');
        if (!template.trim()) {
            previewContent.innerHTML = `<div class="empty-state"><svg fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg><p>Template preview will appear here</p><small>Start typing in the template editor to see results</small></div>`;
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
                    const renderedHtml = result.html.replace(/<!--([\s\S]*?)-->/g, '<span class="html-comment">&lt;!--$1--&gt;</span>');
                    previewContent.innerHTML = renderedHtml;
                    this.updateStatus('Rendered');
            } else {
                previewContent.innerHTML = `<div class="error"><strong>Rendering Error:</strong><br>${result.error}</div>`;
                this.updateStatus('Error', true);
            }
        } catch (err) {
            previewContent.innerHTML = `<div class="error"><strong>Network Error:</strong><br>${err.message}</div>`;
            this.updateStatus('Network Error', true);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new NunjucksPreview());