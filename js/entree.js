const TOUCHES = {
    ArrowUp: 'haut', z: 'haut', w: 'haut',
    ArrowRight: 'droite', d: 'droite',
    ArrowDown: 'bas', s: 'bas',
    ArrowLeft: 'gauche', q: 'gauche', a: 'gauche'
};

export function installerEntrees({ canvas, dpad, surDirection, surPause, surNouvelle, surTheme, gestes = true }) {
    let gestesActifs = gestes;
    let departGeste = null;
    let pointeurDpad = null;
    let derniereDirection = null;

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
        departGeste = { id: evenement.pointerId, x: evenement.clientX, y: evenement.clientY };
        canvas.setPointerCapture?.(evenement.pointerId);
    }

    function gesteHaut(evenement) {
        if (!departGeste || departGeste.id !== evenement.pointerId) return;
        const dx = evenement.clientX - departGeste.x;
        const dy = evenement.clientY - departGeste.y;
        departGeste = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
        evenement.preventDefault();
        surDirection(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'droite' : 'gauche') : (dy > 0 ? 'bas' : 'haut'));
    }

    document.addEventListener('keydown', clavier);
    dpad.addEventListener('pointerdown', dpadBas);
    dpad.addEventListener('pointermove', dpadBouge);
    dpad.addEventListener('pointerup', dpadFin);
    dpad.addEventListener('pointercancel', dpadFin);
    canvas.addEventListener('pointerdown', gesteBas);
    canvas.addEventListener('pointerup', gesteHaut);
    canvas.addEventListener('pointercancel', () => { departGeste = null; });

    return {
        mettreGestes(actifs) { gestesActifs = Boolean(actifs); },
        detruire() {
            document.removeEventListener('keydown', clavier);
            dpad.removeEventListener('pointerdown', dpadBas);
            dpad.removeEventListener('pointermove', dpadBouge);
            dpad.removeEventListener('pointerup', dpadFin);
            dpad.removeEventListener('pointercancel', dpadFin);
            canvas.removeEventListener('pointerdown', gesteBas);
            canvas.removeEventListener('pointerup', gesteHaut);
        }
    };
}
