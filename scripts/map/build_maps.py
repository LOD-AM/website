#!/usr/bin/env python3
"""Base map for the site pages (LOD-AM/planning#18).

One relief map at a fixed, small scale for the whole area of the LOD-AM research database
(owner, 2026-11-19: "load all tiles for the whole database and fix the map to this scale"), in
Web Mercator. The owner chose the overview scale: every site page and /data/sites/ show the whole
area in one image (overview.webp), with the site marked. It is rendered at zoom 7 (about 0.9 km per
pixel at 40° N) and scaled down, so rivers and coasts stay smooth. No borders, settlements, roads
or reservoirs.
- Relief: Copernicus DEM GLO-90 (read at 30" from the files' overviews; hillshade + earthy tint)
- Rivers: HydroRIVERS v1.0 (HydroSHEDS), line width by upstream area
- Natural lakes and sea: Natural Earth 10m (public domain); reservoirs are left out (owner).

The area is the bounding box of all sites in the research database, rounded out to whole
degrees (EXTENT below). Only this box is used here, no site coordinates from the private
database. Markers are placed by the website build (_data/lodam.js), so the tiles don't change
when sites are released.

    pip install -r scripts/map/requirements.txt
    python3 scripts/map/build_maps.py        # downloads into .cache/maps/, ~10 minutes
Needs: copernicus-dem-90m.s3.amazonaws.com, data.hydrosheds.org, raw.githubusercontent.com.
Writes public/img/maps/overview.webp and _data/siteMaps.json.
"""
import io, json, math, os, sys, urllib.error, urllib.request, zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import rasterio
from rasterio.enums import Resampling
import shapefile
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache" / "maps"
OUT_DIR = ROOT / "public" / "img" / "maps"
OUT_JSON = ROOT / "_data" / "siteMaps.json"

# Bounding box of all sites in the research database (ingest dump of 2026-11-17: 504 sites,
# 21.0–61.4° E, 30.7–52.8° N), rounded out to whole degrees: west, south, east, north.
# Widen it when the database grows beyond it; npm run check fails for a released site outside.
EXTENT = (21, 30, 62, 53)
ZOOM, TILE = 7, 256
PX_PER_DEG = 120                     # DEM sampling: 30 arc seconds (~0.9 km)
EXAGGERATION = 3.0                   # vertical exaggeration for the hillshade at this scale
MIN_UPLAND_KM2 = 2000                # rivers with a smaller catchment are left out
HYDRO_REGIONS = ["eu", "as"]
SUPER = 2                            # draw vectors at 2x, then scale down
OVERVIEW_WIDTH = 2048                # sharp up to ~1000 CSS px on 2x screens

SOURCES = [
    # Licences (owner, 2026-11-19): COP-DEM-GLO-90-F, free of charge, worldwide, non-exclusive, no time limit.
    # HydroRIVERS v1.0 is under the HydroSHEDS License Agreement (free for non-commercial and commercial use,
    # citation required; HydroRIVERS Technical Documentation v1.0, section 4). The CC-BY 4.0 licence of
    # HydroSHEDS v2 core products does not cover v1.0.
    {"name": "Copernicus DEM GLO-90", "text": "Produced using Copernicus WorldDEM™-90 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA; all rights reserved. Licence: COP-DEM-GLO-90-F Global 90m Full, Free & Open (Licence for the use of the Copernicus WorldDEM™-90).", "url": "https://doi.org/10.5270/ESA-c5d3d65"},
    {"name": "HydroRIVERS v1.0", "text": "Lehner, B., Grill, G. (2013): Global river hydrography and network routing: baseline data and new approaches to study the world’s large river systems. Hydrological Processes 27(15): 2171–2186. Data: www.hydrosheds.org, under the HydroSHEDS License Agreement.", "url": "https://www.hydrosheds.org"},
    {"name": "Natural Earth", "text": "Natural lakes and sea: Natural Earth (public domain). Reservoirs are left out.", "url": "https://www.naturalearthdata.com"},
]

TINT = [(-100, (196, 208, 176)), (0, (203, 212, 178)), (400, (218, 214, 172)), (800, (222, 204, 160)),
        (1200, (210, 186, 142)), (1700, (190, 164, 124)), (2300, (170, 148, 118)), (3000, (160, 146, 132)),
        (3800, (214, 210, 202)), (5000, (240, 238, 234))]
WATER, WATER_LINE = (157, 190, 214), (52, 104, 156)
OUTSIDE = (226, 222, 210)            # beyond the database box
UA = {"User-Agent": "lod-am-map-builder"}   # data.hydrosheds.org refuses Python's default User-Agent


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def fetch(url, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        log(f"  download {url}")
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA)) as r, open(path, "wb") as f:
            f.write(r.read())
    return path


# --- Web Mercator ----------------------------------------------------------------------------
WORLD = TILE * 2 ** ZOOM
def lon2px(lon): return (lon + 180) / 360 * WORLD
def lat2py(lat): return (1 - math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)) / math.pi) / 2 * WORLD
def py2lat(py): return math.degrees(2 * math.atan(math.exp((1 - 2 * py / WORLD) * math.pi)) - math.pi / 2)


# --- Relief ----------------------------------------------------------------------------------
def dem_cell(lat, lon):
    """One 1x1 degree GLO-90 tile at PX_PER_DEG, read from the file's overview over HTTP; None for sea."""
    cache = CACHE / "dem30" / f"{lat}_{lon}.npy"
    if cache.exists():
        a = np.load(cache)
        return None if a.size == 0 else a
    ns, ew = ("N" if lat >= 0 else "S"), ("E" if lon >= 0 else "W")
    name = f"Copernicus_DSM_COG_30_{ns}{abs(lat):02d}_00_{ew}{abs(lon):03d}_00_DEM"
    try:
        with rasterio.open(f"/vsicurl/https://copernicus-dem-90m.s3.amazonaws.com/{name}/{name}.tif") as ds:
            a = ds.read(1, out_shape=(PX_PER_DEG, PX_PER_DEG), resampling=Resampling.average).astype("float32")
    except rasterio.errors.RasterioIOError:
        a = np.zeros(0, "float32")    # no tile: open sea
    cache.parent.mkdir(parents=True, exist_ok=True)
    np.save(cache, a)
    return None if a.size == 0 else a


def dem_mosaic():
    west, south, east, north = EXTENT
    m = np.zeros(((north - south) * PX_PER_DEG, (east - west) * PX_PER_DEG), "float32")
    cells = [(lat, lon) for lat in range(south, north) for lon in range(west, east)]
    os.environ.setdefault("GDAL_DISABLE_READDIR_ON_OPEN", "EMPTY_DIR")
    if Path("/root/.ccr/ca-bundle.crt").exists():
        os.environ.setdefault("CURL_CA_BUNDLE", "/root/.ccr/ca-bundle.crt")
    with ThreadPoolExecutor(8) as ex:
        for i, ((lat, lon), a) in enumerate(zip(cells, ex.map(lambda c: dem_cell(*c), cells))):
            if a is not None:
                r0, c0 = (north - lat - 1) * PX_PER_DEG, (lon - west) * PX_PER_DEG
                m[r0:r0 + PX_PER_DEG, c0:c0 + PX_PER_DEG] = a
            if (i + 1) % 100 == 0:
                log(f"  DEM {i + 1}/{len(cells)}")
    m[m < -1000] = 0
    return m


def relief_rgb(z):
    """Hillshade with a weaker second light, multiplied with the elevation tint (lat/lon grid)."""
    north = EXTENT[3]
    lats = north - (np.arange(z.shape[0]) + 0.5) / PX_PER_DEG
    dx = (1 / PX_PER_DEG) * 111320 * np.cos(np.radians(lats))[:, None]
    dy = (1 / PX_PER_DEG) * 110574
    ze = z * EXAGGERATION
    gy = np.gradient(ze, axis=0) / dy
    gx = np.gradient(ze, axis=1) / dx

    def shade(azimuth, altitude=45.0):
        slope = np.arctan(np.hypot(gx, gy)); aspect = np.arctan2(-gx, gy)
        az, alt = math.radians(360 - azimuth + 90), math.radians(altitude)
        return np.clip(np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect), 0, 1)

    s = 0.45 + 0.55 * (0.75 * shade(315) + 0.25 * shade(270))
    zs = np.array([t[0] for t in TINT], float)
    tint = np.stack([np.interp(z, zs, [t[1][i] for t in TINT]) for i in range(3)], axis=-1)
    return np.clip(tint * s[..., None], 0, 255).astype("uint8")


# --- Vectors ---------------------------------------------------------------------------------
def natural_earth(layer):
    return json.loads(fetch(f"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_{layer}.geojson",
                            CACHE / f"ne_10m_{layer}.geojson").read_text())


def polygons(geom):
    if geom["type"] == "Polygon": yield geom["coordinates"]
    elif geom["type"] == "MultiPolygon": yield from geom["coordinates"]


def rivers():
    west, south, east, north = EXTENT
    out = []
    for region in HYDRO_REGIONS:
        z = fetch(f"https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_{region}_shp.zip", CACHE / f"HydroRIVERS_v10_{region}_shp.zip")
        with zipfile.ZipFile(z) as zf:
            names = {Path(n).suffix: n for n in zf.namelist() if Path(n).stem == f"HydroRIVERS_v10_{region}"}
            r = shapefile.Reader(shp=io.BytesIO(zf.read(names[".shp"])), dbf=io.BytesIO(zf.read(names[".dbf"])))
            up = [f[0] for f in r.fields[1:]].index("UPLAND_SKM")
            for sr in r.iterShapeRecords():
                bx = sr.shape.bbox
                if bx[2] < west or bx[0] > east or bx[3] < south or bx[1] > north: continue
                if sr.record[up] >= MIN_UPLAND_KM2:
                    out.append((sr.record[up], sr.shape.points))
    log(f"  {len(out)} river segments")
    return out


def smooth(pts, passes=2):
    """Chaikin corner cutting, for drawing only (HydroRIVERS follows a 15" raster)."""
    for _ in range(passes):
        if len(pts) < 3: return pts
        out = [pts[0]]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            out += [(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1), (0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1)]
        out.append(pts[-1]); pts = out
    return pts


# --- Build -----------------------------------------------------------------------------------
def main():
    west, south, east, north = EXTENT
    # canvas aligned to the global tile grid, so tiles are standard z/x/y tiles
    tx0, tx1 = math.floor(lon2px(west) / TILE), math.ceil(lon2px(east) / TILE)
    ty0, ty1 = math.floor(lat2py(north) / TILE), math.ceil(lat2py(south) / TILE)
    ox, oy = tx0 * TILE, ty0 * TILE
    W, H = (tx1 - tx0) * TILE, (ty1 - ty0) * TILE
    log(f"extent {EXTENT}: {tx1 - tx0} x {ty1 - ty0} tiles at zoom {ZOOM} ({W} x {H} px)")

    rgb_ll = relief_rgb(dem_mosaic())
    # resample the lat/lon grid into the Mercator canvas (bilinear), at SUPER x
    cols = (np.arange(W * SUPER) + 0.5) / SUPER + ox
    rows = (np.arange(H * SUPER) + 0.5) / SUPER + oy
    lon = cols / WORLD * 360 - 180
    lat = np.degrees(2 * np.arctan(np.exp((1 - 2 * rows / WORLD) * np.pi)) - np.pi / 2)
    ci = np.clip((lon - west) * PX_PER_DEG - 0.5, 0, rgb_ll.shape[1] - 1.001)
    ri = np.clip((north - lat) * PX_PER_DEG - 0.5, 0, rgb_ll.shape[0] - 1.001)
    c0, r0 = ci.astype(int), ri.astype(int)
    fc, fr = (ci - c0)[None, :, None], (ri - r0)[:, None, None]
    src = rgb_ll.astype("float32")
    top = src[r0][:, c0] * (1 - fc) + src[r0][:, c0 + 1] * fc
    bot = src[r0 + 1][:, c0] * (1 - fc) + src[r0 + 1][:, c0 + 1] * fc
    canvas = (top * (1 - fr) + bot * fr).astype("uint8")
    # outside the database box: plain background, no smeared edge pixels
    outside = ((lon < west) | (lon > east))[None, :] | ((lat < south) | (lat > north))[:, None]
    canvas[outside] = OUTSIDE
    img = Image.fromarray(canvas)
    del canvas, top, bot

    px = lambda p: ((lon2px(p[0]) - ox) * SUPER, (lat2py(max(-85, min(85, p[1]))) - oy) * SUPER)
    def inside(rings):
        xs = [c[0] for r in rings for c in r]; ys = [c[1] for r in rings for c in r]
        return not (max(xs) < west - 1 or min(xs) > east + 1 or max(ys) < south - 1 or min(ys) > north + 1)
    # Water as a mask: outer rings filled, holes (islands) cut out again, so islands keep their relief
    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    def fill(rings):
        md.polygon([px(c) for c in rings[0]], fill=255)
        for hole in rings[1:]:
            md.polygon([px(c) for c in hole], fill=0)
    for f in natural_earth("ocean")["features"]:
        for rings in polygons(f["geometry"]):
            if inside(rings): fill(rings)
    n_lakes = n_res = 0
    for f in natural_earth("lakes")["features"]:
        if f["properties"].get("featurecla") == "Reservoir":
            n_res += 1; continue           # owner, 2026-11-19: no modern reservoirs
        for rings in polygons(f["geometry"]):
            if inside(rings): fill(rings); n_lakes += 1
    m = np.array(mask); m[outside] = 0     # water only inside the database box
    img.paste(Image.new("RGB", img.size, WATER), (0, 0), Image.fromarray(m))
    del m
    del mask, md
    draw = ImageDraw.Draw(img)
    log(f"  {n_lakes} natural lake polygons, {n_res} reservoirs left out")
    for upland, pts in sorted(rivers()):
        w = min(4.0, 0.6 + 0.8 * math.log10(upland / MIN_UPLAND_KM2)) * SUPER
        draw.line([px(p) for p in smooth(pts)], fill=WATER_LINE, width=max(1, round(w)), joint="curve")

    oh = round(H * OVERVIEW_WIDTH / W)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img.resize((OVERVIEW_WIDTH, oh), Image.LANCZOS).save(OUT_DIR / "overview.webp", "WEBP", quality=80, method=6)
    log(f"  overview {OVERVIEW_WIDTH} x {oh} px, {(OUT_DIR / 'overview.webp').stat().st_size // 1024} KB")
    OUT_JSON.write_text(json.dumps({
        "zoom": ZOOM, "tileSize": TILE, "extent": dict(zip(["west", "south", "east", "north"], EXTENT)),
        "canvas": {"originX": ox, "originY": oy, "width": W, "height": H},
        "overview": {"src": "/img/maps/overview.webp", "width": OVERVIEW_WIDTH, "height": oh},
        "minUplandKm2": MIN_UPLAND_KM2, "sources": SOURCES,
    }, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    log(f"wrote {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
