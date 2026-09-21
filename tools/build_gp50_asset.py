#!/usr/bin/env python3
"""
Build a clean, articulation-ready GP50 asset from the supplied CAD conversion.

Input : public/models/gp50/GP50.glb   (OCCT export of the Yaskawa STEP; 30,589 primitives,
                                       3x/2x duplicated parts, all node transforms identity,
                                       Z-up->Y-up conversion applied to a Y-up CAD => robot lies on its side)
Output: GP50_clean.glb  - 7 meshes (one per CAD part), CAD frame restored (Y up, X forward, mm),
                          joint hierarchy J1..J6 with real pivots, geometry NOT modified (only rigid re-basing)
        gp50_manifest.json - pivots/axes/flange, verified against exact STEP cylinder axes

Vertex data is taken byte-for-byte from the supplied GLB (first, un-duplicated copy of each part);
the only operations are a rigid rotation (undo the exporter's axis swap) and a translation
(re-base each part on its own joint pivot).  No geometry is generated or approximated.
"""
import json, struct, sys, numpy as np

SRC = sys.argv[1] if len(sys.argv) > 1 else 'public/models/gp50/GP50.glb'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'GP50_clean.glb'
MAN = sys.argv[3] if len(sys.argv) > 3 else 'gp50_manifest.json'

d = open(SRC, 'rb').read()
jl, _ = struct.unpack('<I4s', d[12:20]); J = json.loads(d[20:20 + jl]); BIN = d[20 + jl + 8:]
A, BV = J['accessors'], J['bufferViews']

def read(ai, comps, dt):
    a = A[ai]; v = BV[a['bufferView']]
    off = v.get('byteOffset', 0) + a.get('byteOffset', 0)
    return np.frombuffer(BIN, dtype=dt, count=a['count'] * comps, offset=off).reshape(-1, comps) if comps > 1 \
        else np.frombuffer(BIN, dtype=dt, count=a['count'], offset=off)

# First (un-duplicated) copy of each CAD part = the meshes under GP50_ASM_ASM (mesh ids 0..12)
PARTS = {  # part: mesh ids
    'BASE': [0, 1, 2, 3, 4], 'S': [5, 6, 7], 'L': [8], 'U': [9], 'R': [10], 'B': [11], 'T': [12],
}
def to_step(p):          # glTF (x,y,z)[m] -> CAD/STEP (X,Y,Z)[mm];  inverse of the exporter's (X,Z,-Y)
    return np.stack([p[:, 0], -p[:, 2], p[:, 1]], 1) * 1000.0
def n_to_step(n):
    return np.stack([n[:, 0], -n[:, 2], n[:, 1]], 1)

# Pivots/axes measured from the exact analytic cylinders in the STEP (see manifest 'evidence')
P = {  # CAD frame, mm
    'J1': (0.0, 0.0, 0.0),        'J2': (144.0, 540.0, 0.0),   'J3': (144.0, 1410.0, 0.0),
    'J4': (1170.0, 1620.0, 0.0),  'J5': (1170.0, 1620.0, 0.0), 'J6': (1170.0, 1620.0, 0.0),
}
AXIS = {'J1': (0, 1, 0), 'J2': (0, 0, 1), 'J3': (0, 0, 1), 'J4': (1, 0, 0), 'J5': (0, 0, 1), 'J6': (1, 0, 0)}
CHAIN = [('BASE', None), ('S', 'J1'), ('L', 'J2'), ('U', 'J3'), ('R', 'J4'), ('B', 'J5'), ('T', 'J6')]
FLANGE_FROM_J6_MM = (175.0, 0.0, 0.0)   # T-part flange face at X=1345 (measured), wrist centre X=1170

meshes, stats = {}, {}
for part, ids in PARTS.items():
    pos, nor, idx, base = [], [], [], 0
    for mi in ids:
        for pr in J['meshes'][mi]['primitives']:
            p = to_step(read(pr['attributes']['POSITION'], 3, '<f4'))
            n = n_to_step(read(pr['attributes']['NORMAL'], 3, '<f4'))
            i = read(pr['indices'], 1, '<u4') if A[pr['indices']]['componentType'] == 5125 else read(pr['indices'], 1, '<u2')
            pos.append(p); nor.append(n); idx.append(i.astype(np.uint32) + base); base += len(p)
    meshes[part] = [np.vstack(pos), np.vstack(nor), np.concatenate(idx)]
    stats[part] = dict(primitives_merged=sum(len(J['meshes'][m]['primitives']) for m in ids),
                       vertices=int(base), triangles=int(len(meshes[part][2]) // 3))

# re-base each part on its own pivot so J-nodes rotate about their local origin
pivot_of = {'BASE': (0, 0, 0)}
for part, jn in CHAIN[1:]: pivot_of[part] = P[jn]
for part, m in meshes.items(): m[0] = (m[0] - np.array(pivot_of[part])).astype(np.float32)

# ---- write GLB ----
blob = bytearray(); bvs, accs, gmeshes, nodes = [], [], [], []
def add_view(arr, target):
    while len(blob) % 4: blob.append(0)
    bvs.append(dict(buffer=0, byteOffset=len(blob), byteLength=arr.nbytes, target=target)); blob.extend(arr.tobytes()); return len(bvs) - 1
for part, (p, n, i) in meshes.items():
    vp = add_view(np.ascontiguousarray(p), 34962); vn = add_view(np.ascontiguousarray(n.astype(np.float32)), 34962); vi = add_view(np.ascontiguousarray(i), 34963)
    accs += [dict(bufferView=vp, componentType=5126, count=len(p), type='VEC3', min=p.min(0).tolist(), max=p.max(0).tolist()),
             dict(bufferView=vn, componentType=5126, count=len(n), type='VEC3'),
             dict(bufferView=vi, componentType=5125, count=len(i), type='SCALAR')]
    gmeshes.append(dict(name=f'{part}_mesh', primitives=[dict(attributes=dict(POSITION=len(accs) - 3, NORMAL=len(accs) - 2), indices=len(accs) - 1, material=0)]))
mat = J['materials'][0]
nodes.append(dict(name='GP50', children=[1]))
prev_pivot = np.zeros(3); order = []
for k, (part, jn) in enumerate(CHAIN):
    piv = np.array(pivot_of[part]); tr = (piv - prev_pivot).tolist()
    node = dict(name=part if jn is None else f'{jn}_{part}', mesh=k)
    if jn: node['translation'] = tr; node['extras'] = dict(joint=jn, axis=list(AXIS[jn]), pivotCad=list(P[jn]))
    nodes.append(node); prev_pivot = piv
for k in range(1, len(nodes) - 1): nodes[k]['children'] = [k + 1]
# flange marker node (child of J6): TCP mount frame
nodes.append(dict(name='FLANGE', translation=list(FLANGE_FROM_J6_MM), extras=dict(note='tool mounting face, +X out of flange')))
nodes[-2]['children'] = [len(nodes) - 1]
gltf = dict(asset=dict(version='2.0', generator='build_gp50_asset.py (from supplied GP50.glb / Yaskawa STEP)', extras=dict(units='mm', up='+Y', forward='+X')),
            scene=0, scenes=[dict(nodes=[0])], nodes=nodes, meshes=gmeshes, materials=[mat],
            accessors=accs, bufferViews=bvs, buffers=[dict(byteLength=len(blob))])
js = json.dumps(gltf, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
while len(blob) % 4: blob.append(0)
open(OUT, 'wb').write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(blob)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(blob), b'BIN\0') + bytes(blob))

manifest = dict(
    source='GP50.glb (OCCT export of Yaskawa GP50 STEP, Pro/E 2014, 2018-01-15)', units='mm', frame='CAD frame: +Y up, +X forward (forearm direction at zero pose), origin on J1 axis at base plane',
    zeroPose='Yaskawa zero: J2 upper arm vertical, J3 forearm horizontal (+X), flange facing +X',
    joints={jn: dict(part=part, pivot=list(P[jn]), axis=list(AXIS[jn])) for part, jn in CHAIN[1:]},
    flange=dict(fromJ6=list(FLANGE_FROM_J6_MM), positionCad=[1345.0, 1620.0, 0.0], approachAxis=[1, 0, 0]),
    derivedLinks=dict(baseHeight_d1=540.0, shoulderOffset_a1=144.0, upperArm_J2toJ3=870.0,
                      forearm_J3toWristCentre=dict(along_X=1026.0, up_Y=210.0), wristCentreToFlange=175.0),
    evidence='Exact STEP CYLINDRICAL_SURFACE axes: J1 (BASE/S r=190..290 about Y through origin); J2 (S/L r=142..175 about Z through (144,540)); '
             'J3 (L/U r=104..165 about Z through (144,1410)); J4/J6 (U/R/B/T r=25..127 about X through y=1620,z=0); J5 (R/B r=69..92 about Z through (1170,1620)).',
    stats=stats, colorsInSource='none (STEP has 0 STYLED_ITEM/COLOUR_RGB; GLB has single material mat_0)')
json.dump(manifest, open(MAN, 'w'), indent=2)
print(json.dumps(stats, indent=1)); print('wrote', OUT, len(open(OUT, 'rb').read()) / 1e6, 'MB', MAN)
