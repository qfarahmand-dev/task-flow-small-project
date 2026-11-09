import { createClient } from '@supabase/supabase-js'

const configuredUrl = process.env.VITE_SUPABASE_URL?.trim()
const supabaseUrl = configuredUrl?.replace(/\/?rest\/v1\/?$/, '')
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const supabase =
  supabaseUrl && publishableKey
    ? createClient(supabaseUrl, publishableKey, {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null

export const supabaseConfigured = Boolean(supabase)
