import { useEffect, useRef } from 'react';

/**
 * Aggiunge la classe `is-visible` agli elementi con classe `reveal`
 * contenuti nel nodo osservato, quando entrano nel viewport.
 * Un solo IntersectionObserver per sezione, disconnesso allo smontaggio.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root) return;

        const targets = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
        if (targets.length === 0) return;

        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced || !('IntersectionObserver' in window)) {
            targets.forEach((el) => el.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
        );

        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return ref;
}

export default useReveal;
