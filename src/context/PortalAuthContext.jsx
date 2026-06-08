import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const PortalAuthContext = createContext({})

export function PortalAuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        if (session?.user && session.user.user_metadata?.role === 'client') {
          setUser(session.user)
          const { data } = await supabase
            .from('clients').select('*')
            .eq('user_id', session.user.id).maybeSingle()
          if (mounted) setClient(data || null)
        }
      } catch (e) {
        console.error('Portal init error:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null); setClient(null); return
      }
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
          session?.user?.user_metadata?.role === 'client') {
        setUser(session.user)
        const { data } = await supabase
          .from('clients').select('*')
          .eq('user_id', session.user.id).maybeSingle()
        setClient(data || null)
      }
    })

    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  async function loadClient(userId) {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (!error) setClient(data || null)
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error }

    if (data.user.user_metadata?.role !== 'client') {
      await supabase.auth.signOut()
      return { error: { message: "Bu akkaunt mijoz portali uchun emas" } }
    }

    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', data.user.id)
      .single()

    if (!clientData) {
      await supabase.auth.signOut()
      return { error: { message: "Mijoz ma'lumotlari topilmadi" } }
    }

    setUser(data.user)
    setClient(clientData)
    return { data }
  }

  async function register(accountNumber, email, password) {
    // Hisob raqamini tekshirish
    const { data: existingClient } = await supabase
      .from('clients')
      .select('*')
      .ilike('account_number', accountNumber.trim())
      .single()

    if (!existingClient) {
      return { error: { message: "Hisob raqami topilmadi. Admin bilan bog'laning." } }
    }

    if (existingClient.user_id) {
      return { error: { message: "Bu hisob raqami allaqachon ro'yxatdan o'tgan" } }
    }

    // Supabase auth user yaratish
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'client', account_number: accountNumber }
      }
    })

    if (authError) return { error: authError }

    // Client jadvalida user_id ni saqlash
    const { error: updateError } = await supabase
      .from('clients')
      .update({ user_id: authData.user.id })
      .eq('id', existingClient.id)

    if (updateError) {
      // Auth user yaratildi lekin client bog'lanmadi — auth userni o'chirib xato qaytaramiz
      await supabase.auth.signOut()
      return { error: { message: "Hisob bog'lashda xatolik. Iltimos qayta urinib ko'ring." } }
    }

    setUser(authData.user)
    setClient({ ...existingClient, user_id: authData.user.id })
    return { data: authData }
  }

  const signOut = async () => {
    setUser(null)
    setClient(null)
    await supabase.auth.signOut()
  }

  // Mijoz o'z profilini yangilaganda chaqiriladi
  async function updateProfile(fields) {
    if (!client) return { error: { message: 'Mijoz topilmadi' } }
    const { error } = await supabase
      .from('clients')
      .update(fields)
      .eq('id', client.id)
    if (error) return { error }
    setClient({ ...client, ...fields })
    return { data: true }
  }

  return (
    <PortalAuthContext.Provider value={{ user, client, loading, login, register, signOut, updateProfile }}>
      {children}
    </PortalAuthContext.Provider>
  )
}

export const usePortalAuth = () => useContext(PortalAuthContext)
