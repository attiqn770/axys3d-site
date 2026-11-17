// Facts and short texts used on more than one page. Change a number here and it changes everywhere.

export const figures = [
  { value: "172", unit: "", label: "Projects delivered" },
  { value: "43", unit: "+", label: "Studio partners" },
  { value: "7", unit: "days", label: "Brief to first render" },
  { value: "4.8", unit: "/5", label: "Average client rating" },
];

export const steps = [
  { title: "Send your brief", text: "Drawings, references and your deadline. A sketch or a PDF set is enough to start." },
  { title: "Get a clear quote", text: "We reply within one working day with scope, price, timeline and the number of revisions included." },
  { title: "Review every stage", text: "Work arrives in stages. Each one is checked in house first, and nothing moves on until you approve it." },
  { title: "Receive your files", text: "Native Revit, 3ds Max or Blender files, drawings and final images. They are yours to keep and reuse." },
];

export const faqs = [
  { q: "What do you need from me to start?", a: "Whatever you have: a hand sketch, PDF drawings, a CAD file or a Revit model, plus your deadline and the standards or templates you want us to follow. We tell you if anything is missing before we quote." },
  { q: "Will the work follow our office standards?", a: "Yes. We build in your Revit templates, naming rules and sheet setup, and a sample is approved by you before full production starts." },
  { q: "Which Revit version do you work in?", a: "Yours. We work in older Revit releases and the latest one, and we keep your project in the version it is already in so the file opens on your side without an upgrade." },
  { q: "Who stays responsible for the design?", a: "You do. We provide production support. Design decisions, code compliance and professional sign off stay with you and your appointed professionals." },
  { q: "Is our project kept confidential?", a: "Yes. We sign your NDA before you share anything, and we never show a project in our portfolio without your written permission." },
  { q: "How do revisions and payment work?", a: "The number of revisions is agreed in the quote. We work through Upwork and Fiverr, so the platform holds your payment until you approve the delivery." },
];

// Real work from the studio's own portfolio. Clips are short, silent and load only when played.
export const work = [
  { id: "residence", title: "Residence interiors and terraces", kind: "Interior visualization" },
  { id: "lounge", title: "Lounge and home office", kind: "Interior visualization" },
  { id: "landscape", title: "Garden and landscape", kind: "Landscape visualization" },
  { id: "kitchen", title: "Kitchen", kind: "Interior visualization" },
  { id: "office", title: "Office interior", kind: "Commercial visualization" },
  { id: "bathroom", title: "Bathroom", kind: "Interior visualization" },
  { id: "environment", title: "Exterior environment", kind: "Environment and real time" },
  { id: "exterior", title: "Two storey residence", kind: "Exterior film" },
];

// The four kinds of team that hire us. Used by the "built for you" picker on the home page and by the Industries page.
export const audiences = [
  { slug: "architecture-design-practices", tab: "Architects", name: "Architects and design studios", who: "architects",
    problem: "Deadlines pile up faster than your team can draw.",
    deliver: ["Revit models and drawing sets in your templates", "Permit and construction drawings kept in step with the design", "Planning and client visuals"],
    services: ["revit-production", "bim-production", "architectural-visualization"], img: "svc-plan" },
  { slug: "engineering-multidisciplinary", tab: "Engineers", name: "Engineers and MEP consultancies", who: "engineers",
    problem: "Clashes found on site cost time and money.",
    deliver: ["Coordinated structural and MEP models", "Clash checks, each issue tracked to the right engineer", "Revit documentation"],
    services: ["mep-coordination", "bim-production", "revit-production"], img: "svc-mep" },
  { slug: "developers-asset-teams", tab: "Developers", name: "Developers and property teams", who: "developers",
    problem: "Buyers, investors and councils need to see it before it exists.",
    deliver: ["Planning and marketing renders", "Walkthrough films", "Interactive Unreal Engine tours"],
    services: ["architectural-visualization", "animation-motion", "real-time"], img: "adu-9" },
  { slug: "agencies-production-partners", tab: "Agencies", name: "Agencies and production partners", who: "agencies",
    problem: "More client work than your in house team can render.",
    deliver: ["Renders and films under your brand", "NDA from day one", "Nothing published without your permission"],
    services: ["architectural-visualization", "animation-motion", "3d-modeling"], img: "lounge" },
];
