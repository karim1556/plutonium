import { createWorker, type Worker } from "tesseract.js";

let worker: Worker | null = null;

/**
 * Initialize Tesseract worker (singleton pattern)
 */
async function getWorker(): Promise<Worker> {
  if (worker) {
    return worker;
  }

  worker = await createWorker("eng", 1, {
    logger: (m) => {
      // Optional: log progress
      if (m.status === "recognizing text") {
        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
      }
    }
  });

  return worker;
}

/**
 * Extract text from an image using Tesseract OCR
 * @param imageSource - Can be a file path, URL, or base64 string
 * @param language - Language code (default: 'eng')
 * @returns Extracted text
 */
export async function extractTextFromImage(
  imageSource: string | Buffer,
  language = "eng"
): Promise<{
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}> {
  try {
    const ocrWorker = await getWorker();

    const {
      data: { text, confidence }
    } = await ocrWorker.recognize(imageSource);

    return {
      text: text.trim(),
      confidence: confidence / 100, // Convert to 0-1 range
      success: true
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      text: "",
      confidence: 0,
      success: false,
      error: error instanceof Error ? error.message : "Unknown OCR error"
    };
  }
}

/**
 * Extract text from base64 encoded image
 */
export async function extractTextFromBase64(
  base64Data: string,
  language = "eng"
): Promise<{
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}> {
  try {
    // Remove data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");

    return await extractTextFromImage(buffer, language);
  } catch (error) {
    console.error("Base64 OCR Error:", error);
    return {
      text: "",
      confidence: 0,
      success: false,
      error: error instanceof Error ? error.message : "Failed to process base64 image"
    };
  }
}

/**
 * Cleanup Tesseract worker
 * Call this when shutting down the application
 */
export async function terminateWorker(): Promise<void> {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}

/**
 * Enhanced OCR for prescription images
 * Applies preprocessing and post-processing for medical text
 */
export async function extractPrescriptionText(
  imageSource: string | Buffer,
  language = "eng"
): Promise<{
  text: string;
  confidence: number;
  success: boolean;
  lines: string[];
  error?: string;
}> {
  const result = await extractTextFromImage(imageSource, language);

  if (!result.success) {
    return {
      ...result,
      lines: []
    };
  }

  // Post-process text for prescription parsing
  const lines = result.text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    // Remove common OCR artifacts
    .map((line) => line.replace(/[|\\]/g, ""))
    // Normalize whitespace
    .map((line) => line.replace(/\s+/g, " "));

  return {
    ...result,
    lines,
    text: lines.join("\n")
  };
}
