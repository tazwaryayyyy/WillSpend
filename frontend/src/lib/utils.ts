import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseAiReport(text: string) {
  if (!text) return { summary: "", roadmap: null }

  try {
    const roadmapMatch = text.match(/<roadmap>([\s\S]*?)<\/roadmap>/)
    
    if (roadmapMatch && roadmapMatch[1]) {
      const summary = text.replace(roadmapMatch[0], "").trim()
      const roadmap = JSON.parse(roadmapMatch[1].trim())
      return { summary, roadmap }
    }
    
    return { summary: text, roadmap: null }
  } catch (error) {
    console.error("Failed to parse roadmap JSON:", error)
    return { summary: text, roadmap: null }
  }
}
