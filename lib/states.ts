// US states + DC. `costIndex` is a representative regional construction-cost
// multiplier relative to the US average (≈1.00), in the spirit of RSMeans city
// cost indices — approximate, used only to scale cost estimates. `code` is the
// model building code the state has adopted (almost every US jurisdiction bases
// retaining-wall permitting on the IBC/IRC). These drive 51 programmatic pages.

export interface StateInfo {
  name: string;
  slug: string;
  abbr: string;
  costIndex: number;
  code: string;
}

export const STATES: StateInfo[] = [
  { name: "Alabama", slug: "alabama", abbr: "AL", costIndex: 0.86, code: "IBC/IRC 2021" },
  { name: "Alaska", slug: "alaska", abbr: "AK", costIndex: 1.25, code: "IBC/IRC 2018" },
  { name: "Arizona", slug: "arizona", abbr: "AZ", costIndex: 0.93, code: "IBC/IRC (local adoption)" },
  { name: "Arkansas", slug: "arkansas", abbr: "AR", costIndex: 0.84, code: "Arkansas Fire Prevention Code (IBC)" },
  { name: "California", slug: "california", abbr: "CA", costIndex: 1.28, code: "CBC / CRC (Title 24)" },
  { name: "Colorado", slug: "colorado", abbr: "CO", costIndex: 1.0, code: "IBC/IRC (local adoption)" },
  { name: "Connecticut", slug: "connecticut", abbr: "CT", costIndex: 1.12, code: "Connecticut State Building Code (IBC)" },
  { name: "Delaware", slug: "delaware", abbr: "DE", costIndex: 1.0, code: "IBC/IRC 2018" },
  { name: "District of Columbia", slug: "district-of-columbia", abbr: "DC", costIndex: 1.18, code: "DC Construction Codes (IBC)" },
  { name: "Florida", slug: "florida", abbr: "FL", costIndex: 0.9, code: "Florida Building Code (FBC)" },
  { name: "Georgia", slug: "georgia", abbr: "GA", costIndex: 0.88, code: "Georgia State Minimum Codes (IBC)" },
  { name: "Hawaii", slug: "hawaii", abbr: "HI", costIndex: 1.35, code: "County codes (IBC)" },
  { name: "Idaho", slug: "idaho", abbr: "ID", costIndex: 0.93, code: "Idaho Building Code (IBC)" },
  { name: "Illinois", slug: "illinois", abbr: "IL", costIndex: 1.08, code: "IBC/IRC (local adoption)" },
  { name: "Indiana", slug: "indiana", abbr: "IN", costIndex: 0.95, code: "Indiana Building Code (IBC)" },
  { name: "Iowa", slug: "iowa", abbr: "IA", costIndex: 0.94, code: "Iowa State Building Code (IBC)" },
  { name: "Kansas", slug: "kansas", abbr: "KS", costIndex: 0.88, code: "IBC/IRC (local adoption)" },
  { name: "Kentucky", slug: "kentucky", abbr: "KY", costIndex: 0.9, code: "Kentucky Building Code (IBC)" },
  { name: "Louisiana", slug: "louisiana", abbr: "LA", costIndex: 0.88, code: "Louisiana State Uniform Code (IBC)" },
  { name: "Maine", slug: "maine", abbr: "ME", costIndex: 0.98, code: "MUBEC (IBC/IRC)" },
  { name: "Maryland", slug: "maryland", abbr: "MD", costIndex: 1.05, code: "Maryland Building Performance Standards (IBC)" },
  { name: "Massachusetts", slug: "massachusetts", abbr: "MA", costIndex: 1.18, code: "Massachusetts State Building Code (IBC)" },
  { name: "Michigan", slug: "michigan", abbr: "MI", costIndex: 0.97, code: "Michigan Building Code (IBC)" },
  { name: "Minnesota", slug: "minnesota", abbr: "MN", costIndex: 1.05, code: "Minnesota State Building Code (IBC)" },
  { name: "Mississippi", slug: "mississippi", abbr: "MS", costIndex: 0.83, code: "IBC/IRC (local adoption)" },
  { name: "Missouri", slug: "missouri", abbr: "MO", costIndex: 0.92, code: "IBC/IRC (local adoption)" },
  { name: "Montana", slug: "montana", abbr: "MT", costIndex: 0.95, code: "Montana Building Code (IBC)" },
  { name: "Nebraska", slug: "nebraska", abbr: "NE", costIndex: 0.9, code: "Nebraska State Building Code (IBC)" },
  { name: "Nevada", slug: "nevada", abbr: "NV", costIndex: 1.02, code: "IBC/IRC (local adoption)" },
  { name: "New Hampshire", slug: "new-hampshire", abbr: "NH", costIndex: 1.0, code: "NH State Building Code (IBC)" },
  { name: "New Jersey", slug: "new-jersey", abbr: "NJ", costIndex: 1.14, code: "NJ Uniform Construction Code (IBC)" },
  { name: "New Mexico", slug: "new-mexico", abbr: "NM", costIndex: 0.9, code: "NMCID Codes (IBC)" },
  { name: "New York", slug: "new-york", abbr: "NY", costIndex: 1.22, code: "NYS Uniform Code (IBC) / NYC Code" },
  { name: "North Carolina", slug: "north-carolina", abbr: "NC", costIndex: 0.87, code: "NC State Building Code (IBC)" },
  { name: "North Dakota", slug: "north-dakota", abbr: "ND", costIndex: 0.93, code: "North Dakota State Building Code (IBC)" },
  { name: "Ohio", slug: "ohio", abbr: "OH", costIndex: 0.96, code: "Ohio Building Code (IBC)" },
  { name: "Oklahoma", slug: "oklahoma", abbr: "OK", costIndex: 0.86, code: "Oklahoma Uniform Building Code (IBC)" },
  { name: "Oregon", slug: "oregon", abbr: "OR", costIndex: 1.08, code: "Oregon Structural Specialty Code (IBC)" },
  { name: "Pennsylvania", slug: "pennsylvania", abbr: "PA", costIndex: 1.03, code: "PA UCC (IBC/IRC)" },
  { name: "Rhode Island", slug: "rhode-island", abbr: "RI", costIndex: 1.1, code: "RI State Building Code (IBC)" },
  { name: "South Carolina", slug: "south-carolina", abbr: "SC", costIndex: 0.86, code: "SC Building Codes (IBC)" },
  { name: "South Dakota", slug: "south-dakota", abbr: "SD", costIndex: 0.9, code: "IBC/IRC (local adoption)" },
  { name: "Tennessee", slug: "tennessee", abbr: "TN", costIndex: 0.87, code: "IBC/IRC (local adoption)" },
  { name: "Texas", slug: "texas", abbr: "TX", costIndex: 0.89, code: "IBC/IRC (local adoption)" },
  { name: "Utah", slug: "utah", abbr: "UT", costIndex: 0.95, code: "Utah State Construction Code (IBC)" },
  { name: "Vermont", slug: "vermont", abbr: "VT", costIndex: 1.0, code: "Vermont Fire & Building Code (IBC)" },
  { name: "Virginia", slug: "virginia", abbr: "VA", costIndex: 0.93, code: "Virginia USBC (IBC)" },
  { name: "Washington", slug: "washington", abbr: "WA", costIndex: 1.08, code: "Washington State Building Code (IBC)" },
  { name: "West Virginia", slug: "west-virginia", abbr: "WV", costIndex: 0.9, code: "WV State Building Code (IBC)" },
  { name: "Wisconsin", slug: "wisconsin", abbr: "WI", costIndex: 1.0, code: "Wisconsin SPS Codes (IBC)" },
  { name: "Wyoming", slug: "wyoming", abbr: "WY", costIndex: 0.93, code: "IBC/IRC (local adoption)" },
];

export function stateBySlug(slug: string): StateInfo | undefined {
  return STATES.find((s) => s.slug === slug);
}
