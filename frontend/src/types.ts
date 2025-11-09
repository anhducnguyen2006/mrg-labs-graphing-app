export interface ParsedCSV {
  filename: string;
  x: number[];
  y: number[];
  rawContent: string;
}

export interface SavedGraphResponse {
  saved_paths: string[];
  previews?: string[]; // base64 optional
}

export interface User {
  name: string;
  email: string;
  avatarUrl?: string;
  backgroundUrl?: string;
}
