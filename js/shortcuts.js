// Gestion centralisée des raccourcis clavier + overlay visuel

let _shortcutsInit = false;
let _overlay;
let _overlayTimer;
let _bindings = {};

export function initShortcuts(bindings) {
    if (_shortcutsInit) {
        // Mise à jour dynamique des bindings si déjà initialisé
        _bindings = { ..._bindings, ...bindings };
        return;
    }
    _shortcutsInit = true;
    _bindings = { ...bindings };

    // Crée l'overlay
    _overlay = document.createElement('div');
    _overlay.id = 'shortcutOverlay';
    document.body.appendChild(_overlay);

    document.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        let key = e.key.toLowerCase();
        if (key === 'spacebar') key = ' ';
        const binding = _bindings[key];
        if (!binding) return;

        e.preventDefault();
        if (e.repeat) return;

        try {
            binding.fn?.();
        } catch (err) {
            console.error('Erreur exécution raccourci', key, err);
        }
        showOverlay(binding.label, binding.color);
    });
}

export function addShortcut(key, fn, label, color = '#3b82f6') {
    _bindings[key.toLowerCase()] = { fn, label, color };
}

export function removeShortcut(key) {
    delete _bindings[key.toLowerCase()];
}

function showOverlay(label, color) {
    if (!_overlay) return;
    _overlay.textContent = label;
    _overlay.style.background = color;
    _overlay.style.color = isColorLight(color) ? '#0d1117' : '#ffffff';
    _overlay.classList.add('show');
    if (_overlayTimer) clearTimeout(_overlayTimer);
    _overlayTimer = setTimeout(() => _overlay.classList.remove('show'), 200);
}

function isColorLight(hex) {
    const h = (hex || '').replace('#', '');
    if (h.length === 3) {
        // #abc -> #aabbcc
        const r = h[0], g = h[1], b = h[2];
        return isColorLight(r + r + g + g + b + b);
    }
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    return l > 160;
}