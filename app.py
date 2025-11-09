from flask import Flask, render_template, request, jsonify
import os
import tempfile
import torch
import ffmpeg
import whisper

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load Whisper model (base is fast and accurate)
model = whisper.load_model("base")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    file = request.files.get("file")
    lang = request.form.get("language", "")

    if not file:
        return jsonify({"error": "No file provided"}), 400

    # Save uploaded file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        file.save(tmp.name)
        audio_path = tmp.name

    try:
        # Transcribe
        options = {"task": "transcribe"}
        if lang:
            options["language"] = lang

        result = model.transcribe(audio_path, **options)
        text = result["text"].strip()
        detected_lang = result.get("language", "auto")

        return jsonify({
            "text": text,
            "language": detected_lang
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        os.remove(audio_path)

if __name__ == "__main__":
    app.run(debug=True)
