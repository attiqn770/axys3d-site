# Turns the built site (dist/) into a copy that works from any folder, for sharing as a preview.
# Every address is made relative, the mail handler and search engine files are left out,
# and the home page is also written as a headless fragment (index.html) for the artifact host.
#   npx astro build && python tools/make-preview.py <output folder>
import os, re, shutil, sys

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist")
OUT = sys.argv[1]
SKIP_DIRS = {"mail", "process", "services_index", "work"}
SKIP_FILES = {"robots.txt", "sitemap-index.xml", "sitemap-0.xml", ".htaccess", "favicon.ico"}

if os.path.exists(OUT):
    shutil.rmtree(OUT)

def page_url(target: str, prefix: str) -> str:
    """'/about/#x' -> '<prefix>about/index.html#x'"""
    path, _, frag = target.partition("#")
    path = path.strip("/")
    out = prefix + (path + "/" if path else "") + "index.html"
    return out + ("#" + frag if frag else "")

def fix_html(html: str, depth: int, self_path: str) -> str:
    prefix = "../" * depth
    def attr(m):
        name, val = m.group(1), m.group(2)
        if name == "srcset" or name == "imagesrcset":
            return f'{name}="' + re.sub(r"(^|,\s*)/", lambda k: k.group(1) + prefix, val) + '"'
        if val.startswith("//") or not val.startswith("/"):
            return m.group(0)
        last = val.split("#")[0].rstrip("/").split("/")[-1]
        if name == "href" and "." not in last:      # a page, not a file
            return f'{name}="{page_url(val, prefix)}"'
        return f'{name}="{prefix}{val[1:]}"'
    html = re.sub(r'\b(href|src|srcset|imagesrcset|poster|action|data-clip|data-film|data-src|data-src-tall|data-full|data-base|content)="([^"]*)"', attr, html)
    html = html.replace("url(/", f"url({prefix}")
    # in page anchors keep working without relying on the document address
    return html

for root, dirs, files in os.walk(SRC):
    rel = os.path.relpath(root, SRC).replace("\\", "/")
    top = rel.split("/")[0]
    if top in ("mail", "process", "work") or rel == "services":
        continue
    for f in files:
        if f in SKIP_FILES:
            continue
        src = os.path.join(root, f)
        relfile = (rel + "/" if rel != "." else "") + f
        if rel == "services" and f == "index.html":
            continue
        dst = os.path.join(OUT, relfile)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        depth = 0 if rel == "." else rel.count("/") + 1
        if f.endswith(".html"):
            s = open(src, encoding="utf8").read()
            open(dst, "w", encoding="utf8", newline="").write(fix_html(s, depth, relfile))
        elif f.endswith(".css"):
            s = open(src, encoding="utf8").read().replace("url(/_astro/", "url(")
            open(dst, "w", encoding="utf8", newline="").write(s)
        elif f.endswith(".js"):
            s = open(src, encoding="utf8").read()
            for a in ("/draco/", "/models/", "/media/"):
                s = s.replace(f'"{a}', f'"{a[1:]}').replace(f"'{a}", f"'{a[1:]}").replace(f"`{a}", f"`{a[1:]}")
            open(dst, "w", encoding="utf8", newline="").write(s)
        else:
            shutil.copyfile(src, dst)

# the artifact host wraps the entry page in its own document, so give it the head and body contents only
home = open(os.path.join(OUT, "index.html"), encoding="utf8").read()
shutil.copyfile(os.path.join(OUT, "index.html"), os.path.join(OUT, "home.html"))
head = re.search(r"<head[^>]*>(.*?)</head>", home, re.S).group(1)
body = re.search(r"<body[^>]*>(.*)</body>", home, re.S).group(1)
# Astro can place a page's own script after </body>; it must travel too, or the page loses its behaviour
tail = home[home.rindex("</body>") + len("</body>"):]
body += "".join(re.findall(r"<script.*?</script>", tail, flags=re.S))
head = re.sub(r'<meta charset[^>]*>|<meta name="viewport"[^>]*>|<link rel="canonical"[^>]*>|<meta property="og:[^>]*>|<meta name="twitter:[^>]*>|<script type="application/ld\+json">.*?</script>', "", head, flags=re.S)
head = re.sub(r"<title>.*?</title>", "<title>Axys3D Website</title>", head, flags=re.S)
open(os.path.join(OUT, "entry.html"), "w", encoding="utf8", newline="").write(head.strip() + "\n" + body.strip() + "\n")

# the artifact host reserves names starting with "_": publish the build folder as "assets"
os.rename(os.path.join(OUT, "_astro"), os.path.join(OUT, "assets"))
for r, _, fs in os.walk(OUT):
    for f in fs:
        if f.endswith((".html", ".css", ".js")):
            fp = os.path.join(r, f)
            t = open(fp, encoding="utf8").read()
            if "_astro/" in t:
                open(fp, "w", encoding="utf8", newline="").write(t.replace("_astro/", "assets/"))

# the artifact host does not serve .glb files, so the two models travel as generic binary files
for name in ("adu", "logo"):
    os.rename(os.path.join(OUT, "models", name + ".glb"), os.path.join(OUT, "models", name + ".wasm"))
for f in os.listdir(os.path.join(OUT, "assets")):
    if f.endswith(".js"):
        fp = os.path.join(OUT, "assets", f)
        t = open(fp, encoding="utf8").read()
        if ".glb" in t:
            open(fp, "w", encoding="utf8", newline="").write(t.replace("models/adu.glb", "models/adu.wasm").replace("models/logo.glb", "models/logo.wasm"))

n = sum(len(f) for _, _, f in os.walk(OUT))
size = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(OUT) for f in fs)
print(f"preview written: {n} files, {size / 1e6:.1f} MB")
