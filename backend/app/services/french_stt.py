import tempfile
from pathlib import Path

_WHISPER = None


def transcribe_french_audio(audio: bytes, suffix: str = ".wav") -> str | None:
    if not audio:
        return ""
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None

    model = _whisper_model(WhisperModel)
    temporary = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    path = Path(temporary.name)
    try:
        temporary.write(audio)
        temporary.close()
        segments, info = model.transcribe(str(path), language="fr", beam_size=5)
        if info.language != "fr" and info.language_probability < 0.6:
            return ""
        return " ".join(segment.text.strip() for segment in segments).strip()
    finally:
        path.unlink(missing_ok=True)


def _whisper_model(whisper_model):
    global _WHISPER
    if _WHISPER is None:
        _WHISPER = whisper_model("small", device="cpu", compute_type="int8")
    return _WHISPER
