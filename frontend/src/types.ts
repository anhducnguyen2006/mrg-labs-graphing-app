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
