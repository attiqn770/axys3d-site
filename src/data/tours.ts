// TOUR LIBRARY: every 360 degree tour on the site comes from here.
// Add a project by dropping two things in place, nothing else:
//   src/data/tours/<slug>.json                       rooms, hotspots, start views, project name and summary
//   public/media/tours/<slug>/<room>.webp, <room>-sm.webp, poster.webp, poster-sm.webp
// A tour is listed only when its JSON is complete AND every picture it needs is on disk,
// so a project that is still rendering never shows a broken card or page.
// Picture paths are never stored in the JSON: they are built from tourBase() so tools/make-preview.py
// can rewrite the one data-base attribute for the shared preview.
import { existsSync, openSync, readSync, closeSync } from "node:fs";
import { join } from "node:path";
import type { TourData, TourRoom } from "../scripts/tour";

export interface TourFile extends TourData {
  slug: string;
  project: string;        // the name visitors see, never a client, architect or address
  summary: string;        // one line for the library card and the page opening
  rooms_count?: number;
  note?: string;
  poster_alt?: string;    // optional: what the poster shows
  order?: number;         // optional: lower comes first in the library
}

export interface Tour extends TourFile {
  base: string;           // public folder of the pictures, with a trailing slash
  floors: string[];       // floor names in the order the rooms reach them
  poster: { w: number; h: number; alt: string };
}

const files = import.meta.glob<TourFile>("./tours/*.json", { eager: true, import: "default" });
const PUBLIC = join(process.cwd(), "public");

export const tourBase = (slug: string) => `/media/tours/${slug}/`;
const onDisk = (slug: string, file: string) => existsSync(join(PUBLIC, "media", "tours", slug, file));

// width and height straight from the WebP header, so every poster reserves the right space
function webpSize(slug: string, file: string): { w: number; h: number } | null {
  try {
    const fd = openSync(join(PUBLIC, "media", "tours", slug, file), "r");
    const b = Buffer.alloc(30);
    readSync(fd, b, 0, 30, 0);
    closeSync(fd);
    if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WEBP") return null;
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") return { w: 1 + (((b[22] & 0x3f) << 8) | b[21]), h: 1 + (((b[24] & 0x0f) << 10) | (b[23] << 2) | ((b[22] & 0xc0) >> 6)) };
  } catch { /* missing or unreadable */ }
  return null;
}

const complete = (t: Partial<TourFile>): t is TourFile =>
  typeof t.slug === "string" && /^[a-z0-9-]+$/.test(t.slug) &&
  typeof t.project === "string" && typeof t.summary === "string" &&
  Array.isArray(t.rooms) && t.rooms.length > 0 &&
  t.rooms.every((r: TourRoom) => typeof r.slug === "string" && typeof r.name === "string" && Array.isArray(r.spots));

const ready = (t: TourFile) =>
  ["poster.webp", "poster-sm.webp"].every((f) => onDisk(t.slug, f)) &&
  t.rooms.every((r) => onDisk(t.slug, `${r.slug}.webp`) && onDisk(t.slug, `${r.slug}-sm.webp`));

const why: string[] = [];
export const tours: Tour[] = Object.entries(files)
  .map(([path, t]) => ({ path, t: t as Partial<TourFile> }))
  .filter(({ path, t }) => {
    if (!complete(t)) { why.push(`${path}: incomplete data`); return false; }
    if (!ready(t)) { why.push(`${t.slug}: pictures missing in public/media/tours/${t.slug}/`); return false; }
    return true;
  })
  .map(({ t }) => {
    const f = t as TourFile;
    // keep only hotspots that lead to a room the tour has, so a stale arrow can never break the viewer
    const known = new Set(f.rooms.map((r) => r.slug));
    const rooms = f.rooms.map((r) => ({ ...r, floor: r.floor ?? "", spots: r.spots.filter((s) => known.has(s.to)) }));
    const floors = [...new Set(rooms.map((r) => r.floor).filter(Boolean))];
    const size = webpSize(f.slug, "poster.webp") ?? { w: 1600, h: 900 };
    return {
      ...f,
      rooms,
      rooms_count: rooms.length,
      base: tourBase(f.slug),
      floors,
      poster: { ...size, alt: f.poster_alt ?? `${f.project}, a frame from the virtual tour` },
    };
  })
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100) || a.project.localeCompare(b.project));

if (why.length) console.warn(`[tours] left out of the library: ${why.join("; ")}`);

export const getTour = (slug: string): Tour | undefined => tours.find((t) => t.slug === slug);

// plain words for small counts, so headings read "Six rooms on three floors"
const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
export const inWords = (n: number) => WORDS[n] ?? String(n);
export const plural = (n: number, one: string, many = `${one}s`) => `${inWords(n)} ${n === 1 ? one : many}`;
