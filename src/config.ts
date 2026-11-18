// Public settings for talking to Supabase (shared with the Coconut-Water app's project).
// The publishable key is designed to be public: what each person can see or change is
// enforced by database rules (Row Level Security). NEVER put the "secret" / "service_role" key here.
export const SUPABASE_URL = "https://vhipoagjztecsobfrjsz.supabase.co";
export const SUPABASE_KEY = "sb_publishable_33tYPU1E5jmRQGewLXAfwA_9XnglQnT";
// All We Got Lists tables live in their own schema so they can't clash with Coconut-Water's.
export const DB_SCHEMA = "wgl";
