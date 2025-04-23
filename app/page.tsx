"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  }>;
  skills: string[];
  certifications: string[];
  fileUrl: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [resumeData, setResumeData] = useState<ResumeData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to parse resume: ${file.name}`);
        }

        return await response.json();
      });

      const results = await Promise.all(uploadPromises);
      setResumeData(results);
      
      toast({
        title: "Success",
        description: `Successfully processed ${results.length} resumes!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process some resumes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedFiles([]);
    }
  };

  const filteredResumes = useCallback(() => {
    let filtered = [...resumeData];

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (resume) =>
          resume?.personalInfo?.name?.toLowerCase().includes(term) ||
          resume?.personalInfo?.email?.toLowerCase().includes(term) ||
          resume?.skills.some((skill) => skill.toLowerCase().includes(term))
      );
    }

    // Apply skill filter
    if (skillFilter) {
      filtered = filtered.filter((resume) =>
        resume.skills.some((skill) =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        )
      );
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter((resume) =>
        resume.personalInfo.location
          ?.toLowerCase()
          .includes(locationFilter.toLowerCase())
      );
    }

    // Apply experience filter
    if (experienceFilter) {
      filtered = filtered.filter((resume) =>
        resume.experience.some(
          (exp) =>
            exp.title.toLowerCase().includes(experienceFilter.toLowerCase()) ||
            exp.company.toLowerCase().includes(experienceFilter.toLowerCase())
        )
      );
    }

    return filtered;
  }, [resumeData, searchTerm, skillFilter, locationFilter, experienceFilter]);

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <h1 className="text-3xl font-bold">Resume Parser</h1>
          <p className="text-muted-foreground">
            Upload multiple resumes in PDF, TXT, DOCX, or image format
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
                {selectedFiles.length > 0 && (
                  <p className="mt-2 text-sm text-green-500">
                    {selectedFiles.length} files selected
                  </p>
                )}
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.txt,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                multiple
                disabled={isLoading}
              />
            </label>
          </div>
          <Button
            onClick={handleUpload}
            disabled={isLoading || selectedFiles.length === 0}
            className="w-full max-w-xs"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⌛</span>
                Processing...
              </>
            ) : (
              'Upload and Process Files'
            )}
          </Button>
        </div>
      </Card>

      {resumeData.length > 0 && (
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Parsed Resumes</h2>
              <div className="flex gap-4">
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="skills">Skills</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filterType !== "all" && (
              <div className="flex gap-4">
                {filterType === "skills" && (
                  <Input
                    placeholder="Filter by skills..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                    className="max-w-xs"
                  />
                )}
                {filterType === "location" && (
                  <Input
                    placeholder="Filter by location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="max-w-xs"
                  />
                )}
                {filterType === "experience" && (
                  <Input
                    placeholder="Filter by experience..."
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="max-w-xs"
                  />
                )}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Education</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Resume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResumes().map((resume, index) => (
                  <TableRow key={index}>
                    <TableCell>{resume?.personalInfo?.name}</TableCell>
                    <TableCell>{resume?.personalInfo?.email}</TableCell>
                    <TableCell>{resume?.personalInfo?.location}</TableCell>
                    <TableCell>
                      {resume.education.map((edu, idx) => (
                        <div key={idx} className="text-sm">
                          {edu.degree} - {edu.institution}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {resume.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-primary/10 rounded-full text-xs"
                          >
                            {skill}
                          </span>
                        ))}
                        {resume.skills.length > 3 && (
                          <span className="px-2 py-0.5 bg-primary/10 rounded-full text-xs">
                            +{resume.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {resume.experience.map((exp, idx) => (
                        <div key={idx} className="text-sm">
                          {exp.title} at {exp.company}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}