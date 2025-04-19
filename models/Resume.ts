import mongoose from 'mongoose';

const ResumeSchema = new mongoose.Schema({
  personalInfo: {
    name: String,
    email: String,
    phone: String,
    location: String,
  },
  education: [{
    degree: String,
    institution: String,
    year: String,
    gpa: String,
  }],
  experience: [{
    title: String,
    company: String,
    duration: String,
    responsibilities: [String],
  }],
  projects: [{
    name: String,
    description: String,
    technologies: [String],
  }],
  skills: [String],
  certifications: [String],
  fileUrl: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);