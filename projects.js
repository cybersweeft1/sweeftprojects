/**
 * Cyber Sweeft - Projects Data Manager
 * Uses Google Sheets Gviz API for unlimited reads (no Apps Script quota)
 */

// Department to School mapping - All 34 departments from your original code
const DEPARTMENT_TO_SCHOOL = {
  // SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY (8 departments)
  "Department of Science Laboratory Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Home and Rural Economics": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Food Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Statistics": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Hospitality Management": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Computer Science": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Agricultural Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "Department of Horticultural Technology": "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  
  // SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY (3 departments)
  "Department of Fashion Design & Clothing Technology": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "Department of Printing Technology": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "Department of Fine and Applied Arts": "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  
  // SCHOOL OF BUSINESS STUDIES (4 departments)
  "Department of Business Administration & Management": "SCHOOL OF BUSINESS STUDIES",
  "Department of Public Administration": "SCHOOL OF BUSINESS STUDIES",
  "Department of Office Technology and Management": "SCHOOL OF BUSINESS STUDIES",
  "Department of Marketing": "SCHOOL OF BUSINESS STUDIES",
  
  // SCHOOL OF ENGINEERING TECHNOLOGY (6 departments)
  "Department of Civil Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Mechanical Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Electrical/Electronics Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Agricultural and Bio Environmental Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Computer Engineering Technology": "SCHOOL OF ENGINEERING TECHNOLOGY",
  "Department of Chemical Engineering": "SCHOOL OF ENGINEERING TECHNOLOGY",
  
  // SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY (6 departments)
  "Department of Architecture": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Building Technology": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Estate Management": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Urban and Regional Planning": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Quantity Surveying": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "Department of Surveying and Geo-informatics": "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  
  // SCHOOL OF FINANCIAL STUDIES (3 departments)
  "Department of Banking and Finance": "SCHOOL OF FINANCIAL STUDIES",
  "Department of Accountancy": "SCHOOL OF FINANCIAL STUDIES",
  "Department of Insurance": "SCHOOL OF FINANCIAL STUDIES",
  
  // SCHOOL OF GENERAL STUDIES (3 departments)
  "Department of Natural Science": "SCHOOL OF GENERAL STUDIES",
  "Department of Social Science": "SCHOOL OF GENERAL STUDIES",
  "Department of Languages": "SCHOOL OF GENERAL STUDIES",
  
  // SCHOOL OF INFORMATION TECHNOLOGY (2 departments)
  "Department of Mass Communication": "SCHOOL OF INFORMATION TECHNOLOGY",
  "Department of Library and Information Science": "SCHOOL OF INFORMATION TECHNOLOGY"
};

// All departments sorted alphabetically for dropdown
const ALL_DEPARTMENTS = Object.keys(DEPARTMENT_TO_SCHOOL).sort();

// Schools list for reference
const ALL_SCHOOLS = [
  "SCHOOL OF APPLIED SCIENCE AND TECHNOLOGY",
  "SCHOOL OF ARTS, DESIGN AND PRINTING TECHNOLOGY",
  "SCHOOL OF BUSINESS STUDIES",
  "SCHOOL OF ENGINEERING TECHNOLOGY",
  "SCHOOL OF ENVIRONMENTAL DESIGN AND TECHNOLOGY",
  "SCHOOL OF FINANCIAL STUDIES",
  "SCHOOL OF GENERAL STUDIES",
  "SCHOOL OF INFORMATION TECHNOLOGY"
];

/**
 * Project Store Class
 * Handles fetching and filtering projects from Google Sheets
 */
class ProjectStore {
  constructor() {
    this.projects = [];
    this.loading = false;
    this.error = null;
  }

  /**
   * Fetch projects using Google Sheets Gviz API
   * This bypasses Apps Script quota limits completely
   */
  async fetchProjects() {
    this.loading = true;
    this.error = null;
    
    try {
      const { SHEET_ID, SHEET_NAME } = window.API_CONFIG;
      
      // Gviz API endpoint - returns JSONP that we parse
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      // Extract JSON from JSONP wrapper
      // Response format: /*O_o*/google.visualization.Query.setResponse({...});
      const jsonMatch = text.match(/\/\*O_o\*\/\s*google\.visualization\.Query\.setResponse\((.*)\);?\s*$/s);
      
      if (!jsonMatch) {
        throw new Error('Invalid response format from Google Sheets');
      }
      
      const data = JSON.parse(jsonMatch[1]);
      this.projects = this.parseSheetData(data);
      this.loading = false;
      
      return this.projects;
    } catch (err) {
      this.error = err.message;
      this.loading = false;
      console.error('Failed to fetch projects:', err);
      throw err;
    }
  }

  /**
   * Parse Google Sheets response into project objects
   * Expected columns: A=ID, B=Name, C=Department, D=Description, E=Price, F=DriveID, G=CreatedAt, H=Status
   */
  parseSheetData(data) {
    if (!data.table || !data.table.rows || data.table.rows.length < 2) {
      return [];
    }
    
    const rows = data.table.rows;
    const projects = [];
    
    // Skip header row (index 0), start from data rows
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].c;
      if (!row) continue;
      
      // Extract cell values (handle null/undefined)
      const id = row[0]?.v?.toString().trim() || '';
      const name = row[1]?.v?.toString().trim() || '';
      const department = row[2]?.v?.toString().trim() || '';
      const description = row[3]?.v?.toString().trim() || '';
      const price = parseInt(row[4]?.v) || window.API_CONFIG.FIXED_PRICE;
      const driveId = row[5]?.v?.toString().trim() || '';
      const status = row[7]?.v?.toString().trim().toLowerCase() || 'active';
      
      // Skip inactive or incomplete rows
      if (status !== 'active' || !id || !driveId || !name) {
        continue;
      }
      
      // Get school from department mapping
      const school = DEPARTMENT_TO_SCHOOL[department] || 'Unknown School';
      
      projects.push({
        id,
        name,
        school,
        category: department,
        price,
        driveId,
        description: description || 'No description available',
        // Google Drive direct download URL
        driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${driveId}`,
        // View URL for preview
        viewUrl: `https://drive.google.com/file/d/${driveId}/view`
      });
    }
    
    return projects;
  }

  /**
   * Filter projects by department and search query
   */
  filterProjects(department = 'all', searchQuery = '') {
    let filtered = [...this.projects];
    
    // Filter by department dropdown
    if (department !== 'all') {
      filtered = filtered.filter(p => p.category === department);
    }
    
    // Filter by search query (case-insensitive)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.school.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }

  /**
   * Get a single project by ID
   */
  getProjectById(id) {
    return this.projects.find(p => p.id === id);
  }

  /**
   * Get all unique departments present in projects
   */
  getAvailableDepartments() {
    const depts = new Set(this.projects.map(p => p.category));
    return Array.from(depts).sort();
  }
}

// Make available globally
window.ProjectStore = ProjectStore;
window.ALL_DEPARTMENTS = ALL_DEPARTMENTS;
window.ALL_SCHOOLS = ALL_SCHOOLS;
window.DEPARTMENT_TO_SCHOOL = DEPARTMENT_TO_SCHOOL;
