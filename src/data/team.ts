// The people behind Axys3D, shown as profile cards on the Hire us page (#team).
// Figures are copied from each person's public Upwork profile. Update them when they change, and update `checked`.
// A card shows only when the person has at least one profile link. Leave a figure empty ("" or 0) to hide it.
// Photos live in public/media/team/<slug>.webp (square, at least 100px).

export const checked = "November 2026";

export type Member = {
  slug: string;
  name: string;          // as shown on the platforms: first name and initial
  role: string;          // short line, no dashes
  upwork?: string;
  fiverr?: string;
  badge?: string;        // the Upwork badge, e.g. "Top Rated Plus"
  jobSuccess?: number;   // Upwork Job Success, percent
  rating?: number;       // average client rating out of 5
  reviews?: number;
  jobs?: number;
  hours?: string;        // as Upwork shows it, e.g. "1.7K"
  rate?: string;         // e.g. "$25"
};

export const team: Member[] = [
  {
    slug: "attiq",
    name: "Attiq R.",
    role: "3D visualization and CAD",
    upwork: "https://www.upwork.com/freelancers/attiqrehman15",
    fiverr: "https://www.fiverr.com/itzghostrider",
    badge: "Top Rated Plus",
    jobSuccess: 100,
    rating: 5.0,
    reviews: 18,
    jobs: 32,
    hours: "1.7K",
    rate: "$25",
  },
  {
    slug: "muneeb",
    name: "Muneeb U.",
    role: "Revit, permit sets and scan to BIM",
    upwork: "https://www.upwork.com/freelancers/~01764ff548009cb954",
    badge: "Top Rated Plus",
    jobSuccess: 100,
    rating: 5.0,
    reviews: 4,
    jobs: 17,
    hours: "1.1K",
    rate: "$25",
  },
  {
    slug: "matti",
    name: "Matti U.",
    role: "Interior design and architectural visualization",
    upwork: "https://www.upwork.com/freelancers/~01d3ccb98cc31b5a2f",
    fiverr: "https://www.fiverr.com/matti7215",
    badge: "Verified",
    jobs: 20,
    hours: "85",
    rate: "$20",
  },
  // Kaleem: add the Upwork and Fiverr links and a photo, and the card appears.
];
