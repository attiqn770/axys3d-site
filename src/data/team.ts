// The people behind Axys3D, shown as profile cards on the Hire us page (#team).
// Figures come from each person's Upwork profile. Update them when they change, and update `checked`.
// A card shows only when the person has at least one profile link. Leave a figure out to hide it.
// Photos live in public/media/team/<slug>.webp (square, at least 100px).

export const checked = "November 2026";

export type Badge = "Top Rated Plus" | "Top Rated" | "Rising Talent";

export type Member = {
  slug: string;
  name: string;          // as shown on the platforms: first name and initial
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
};

export const team: Member[] = [
  {
    slug: "attiq",
    name: "Attiq R.",
    role: "3D visualization and CAD",
    upwork: "https://www.upwork.com/freelancers/attiqrehman15",
    fiverr: "https://www.fiverr.com/itzghostrider",
    verified: true,
    badge: "Top Rated Plus",
    jobSuccess: 100,
    rating: 5.0,
    reviews: 18,
    jobs: 32,
    hours: 1700,
    earned: 35000,
    rate: "$25",
  },
  {
    slug: "muneeb",
    name: "Muneeb U.",
    role: "Revit, permit sets and scan to BIM",
    upwork: "https://www.upwork.com/freelancers/~01764ff548009cb954",
    verified: true,
    badge: "Top Rated Plus",
    jobSuccess: 100,
    rating: 5.0,
    reviews: 4,
    jobs: 17,
    hours: 1100,
    earned: 21240,
    rate: "$25",
  },
  {
    slug: "kaleem",
    name: "Kaleem U.",
    role: "Revit BIM, permit sets and 3D rendering",
    upwork: "https://www.upwork.com/freelancers/~01f7cd3f1ababd0221",
    verified: true,
    badge: "Top Rated",
    jobSuccess: 100,
    rating: 5.0,
    reviews: 3,
    jobs: 5,
    hours: 51,
    earned: 1292,
    rate: "$20",
  },
  {
    slug: "matti",
    name: "Matti U.",
    role: "Interior design and architectural visualization",
    upwork: "https://www.upwork.com/freelancers/~01d3ccb98cc31b5a2f",
    fiverr: "https://www.fiverr.com/matti7215",
    verified: true,
    badge: "Top Rated",
    jobs: 20,
    hours: 85,
    earned: 3788,
    rate: "$20",
  },
];
