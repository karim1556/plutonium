import { NextResponse } from "next/server";
import { parsePrescriptionText } from "@/lib/ai";
import { getCurrentSessionUser } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getCurrentSessionUser();

  if (!session || session.role !== "caregiver") {
    return NextResponse.json({ error: "Caregiver session required." }, { status: 401 });
  }

  const payload = (await request.json()) as {
    imageName?: string;
    ocrText?: string;
  };

  if (!payload.ocrText?.trim()) {
    return NextResponse.json(
      {
        error: "OCR text is required. Plug in a scanner or OCR provider before sending raw images."
      },
      { status: 400 }
    );
  }

  const result = parsePrescriptionText(payload.ocrText);

  return NextResponse.json({
    imageName: payload.imageName ?? "uploaded-prescription.jpg",
    ...result
  });
}
