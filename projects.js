/**
 * Cyber Sweeft - Projects Data Manager
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
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      // Improved Regex to grab the JSON content inside the Google wrapper
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonData = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
      
      this.projects = this.parseSheetData(jsonData);
      return this.projects;
    } catch (err) {
      console.error('Fetch Error:', err);
      throw err;
    }
  }

  parseSheetData(data) {
    if (!data.table || !data.table.rows) return [];
    
    // Mapping: A=0(ID), B=1(Name), C=2(Dept), D=3(Desc), E=4(Price), F=5(DriveID), H=7(Status)
    return data.table.rows.map(row => {
      const cells = row.c;
      if (!cells || !cells[0]) return null;

      const status = cells[7]?.v?.toString().toLowerCase() || 'active';
      if (status !== 'active') return null;

      const dept = cells[2]?.v?.toString().trim() || 'General';
      
      return {
        id: cells[0]?.v?.toString() || Math.random().toString(36),
        name: cells[1]?.v?.toString() || 'Untitled Project',
        category: dept,
        school: DEPARTMENT_TO_SCHOOL[dept] || "Other",
        description: cells[3]?.v?.toString() || 'No description available.',
        price: parseInt(cells[4]?.v) || window.API_CONFIG.FIXED_PRICE,
        driveId: cells[5]?.v?.toString().trim() || '',
        driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${cells[5]?.v}`,
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
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
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
