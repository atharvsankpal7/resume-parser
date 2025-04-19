import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import cloudinary from "@/lib/cloudinary";
import dbConnect from "@/lib/mongoose";
import Resume from "@/models/Resume";

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

async function uploadToCloudinary(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supportedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "text/plain",
    ];

    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "File type not supported. Please upload PDF, Word, Image or Text files.",
        },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload file to Cloudinary
    const fileUrl = await uploadToCloudinary(buffer, file.type === "application/pdf" ? "raw" : file.type);
    let fileContent = "";
    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      fileContent = await extractTextFromDocx(buffer);
    } else {
      fileContent = buffer.toString("base64");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze the following resume content and extract key information in the following JSON format don't include any other text in your response not even the word "JSON" in your response cause we are directly going to parse your response to get the data :
      {
        "personalInfo": {
          "name": "",
          "email": "",
          "phone": "",
          "location": ""
        },
        "education": [
          {
            "degree": "",
            "institution": "",
            "year": "",
            "gpa": ""
          }
        ],
        "experience": [
          {
            "title": "",
            "company": "",
            "duration": "",
            "responsibilities": []
          }
        ],
        "projects": [
          {
            "name": "",
            "description": "",
            "technologies": []
          }
        ],
        "skills": [](make this skills in lowercase),
        "certifications": []
      }

      Resume content:
    `;

    let parts;
    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      parts = [{ text: prompt + fileContent }];
    } else {
      parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: file.type,
            data: fileContent,
          },
        },
      ];
    }

    const result = await model.generateContent(parts);
    const response = result.response;
    let responseText = response.text();
    responseText = responseText.replace("`json", "").replaceAll("`", "");
    let parsedData = JSON.parse(responseText);
    // Save to MongoDB
    const resumeData = {
      ...parsedData,
      fileUrl,
    };

    await Resume.create(resumeData);

    return NextResponse.json(resumeData);
  } catch (error) {
    console.error("Error processing resume:", error);
    return NextResponse.json(
      { error: "Failed to process resume" },
      { status: 500 }
    );
  }
}
