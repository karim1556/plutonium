import { NextResponse } from "next/server";
import { parsePrescriptionText } from "@/lib/ai";
import { getCurrentSessionUser } from "@/lib/auth";
import { extractTextFromBase64, extractPrescriptionText } from "@/lib/ocr";
import { parseTextSchema, parseImageSchema, formatValidationError } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session || session.role !== "caregiver") {
    return NextResponse.json(
      { error: "Caregiver session required", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  try {
    const payload = await request.json();

    // Support both text and image input
    let prescriptionText = "";
    let ocrConfidence = 1.0;
    let ocrSuccess = true;

    // If image data is provided, extract text using OCR
    if (payload.imageData) {
      const imageValidation = parseImageSchema.safeParse(payload);

      if (!imageValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid image data",
            code: "VALIDATION_ERROR",
            details: formatValidationError(imageValidation.error)
          },
          { status: 400 }
        );
      }

      const imageData = imageValidation.data;
      const ocrResult = await extractTextFromBase64(imageData.imageData, "eng");

      if (!ocrResult.success) {
        return NextResponse.json(
          {
            error: "OCR extraction failed",
            code: "OCR_ERROR",
            details: ocrResult.error
          },
          { status: 500 }
        );
      }

      prescriptionText = ocrResult.text;
      ocrConfidence = ocrResult.confidence;
      ocrSuccess = ocrResult.success;
    }
    // If text is provided directly, use it
    else if (payload.ocrText || payload.text) {
      const textValidation = parseTextSchema.safeParse({
        text: payload.ocrText || payload.text
      });

      if (!textValidation.success) {
        return NextResponse.json(
          {
            error: "Invalid text input",
            code: "VALIDATION_ERROR",
            details: formatValidationError(textValidation.error)
          },
          { status: 400 }
        );
      }

      prescriptionText = textValidation.data.text;
    } else {
      return NextResponse.json(
        {
          error: "Either 'imageData' or 'text'/'ocrText' is required",
          code: "MISSING_INPUT"
        },
        { status: 400 }
      );
    }

    // Parse the prescription text
    const result = parsePrescriptionText(prescriptionText);

    return NextResponse.json({
      imageName: payload.imageName ?? "uploaded-prescription.jpg",
      ocrConfidence,
      ocrSuccess,
      extractedText: prescriptionText,
      ...result
    });
  } catch (error) {
    console.error("Parse API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        code: "SERVER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
