"""Install the exact public speech and translation models used by the server."""
import hashlib
import os
import shutil
import urllib.request
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(os.getenv("MODELS", Path(__file__).resolve().parent / "models"))
ARGOS = "https://data.argosopentech.com/argospm/v1"
WHISPER = "https://huggingface.co/Systran/faster-whisper-base/resolve/ebe41f70d5b6dfa9166e2c581c45c9c0cfc57b66"
TRANSLATIONS = {
    "en_tr": "2d553a00880a0c21dea5b1c375535659e6bf18c9bf2ce9847c2a2fd2ff50316a",
    "tr_en": "15217905586561fac843efb5730aabff9a1534d5a9aa3f6ebcc0f9641394ac2d",
}
SPEECH = {
    "config.json": "56a6d8110d311f19c8f0471e562832c7527f146b567275bfca59fcf7c184da9a",
    "model.bin": "d01c3014881c9c6f3133c182f3d2887eb6ca1c789a7538c5c007196857a0a6a9",
    "tokenizer.json": "fb7b63191e9bb045082c79fd742a3106a12c99513ab30df4a0d47fa6cb6fd0ab",
    "vocabulary.txt": "34ce3fe1c5041027b3f8d42912270993f986dbc4bb34cf27f951e34a1e453913",
}


def digest(path):
    with path.open("rb") as file:
        return hashlib.file_digest(file, "sha256").hexdigest()


def download(url, path, expected):
    if path.is_file() and digest(path) == expected:
        return
    print(f"Downloading {path.name}", flush=True)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".part")
    with urllib.request.urlopen(url, timeout=120) as response, temp.open("wb") as file:
        shutil.copyfileobj(response, file)
    if digest(temp) != expected:
        temp.unlink()
        raise ValueError(f"Checksum mismatch for {path.name}")
    temp.replace(path)


def main():
    for pair, checksum in TRANSLATIONS.items():
        folder = f"translate-{pair}-1_5"
        marker = ROOT / pair / ".verified"
        if marker.is_file() and marker.read_text() == checksum:
            continue
        archive = ROOT / f"{pair}.zip"
        download(f"{ARGOS}/{folder}.argosmodel", archive, checksum)
        with ZipFile(archive) as models:
            for name in ("README.md", "metadata.json", "sentencepiece.model", "model/model.bin", "model/shared_vocabulary.txt"):
                models.extract(f"{folder}/{name}", ROOT / pair)
        marker.write_text(checksum)
        archive.unlink()
    for name, checksum in SPEECH.items():
        download(f"{WHISPER}/{name}", ROOT / "whisper" / name, checksum)
    print(f"Models ready in {ROOT}", flush=True)


if __name__ == "__main__":
    main()
