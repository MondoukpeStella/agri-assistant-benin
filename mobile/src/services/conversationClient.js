import { readPublicConfig } from '../constants/env';

export async function requestPriceConsultation() {
  return { type: 'not_connected' };
}

export async function requestFrenchAnswer(text) {
  return postFrenchVoice({ text });
}

export async function requestFrenchTranscript(audioBase64) {
  return postFrenchVoice({ audio_base64: audioBase64 });
}

async function postFrenchVoice(payload) {
  const apiUrl = readPublicConfig().apiUrl;
  if (!apiUrl) {
    return null;
  }
  try {
    const response = await fetch(`${apiUrl}/api/v1/voice/french`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return null;
    }
    const body = await response.json();
    if (typeof body?.reply !== 'string' || typeof body.status !== 'string') {
      return null;
    }
    const published = body.status === 'published_price';
    if (!published && /\d/.test(body.reply) && /fcfa|xof/i.test(body.reply)) {
      return null;
    }
    return body;
  } catch {
    return null;
  }
}
