// Login is by username only; Supabase Auth needs an email, so we derive a fixed synthetic one.
export const USERNAME_RE = /^[A-Za-z0-9.-]+$/;
export const usernameToEmail = (u: string) => `${u.trim().toLowerCase()}@app.local`;
export const emailToUsername = (e?: string | null) => (e ? e.replace(/@app\.local$/, "") : "");
