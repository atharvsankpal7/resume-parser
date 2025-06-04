import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Resume from "@/models/Resume";
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const searchParams = request.nextUrl.searchParams;
    const skills = searchParams.get('skills');
    console.log("Skills:", skills);
    if (!skills) {
      return NextResponse.json({ error: "No skills provided" }, { status: 400 });
    }

    const skillsArray = skills.split(',').map(skill => skill.trim().toLowerCase());
    
    const resumes = await Resume.find({
      skills: { $in: skillsArray }
    }).sort({ createdAt: -1 });
    console.log("Resumes:", resumes);
    return NextResponse.json(resumes);
  } catch (error) {
    console.error("Error searching resumes:", error);
    return NextResponse.json(
      { error: "Failed to search resumes" },
      { status: 500 }
    );
  }
}