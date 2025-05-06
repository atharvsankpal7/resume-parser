import * as XLSX from 'xlsx';

interface ExportToExcelOptions {
  filename?: string;
  sheetName?: string;
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  options: ExportToExcelOptions = {}
) {
  const {
    filename = 'export.xlsx',
    sheetName = 'Sheet1'
  } = options;

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert data to worksheet
  const ws = XLSX.utils.json_to_sheet(data);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate the file and trigger download
  XLSX.writeFile(wb, filename);
}

export function prepareResumeDataForExcel(resumeData: any[]) {
  return resumeData.map(resume => ({
    Name: resume.personalInfo?.name || '',
    Email: resume.personalInfo?.email || '',
    Location: resume.personalInfo?.location || '',
    Phone: resume.personalInfo?.phone || '',
    Education: resume.education?.map((edu: any) => 
      `${edu.degree} - ${edu.institution} (${edu.year})`
    ).join('; ') || '',
    Skills: resume.skills?.join(', ') || '',
    Experience: resume.experience?.map((exp: any) => 
      `${exp.title} at ${exp.company} (${exp.duration})`
    ).join('; ') || '',
    Projects: resume.projects?.map((proj: any) => 
      `${proj.name}: ${proj.description}`
    ).join('; ') || '',
    Certifications: resume.certifications?.join(', ') || '',
    'Resume URL': resume.fileUrl || ''
  }));
}