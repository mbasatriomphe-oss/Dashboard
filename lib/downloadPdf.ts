import { getStoredToken } from '@/app/services/backend'

export async function downloadBlob(response: Response, filename: string) {
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function normalizePdfPath(path: string) {
  if (!path) return '/api/rapports/html-to-pdf'
  return path.startsWith('/api/') || path.startsWith('http://') || path.startsWith('https://') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`
}

export async function fetchPdf(path: string, filename = 'report.pdf') {
  const token = getStoredToken() || ''
  const headers: Record<string, string> = { Accept: 'application/pdf' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(normalizePdfPath(path), { method: 'GET', headers, credentials: 'include' })
  if (!res.ok) throw new Error('PDF generation failed')
  await downloadBlob(res, filename)
}

export async function postHtmlToPdf(html: string, filename = 'report.pdf') {
  const token = getStoredToken() || ''
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/rapports/html-to-pdf', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: JSON.stringify({ html, filename }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Server error')
  }
  await downloadBlob(res, filename)
}
