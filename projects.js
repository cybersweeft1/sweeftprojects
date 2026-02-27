/**
 * Cyber Sweeft - Projects Data Manager
 * Uses Google Sheets Gviz API for unlimited reads (no Apps Script quota)
 */

// ===============================
// DEPARTMENT MAPPING (UNCHANGED)
// ===============================
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

// ===============================
// PROJECT STORE CLASS
// ===============================
class ProjectStore {
  constructor() {
    this.projects = [];
    this.loading = false;
    this.error = null;
  }

  async fetchProjects() {
    this.loading = true;
    this.error = null;

    try {
      const { SHEET_ID, SHEET_NAME } = window.API_CONFIG;

      const url =
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

      const response = await fetch(url);
      const text = await response.text();

      // SAFER JSON extraction (no fragile regex)
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonString = text.substring(jsonStart, jsonEnd + 1);

      const data = JSON.parse(jsonString);

      this.projects = this.parseSheetData(data);
      this.loading = false;

      return this.projects;

    } catch (err) {
      this.error = err.message;
      this.loading = false;
      console.error("Failed to fetch projects:", err);
      throw err;
    }
  }

  /**
   * Expected columns:
   * A=ID
   * B=Name
   * C=Department
   * D=Description
   * E=Price
   * F=DriveID
   * G=CreatedAt
   * H=Status
   */
  parseSheetData(data) {
    if (!data.table || !data.table.rows) {
      return [];
    }

    const rows = data.table.rows;
    const projects = [];

    // DO NOT SKIP FIRST ROW (GViz already excludes header row)
    for (let i = 0; i < rows.length; i++) {

      const row = rows[i].c;
      if (!row) continue;

      const id = row[0]?.v?.toString().trim() || '';
      const name = row[1]?.v?.toString().trim() || '';
      const department = row[2]?.v?.toString().trim() || '';
      const description = row[3]?.v?.toString().trim() || '';
      const priceRaw = row[4]?.v;
      const driveId = row[5]?.v?.toString().trim() || '';
      const status = row[7]?.v?.toString().trim().toLowerCase() || 'active';

      const price = Number(priceRaw) || window.API_CONFIG.FIXED_PRICE;

      // Skip invalid or inactive rows
      if (
        status !== 'active' ||
        !id ||
        !name ||
        !driveId
      ) {
        continue;
      }

      const school =
        DEPARTMENT_TO_SCHOOL[department] || 'Unknown School';

      projects.push({
        id,
        name,
        school,
        category: department,
        price,
        driveId,
        description: description || 'No description available',
        driveDownloadUrl:
          `https://drive.google.com/uc?export=download&id=${driveId}`,
        viewUrl:
          `https://drive.google.com/file/d/${driveId}/view`
      });
    }

    return projects;
  }

  filterProjects(department = 'all', searchQuery = '') {
    let filtered = [...this.projects];

    if (department !== 'all') {
      filtered = filtered.filter(p => p.category === department);
    }

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

  getProjectById(id) {
    return this.projects.find(p => p.id === id);
  }

  getAvailableDepartments() {
    const depts = new Set(this.projects.map(p => p.category));
    return Array.from(depts).sort();
  }
}

// Global exposure
window.ProjectStore = ProjectStore;
window.ALL_DEPARTMENTS = ALL_DEPARTMENTS;
window.ALL_SCHOOLS = ALL_SCHOOLS;
window.DEPARTMENT_TO_SCHOOL = DEPARTMENT_TO_SCHOOL;
