/** Converts an age (years + months) into an approximate birth month YYYY-MM. */
export function birthMonthFromAge(years: number, months: number, today = new Date()) {
  const d = new Date(today.getFullYear(), today.getMonth() - (years * 12 + months), 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function ageFromBirthMonth(birthMonth: string, today = new Date()) {
  const [y, m] = birthMonth.split('-').map(Number)
  const total = Math.max(0, (today.getFullYear() - y) * 12 + (today.getMonth() + 1 - m))
  return { years: Math.floor(total / 12), months: total % 12 }
}

export function formatAge(birthMonth: string) {
  const { years, months } = ageFromBirthMonth(birthMonth)
  const y = years === 1 ? '1 ano' : `${years} anos`
  if (months === 0) return y
  const m = months === 1 ? '1 mês' : `${months} meses`
  return years === 0 ? m : `${y} e ${m}`
}
