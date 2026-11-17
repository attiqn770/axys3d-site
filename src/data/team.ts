// The people behind Axys3D, shown as profile cards on the Hire us page (#team).
// Edited in Pages CMS ("Team on the Hire us page"): src/content/team/index.json.
// A card shows only when the person is ticked visible and has at least one profile link. An empty figure is hidden.
// Photos: any upload works; the site shows it as a round picture. Built in ones live in public/media/team/.
import data from "../content/team/index.json";

export type Badge = "Top Rated Plus" | "Top Rated" | "Rising Talent" | "";

export type Member = {
  name: string;          // as shown on the platforms: first name and initial
  photo?: string;        // site address of the picture, e.g. /media/team/attiq.webp
  role: string;          // short line, no dashes
  upwork?: string;
  fiverr?: string;
  verified?: boolean;    // identity verified on Upwork (blue tick)
  badge?: Badge;         // the Upwork talent badge
  jobSuccess?: number;   // Upwork Job Success, percent
  rating?: number;       // average client rating out of 5
  reviews?: number;
  jobs?: number;
  hours?: number;        // total hours, written out in full on the card
  earned?: number;       // total Upwork earnings in US dollars
  rate?: string;         // e.g. "$25"
  visible?: boolean;
};

export const checked: string = data.checked ?? "";
export const team: Member[] = (data.members ?? []) as Member[];

// a picture uploaded in the editor gets a small copy next to it (name-sm.webp); use that for the round photo
export const photoSrc = (m: Member) => {
  const p = m.photo || "";
  return p.startsWith("/media/uploads/") && p.endsWith(".webp") && !p.endsWith("-sm.webp") ? p.replace(/\.webp$/, "-sm.webp") : p;
};
