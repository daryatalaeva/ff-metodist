import { NextRequest } from 'next/server'
import { put } from '@vercel/blob'

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXTENSIONS = ['.pdf', '.docx']

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return Response.json({ error: 'file field is required' }, { status: 422 })
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: 'File exceeds 10 MB limit' }, { status: 422 })
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    return Response.json({ error: 'Only PDF and DOCX files are allowed' }, { status: 422 })
  }

  try {
    const blob = await put(`lesson-plans/${Date.now()}-${file.name}`, file, {
      access: 'public',
      contentType: file.type || 'application/octet-stream',
    })

    return Response.json({ url: blob.url, filename: file.name })
  } catch (err) {
    console.error('[lesson-plan/upload-material]', err)
    return Response.json({ error: 'Upload failed' }, { status: 500 })
  }
}
