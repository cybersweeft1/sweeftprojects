/**
 * Cyber Sweeft - Projects Data Manager
 * Uses GVIK/Gviz trick for unlimited reads
 */

// 1. PREFIX REMOVED: Cleaned keys for easier UI display
const DEPARTMENT_TO_SCHOOL = {
  "Science Laboratory Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Home and Rural Economics": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Food Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Statistics": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Hospitality Management": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Computer Science": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Agricultural Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Horticultural Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Fashion Design & Clothing Technology": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "Printing Technology": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "Fine and Applied Arts": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "Business Administration & Management": "SCHOOL OF BUSINESS STUDIES",
  "Public Administration": "SCHOOL OF BUSINESS STUDIES",
  "Office Technology and Management": "SCHOOL OF BUSINESS STUDIES",
  "Marketing": "SCHOOL OF BUSINESS STUDIES",
  "Civil Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Mechanical Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Electrical/Electronics Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Agricultural and Bio Environmental Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Computer Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Chemical Engineering": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Architecture": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Building Technology": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Estate Management": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Urban and Regional Planning": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Quantity Surveying": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Surveying and Geo-informatics": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Banking and Finance": "SCHOOL OF FINANCIAL STUDIES",
  "Accountancy": "SCHOOL OF FINANCIAL STUDIES",
  "Insurance": "SCHOOL OF FINANCIAL STUDIES",
  "Natural Science": "SCHOOL OF GENERAL STUDIES",
  "Social Science": "SCHOOL OF GENERAL STUDIES",
  "Languages": "SCHOOL OF GENERAL STUDIES",
  "Mass Communication": "SCHOOL OF INFORMATION TECHNOLOGY",
  "Library and Information Science": "SCHOOL OF INFORMATION TECHNOLOGY"
};

const ALL_DEPARTMENTS = Object.keys(DEPARTMENT_TO_SCHOOL).sort();

class ProjectStore {
  constructor() {
    this.projects = [];
  }

  async fetchProjects() {
    try {
      const { SHEET_ID, SHEET_NAME } = window.API_CONFIG;
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const text = await response.text();
      
      // FIX: Better parsing that won't get stuck on Regex mismatches
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error("Invalid response format");
      
      const jsonData = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      this.projects = this.parseSheetData(jsonData);
      return this.projects;
    } catch (err) {
      console.error('Project Loading Error:', err);
      throw err; // Ensure the UI catch block sees this to stop the loader
    }
  }

  parseSheetData(data) {
    if (!data.table || !data.table.rows) return [];
    
    return data.table.rows.map(row => {
      const c = row.c;
      if (!c || !c[0]) return null; 

      const statusValue = c[7]?.v?.toString().toLowerCase() || 'active';
      if (statusValue !== 'active') return null;

      // REMOVE "Department of" prefix from the string coming from the spreadsheet
      let rawDept = c[2]?.v?.toString().trim() || 'General';
      const cleanDept = rawDept.replace(/^Department of\s+/i, "");
      
      return {
        id: c[0]?.v?.toString() || '',
        name: c[1]?.v?.toString() || 'Untitled Project',
        category: cleanDept, // Stores "Computer Science" instead of "Department of..."
        school: DEPARTMENT_TO_SCHOOL[cleanDept] || "GENERAL STUDIES",
        description: c[3]?.v?.toString() || 'Detailed project documentation.',
        price: parseInt(c[4]?.v) || window.API_CONFIG.FIXED_PRICE,
        driveId: c[5]?.v?.toString().trim() || '',
        driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${c[5]?.v}`,
      };
    }).filter(p => p !== null && p.driveId !== '');
  }

  filterProjects(department = 'all', searchQuery = '') {
    let filtered = [...this.projects];
    if (department !== 'all') {
      // Logic still works because category is now prefix-free
      filtered = filtered.filter(p => p.category === department);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }

  getProjectById(id) {
    return this.projects.find(p => p.id == id);
  }
}

window.ProjectStore = ProjectStore;
window.ALL_DEPARTMENTS = ALL_DEPARTMENTS;
