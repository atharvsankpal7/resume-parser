"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

export default function AllResumes() {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [filteredResumes, setFilteredResumes] = useState<ResumeData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [skillFilter, setSkillFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const response = await fetch("/api/resumes");
        if (!response.ok) throw new Error("Failed to fetch resumes");
        const data = await response.json();
        setResumes(data);
        setFilteredResumes(data);
      } catch (error) {
        console.error("Error fetching resumes:", error);
      }
    };

    fetchResumes();
  }, []);

  useEffect(() => {
    let filtered = [...resumes];

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

    setFilteredResumes(filtered);
  }, [resumes, searchTerm, skillFilter, locationFilter, experienceFilter]);

  // Handler to clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSkillFilter("");
    setLocationFilter("");
    setExperienceFilter("");
    setFilterType("all");
  };

  // Handle filter type change
  const handleFilterTypeChange = (value: string) => {
    setFilterType(value);
    // Clear the specific filters when changing filter type
    if (value === "all") {
      setSkillFilter("");
      setLocationFilter("");
      setExperienceFilter("");
    }
  };

  // Handle export to Excel
  const handleExport = () => {
    if (filteredResumes.length === 0) {
      toast({
        title: "No Data",
        description: "There is no data to export.",
        variant: "destructive",
      });
      return;
    }

    const excelData = prepareResumeDataForExcel(filteredResumes);
    exportToExcel(excelData, {
      filename: 'all-resumes.xlsx',
      sheetName: 'Resumes'
    });

    toast({
      title: "Success",
      description: `Successfully exported ${filteredResumes.length} resumes to Excel.`,
    });
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold">
                All Resumes ({filteredResumes.length} of {resumes.length})
              </h1>
              <Button
                variant="outline"
                onClick={handleExport}
                className="ml-4"
              >
                Export to Excel
              </Button>
            </div>
            <div className="flex gap-4">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Select 
                value={filterType} 
                onValueChange={handleFilterTypeChange}
              >
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
              {(searchTerm || skillFilter || locationFilter || experienceFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
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
              {filteredResumes.length > 0 &&
                filteredResumes.map((resume, index) => (
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
    </div>
  );
}