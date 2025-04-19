"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  skills: string[];
  fileUrl: string;
}

export default function RecruiterPage() {
  const [searchSkills, setSearchSkills] = useState("");
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/search?skills=${encodeURIComponent(searchSkills)}`);
      
      if (!response.ok) {
        throw new Error("Failed to search resumes");
      }

      const data = await response.json();
      setResumes(data);
      
      toast({
        title: "Success",
        description: `Found ${data.length} matching resumes`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search resumes",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-8">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-6">Resume Search</h1>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Enter skills (comma separated)"
            value={searchSkills}
            onChange={(e) => setSearchSkills(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {resumes.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Resume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resumes.map((resume, index) => (
                <TableRow key={index}>
                  <TableCell>{resume?.personalInfo?.name}</TableCell>
                  <TableCell>{resume?.personalInfo?.email}</TableCell>
                  <TableCell>{resume?.personalInfo?.location}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {resume.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-primary/10 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={resume.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Resume
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}