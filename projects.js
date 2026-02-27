/**
 * Cyber Sweeft - Projects Data Manager
 * Uses GVIK/Gviz trick for unlimited reads
 */

const DEPARTMENT_TO_SCHOOL = {
  "Department of Science Laboratory Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Home and Rural Economics": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Food Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Statistics": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Hospitality Management": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Computer Science": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Agricultural Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Horticultural Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Fashion Design & Clothing Technology": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "Department of Printing Technology": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "Department of Fine and Applied Arts": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "Department of Business Administration & Management": "SCHOOL OF BUSINESS STUDIES",
  "Department of Public Administration": "SCHOOL OF BUSINESS STUDIES",
  "Department of Office Technology and Management": "SCHOOL OF BUSINESS STUDIES",
  "Department of Marketing": "SCHOOL OF BUSINESS STUDIES",
  "Department of Civil Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Mechanical Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Electrical/Electronics Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Agricultural and Bio Environmental Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Computer Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Chemical Engineering": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Architecture": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Building Technology": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Estate Management": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Urban and Regional Planning": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Quantity Surveying": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Surveying and Geo-informatics": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Banking and Finance": "SCHOOL OF FINANCIAL STUDIES",
  "Department of Accountancy": "SCHOOL OF FINANCIAL STUDIES",
  "Department of Insurance": "SCHOOL OF FINANCIAL STUDIES",
  "Department of Natural Science": "SCHOOL OF GENERAL STUDIES",
  "Department of Social Science": "SCHOOL OF GENERAL STUDIES",
  "Department of Languages": "SCHOOL OF GENERAL STUDIES",
  "Department of Mass Communication": "SCHOOL OF INFORMATION TECHNOLOGY",
  "Department of Library and Information Science": "SCHOOL OF INFORMATION TECHNOLOGY"
};

const ALL_DEPARTMENTS = Object.keys(DEPARTMENT_TO_SCHOOL).sort();

class ProjectStore {
  constructor() {
    this.projects = [];
  }

  async fetchProjects() {
    try {
      const { SHEET_ID, SHEET_NAME } = window.API_CONFIG;
      // The GVIK trick URL
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      // FIX: Robust Regex to handle Google's JSON wrapper safely regardless of length
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/);
      if (!match || !match[1]) throw new Error("Invalid response format from Sheets");
      
      const jsonData = JSON.parse(match[1]);
      this.projects = this.parseSheetData(jsonData);
      return this.projects;
    } catch (err) {
      console.error('Project Loading Error:', err);
      throw err;
    }
  }

  parseSheetData(data) {
    if (!data.table || !data.table.rows) return [];
    
    // Mapping matches your Admin Panel/Screenshot: 
    // A=0(ID), B=1(Name), C=2(Dept), D=3(Desc), E=4(Price), F=5(DriveID), H=7(Status)
    return data.table.rows.map(row => {
      const c = row.c;
      if (!c || !c[0]) return null; 

      // Only show if Status (Col H / Index 7) is 'Active' or 'active'
      const statusValue = c[7]?.v?.toString().toLowerCase() || 'active';
      if (statusValue !== 'active') return null;

      const dept = c[2]?.v?.toString().trim() || 'General';
      
      return {
        id: c[0]?.v?.toString() || '',
        name: c[1]?.v?.toString() || 'Untitled Project',
        category: dept,
        school: DEPARTMENT_TO_SCHOOL[dept] || "GENERAL STUDIES",
        description: c[3]?.v?.toString() || 'Detailed project documentation.',
        price: parseInt(c[4]?.v) || window.API_CONFIG.FIXED_PRICE,
        driveId: c[5]?.v?.toString().trim() || '',
        // Direct download link logic
        driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${c[5]?.v}`,
      };
    }).filter(p => p !== null && p.driveId !== '');
  }

  filterProjects(department = 'all', searchQuery = '') {
    let filtered = [...this.projects];
    if (department !== 'all') {
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
