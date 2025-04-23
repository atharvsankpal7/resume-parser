import React, { useState } from 'react';
import { Resume } from '../types';

interface ResumeListProps {
  resumes: Resume[];
}

export function ResumeList({ resumes }: ResumeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string>('');

  // Get unique skills from all resumes
  const allSkills = Array.from(
    new Set(resumes.flatMap(resume => resume.skills || []))
  ).sort();

  const experienceLevels = [
    '0-2 years',
    '2-5 years',
    '5-8 years',
    '8+ years'
  ];

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = resume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resume.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesSkills = selectedSkills.length === 0 ||
      selectedSkills.every(skill => resume.skills?.includes(skill));

    const matchesExperience = !selectedExperience ||
      resume.experience === selectedExperience;

    return matchesSearch && matchesSkills && matchesExperience;
  });

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 space-y-4">
        <input
          type="text"
          placeholder="Search resumes..."
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <div>
          <h3 className="text-lg font-medium mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {allSkills.map(skill => (
              <button
                key={skill}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedSkills.includes(skill)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
                onClick={() => handleSkillToggle(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Experience Level</h3>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedExperience}
            onChange={(e) => setSelectedExperience(e.target.value)}
          >
            <option value="">All Experience Levels</option>
            {experienceLevels.map(level => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResumes.map(resume => (
          <div
            key={resume.id}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold mb-2">{resume.name}</h3>
            <p className="text-gray-600 mb-2">{resume.email}</p>
            {resume.experience && (
              <p className="text-gray-600 mb-2">Experience: {resume.experience}</p>
            )}
            {resume.skills && resume.skills.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {resume.skills.map(skill => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {resume.summary && (
              <p className="mt-4 text-gray-700 line-clamp-3">{resume.summary}</p>
            )}
          </div>
        ))}
      </div>

      {filteredResumes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No resumes found matching your criteria</p>
        </div>
      )}
    </div>
  );
}