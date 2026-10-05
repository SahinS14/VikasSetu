"""
FACE/service.py
Lightweight HTTP microservice wrapping ArcFace (InsightFace buffalo_l) model for VikasSetu.
Provides:
  - GET  /health      : Status & enrolled identities
  - POST /recognize   : Identifies face from multipart image or base64 JSON
  - POST /enroll      : Enrolls new face identity into enrolled.pkl
  - GET  /identities  : List of enrolled face names
"""

import sys
import os
import io
import time
import pickle
import base64
import json
import numpy as np
import cv2
from typing import Optional
from fastapi import FastAPI, Request, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Limit threads to prevent memory explosion on cloud free tiers (e.g. Render 512MB RAM)
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

# Windows DLL path resolution for CUDA / cuDNN
if sys.platform == "win32":
    cuda_path = os.environ.get("CUDA_PATH", r"C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.8")
    cuda_bin = os.path.join(cuda_path, "bin")
    if os.path.exists(cuda_bin) and hasattr(os, "add_dll_directory"):
        os.add_dll_directory(cuda_bin)

from contextlib import asynccontextmanager
from insightface.app import FaceAnalysis

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENROLLED_PATH = os.path.join(BASE_DIR, "enrolled.pkl")
THRESHOLD = 0.50  # ArcFace cosine similarity threshold

# Global model and database holder
face_app = None
enrolled_db = {}
_last_mtime = 0.0


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    denom = (np.linalg.norm(a) * np.linalg.norm(b))
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def load_database(force: bool = False) -> dict:
    global enrolled_db, _last_mtime
    if not os.path.exists(ENROLLED_PATH):
        enrolled_db = {}
        return enrolled_db
    try:
        current_mtime = os.path.getmtime(ENROLLED_PATH)
        if force or current_mtime > _last_mtime or not enrolled_db:
            with open(ENROLLED_PATH, "rb") as f:
                data = pickle.load(f)
            if isinstance(data, np.ndarray):
                enrolled_db = {"person": data}
            elif isinstance(data, dict):
                enrolled_db = data
            else:
                print(f"[FaceService] Warning: unexpected data format in {ENROLLED_PATH}: {type(data)}")
                return enrolled_db
            _last_mtime = current_mtime
            print(f"[FaceService] Loaded {len(enrolled_db)} identities from {ENROLLED_PATH}: {list(enrolled_db.keys())}")
    except Exception as e:
        print(f"[FaceService] Error loading database: {e}")
    return enrolled_db


def save_database(db: dict):
    global _last_mtime
    # Write to a temporary file first, then atomically replace
    tmp_path = ENROLLED_PATH + ".tmp"
    with open(tmp_path, "wb") as f:
        pickle.dump(db, f)
    os.replace(tmp_path, ENROLLED_PATH)
    _last_mtime = os.path.getmtime(ENROLLED_PATH)


def get_embedding(model, frame: np.ndarray, quality_check: bool = False):
    """Detect face(s) in frame and return the embedding of the largest detected face."""
    faces = model.get(frame)
    if not faces or len(faces) == 0:
        return None, None, 0
    # Pick largest detected face by area
    faces.sort(key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]), reverse=True)
    best_face = faces[0]
    bbox = best_face.bbox
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    det_score = getattr(best_face, "det_score", 1.0)

    if quality_check:
        if det_score < 0.50:
            print(f"[FACE QUALITY] Rejected: det_score {det_score:.3f} < 0.50")
            return None, None, len(faces)
        if w < 50 or h < 50:
            print(f"[FACE QUALITY] Rejected: face size ({w:.0f}x{h:.0f}) too small (< 50px)")
            return None, None, len(faces)

    return best_face.embedding, bbox, len(faces)


def decode_image_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(nparr, cv2.IMREAD_COLOR)


def get_face_app():
    global face_app
    if face_app is None:
        print("[FaceService] Initializing InsightFace buffalo_sc (MobileFaceNet low-memory CPU)...")
        try:
            import onnxruntime as ort
            orig_init = ort.InferenceSession.__init__
            def patched_init(self, *args, **kwargs):
                so = kwargs.get('sess_options') or ort.SessionOptions()
                so.enable_cpu_mem_arena = False
                so.intra_op_num_threads = 1
                so.inter_op_num_threads = 1
                kwargs['sess_options'] = so
                return orig_init(self, *args, **kwargs)
            ort.InferenceSession.__init__ = patched_init
        except Exception as e:
            print(f"[FaceService] Note: onnxruntime session patch skipped: {e}")

        app = FaceAnalysis(
            name="buffalo_sc",
            allowed_modules=["detection", "recognition"],
            providers=["CPUExecutionProvider"]
        )
        app.prepare(ctx_id=-1, det_size=(320, 320))
        face_app = app
        import gc
        gc.collect()
        print(f"[FaceService] Model ready. Loaded {len(enrolled_db)} enrolled faces: {list(enrolled_db.keys())}")
    return face_app


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[FaceService] FastAPI starting up...")
    load_database(force=True)
    print(f"[FaceService] Database loaded with {len(enrolled_db)} identities.")
    try:
        get_face_app()
    except Exception as e:
        print(f"[FaceService] Model loading deferred: {e}")
    yield


app = FastAPI(title="VikasSetu Face Recognition Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Base64RecognizeRequest(BaseModel):
    image: str  # Data URL or raw base64 string


class Base64EnrollRequest(BaseModel):
    identity: str
    image: str  # Data URL or raw base64 string


@app.get("/health")
@app.get("/healthz")
@app.get("/")
def health():
    load_database()
    return {
        "status": "ok",
        "service": "VikasSetu Face Recognition AI",
        "model": "ArcFace buffalo_sc",
        "enrolled_count": len(enrolled_db),
        "identities": list(enrolled_db.keys()),
        "threshold": THRESHOLD,
    }


@app.get("/identities")
def get_identities():
    load_database()
    return {
        "success": True,
        "identities": list(enrolled_db.keys())
    }


@app.delete("/identities/{identity}")
def delete_identity(identity: str):
    db = load_database(force=True)
    if identity in db:
        del db[identity]
        save_database(db)
        print(f"[FaceService] Deleted identity: {identity}. Remaining: {list(db.keys())}")
        return {"success": True, "message": f"Deleted {identity}"}
    return {"success": False, "message": f"{identity} not found"}


@app.post("/recognize")
async def recognize(request: Request):
    """
    Recognize a person in the submitted image frame.
    Supports either JSON { "image": "<base64>" } or multipart/form-data with "file".
    """
    model = get_face_app()
    if model is None:
        raise HTTPException(status_code=503, detail="Face recognition model could not be initialized")

    # Refresh DB if updated on disk
    load_database()

    frame = None
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body_bytes = await request.body()
            data = json.loads(body_bytes.decode("utf-8", errors="replace"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

        raw_b64 = data.get("image", "").strip()
        if not raw_b64:
            raise HTTPException(status_code=400, detail="Missing 'image' field in JSON payload")
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        # Strip whitespace/newlines if any
        raw_b64 = "".join(raw_b64.split())

        try:
            img_bytes = base64.b64decode(raw_b64)
            frame = decode_image_bytes(img_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to decode base64 image: {e}")

    elif "multipart/form-data" in content_type:
        form = await request.form()
        file = form.get("file")
        if file and hasattr(file, "read"):
            content = await file.read()
            frame = decode_image_bytes(content)

    if frame is None:
        raise HTTPException(status_code=400, detail="Invalid image or unreadable format provided")

    print("[FACE] Image received")
    print(f"[FACE] Image decoded: {frame.shape[1]}x{frame.shape[0]}")

    emb, bbox, face_count = get_embedding(model, frame, quality_check=False)
    print(f"[FACE] Face count: {face_count}")

    if emb is None:
        print("[FACE] Result: NO FACE")
        return {
            "success": True,
            "recognized": False,
            "matched": False,
            "identity": None,
            "name": None,
            "confidence": 0.0,
            "score": 0.0,
            "threshold": THRESHOLD,
            "face_detected": False,
            "embedding_generated": False,
            "message": "No face detected in the frame",
            "bbox": None
        }

    print("[FACE] Embedding generated")

    best_name = None
    best_score = -1.0

    for name, ref_embedding in enrolled_db.items():
        score = cosine_similarity(emb, ref_embedding)
        if score > best_score:
            best_score = score
            best_name = name

    matched = bool(best_score >= THRESHOLD and best_name is not None)
    confidence = round(float(best_score), 4)

    print(f"[FACE] Best match: {best_name}")
    print(f"[FACE] Distance/similarity: {confidence}")
    print(f"[FACE] Threshold: {THRESHOLD}")
    print(f"[FACE] Result: {'MATCH (' + str(best_name) + ')' if matched else 'UNKNOWN'}")

    return {
        "success": True,
        "recognized": matched,
        "matched": matched,
        "identity": best_name if matched else "UNKNOWN",
        "name": best_name if matched else "UNKNOWN",
        "recognizedName": best_name if matched else None,
        "confidence": confidence,
        "score": confidence,
        "threshold": THRESHOLD,
        "face_detected": True,
        "embedding_generated": True,
        "best_match": best_name,
        "bbox": [int(v) for v in bbox] if bbox is not None else None
    }


@app.post("/enroll")
async def enroll(request: Request):
    """
    Enroll a new face identity into enrolled.pkl.
    Supports either JSON { "identity": "name", "image": "<base64>" } or multipart/form-data.
    NEVER overwrites existing enrolled identities; safely appends/updates target identity.
    """
    global face_app, enrolled_db
    if face_app is None:
        raise HTTPException(status_code=503, detail="Face recognition model not yet initialized")

    # Load latest database from disk first to guarantee zero overwrites
    db = load_database(force=True)

    target_identity = None
    frame = None
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            body_bytes = await request.body()
            data = json.loads(body_bytes.decode("utf-8", errors="replace"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {e}")

        target_identity = data.get("identity", "").strip()
        raw_b64 = data.get("image", "").strip()
        if raw_b64:
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            raw_b64 = "".join(raw_b64.split())
            try:
                img_bytes = base64.b64decode(raw_b64)
                frame = decode_image_bytes(img_bytes)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Base64 decode error: {e}")

    elif "multipart/form-data" in content_type:
        form = await request.form()
        target_identity = str(form.get("identity", "")).strip()
        file = form.get("file")
        if file and hasattr(file, "read"):
            content = await file.read()
            frame = decode_image_bytes(content)

    if not target_identity:
        raise HTTPException(status_code=400, detail="Identity name is required for enrollment")
    if frame is None:
        raise HTTPException(status_code=400, detail="Valid image is required for enrollment")

    print(f"[ENROLL] Identity: {target_identity}")

    model = get_face_app()
    emb, bbox, face_count = get_embedding(model, frame, quality_check=True)
    print(f"[ENROLL] Face detected: {face_count}")

    if emb is None:
        raise HTTPException(
            status_code=400,
            detail="No clear face detected in enrollment frame or face is too small. Please position your face clearly in the camera."
        )

    print("[ENROLL] Embedding generated: YES")
    print(f"[ENROLL] Existing identities: {list(db.keys())}")

    # Safely merge target identity into database (preserving all other identities!)
    db[target_identity] = emb
    save_database(db)
    enrolled_db = db

    print(f"[ENROLL] Saved successfully: YES. Total identities now: {len(enrolled_db)}")

    return {
        "success": True,
        "identity": target_identity,
        "enrolled_count": len(enrolled_db),
        "identities": list(enrolled_db.keys()),
        "message": f"Identity '{target_identity}' enrolled successfully"
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f"[FaceService] Starting HTTP Face Service on port {port} (single worker)...")
    uvicorn.run("service:app", host="0.0.0.0", port=port, reload=False, workers=1, access_log=False)
