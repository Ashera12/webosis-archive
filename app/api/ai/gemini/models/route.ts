import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/adminConfig';

export async function GET(_req: NextRequest) {
  const apiKey = await getConfig('GEMINI_API_KEY');
  if (!apiKey || !apiKey.startsWith('AIza')) {
    return NextResponse.json({ error: 'GEMINI_API_KEY tidak valid atau belum diset (harus mulai AIza).'}, { status: 400 });
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    if (!text) {
      return NextResponse.json({ error: 'Respon kosong dari Gemini. Pastikan Generative Language API diaktifkan di Google Cloud Console.' }, { status: res.status || 502 });
    }
    let json: any;
    try { json = JSON.parse(text); } catch {
      return NextResponse.json({ error: 'Respon bukan JSON', raw: text.slice(0,200) }, { status: 502 });
    }
    return NextResponse.json({ models: json.models || [], rawCount: (json.models || []).length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Gagal menghubungi Gemini' }, { status: 500 });
  }
}