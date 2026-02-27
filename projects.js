// Department to School mapping (preserves your original structure)
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

// All departments sorted for dropdown
window.ALL_DEPARTMENTS = Object.keys(DEPARTMENT_TO_SCHOOL).sort();

class ProjectStore {
  constructor() {
    this.projects = [];
    this.loading = false;
    this.error = null;
  }

  // Fetch using Gviz trick (no Apps Script quota limits)
  async fetchProjects() {
    this.loading = true;
    this.error = null;
    
    try {
      const { SHEET_ID, SHEET_NAME } = window.API_CONFIG;
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      
      // Extract JSON from JSONP wrapper
      const jsonStr = text.replace('/*O_o*/\ngoogle.visualization.Query.setResponse(', '').slice(0, -2);
      const data = JSON.parse(jsonStr);
      
      this.projects = this.parseSheetData(data);
      this.loading = false;
      return this.projects;
    } catch (err) {
      this.error = 'Failed to load projects. Please refresh.';
      this.loading = false;
      console.error('Fetch error:', err);
      throw err;
    }
  }

  parseSheetData(data) {
    if (!data.table || !data.table.rows) return [];
    
    const rows = data.table.rows;
    const projects = [];
    
    // Row 0 is header, data starts from row 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].c;
      if (!row || row.length < 6) continue;
      
      const id = row[0]?.v || '';
      const name = row[1]?.v || '';
      const department = row[2]?.v || '';
      const description = row[3]?.v || '';
      const price = row[4]?.v || window.API_CONFIG.FIXED_PRICE;
      const driveId = row[5]?.v || '';
      const status = row[7]?.v || 'active';
      
      // Skip inactive or empty rows
      if (status !== 'active' || !id || !driveId) continue;
      
      const school = DEPARTMENT_TO_SCHOOL[department] || 'Unknown School';
      
      projects.push({
        id,
        name,
        school,
        category: department,
        price: parseInt(price) || window.API_CONFIG.FIXED_PRICE,
        driveId,
        description: description || 'No description available',
        driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${driveId}`,
        viewUrl: `https://drive.google.com/file/d/${driveId}/view`
      });
    }
    
    return projects;
  }

  filterProjects(department = 'all', searchQuery = '') {
    let filtered = [...this.projects];
    
    // Filter by department dropdown
    if (department !== 'all') {
      filtered = filtered.filter(p => p.category === department);
    }
    
    // Filter by search query (searches name, department, school, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.school.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }

  getProjectById(id) {
    return this.projects.find(p => p.id === id);
  }
}

window.ProjectStore = ProjectStore;
