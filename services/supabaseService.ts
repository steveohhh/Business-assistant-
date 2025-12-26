import { createClient, SupabaseClient } from '@supabase/supabase-js';

// --- NETWORK CONFIGURATION ---
// PASTE YOUR SUPABASE CREDENTIALS HERE TO AUTO-CONNECT
export const HARDCODED_SUPABASE_URL = 'https://hnznbdxtppgpcjhymiuk.supabase.co'; 
export const HARDCODED_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhuem5iZHh0cHBncGNqaHltaXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTAzMTAsImV4cCI6MjA4MTEyNjMxMH0.cuRIDp_4q0J1lQHRCm6AWkml5nwN-LxWuwoVv3Zvqtg';
// -----------------------------

let supabase: SupabaseClient | null = null;

export const initSupabase = (url: string = HARDCODED_SUPABASE_URL, key: string = HARDCODED_SUPABASE_KEY) => {
    if (!url || !key) return null;
    try {
        // Prevent multiple instances if already initialized with same config
        if (supabase) return supabase;
        
        supabase = createClient(url, key);
        return supabase;
    } catch (e) {
        console.error("Invalid Supabase Config", e);
        return null;
    }
};

export const getSupabase = () => supabase;

export const signInAnonymously = async () => {
    if (!supabase) return null;
    // We use standard email signup with a random dummy email for "anonymous" feel in this context
    // In a real prod environment, you might enable "Anonymous Sign-ins" in Supabase Auth settings
    const dummyEmail = `operator_${Date.now()}_${Math.random().toString(36).substring(7)}@shadow.net`;
    const password = `pass_${Math.random().toString(36)}`;
    
    // Check if we have a stored session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session.user;

    const { data, error } = await supabase.auth.signUp({
        email: dummyEmail,
        password: password,
    });
    
    if (error) {
        console.error("Auth Error", error);
        return null;
    }
    return data.user;
};

export const updateProfileStats = async (netWorth: number, reputation: number, isVerified: boolean, alias: string) => {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
        net_worth: netWorth,
        reputation_score: reputation,
        is_verified: isVerified,
        username: alias,
        updated_at: new Date().toISOString()
    }).eq('id', user.id);
};

// --- CLOUD PERSISTENCE ---
export const saveToCloud = async (backupData: any) => {
    if (!supabase) return { success: false, error: 'OFFLINE' };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        const u = await signInAnonymously();
        if (!u) return { success: false, error: 'AUTH_FAILED' };
    }
    
    // We use the 'profiles' table 'metadata' column (jsonb) to store the save state
    // Ideally use a dedicated 'saves' table, but this works for the template schema
    const { error } = await supabase.from('profiles').update({
        metadata: backupData,
        updated_at: new Date().toISOString()
    }).eq('id', user?.id || (await supabase.auth.getUser()).data.user?.id);

    return { success: !error, error: error?.message };
};

export const loadFromCloud = async () => {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', user.id)
        .single();

    if (error || !data) return null;
    return data.metadata;
};

export const subscribeToLeaderboard = (callback: (payload: any) => void) => {
    if (!supabase) return;
    
    // Initial Fetch
    supabase.from('profiles')
        .select('id, username, net_worth, reputation_score, is_verified, avatar_color')
        .order('net_worth', { ascending: false })
        .limit(20)
        .then(({ data }) => {
            if (data) callback(data);
        });

    // Realtime Subscription
    return supabase.channel('public:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
            // Re-fetch leaderboard on any change
            supabase?.from('profiles')
                .select('id, username, net_worth, reputation_score, is_verified, avatar_color')
                .order('net_worth', { ascending: false })
                .limit(20)
                .then(({ data }) => {
                    if (data) callback(data);
                });
        })
        .subscribe();
};