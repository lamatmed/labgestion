'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { FlaskConical } from 'lucide-react'

export function SplashScreen({ locale }: { locale: string }) {
  const [phase, setPhase] = useState<'in' | 'visible' | 'out' | 'done'>('done')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const seen = sessionStorage.getItem('lab-splash')
    if (seen) return
    sessionStorage.setItem('lab-splash', '1')

    setPhase('in')
    // Small delay so initial paint happens before we trigger opacity transition
    const enterTimer = setTimeout(() => setPhase('visible'), 60)
    const autoTimer = setTimeout(() => dismiss(), 4500)
    return () => {
      clearTimeout(enterTimer)
      clearTimeout(autoTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    setPhase('out')
    setTimeout(() => setPhase('done'), 450)
  }

  function pickLocale(picked: string) {
    if (picked !== locale) {
      router.push(pathname.replace(`/${locale}`, `/${picked}`))
    }
    dismiss()
  }

  if (phase === 'done') return null

  const isOut = phase === 'in' || phase === 'out'

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #4338ca 100%)',
        opacity: isOut ? 0 : 1,
        transform: isOut ? 'scale(1.04)' : 'scale(1)',
        transition: 'opacity 450ms ease-out, transform 450ms ease-out',
      }}
    >
      {/* Background decorations */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/5" />
      <div className="absolute -bottom-24 -right-16 w-[420px] h-[420px] rounded-full bg-indigo-950/40" />
      <div className="absolute top-1/4 right-8 w-32 h-32 rounded-full bg-blue-500/20" />

      {/* Content */}
      <div className="relative flex flex-col items-center">

        {/* Logo icon */}
        <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl shadow-black/40 mb-7">
          <FlaskConical className="w-14 h-14 text-white drop-shadow-lg" />
        </div>

        {/* Name & tagline */}
        <h1 className="text-5xl font-bold text-white tracking-tight mb-1">LabGestion</h1>
        <p className="text-blue-200 text-sm tracking-wide mb-12">
          Gestion de Laboratoire Médical
        </p>

        {/* Language chooser */}
        <p className="text-white/60 text-xs uppercase tracking-widest mb-4">
          Choisir la langue — اختر اللغة
        </p>
        <div className="flex gap-4 mb-14">
          <button
            onClick={() => pickLocale('fr')}
            className="flex flex-col items-center gap-2.5 px-8 py-5 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
            style={{
              background: locale === 'fr' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)',
              borderColor: locale === 'fr' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.20)',
              boxShadow: locale === 'fr' ? '0 0 0 2px rgba(255,255,255,0.4)' : 'none',
            }}
          >
            <span className="text-5xl leading-none select-none">🇫🇷</span>
            <span className="text-white font-semibold text-sm">Français</span>
          </button>

          <button
            onClick={() => pickLocale('ar')}
            className="flex flex-col items-center gap-2.5 px-8 py-5 rounded-2xl border transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none"
            style={{
              background: locale === 'ar' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)',
              borderColor: locale === 'ar' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.20)',
              boxShadow: locale === 'ar' ? '0 0 0 2px rgba(255,255,255,0.4)' : 'none',
            }}
          >
            <span className="text-5xl leading-none select-none">🇲🇷</span>
            <span className="text-white font-semibold text-sm">العربية</span>
          </button>
        </div>

        {/* Pulsing dots */}
        <div className="flex gap-2">
          {[0, 180, 360].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full bg-white/50 animate-pulse"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
