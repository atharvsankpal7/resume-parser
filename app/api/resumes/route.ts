import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Resume from "@/models/Resume";

export async function GET() {
  try {
    await dbConnect();
    const resumes = await Resume.find().sort({ createdAt: -1 });
    return NextResponse.json(resumes);
  } catch (error) {
    console.error("Error fetching resumes:", error);
    return NextResponse.json(
      { error: "Failed to fetch resumes" },
      { status: 500 }
    );
  }
}