"use client";
import type React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  Upload,
  Trash2,
  FileText,
  Users,
  Filter,
  Download,
  Sparkles,
  Search,
  MapPin,
  GraduationCap,
  Code,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel, prepareResumeDataForExcel } from "@/lib/excel";
import { create } from "zustand";

// Zustand store for resume management
interface ResumeStore {
  resumeData: ResumeData[];
  selectedJD: File | null;
  addResumes: (newResumes: ResumeData[]) => void;
  deleteResume: (id: string) => void;
  setSelectedJD: (file: File | null) => void;
  setResumeData: (resumes: ResumeData[]) => void;
}

interface ResumeData {
  uuid: string;
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

const useResumeStore = create<ResumeStore>((set) => ({
  resumeData: [],
  selectedJD: null,
  addResumes: (newResumes) => 
    set((state) => ({ 
      resumeData: [...state.resumeData, ...newResumes] 
    })),
  deleteResume: (id) => 
    set((state) => ({
      resumeData: state.resumeData.filter(resume => resume.uuid !== id)
    })),
  setSelectedJD: (file) => set({ selectedJD: file }),
  setResumeData: (resumes) => set({ resumeData: resumes }),
}));

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("");
  const [filterLabel, setFilterLabel] = useState<string>("Filter by...");
  const { toast } = useToast();
  
  // Zustand store hooks
  const { 
    resumeData, 
    selectedJD, 
    addResumes, 
    deleteResume, 
    setSelectedJD, 
    setResumeData 
  } = useResumeStore();

  // Extract unique values for dropdowns with memoization
  const locations = useMemo(() => {
    return Array.from(
      new Set(resumeData.map((r) => r.personalInfo?.location).filter(Boolean))
    ).sort();
  }, [resumeData]);

  const educationLevels = useMemo(() => {
    return Array.from(
      new Set(resumeData.flatMap((r) => r.education?.map((e) => e.degree) || []).filter(Boolean))
    ).sort();
  }, [resumeData]);

  const skills = useMemo(() => {
    return Array.from(
      new Set(resumeData.flatMap((r: { skills: any; }) => r.skills || []).filter(Boolean))
    ).sort();
  }, [resumeData]);

  const jobTitles = useMemo(() => {
    return Array.from(
      new Set(resumeData.flatMap((r) => r.experience?.map((e) => e.title) || []).filter(Boolean))
    ).sort();
  }, [resumeData]);

  const companies = useMemo(() => {
    return Array.from(
      new Set(resumeData.flatMap((r) => r.experience?.map((e) => e.company) || []).filter(Boolean))
    ).sort();
  }, [resumeData]);

  const certifications = useMemo(() => {
    return Array.from(
      new Set(resumeData.flatMap((r) => r.certifications || []).filter(Boolean))
    ).sort();
  }, [resumeData]);

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
      
      // Add new resumes to store
      addResumes(results);
      
      // If JD is selected, match it with the complete dataset
      if (selectedJD) {
        matchJobDescription();
      }

      toast({
        title: "Success",
        description: `Successfully processed ${results.length} resumes!`,
      });
    } catch (error) {
      console.error("Upload error:", error);
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

  const matchJobDescription = async () => {
    if (!selectedJD) {
      toast({
        title: "Error",
        description: "Please select a job description file",
        variant: "destructive",
      });
      return;
    }

    if (resumeData.length === 0) {
      toast({
        title: "Error",
        description: "No resumes to match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("jdFile", selectedJD);
      formData.append("resumes", JSON.stringify(resumeData));

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
      console.error("Match JD error:", error);
      toast({
        title: "Error",
        description: "Failed to match job description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      deleteResume(id);
      toast({
        title: "Success",
        description: "Resume deleted successfully",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete resume",
        variant: "destructive",
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedFilter("");
    setFilterLabel("Filter by...");
  };

  const handleFilterSelect = (filterValue: string, label: string) => {
    setSelectedFilter(filterValue);
    setFilterLabel(label);
  };

  // Fixed filteredResumes with useMemo instead of useCallback
  const filteredResumes = useMemo(() => {
    return resumeData.filter((resume) => {
      // Null safety checks
      if (!resume?.personalInfo) return false;

      const matchesSearch =
        !searchTerm ||
        resume.personalInfo.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        resume.personalInfo.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (resume.skills || []).some((skill) =>
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        );

      // Handle the selected filter
      let matchesFilter = true;
      if (selectedFilter) {
        const [filterType, filterValue] = selectedFilter.split('_');
        
        switch(filterType) {
          case 'location':
            matchesFilter = resume.personalInfo.location === filterValue;
            break;
          case 'education':
            matchesFilter = (resume.education || []).some(edu => edu.degree === filterValue);
            break;
          case 'skill':
            matchesFilter = (resume.skills || []).includes(filterValue);
            break;
          case 'jobtitle':
            matchesFilter = (resume.experience || []).some(exp => exp.title === filterValue);
            break;
          case 'company':
            matchesFilter = (resume.experience || []).some(exp => exp.company === filterValue);
            break;
          case 'certification':
            matchesFilter = (resume.certifications || []).includes(filterValue);
            break;
          default:
            matchesFilter = true;
        }
      }

      return matchesSearch && matchesFilter;
    });
  }, [resumeData, searchTerm, selectedFilter]);

  const handleExport = () => {
    if (filteredResumes.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return;
    }

    try {
      const excelData = prepareResumeDataForExcel(filteredResumes);
      exportToExcel(excelData, {
        filename: "resumes.xlsx",
        sheetName: "Resumes",
      });

      toast({
        title: "Success",
        description: `Successfully exported ${filteredResumes.length} resumes to Excel.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Error",
        description: "Failed to export resumes",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Resume Parsing
            </h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload multiple resumes and match them with job descriptions using
            AI-powered analysis
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* File Upload Area */}
              <div className="relative">
                <label
                  htmlFor="file-upload"
                  className="group flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-blue-300 rounded-2xl cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:border-blue-400"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <p className="mb-2 text-lg font-semibold text-slate-700">
                      Drop your resumes here or{" "}
                      <span className="text-blue-600">click to browse</span>
                    </p>
                    <p className="text-sm text-slate-500">
                      Supports PDF, TXT, DOCX, and image files
                    </p>
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                          <Sparkles className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">
                            {selectedFiles.length} files selected
                          </span>
                        </div>
                      </div>
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

              {/* Job Description Upload */}
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Job Description (Optional)
                  </label>
                  <Input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    onChange={handleJDSelect}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                {selectedJD && (
                  <Button
                    onClick={() => matchJobDescription()}
                    disabled={isLoading || resumeData.length === 0}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Match JD
                  </Button>
                )}
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isLoading || selectedFiles.length === 0}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Processing Resumes...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload and Process Files
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {resumeData.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-slate-800">
                      Parsed Resumes
                    </CardTitle>
                    <p className="text-slate-600">
                      {filteredResumes.length} of {resumeData.length} resumes
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleExport}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search resumes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="justify-between border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <div className="flex items-center">
                        <Filter className="w-4 h-4 mr-2 text-slate-400" />
                        {filterLabel}
                      </div>
                      <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuItem onClick={() => handleFilterSelect("", "Filter by...")}>
                      <span>All Filters</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    
                    {/* Location Submenu */}
                    {locations.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>Location</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {locations.map((location) => (
                            <DropdownMenuItem 
                              key={location} 
                              onClick={() => handleFilterSelect(`location_${location}`, `Location: ${location}`)}
                            >
                              {location}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}

                    {/* Education Submenu */}
                    {educationLevels.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <GraduationCap className="w-4 h-4 mr-2" />
                          <span>Education</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {educationLevels.map((education) => (
                            <DropdownMenuItem 
                              key={education} 
                              onClick={() => handleFilterSelect(`education_${education}`, `Education: ${education}`)}
                            >
                              {education}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}

                    {/* Skills Submenu */}
                    {skills.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Code className="w-4 h-4 mr-2" />
                          <span>Skills</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                          {skills.map((skill) => (
                            <DropdownMenuItem 
                              key={skill} 
                              onClick={() => handleFilterSelect(`skill_${skill}`, `Skill: ${skill}`)}
                            >
                              {skill}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}

                    {/* Experience Submenu */}
                    {jobTitles.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Briefcase className="w-4 h-4 mr-2" />
                          <span>Job Title</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                          {jobTitles.map((title) => (
                            <DropdownMenuItem 
                              key={title} 
                              onClick={() => handleFilterSelect(`jobtitle_${title}`, `Job Title: ${title}`)}
                            >
                              {title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}

                    {/* Company Submenu */}
                    {companies.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Briefcase className="w-4 h-4 mr-2" />
                          <span>Company</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                          {companies.map((company) => (
                            <DropdownMenuItem 
                              key={company} 
                              onClick={() => handleFilterSelect(`company_${company}`, `Company: ${company}`)}
                            >
                              {company}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}

                    {/* Certifications Submenu */}
                    {certifications.length > 0 && (
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Award className="w-4 h-4 mr-2" />
                          <span>Certifications</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="max-h-64 overflow-y-auto">
                          {certifications.map((cert) => (
                            <DropdownMenuItem 
                              key={cert} 
                              onClick={() => handleFilterSelect(`certification_${cert}`, `Certification: ${cert}`)}
                            >
                              {cert}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {(searchTerm || selectedFilter) && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="border-slate-300 hover:bg-slate-50"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              )}

              {/* Table */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100">
                      {selectedJD && (
                        <TableHead className="font-semibold text-slate-700">
                          Match Score
                        </TableHead>
                      )}
                      <TableHead className="font-semibold text-slate-700">
                        Name
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Email
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Location
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Education
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Skills
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Experience
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Resume
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResumes.map((resume, index) => (
                      <TableRow
                        key={resume.uuid}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }
                      >
                        {selectedJD && (
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    (resume.matchScore || 0) >= 80
                                      ? "bg-green-500"
                                      : (resume.matchScore || 0) >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                />
                                <span className="font-bold text-lg">
                                  {resume.matchScore || 0}%
                                </span>
                              </div>
                              {resume.matchExplanation && (
                                <span className="text-xs text-slate-500 max-w-32 truncate">
                                  {resume.matchExplanation}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="font-medium text-slate-800">
                          {resume?.personalInfo?.name || 'N/A'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {resume?.personalInfo?.email || 'N/A'}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {resume?.personalInfo?.location || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {(resume.education || []).map((edu, idx) => (
                              <div key={idx} className="text-sm">
                                <div className="font-medium text-slate-700">
                                  {edu.degree || 'N/A'}
                                </div>
                                <div className="text-slate-500">
                                  {edu.institution || 'N/A'}
                                </div>
                              </div>
                            ))}
                            {(!resume.education || resume.education.length === 0) && (
                              <div className="text-sm text-slate-500">No education data</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(resume.skills || []).slice(0, 3).map((skill, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                              >
                                {skill}
                              </Badge>
                            ))}
                            {(resume.skills || []).length > 3 && (
                              <Badge
                                variant="outline"
                                className="border-slate-300 text-slate-600"
                              >
                                +{resume.skills.length - 3}
                              </Badge>
                            )}
                            {(!resume.skills || resume.skills.length === 0) && (
                              <div className="text-sm text-slate-500">No skills listed</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {(resume.experience || []).slice(0, 2).map((exp, idx) => (
                              <div key={idx} className="text-sm">
                                <div className="font-medium text-slate-700">
                                  {exp.title || 'N/A'}
                                </div>
                                <div className="text-slate-500">
                                  {exp.company || 'N/A'}
                                </div>
                              </div>
                            ))}
                            {(resume.experience || []).length > 2 && (
                              <div className="text-xs text-slate-400">
                                +{resume.experience.length - 2} more
                              </div>
                            )}
                            {(!resume.experience || resume.experience.length === 0) && (
                              <div className="text-sm text-slate-500">No experience data</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {resume.fileUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                              <a
                                href={resume.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                View
                              </a>
                            </Button>
                          ) : (
                            <span className="text-sm text-slate-500">No file</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => handleDelete(resume.uuid, event)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}