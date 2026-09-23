#!/usr/bin/env python3
"""Generate/update the runtime GP50 CAD manifest used by the simulator."""

import json
from pathlib import Path

MANIFEST_PATH = Path(__file__).resolve().parents[1] / "public" / "models" / "gp50" / "gp50_manifest.json"

manifest = {}
if MANIFEST_PATH.exists():
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

manifest.update({
    "robotModel": "Yaskawa GP50",
    "pivots": {
        "J1": [0.0, 0.0, 0.0],
        "J2": [144.0, 540.0, 0.0],
        "J3": [144.0, 1410.0, 0.0],
        "J4": [1170.0, 1620.0, 0.0],
        "J5": [1170.0, 1620.0, 0.0],
        "J6": [1170.0, 1620.0, 0.0],
    },
    "axes": {
        "J1": [0, 1, 0],
        "J2": [0, 0, 1],
        "J3": [0, 0, 1],
        "J4": [1, 0, 0],
        "J5": [0, 0, 1],
        "J6": [1, 0, 0],
    },
    "flangeOffset": [175.0, 0.0, 0.0],
    "materials": {
        "YaskawaBlue": "#00539C",
        "AccentSilver": "#A5ACAF",
        "DarkGrey": "#2B3038",
    },
})

MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
MANIFEST_PATH.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {MANIFEST_PATH}")
