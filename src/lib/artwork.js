import { getCachedArtwork, setCachedArtwork } from './storage'

const AIC_BASE = 'https://api.artic.edu/api/v1'
const IMAGE_BASE = 'https://www.artic.edu/iiif/2'

function dayOfYear(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z')
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 0))
  const diff = d - start
  return Math.floor(diff / 86400000)
}

export function getImageUrl(imageId, size = '843,') {
  return `${IMAGE_BASE}/${imageId}/full/${size}/0/default.jpg`
}

export async function fetchArtworkForDay(dayKey) {
  const cached = getCachedArtwork(dayKey)
  if (cached) return cached

  const doy = dayOfYear(dayKey)
  const page = Math.floor(doy / 10) + 1
  const offset = doy % 10

  try {
    const params = new URLSearchParams({
      query: JSON.stringify({
        bool: {
          must: [
            { term: { 'is_public_domain': true } },
            { exists: { field: 'image_id' } },
          ],
          should: [
            { term: { 'classification_titles': 'painting' } },
            { term: { 'artwork_type_title': 'Painting' } },
          ],
          minimum_should_match: 1,
        },
      }),
      fields: 'id,title,artist_display,date_display,image_id',
      limit: 10,
      page,
    })

    const res = await fetch(`${AIC_BASE}/artworks/search?${params}`)
    if (!res.ok) throw new Error('AIC fetch failed')

    const json = await res.json()
    const items = (json.data || []).filter(a => a.image_id)
    if (!items.length) throw new Error('No results')

    const pick = items[offset % items.length]
    const artwork = {
      artwork_id: String(pick.id),
      image_id: pick.image_id,
      title: pick.title || 'Untitled',
      artist_display: pick.artist_display || 'Unknown Artist',
      date_display: pick.date_display || '',
      image_url: getImageUrl(pick.image_id),
      day_key: dayKey,
    }

    setCachedArtwork(dayKey, artwork)
    return artwork
  } catch (err) {
    console.error('fetchArtworkForDay error:', err)
    return null
  }
}
