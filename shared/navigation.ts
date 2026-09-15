export const primaryNavigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subjects", label: "Subjects" },
  { href: "/browse", label: "Browse PDFs" },
  { href: "/groups", label: "Friend circles" },
  { href: "/upload", label: "Upload PDF" },
  { href: "/uploads", label: "My uploads" },
] as const;

export type PrimaryNavigationItem = (typeof primaryNavigation)[number];
