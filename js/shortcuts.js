// Gestion centralisée des raccourcis clavier + overlay visuel

let _shortcutsInit = false;
let _overlay;
let _overlayTimer;
let _bindings = {};
let _actionMeta = {}; // { actionName: { fn,label,color } }
let _keyByAction = {}; // { actionName: key }
let _actionByKey = {}; // { key: actionName }

const STORAGE_KEY = 'shortcutConfigV1';

export function initShortcuts(actionMeta, initialActionToKey) {
    // actionMeta: { random:{fn,label,color}, keep:{...}, ... }
    _actionMeta = actionMeta;
    // Charger config sauvegardée ou utiliser celle passée
    const saved = loadConfig();
    _keyByAction = saved || { ...initialActionToKey };
    rebuildKeyIndex();

    if (_shortcutsInit) {
        rebuildBindings();
        return;
    }
    _shortcutsInit = true;
    rebuildBindings();

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
        const action = _actionByKey[key];
        if (!action) return;

        const binding = _bindings[key];
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

export function updateShortcut(actionName, newKey) {
    actionName = actionName.toLowerCase();
    newKey = normalizeKey(newKey);
    if (!_actionMeta[actionName]) return false;

    // Retirer précédent key si occupé
    const oldKey = _keyByAction[actionName];
    if (oldKey) delete _actionByKey[oldKey];

    // Si la nouvelle touche est déjà utilisée par une autre action -> swap ou refuse
    const occupiedAction = _actionByKey[newKey];
    if (occupiedAction) {
        // Simple: on refuse (retourne false)
        return false;
    }

    _keyByAction[actionName] = newKey;
    _actionByKey[newKey] = actionName;
    saveConfig(_keyByAction);
    rebuildBindings();
    return true;
}

export function resetShortcuts(defaults) {
    _keyByAction = { ...defaults };
    rebuildKeyIndex();
    saveConfig(_keyByAction);
    rebuildBindings();
}

export function getShortcutConfig() {
    return { ..._keyByAction };
}

function rebuildBindings() {
    _bindings = {};
    Object.entries(_keyByAction).forEach(([action, key]) => {
        const meta = _actionMeta[action];
        if (!meta) return;
        _bindings[key] = {
            fn: meta.fn,
            label: meta.label,
            color: meta.color
        };
    });
}

function rebuildKeyIndex() {
    _actionByKey = {};
    Object.entries(_keyByAction).forEach(([act, key]) => {
        if (key) _actionByKey[key] = act;
    });
}

function normalizeKey(k) {
    if (!k) return '';
    if (k === ' ') return ' '; // space
    return k.toLowerCase().slice(0, 1);
}

function loadConfig() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const obj = JSON.parse(raw);
        return obj;
    } catch {
        return null;
    }
}

function saveConfig(cfg) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (e) {
        console.warn('Impossible de sauvegarder les raccourcis', e);
    }
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