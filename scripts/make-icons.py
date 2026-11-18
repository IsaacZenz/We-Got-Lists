"""Draws the We Got Lists app icon (a pixel-art cow) and saves it at the sizes phones need.
Run from the repo root:  python3 scripts/make-icons.py"""
from PIL import Image

SKY, GRASS, GRASS_DARK = (124, 208, 255), (92, 194, 60), (74, 168, 46)
INK, WHITE, PINK, PINK_DARK = (59, 36, 16), (255, 250, 240), (255, 158, 192), (194, 90, 122)
HORN, SPOT = (230, 207, 152), (59, 36, 16)
N = 32

def cow_grid():
    g = {}
    def put(x, y, c):
        if 0 <= x < N and 0 <= y < N: g[(x, y)] = c
    # horns
    for x, y in [(8, 3), (9, 4), (9, 5), (10, 6), (23, 3), (22, 4), (22, 5), (21, 6)]:
        put(x, y, HORN); put(x - 1 if x < 16 else x + 1, y, HORN) if y == 3 else None
    # ears
    for y in range(9, 13):
        for x in range(3, 10): put(x, y, WHITE)
        for x in range(22, 29): put(x, y, WHITE)
    for x in range(4, 8): put(x, 10, PINK); put(x, 11, PINK)
    for x in range(24, 28): put(x, 10, PINK); put(x, 11, PINK)
    # head (rounded rectangle)
    for y in range(6, 24):
        for x in range(9, 23):
            if (y in (6, 23)) and x in (9, 22): continue
            put(x, y, WHITE)
    # spots
    for x, y in [(10,7),(11,7),(12,7),(13,7),(10,8),(11,8),(12,8),(10,9),(11,9),(10,10),(19,8),(20,8),(20,9),(21,9),(20,10),(21,16),(21,17),(20,17)]:
        put(x, y, SPOT)
    # eyes with a sparkle
    for ex in (12, 19):
        for y in range(13, 16):
            put(ex, y, INK); put(ex + 1, y, INK)
        put(ex, 13, WHITE)
    # muzzle (wider than the head) with nostrils
    for y in range(19, 28):
        for x in range(8, 24):
            if (y in (19, 27)) and x in (8, 9, 22, 23): continue
            if y in (20, 26) and x in (8, 23): continue
            put(x, y, PINK)
    for nx in (11, 19):
        for dx in (0, 1):
            for dy in (0, 1): put(nx + dx, 22 + dy, PINK_DARK)
    for x in range(13, 19): put(x, 25, PINK_DARK)  # smile
    # outline: every empty pixel touching the cow becomes ink
    out = dict(g)
    for x in range(N):
        for y in range(N):
            if (x, y) in g: continue
            if any((x + dx, y + dy) in g for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))): out[(x, y)] = INK
    return out

def render(pad, scale, path):
    size = N + 2 * pad
    im = Image.new("RGB", (size, size), SKY)
    px = im.load()
    cow = cow_grid()
    for y in range(size):
        for x in range(size):
            gy = y - pad
            px[x, y] = GRASS if gy >= 18 else SKY
            if gy >= 18 and (x * 7 + gy * 3) % 11 == 0: px[x, y] = GRASS_DARK
            c = cow.get((x - pad, gy))
            if c: px[x, y] = c
    im.resize((size * scale, size * scale), Image.NEAREST).save(path)

render(0, 16, "public/icon-512.png")
render(0, 6, "public/icon-192.png")
render(2, 5, "public/apple-touch-icon.png")   # 36 x 5 = 180, the size iPhones use
print("icons written")
