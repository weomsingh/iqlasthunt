// DEPRECATED — Supabase has been replaced by Firebase.
// This file is kept to prevent import errors while migration completes.
// DO NOT USE — use firebaseService.js instead.

// Stub that prevents crashes in components not yet migrated
const supabaseMigrationStub = {
    auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
    },
    from: (table) => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: new Error('Supabase is disabled. Use Firebase instead.') }), data: [], error: null }), data: [], error: null }),
        insert: () => async () => ({ data: null, error: new Error('Supabase is disabled. Use Firebase.') }),
        upsert: () => async () => ({ data: null, error: new Error('Supabase is disabled. Use Firebase.') }),
        update: () => ({ eq: () => async () => ({ data: null, error: null }) }),
        delete: () => ({ eq: () => async () => ({ data: null, error: null }) }),
    }),
    channel: () => ({ on: () => ({ subscribe: () => { } }) }),
    removeChannel: () => { },
};

// Named export for compatibility
export const supabase = supabaseMigrationStub;
// Default export for compatibility
export default supabaseMigrationStub;
