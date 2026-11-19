#!/usr/bin/env python3
"""Base maps for the site pages (LOD-AM/planning#18).

One static relief map per 1x1 degree tile that contains a released site (owner, 2026-11-19:
"limited to the tiles whose sites are present on the website"). No borders, cities or roads.
- Relief: Copernicus DEM GLO-90 (hillshade and an earthy elevation tint)
- Rivers: HydroRIVERS v1.0 (HydroSHEDS), line width by upstream area
- Lakes (natural lakes and reservoirs) and sea: Natural Earth 10m (public domain).
  Modern reservoirs and coastlines are accepted (owner, 2026-11-19).

Output: public/img/maps/<tile>.webp and _data/siteMaps.json (extent and size of each image).
The site pages draw the site markers on top as SVG at build time, so the images don't
change when sites are added to an existing tile.

Run it after releasing a publication with a site in a new tile (data/README.md):
    pip install -r scripts/map/requirements.txt
    python3 scripts/map/build_maps.py                 # downloads into .cache/maps/
Needs: copernicus-dem-90m.s3.amazonaws.com, data.hydrosheds.org, raw.githubusercontent.com.
npm run check fails if a released site has no map tile.
"""
import io, json, math, re, sys, urllib.request, zipfile
from pathlib import Path

import numpy as np
import rasterio
import shapefile
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache" / "maps"
OUT_IMG = ROOT / "public" / "img" / "maps"
OUT_JSON = ROOT / "_data" / "siteMaps.json"

HEIGHT = 1200            # output image height in px (one degree of latitude)
SUPER = 2                # draw vectors at 2x, then scale down (anti-aliasing)
MIN_UPLAND_KM2 = 50      # rivers with a smaller catchment are left out
HYDRO_REGIONS = ["eu", "as", "af"]   # HydroRIVERS regions to try, in this order

SOURCES = [
    # Licences (owner, 2026-11-19): COP-DEM-GLO-90-F, free of charge, worldwide, non-exclusive, no time limit.
    # HydroRIVERS v1.0 is under the HydroSHEDS License Agreement (free for non-commercial and commercial use,
    # citation required; HydroRIVERS Technical Documentation v1.0, section 4). The CC-BY 4.0 licence of
    # HydroSHEDS v2 core products does not cover v1.0.
    {"name": "Copernicus DEM GLO-90", "text": "Produced using Copernicus WorldDEM™-90 © DLR e.V. 2010–2014 and © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA; all rights reserved. Licence: COP-DEM-GLO-90-F Global 90m Full, Free & Open (Licence for the use of the Copernicus WorldDEM™-90).", "url": "https://doi.org/10.5270/ESA-c5d3d65"},
    {"name": "HydroRIVERS v1.0", "text": "Lehner, B., Grill, G. (2013): Global river hydrography and network routing: baseline data and new approaches to study the world’s large river systems. Hydrological Processes 27(15): 2171–2186. Data: www.hydrosheds.org, under the HydroSHEDS License Agreement.", "url": "https://www.hydrosheds.org"},
    {"name": "Natural Earth", "text": "Lakes, reservoirs and sea: Natural Earth (public domain).", "url": "https://www.naturalearthdata.com"},
]

# Earthy elevation tint (m -> RGB), multiplied with the hillshade
TINT = [(-100, (196, 208, 176)), (0, (203, 212, 178)), (400, (218, 214, 172)), (800, (222, 204, 160)),
        (1200, (210, 186, 142)), (1700, (190, 164, 124)), (2300, (170, 148, 118)), (3000, (160, 146, 132)),
        (3800, (214, 210, 202)), (5000, (240, 238, 234))]
WATER, WATER_LINE, SEA = (157, 190, 214), (52, 104, 156), (168, 198, 220)


def fetch(url, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        print(f"  download {url}", file=sys.stderr)
        # data.hydrosheds.org refuses Python's default User-Agent
        req = urllib.request.Request(url, headers={"User-Agent": "lod-am-map-builder"})
        with urllib.request.urlopen(req) as r, open(path, "wb") as f:
            f.write(r.read())
    return path


def released_sites():
    """Site coordinates as in data/published: <.../id/site/<uuid>/geometry> geo:asWKT "POINT (lon lat)"."""
    sites = []
    for ttl in sorted((ROOT / "data" / "published").glob("*.ttl")):
        text = ttl.read_text(encoding="utf-8")
        for m in re.finditer(r"<https://lod-am\.net/id/site/([0-9a-f-]{36})/geometry>[^.]*?asWKT\s+\"POINT\s*\(\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\)\"", text, re.S):
            sites.append((m.group(1), float(m.group(2)), float(m.group(3))))
    return sorted(set(sites))


def tile_name(lat, lon):
    return f"{'N' if lat >= 0 else 'S'}{abs(lat):02d}{'E' if lon >= 0 else 'W'}{abs(lon):03d}"


def dem_tile(lat, lon):
    ns, ew = ("N" if lat >= 0 else "S"), ("E" if lon >= 0 else "W")
    name = f"Copernicus_DSM_COG_30_{ns}{abs(lat):02d}_00_{ew}{abs(lon):03d}_00_DEM"
    return fetch(f"https://copernicus-dem-90m.s3.amazonaws.com/{name}/{name}.tif", CACHE / "dem" / f"{name}.tif")


def hydrorivers_for(west, south, east, north):
    for region in HYDRO_REGIONS:
        z = fetch(f"https://data.hydrosheds.org/file/HydroRIVERS/HydroRIVERS_v10_{region}_shp.zip", CACHE / f"HydroRIVERS_v10_{region}_shp.zip")
        with zipfile.ZipFile(z) as zf:
            names = {Path(n).suffix: n for n in zf.namelist() if Path(n).stem == f"HydroRIVERS_v10_{region}"}
            r = shapefile.Reader(shp=io.BytesIO(zf.read(names[".shp"])), dbf=io.BytesIO(zf.read(names[".dbf"])))
            x0, y0, x1, y1 = r.bbox
            if x0 <= west and y0 <= south and x1 >= east and y1 >= north:
                fields = [f[0] for f in r.fields[1:]]
                up = fields.index("UPLAND_SKM")
                out = []
                for sr in r.iterShapeRecords():
                    bx = sr.shape.bbox
                    if bx[2] < west or bx[0] > east or bx[3] < south or bx[1] > north:
                        continue
                    if sr.record[up] >= MIN_UPLAND_KM2:
                        out.append((sr.record[up], sr.shape.points))
                return out
    raise SystemExit(f"no HydroRIVERS region covers {west},{south},{east},{north}")


def natural_earth(layer):
    return json.loads(fetch(f"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_{layer}.geojson", CACHE / f"ne_10m_{layer}.geojson").read_text())


def polygons(geom):
    if geom["type"] == "Polygon":
        yield geom["coordinates"]
    elif geom["type"] == "MultiPolygon":
        yield from geom["coordinates"]


def smooth(pts, passes=2):
    """Chaikin corner cutting, for drawing only: HydroRIVERS follows a 15" raster and looks stepped
    at this scale. Keeps the end points, so connected segments stay connected."""
    for _ in range(passes):
        if len(pts) < 3:
            return pts
        out = [pts[0]]
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            out += [(0.75 * x0 + 0.25 * x1, 0.75 * y0 + 0.25 * y1), (0.25 * x0 + 0.75 * x1, 0.25 * y0 + 0.75 * y1)]
        out.append(pts[-1])
        pts = out
    return pts


def tint(z):
    zs = np.array([t[0] for t in TINT], float)
    return np.stack([np.interp(z, zs, [t[1][i] for t in TINT]) for i in range(3)], axis=-1)


def hillshade(z, dx, dy, azimuth=315.0, altitude=45.0):
    gy, gx = np.gradient(z, dy, dx)
    slope = np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    az, alt = math.radians(360 - azimuth + 90), math.radians(altitude)
    hs = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(hs, 0, 1)


def build_tile(lat, lon, lakes, ocean):
    west, south, east, north = lon, lat, lon + 1, lat + 1
    with rasterio.open(dem_tile(lat, lon)) as ds:
        z = ds.read(1).astype("float64")
        res_x, res_y = ds.res
    z[z < -1000] = 0
    mid = math.radians(lat + 0.5)
    dx, dy = res_x * 111320 * math.cos(mid), res_y * 110574
    # soft relief: main light from the north-west, a weaker one from the west, plus ambient light
    hs = 0.75 * hillshade(z, dx, dy, 315) + 0.25 * hillshade(z, dx, dy, 270)
    shade = 0.45 + 0.55 * hs
    rgb = np.clip(tint(z) * shade[..., None], 0, 255).astype("uint8")
    width = round(HEIGHT * math.cos(mid))      # equirectangular, true scale at the tile's middle
    W, H = width * SUPER, HEIGHT * SUPER
    img = Image.fromarray(rgb).resize((W, H), Image.LANCZOS)
    draw = ImageDraw.Draw(img)
    px = lambda p: ((p[0] - west) / (east - west) * W, (north - p[1]) / (north - south) * H)
    inside = lambda bb: not (bb[2] < west or bb[0] > east or bb[3] < south or bb[1] > north)

    def bbox_of(rings):
        xs = [c[0] for r in rings for c in r]; ys = [c[1] for r in rings for c in r]
        return min(xs), min(ys), max(xs), max(ys)

    for f in ocean["features"]:
        for rings in polygons(f["geometry"]):
            if inside(bbox_of(rings)):
                draw.polygon([px(c) for c in rings[0]], fill=SEA)
    for f in lakes["features"]:
        for rings in polygons(f["geometry"]):
            if inside(bbox_of(rings)):
                draw.polygon([px(c) for c in rings[0]], fill=WATER)   # no outline: adjacent polygons would show seams
    rivers = hydrorivers_for(west, south, east, north)
    for upland, pts in sorted(rivers):
        w = min(4.5, 0.7 + 0.9 * math.log10(upland / MIN_UPLAND_KM2)) * SUPER
        draw.line([px(p) for p in smooth(pts)], fill=WATER_LINE, width=max(1, round(w)), joint="curve")
    img = img.resize((width, HEIGHT), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1, percent=40, threshold=2))
    name = tile_name(lat, lon)
    OUT_IMG.mkdir(parents=True, exist_ok=True)
    img.save(OUT_IMG / f"{name}.webp", "WEBP", quality=80, method=6)
    print(f"  {name}: {width}x{HEIGHT}, {len(rivers)} river segments, {(OUT_IMG / f'{name}.webp').stat().st_size // 1024} KB", file=sys.stderr)
    return {"tile": name, "src": f"/img/maps/{name}.webp", "west": west, "south": south, "east": east, "north": north,
            "width": width, "height": HEIGHT, "kmPerDegreeLat": 110.574, "kmPerDegreeLon": round(111.320 * math.cos(mid), 3)}


def main():
    sites = released_sites()
    tiles = sorted({(math.floor(lat), math.floor(lon)) for _, lon, lat in sites})
    print(f"{len(sites)} released sites in {len(tiles)} tile(s)", file=sys.stderr)
    lakes, ocean = natural_earth("lakes"), natural_earth("ocean")
    maps = [build_tile(lat, lon, lakes, ocean) for lat, lon in tiles]
    OUT_JSON.write_text(json.dumps({"tiles": maps, "sources": SOURCES, "minUplandKm2": MIN_UPLAND_KM2}, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUT_JSON.relative_to(ROOT)}", file=sys.stderr)


if __name__ == "__main__":
    main()
