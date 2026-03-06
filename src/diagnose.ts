import { supabase } from './lib/supabase';

async function diagnose() {
    console.log('--- Supabase Diagnostic ---');

    // 1. Check connection
    const { data: stores, error: storeError } = await supabase.from('stores').select('count');
    if (storeError) {
        console.error('❌ Connection Error:', storeError.message);
    } else {
        console.log('✅ Connected to Supabase');
    }

    // 2. Check Admin Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'admin')
        .single();

    if (profile) {
        console.log('✅ Admin Profile found in public.profiles:', profile);
    } else {
        console.warn('⚠️ Admin Profile NOT found in public.profiles');
    }

    // 3. User check is only possible via Auth session or error messages
    console.log('---------------------------');
}

diagnose();
