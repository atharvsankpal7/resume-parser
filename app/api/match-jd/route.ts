import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const jdFile: File | null = data.get("jdFile") as unknown as File;
    const resumes = JSON.parse(data.get("resumes") as string);

    if (!jdFile) {
      return NextResponse.json({ error: "No JD file provided" }, { status: 400 });
    }

    const bytes = await jdFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let jdContent = "";
    if (jdFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      jdContent = await extractTextFromDocx(buffer);
    } else {
      jdContent = buffer.toString();
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const rankedResumes = await Promise.all(
        resumes.map(async (resume: any) => {
          const prompt = `
            Compare the following job description with the resume and provide a matching score between 0 and 100.
            Also provide a brief explanation of the match. Format the response as JSON:
            {
              "score": number,
              "explanation": "string"
            }

            Job Description:
            ${jdContent}

            Resume:
            Name: ${resume.personalInfo.name}
            Skills: ${resume.skills.join(", ")}
            Experience: ${resume.experience.map((exp: any) => 
              `${exp.title} at ${exp.company} - ${exp.responsibilities.join(", ")}`
            ).join("\n")}
          `;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          let responseText = await response.text();
          responseText = responseText.replace("`json", "").replaceAll("`", "");
          let parsedData = JSON.parse(responseText);

          return {
            ...resume,
            matchScore: parsedData.score,
            matchExplanation: parsedData.explanation
          };
        })
      );

    // Sort resumes by match score in descending order
    rankedResumes.sort((a, b) => b.matchScore - a.matchScore);

    return NextResponse.json(rankedResumes);
  } catch (error) {
    console.error("Error matching JD:", error);
    return NextResponse.json(
      { error: "Failed to process job description" },
      { status: 500 }
    );
  }
}