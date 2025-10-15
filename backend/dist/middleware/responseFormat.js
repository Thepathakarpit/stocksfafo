"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatResponseMiddleware = formatResponseMiddleware;
const ansi = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    fg: {
        green: '\x1b[32m',
        red: '\x1b[31m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
    },
};
function pad(text, width) {
    const truncated = text.length > width ? text.slice(0, width - 1) + '…' : text;
    return truncated + ' '.repeat(Math.max(0, width - truncated.length));
}
function formatKeyValueBlock(title, data) {
    const keys = Object.keys(data);
    const keyWidth = Math.min(Math.max(...keys.map(k => k.length)), 24);
    const lines = keys.map(k => `${ansi.dim}${pad(k, keyWidth)}${ansi.reset}  ${String(data[k])}`);
    return `${ansi.bold}${title}${ansi.reset}\n${lines.join('\n')}`;
}
function formatTable(title, rows, columns) {
    if (!rows || rows.length === 0) {
        return `${ansi.bold}${title}${ansi.reset}\n${ansi.dim}(no data)${ansi.reset}`;
    }
    const sample = rows[0];
    const cols = columns && columns.length > 0 ? columns : Object.keys(sample);
    const colWidths = cols.map(col => {
        const headerLen = col.length;
        const maxCellLen = Math.max(...rows.map(r => String(r[col] ?? '').length));
        return Math.min(Math.max(headerLen, maxCellLen, 6), 28);
    });
    const header = cols.map((c, i) => pad(c.toUpperCase(), colWidths[i])).join('  ');
    const sep = colWidths.map(w => '─'.repeat(w)).join('  ');
    const body = rows.map(r => cols.map((c, i) => pad(String(r[c] ?? ''), colWidths[i])).join('  ')).join('\n');
    return `${ansi.bold}${title}${ansi.reset}\n${ansi.dim}${header}${ansi.reset}\n${sep}\n${body}`;
}
function toCli(body, path) {
    if (body && typeof body === 'object') {
        const success = body.success === undefined ? true : Boolean(body.success);
        const statusBadge = success ? `${ansi.fg.green}✔ SUCCESS${ansi.reset}` : `${ansi.fg.red}✖ ERROR${ansi.reset}`;
        const title = `${statusBadge}  ${ansi.dim}${path}${ansi.reset}`;
        if (body.user) {
            return [
                title,
                formatKeyValueBlock('User', body.user),
                body.token ? `${ansi.dim}Token:${ansi.reset} ${body.token}` : ''
            ].filter(Boolean).join('\n\n');
        }
        if (Array.isArray(body.data)) {
            const rows = body.data.map((s) => ({
                Symbol: s.symbol,
                Name: s.name,
                Price: s.price,
                Change: s.change,
                '%': s.changePercent,
            }));
            return [
                title,
                formatTable(`${body.message || 'Data'}`, rows, ['Symbol', 'Name', 'Price', 'Change', '%'])
            ].join('\n\n');
        }
        if (body.portfolio) {
            const p = body.portfolio;
            const summary = {
                cash: p.cash,
                totalValue: p.totalValue ?? (p.cash + (p.stocks?.reduce((t, st) => t + (st.value ?? st.quantity * (st.currentPrice ?? 0)), 0) || 0)),
                totalInvested: p.totalInvested ?? 0,
                stocksCount: Array.isArray(p.stocks) ? p.stocks.length : 0,
                transactions: Array.isArray(p.transactions) ? p.transactions.length : 0,
            };
            const holdings = Array.isArray(p.stocks) ? p.stocks.map((h) => ({
                Symbol: h.symbol,
                Name: h.name,
                Qty: h.quantity,
                Avg: h.avgPrice,
                Price: h.currentPrice,
                Value: h.value ?? h.quantity * h.currentPrice,
                'P/L%': h.gainLossPercent ?? 0,
            })) : [];
            return [
                title,
                formatKeyValueBlock('Portfolio', summary),
                formatTable('Holdings', holdings, ['Symbol', 'Name', 'Qty', 'Avg', 'Price', 'Value', 'P/L%'])
            ].join('\n\n');
        }
        if (body.summary) {
            return [
                title,
                formatKeyValueBlock('Summary', body.summary)
            ].join('\n\n');
        }
        if (body.holdings) {
            const rows = body.holdings.map((h) => ({
                Symbol: h.symbol,
                Name: h.name,
                Qty: h.quantity,
                Avg: h.avgPrice,
                Price: h.currentPrice,
                Value: h.value,
                'P/L%': h.gainLossPercent,
            }));
            return [
                title,
                formatTable('Holdings', rows, ['Symbol', 'Name', 'Qty', 'Avg', 'Price', 'Value', 'P/L%'])
            ].join('\n\n');
        }
        if (body.transactions) {
            const rows = body.transactions.map((t) => ({
                ID: t.id,
                Type: t.type,
                Symbol: t.symbol,
                Qty: t.quantity,
                Price: t.price,
                Time: t.timestamp?.replace('T', ' ').replace('Z', ''),
            }));
            return [
                title,
                formatTable('Transactions', rows, ['ID', 'Type', 'Symbol', 'Qty', 'Price', 'Time'])
            ].join('\n\n');
        }
    }
    return JSON.stringify(body, null, 2);
}
function formatResponseMiddleware(req, res, next) {
    const ua = String(req.headers['user-agent'] || '').toLowerCase();
    const accept = String(req.headers.accept || '');
    const isCliAgent = ua.includes('curl') || ua.includes('httpie') || ua.includes('wget');
    const wantsCli = (req.query.format === 'cli') || /text\/plain/.test(accept) || isCliAgent;
    const wantsPretty = wantsCli || req.query.pretty === '1' || req.query.pretty === 'true';
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        try {
            if (wantsCli) {
                const text = toCli(body, req.path);
                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                return res.send(text);
            }
            if (wantsPretty) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                return res.send(JSON.stringify(body, null, 2));
            }
            return originalJson(body);
        }
        catch (err) {
            return originalJson(body);
        }
    };
    next();
}
//# sourceMappingURL=responseFormat.js.map