import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

import { requestFrenchTranscript } from './conversationClient';

export async function startFrenchRecording(recorder) {
  try {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission?.granted) {
      return false;
    }
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    await recorder.prepareToRecordAsync();
    recorder.record();
    return true;
  } catch {
    return false;
  }
}

export async function stopFrenchRecording(recorder) {
  try {
    await recorder.stop();
    if (!recorder.uri) {
      return '';
    }
    const audioBase64 = await readAudioBase64(recorder.uri);
    if (!audioBase64) {
      return '';
    }
    const answer = await requestFrenchTranscript(audioBase64);
    return typeof answer?.transcript === 'string'
      ? answer.transcript.trim()
      : '';
  } catch {
    return '';
  }
}

async function readAudioBase64(uri) {
  const response = await fetch(uri);
  if (!response.ok) {
    return '';
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return typeof btoa === 'function' ? btoa(binary) : '';
}
