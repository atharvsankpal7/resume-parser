"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    responsibilities: string[];
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url: string;
  }>;
  skills: string[];
  certifications: string[];
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse resume");
      }

      const data = await response.json();
      setResumeData(data);
      toast({
        title: "Success",
        description: "Resume parsed successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-3xl font-bold">Resume Parser</h1>
          <p className="text-muted-foreground">
            Upload your resume in PDF, TXT, DOCX, or image format
          </p>
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, TXT, DOCX, or Image files
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.txt,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={isLoading}
              />
            </label>
          </div>
          {isLoading && (
            <Button disabled>
              <span className="animate-spin mr-2">⌛</span>
              Parsing Resume...
            </Button>
          )}
        </div>
      </Card>

      {resumeData && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Name</TableCell>
                  <TableCell>{resumeData.personalInfo.name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Email</TableCell>
                  <TableCell>{resumeData.personalInfo.email}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Phone</TableCell>
                  <TableCell>{resumeData.personalInfo.phone}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Location</TableCell>
                  <TableCell>{resumeData.personalInfo.location}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Education</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Degree</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>GPA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumeData.education.map((edu, index) => (
                  <TableRow key={index}>
                    <TableCell>{edu.degree}</TableCell>
                    <TableCell>{edu.institution}</TableCell>
                    <TableCell>{edu.year}</TableCell>
                    <TableCell>{edu.gpa}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Experience</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Responsibilities</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumeData.experience.map((exp, index) => (
                  <TableRow key={index}>
                    <TableCell>{exp.title}</TableCell>
                    <TableCell>{exp.company}</TableCell>
                    <TableCell>{exp.duration}</TableCell>
                    <TableCell>
                      <ul className="list-disc list-inside">
                        {exp.responsibilities.map((resp, idx) => (
                          <li key={idx}>{resp}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Projects</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Technologies</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resumeData.projects.map((project, index) => (
                  <TableRow key={index}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.description}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-primary/10 rounded-full text-xs"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary/10 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">Certifications</h2>
              <ul className="list-disc list-inside">
                {resumeData.certifications.map((cert, index) => (
                  <li key={index}>{cert}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}