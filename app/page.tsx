"use client";

import { useState, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, prepareResumeDataForExcel } from "@/lib/excel";

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
  matchScore?: number;
  matchExplanation?: string;
}

interface Filters {
  search: string;
  skills: string;
  location: string;
  experience: string;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedJD, setSelectedJD] = useState<File | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    skills: "",
    location: "",
    experience: ""
  });
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleJDSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedJD(event.target.files[0]);
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
      
      // If JD is selected, process it immediately after resumes are uploaded
      if (selectedJD) {
        await matchJobDescription(results);
      }

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

  const matchJobDescription = async (resumes: ResumeData[] = resumeData) => {
    if (!selectedJD) {
      toast({
        title: "Error",
        description: "Please select a job description file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("jdFile", selectedJD);
      formData.append("resumes", JSON.stringify(resumes));

      const response = await fetch("/api/match-jd", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to match job description");
      }

      const rankedResumes = await response.json();
      setResumeData(rankedResumes);

      toast({
        title: "Success",
        description: "Successfully matched resumes with job description!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to match job description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      skills: "",
      location: "",
      experience: ""
    });
  };

  const filteredResumes = useCallback(() => {
    return resumeData.filter(resume => {
      const matchesSearch = !filters.search || 
        resume.personalInfo.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        resume.personalInfo.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        resume.skills.some(skill => skill.toLowerCase().includes(filters.search.toLowerCase()));

      const matchesSkills = !filters.skills ||
        resume.skills.some(skill => 
          skill.toLowerCase().includes(filters.skills.toLowerCase())
        );

      const matchesLocation = !filters.location ||
        resume.personalInfo.location?.toLowerCase().includes(filters.location.toLowerCase());

      const matchesExperience = !filters.experience ||
        resume.experience.some(exp =>
          exp.title.toLowerCase().includes(filters.experience.toLowerCase()) ||
          exp.company.toLowerCase().includes(filters.experience.toLowerCase())
        );

      return matchesSearch && matchesSkills && matchesLocation && matchesExperience;
    });
  }, [resumeData, filters]);

  const handleExport = () => {
    const currentData = filteredResumes();
    if (currentData.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return;
    }

    const excelData = prepareResumeDataForExcel(currentData);
    exportToExcel(excelData, {
      filename: 'resumes.xlsx',
      sheetName: 'Resumes'
    });

    toast({
      title: "Success",
      description: `Successfully exported ${currentData.length} resumes to Excel.`,
    });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

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

          <div className="w-full max-w-xl">
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={handleJDSelect}
                className="flex-1"
                placeholder="Upload Job Description (Optional)"
              />
              {selectedJD && (
                <Button
                  onClick={() => matchJobDescription()}
                  disabled={isLoading || resumeData.length === 0}
                >
                  Match JD
                </Button>
              )}
            </div>
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
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-semibold">
                  Parsed Resumes ({filteredResumes().length} of {resumeData.length})
                </h2>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="ml-4"
                >
                  Export to Excel
                </Button>
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear All Filters ({activeFiltersCount})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full"
              />
              <Input
                placeholder="Filter by skills..."
                value={filters.skills}
                onChange={(e) => handleFilterChange('skills', e.target.value)}
                className="w-full"
              />
              <Input
                placeholder="Filter by location..."
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full"
              />
              <Input
                placeholder="Filter by experience..."
                value={filters.experience}
                onChange={(e) => handleFilterChange('experience', e.target.value)}
                className="w-full"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  {selectedJD && <TableHead>Match Score</TableHead>}
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
                    {selectedJD && (
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{resume.matchScore}%</span>
                          <span className="text-xs text-muted-foreground">
                            {resume.matchExplanation}
                          </span>
                        </div>
                      </TableCell>
                    )}
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