const nunjucks = require('nunjucks');

// Configure Nunjucks (no autoescape to support generic XML/text rendering)
const env = new nunjucks.Environment();

// Add some useful filters
env.addFilter('formatDate', function(date, format) {
    if (!date) return '';
    const d = new Date(date);
    if (format === 'short') {
        return d.toLocaleDateString();
    } else if (format === 'long') {
        return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    }
    return d.toLocaleString();
});

env.addFilter('currency', function(amount, currency = 'USD') {
    if (typeof amount !== 'number') {
        amount = parseFloat(amount) || 0;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
});

env.addFilter('highlight', function(text, query) {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
});

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { template, variables = {} } = req.body;

        if (!template) {
            return res.status(400).json({ 
                success: false, 
                error: 'Template is required' 
            });
        }

        // Add some default variables that are commonly useful
        const defaultVariables = {
            currentTime: new Date().toLocaleString(),
            currentDate: new Date().toLocaleDateString(),
            currentYear: new Date().getFullYear(),
            ...variables
        };

        // Render the template
        const html = env.renderString(template, defaultVariables);

        res.status(200).json({
            success: true,
            html: html,
            variables: defaultVariables
        });

    } catch (error) {
        // Parse Nunjucks errors to provide more helpful messages
        let errorMessage = error.message;
        
        if (error.name === 'Template render error') {
            // Extract line and column information if available
            const match = error.message.match(/\((\d+):(\d+)\)/);
            if (match) {
                const [, line, column] = match;
                errorMessage = `Line ${line}, Column ${column}: ${error.message}`;
            }
        }

        res.status(400).json({
            success: false,
            error: errorMessage,
            type: error.name || 'TemplateError'
        });
    }
}
