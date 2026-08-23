const TOUCHES = {
    ArrowUp: 'haut', z: 'haut', w: 'haut',
    ArrowRight: 'droite', d: 'droite',
    ArrowDown: 'bas', s: 'bas',
    ArrowLeft: 'gauche', q: 'gauche', a: 'gauche'
};

export const seuilGestePour = largeur => Math.max(10, Math.min(16, Number(largeur) * .035 || 10));

export function directionDepuisGeste(dx, dy, seuil = 0) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) < seuil) return null;
    return Math.abs(dx) > Math.abs(dy)
        ? (dx > 0 ? 'droite' : 'gauche')
        : (dy > 0 ? 'bas' : 'haut');
}

export function installerEntrees({ canvas, dpad, surDirection, surPause, surNouvelle, surTheme, gestes = true }) {
    let gestesActifs = gestes;
    let departGeste = null;
    let pointeurDpad = null;
    let derniereDirection = null;
    let derniereDirectionGeste = null;

    const directionDe = cible => cible?.closest?.('[data-direction]')?.dataset.direction ?? null;

    function activerDirection(direction, bouton) {
        if (!direction || direction === derniereDirection) return;
        derniereDirection = direction;
        bouton?.classList.add('active');
        setTimeout(() => bouton?.classList.remove('active'), 90);
        surDirection(direction);
    }

    function clavier(evenement) {
        if (evenement.target instanceof HTMLInputElement || evenement.target instanceof HTMLButtonElement
            || document.querySelector('dialog[open]')) return;
        const touche = evenement.key.length === 1 ? evenement.key.toLowerCase() : evenement.key;
        const direction = TOUCHES[touche];
        if (direction) {
            evenement.preventDefault();
            if (!evenement.repeat) surDirection(direction);
            return;
        }
        if ((touche === ' ' || touche === 'p') && !evenement.repeat) {
            evenement.preventDefault();
            surPause();
        } else if (touche === 'r' && !evenement.repeat) {
            evenement.preventDefault();
            surNouvelle();
        } else if (touche === 't' && !evenement.repeat) {
            evenement.preventDefault();
            surTheme();
        }
    }

    function dpadBas(evenement) {
        const direction = directionDe(evenement.target);
        if (!direction) return;
        evenement.preventDefault();
        pointeurDpad = evenement.pointerId;
        derniereDirection = null;
        dpad.setPointerCapture?.(evenement.pointerId);
        activerDirection(direction, evenement.target.closest('[data-direction]'));
    }

    function dpadBouge(evenement) {
        if (evenement.pointerId !== pointeurDpad) return;
        const element = document.elementFromPoint(evenement.clientX, evenement.clientY);
        const direction = directionDe(element);
        if (direction) activerDirection(direction, element.closest('[data-direction]'));
    }

    function dpadFin(evenement) {
        if (evenement.pointerId !== pointeurDpad) return;
        pointeurDpad = null;
        derniereDirection = null;
    }

    function gesteBas(evenement) {
        if (!gestesActifs || evenement.pointerType === 'mouse' && evenement.button !== 0) return;
        evenement.preventDefault();
        departGeste = { id: evenement.pointerId, x: evenement.clientX, y: evenement.clientY };
        derniereDirectionGeste = null;
        canvas.setPointerCapture?.(evenement.pointerId);
    }

    function traiterGeste(evenement) {
        if (!departGeste || departGeste.id !== evenement.pointerId) return;
        const dx = evenement.clientX - departGeste.x;
        const dy = evenement.clientY - departGeste.y;
        const direction = directionDepuisGeste(dx, dy, seuilGestePour(canvas.clientWidth));
        if (!direction) return;
        evenement.preventDefault();
        // Le virage part dès que le seuil est franchi, sans attendre que le
        // doigt se lève. On reprend ensuite le geste à cet endroit : un même
        // glissement peut ainsi enchaîner haut puis gauche à pleine vitesse.
        departGeste.x = evenement.clientX;
        departGeste.y = evenement.clientY;
        if (direction === derniereDirectionGeste) return;
        derniereDirectionGeste = direction;
        surDirection(direction);
    }

    function gesteBouge(evenement) {
        if (!departGeste || departGeste.id !== evenement.pointerId) return;
        traiterGeste(evenement);
    }

    function gesteHaut(evenement) {
        if (!departGeste || departGeste.id !== evenement.pointerId) return;
        traiterGeste(evenement);
        departGeste = null;
        derniereDirectionGeste = null;
        evenement.preventDefault();
    }

    function gesteAnnule(evenement) {
        if (departGeste?.id !== evenement.pointerId) return;
        departGeste = null;
        derniereDirectionGeste = null;
    }

    const bloquerInteraction = evenement => evenement.preventDefault();
    const evenementsBloques = ['contextmenu', 'selectstart', 'dragstart', 'dblclick'];

    document.addEventListener('keydown', clavier);
    dpad.addEventListener('pointerdown', dpadBas);
    dpad.addEventListener('pointermove', dpadBouge);
    dpad.addEventListener('pointerup', dpadFin);
    dpad.addEventListener('pointercancel', dpadFin);
    canvas.addEventListener('pointerdown', gesteBas, { passive: false });
    canvas.addEventListener('pointermove', gesteBouge, { passive: false });
    canvas.addEventListener('pointerup', gesteHaut, { passive: false });
    canvas.addEventListener('pointercancel', gesteAnnule);
    for (const type of evenementsBloques) {
        canvas.addEventListener(type, bloquerInteraction);
        dpad.addEventListener(type, bloquerInteraction);
    }

    return {
        mettreGestes(actifs) { gestesActifs = Boolean(actifs); },
        detruire() {
            document.removeEventListener('keydown', clavier);
            dpad.removeEventListener('pointerdown', dpadBas);
            dpad.removeEventListener('pointermove', dpadBouge);
            dpad.removeEventListener('pointerup', dpadFin);
            dpad.removeEventListener('pointercancel', dpadFin);
            canvas.removeEventListener('pointerdown', gesteBas);
            canvas.removeEventListener('pointermove', gesteBouge);
            canvas.removeEventListener('pointerup', gesteHaut);
            canvas.removeEventListener('pointercancel', gesteAnnule);
            for (const type of evenementsBloques) {
                canvas.removeEventListener(type, bloquerInteraction);
                dpad.removeEventListener(type, bloquerInteraction);
            }
        }
    };
}
