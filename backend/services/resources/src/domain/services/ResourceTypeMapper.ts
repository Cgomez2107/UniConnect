const EXT_TO_RESOURCE_TYPE: Record<string, string> = {
  pdf: "pdf",
  doc: "document",
  docx: "document",
  ppt: "presentation",
  pptx: "presentation",
  xls: "document",
  xlsx: "document",
  csv: "document",
  txt: "document",
  md: "document",
  rtf: "document",
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  bmp: "image",
  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  webm: "video",
  mp3: "audio",
  wav: "audio",
  ogg: "audio",
  flac: "audio",
  zip: "archive",
  rar: "archive",
  "7z": "archive",
  tar: "archive",
  gz: "archive",
  link: "link",
}

export function detectResourceType(fileNameOrType: string | null, currentResourceType: string | null): string | null {
  if (currentResourceType && currentResourceType !== "file") {
    return currentResourceType
  }

  if (!fileNameOrType) return null

  const key = fileNameOrType.toLowerCase()
  return EXT_TO_RESOURCE_TYPE[key] ?? (key.includes(".") ? EXT_TO_RESOURCE_TYPE[key.split(".").pop() ?? ""] ?? "file" : "file")
}
