/** Posizione della villa: un solo posto da cui leggono mappa, footer e contatti. */
export const VILLA_COORDS = { lat: 39.1085644, lng: 9.5031886 } as const;

/** Scheda Google Maps della villa (con nome, foto e recensioni). */
export const MAPS_URL =
    'https://www.google.com/maps/place/Hidden+treasure+villasimius+(I.U.N.+S0174)/@39.1074963,9.0945192,51316m/data=!3m1!1e3!4m6!3m5!1s0x12e0c33df2d8c7bd:0xe25528c67767b9eb!8m2!3d39.1085644!4d9.5031886!16s%2Fg%2F11sbspqsr8';

/** Indicazioni stradali fino alla villa, dalla posizione di chi apre il link. */
export const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${VILLA_COORDS.lat},${VILLA_COORDS.lng}`;
