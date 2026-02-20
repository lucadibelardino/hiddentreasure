import { createClient } from '@supabase/supabase-js';
import ical from 'node-ical';

// Load environment variables (GitHub Actions sets these)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const AIRBNB_ICAL_URL = 'https://www.airbnb.com/calendar/ical/38283678.ics?t=1fc73ff3da0648cab27aee083723689a&locale=it';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase credentials. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncCalendar() {
    try {
        console.log('Fetching iCal from Airbnb...');
        // Use node-ical's fromURL which handles the request
        const events = await ical.async.fromURL(AIRBNB_ICAL_URL);

        const busyEvents = [];

        for (const k in events) {
            const event = events[k];
            if (event.type === 'VEVENT') {
                // Formatting dates to YYYY-MM-DD for simpler comparison/storage
                // Note: date-fns or similar could be used for robustness, but basic ISO string split works for dates
                const start = event.start.toISOString().split('T')[0];
                const end = event.end.toISOString().split('T')[0];

                busyEvents.push({
                    check_in: start,
                    check_out: end,
                    source: 'airbnb'
                });
            }
        }

        console.log(`Found ${busyEvents.length} blocked periods.`);

        // Strategy: Clear all existing Airbnb blocks and insert fresh ones
        // This handles removed blocks (cancellations) automatically

        console.log('Cleaning old Airbnb blocks...');
        const { error: deleteError } = await supabase
            .from('blocked_dates')
            .delete()
            .eq('source', 'airbnb');

        if (deleteError) throw deleteError;

        if (busyEvents.length > 0) {
            console.log('Inserting new blocks...');
            const { error: insertError } = await supabase
                .from('blocked_dates')
                .insert(busyEvents);

            if (insertError) throw insertError;
        }

        console.log('Sync complete successfully.');

    } catch (err) {
        console.error('Error syncing calendar:', err);
        process.exit(1);
    }
}

syncCalendar();
