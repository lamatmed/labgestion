'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

export function TimeGreeting({ name }: { name: string }) {
  const t = useTranslations('dashboard')
  const [greeting, setGreeting] = useState(t('greetingMorning'))

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setGreeting(t('greetingMorning'))
    else if (hour >= 12 && hour < 18) setGreeting(t('greetingAfternoon'))
    else if (hour >= 18 && hour < 21) setGreeting(t('greetingEvening'))
    else setGreeting(t('greetingNight'))
  }, [t])

  return (
    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
      {greeting}, {name} 👋
    </h1>
  )
}
