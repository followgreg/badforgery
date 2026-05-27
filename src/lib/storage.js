export function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function getTodayKey() {
  return getDayKey(new Date())
}

export function getCachedArtwork(dayKey) {
  try {
    const raw = localStorage.getItem(`artwork_${dayKey}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setCachedArtwork(dayKey, artwork) {
  try {
    localStorage.setItem(`artwork_${dayKey}`, JSON.stringify(artwork))
  } catch {}
}

export function getSubmissionId(dayKey) {
  return localStorage.getItem(`submitted_${dayKey}`) || null
}

export function setSubmissionId(dayKey, id) {
  localStorage.setItem(`submitted_${dayKey}`, id)
}

export function hasPlayed(dayKey) {
  return !!localStorage.getItem(`played_${dayKey}`)
}

export function setPlayed(dayKey) {
  localStorage.setItem(`played_${dayKey}`, '1')
}

export function hasRated(submissionId) {
  return !!localStorage.getItem(`rated_${submissionId}`)
}

export function setRated(submissionId) {
  localStorage.setItem(`rated_${submissionId}`, '1')
}

export function getPastDayKeys(count = 7) {
  const keys = []
  for (let i = 1; i <= count; i++) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    keys.push(getDayKey(d))
  }
  return keys
}
