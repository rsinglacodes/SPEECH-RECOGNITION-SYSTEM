import os
from transformers import pipeline, AutoProcessor, AutoModelForSpeechSeq2Seq
import torch

# Choose model: multilingual Whisper models available in Transformers.
# "openai/whisper-small" works well on CPU for short files; replace with larger variant if you have GPU.
MODEL_NAME = os.environ.get("HF_WHISPER_MODEL", "openai/whisper-small")

# Lazy load: keep global pipeline so model loads once per server start
_asr = None

def get_asr_pipeline():
    global _asr
    if _asr is None:
        # For Whisper seq2seq models, use the automatic-speech-recognition pipeline
        print(f"Loading model {MODEL_NAME} ... (this may take a minute)")
        _asr = pipeline("automatic-speech-recognition", model=MODEL_NAME, device=0 if torch.cuda.is_available() else -1)
        print("Model loaded.")
    return _asr

def transcribe_audio(file_path: str, language: str = None) -> dict:
    """
    Transcribe the given audio file.
    If language is given (ISO code like 'en' or 'hi'), pass it to the pipeline via generation kwargs.
    Returns: {"text": "...", "language": "xx" (if available)}
    """
    asr = get_asr_pipeline()

    # Hugging Face pipeline accepts file path directly; whisper will auto-detect language if not provided.
    kwargs = {}
    if language:
        # Whisper can accept forced language; depending on pipeline implementation,
        # you may need to pass generate_kwargs={"forced_decoder_ids": ...}
        # Transformers pipeline supports `language` param for whisper models:
        kwargs["language"] = language

    result = asr(file_path, **kwargs)  # result is usually a dict with "text"
    text = result.get("text", "")
    # The pipeline might not explicitly return detected language, so return None if not available
    return {"text": text, "language": result.get("language", None)}
