import React from 'react';
import { formatNumber, STRINGS, useLang } from '../i18n';

/* Stelle da 0 a 5, anche frazionarie (riempimento parziale). Colore = currentColor. */
const Stars: React.FC<{ value: number; size?: number; className?: string }> = ({ value, size = 16, className }) => {
    const lang = useLang();
    return (
        <span
            className={className}
            style={{ display: 'inline-flex', gap: 2, lineHeight: 0 }}
            role="img"
            aria-label={STRINGS[lang].reviews.stars(formatNumber(value, 1, lang))}
        >
            {[0, 1, 2, 3, 4].map((i) => {
                const fill = Math.max(0, Math.min(1, value - i));
                const id = `st-${i}-${Math.round(fill * 100)}`;
                return (
                    <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
                        <defs>
                            <linearGradient id={id}>
                                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                                <stop offset={`${fill * 100}%`} stopColor="var(--c-sand)" />
                            </linearGradient>
                        </defs>
                        <path
                            fill={`url(#${id})`}
                            d="M12 2.6l2.9 6 6.5.9-4.7 4.6 1.1 6.5L12 17.5l-5.8 3.1 1.1-6.5L2.6 9.5l6.5-.9z"
                        />
                    </svg>
                );
            })}
        </span>
    );
};

export default Stars;
