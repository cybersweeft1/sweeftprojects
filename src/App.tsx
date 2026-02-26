import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Moon, 
  Sun, 
  Download, 
  Lock, 
  Check, 
  Shield, 
  AlertTriangle, 
  Redo, 
  Store, 
  University,
  Loader2,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Types
interface Project {
  id: string;
  name: string;
  school: string;
  category: string;
  price: number;
  driveId: string;
  description: string;
  driveDownloadUrl?: string;
  viewUrl?: string;
}

interface School {
  name: string;
  departments: string[];
}

interface ProjectsData {
  schools: School[];
  projects: Project[];
}

// Constants
const STORAGE_KEY = 'cybersweeft_purchases_v1';
const FIXED_PRICE = 2500;

// Paystack types
declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        currency: string;
        ref: string;
        metadata: {
          custom_fields: Array<{ display_name: string; variable_name: string; value: string }>;
          project_id: string;
        };
        callback: (response: { reference: string }) => void;
        onClose: () => void;
      }) => { openIframe: () => void };
    };
  }
}

function App() {
  // State
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  
  // Purchase state
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [email, setEmail] = useState('');
  const [processing, setProcessing] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  
  // Download screen state
  const [showDownloadScreen, setShowDownloadScreen] = useState(false);
  const [lastTransactionRef, setLastTransactionRef] = useState('');

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Load purchased projects
  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        setPurchasedIds(JSON.parse(data));
      }
    } catch (e) {
      console.error('Error loading purchases:', e);
    }
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try multiple sources
        let response;
        const sources = [
          '/projects.json',
          './projects.json',
          'projects.json'
        ];
        
        for (const source of sources) {
          try {
            response = await fetch(source);
            if (response.ok) break;
          } catch (e) {
            continue;
          }
        }
        
        if (!response || !response.ok) {
          throw new Error('Failed to load projects');
        }
        
        const data: ProjectsData = await response.json();
        
        const processedProjects = data.projects.map(p => ({
          ...p,
          driveDownloadUrl: `https://drive.google.com/uc?export=download&id=${p.driveId}`,
          viewUrl: `https://drive.google.com/file/d/${p.driveId}/view`
        }));
        
        setSchools(data.schools);
        setProjects(processedProjects);
        setFilteredProjects(processedProjects);
      } catch (err) {
        setError('Failed to load projects. Please refresh the page.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  // Filter projects
  useEffect(() => {
    let filtered = [...projects];
    
    // School filter
    if (selectedSchool !== 'all') {
      filtered = filtered.filter(p => p.school === selectedSchool);
    }
    
    // Department filter
    if (selectedDept !== 'all') {
      filtered = filtered.filter(p => p.category === selectedDept);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.school.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredProjects(filtered);
  }, [selectedSchool, selectedDept, searchQuery, projects]);

  // Get departments for selected school
  const getDepartments = useCallback(() => {
    if (selectedSchool === 'all') {
      return schools.flatMap(s => s.departments);
    }
    const school = schools.find(s => s.name === selectedSchool);
    return school ? school.departments : [];
  }, [selectedSchool, schools]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  // Purchase handlers
  const handleBuy = (project: Project) => {
    if (purchasedIds.includes(project.id)) {
      handleDownload(project);
    } else {
      setSelectedProject(project);
      setEmail('');
      setPurchaseModalOpen(true);
    }
  };

  const handlePurchase = () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }
    if (!selectedProject) return;
    if (!window.PaystackPop) {
      alert('Payment system not loaded. Please refresh.');
      return;
    }

    setProcessing(true);

    const handler = window.PaystackPop.setup({
      key: 'pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with actual key
      email: email,
      amount: FIXED_PRICE * 100,
      currency: 'NGN',
      ref: `PRJ_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      metadata: {
        custom_fields: [
          { display_name: 'Project', variable_name: 'project_name', value: selectedProject.name },
          { display_name: 'Project ID', variable_name: 'project_id', value: selectedProject.id },
          { display_name: 'Department', variable_name: 'department', value: selectedProject.category },
          { display_name: 'School', variable_name: 'school', value: selectedProject.school }
        ],
        project_id: selectedProject.id
      },
      callback: (response) => {
        setProcessing(false);
        setPurchaseModalOpen(false);
        
        // Record purchase
        const newPurchased = [...purchasedIds, selectedProject.id];
        setPurchasedIds(newPurchased);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPurchased));
        sessionStorage.setItem('last_purchase', JSON.stringify(selectedProject));
        
        setLastTransactionRef(response.reference);
        setShowDownloadScreen(true);
        
        setTimeout(() => {
          handleDownload(selectedProject);
        }, 1000);
      },
      onClose: () => {
        setProcessing(false);
      }
    });

    handler.openIframe();
  };

  const handleDownload = (project: Project) => {
    if (!project.driveDownloadUrl) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = project.driveDownloadUrl;
    document.body.appendChild(iframe);
    
    const a = document.createElement('a');
    a.href = project.driveDownloadUrl;
    a.download = `${project.name.replace(/\s+/g, '_')}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      document.body.removeChild(iframe);
    }, 5000);
  };

  const retryDownload = () => {
    const lastPurchase = sessionStorage.getItem('last_purchase');
    if (lastPurchase) {
      const project = JSON.parse(lastPurchase);
      handleDownload(project);
    }
  };

  const returnToStore = () => {
    setShowDownloadScreen(false);
    setSelectedProject(null);
  };

  if (showDownloadScreen && selectedProject) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--off-white)' }}>
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-[5%]"
          style={{ 
            background: 'rgba(10,31,92,0.97)', 
            backdropFilter: 'blur(12px)',
            boxShadow: '0 2px 20px rgba(10,31,92,0.3)'
          }}>
          <a href="/" className="text-white font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            CYBER <span style={{ color: 'var(--accent)' }}>SWEEFT</span>
          </a>
          <button 
            onClick={toggleDarkMode}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </nav>

        {/* Download Screen */}
        <div className="pt-[100px] px-4 pb-16 flex items-center justify-center min-h-[60vh]">
          <div 
            className="rounded-2xl p-12 max-w-lg w-full text-center animate-fade-in"
            style={{ 
              background: 'var(--card-bg)', 
              boxShadow: 'var(--shadow)' 
            }}
          >
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ 
                background: 'linear-gradient(135deg, var(--success) 0%, #059669 100%)' 
              }}
            >
              <Check className="text-white w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--blue)' }}>
              Payment Successful!
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              {selectedProject.name}
            </p>
            
            <div 
              className="rounded-xl p-5 mb-8 flex gap-3 text-left"
              style={{ 
                background: 'rgba(245,158,11,0.1)', 
                border: '2px solid rgba(245,158,11,0.3)',
                color: 'var(--warning)'
              }}
            >
              <AlertTriangle className="flex-shrink-0 w-5 h-5 mt-0.5" />
              <div className="text-sm">
                <strong>Important:</strong> Your download has started automatically. 
                If you leave this page, use the same device to "Download Again" without paying twice.
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <Button 
                onClick={retryDownload}
                className="flex-1 py-4 h-auto font-semibold"
                style={{ background: 'var(--success)' }}
              >
                <Redo className="w-4 h-4 mr-2" />
                Download Again
              </Button>
              <Button 
                onClick={returnToStore}
                variant="outline"
                className="flex-1 py-4 h-auto font-semibold"
              >
                <Store className="w-4 h-4 mr-2" />
                Back to Store
              </Button>
            </div>

            <p className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
              Reference: {lastTransactionRef}
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 px-[5%] text-center" style={{ background: '#060f2e', color: 'rgba(255,255,255,0.6)' }}>
          <div className="text-white font-bold text-xl mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            CYBER <span style={{ color: 'var(--accent)' }}>SWEEFT</span> SERVICES
          </div>
          <p className="text-sm opacity-80 mb-4">"Distance Is Not A Barrier"</p>
          <div className="flex items-center justify-center gap-2 text-xs opacity-60">
            <Lock className="w-3 h-3" />
            <span>Secure Payments • Instant Delivery</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--off-white)' }}>
      {/* Load Fonts */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" 
        rel="stylesheet" 
      />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-[5%]"
        style={{ 
          background: 'rgba(10,31,92,0.97)', 
          backdropFilter: 'blur(12px)',
          boxShadow: '0 2px 20px rgba(10,31,92,0.3)'
        }}>
        <a href="/" className="text-white font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
          CYBER <span style={{ color: 'var(--accent)' }}>SWEEFT</span>
        </a>
        <button 
          onClick={toggleDarkMode}
          className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white/10 transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      {/* Main Content */}
      <main className="pt-[100px] px-[5%] pb-16 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 
            className="text-4xl md:text-5xl font-extrabold mb-3"
            style={{ 
              fontFamily: 'Syne, sans-serif', 
              color: darkMode ? '#93c5fd' : 'var(--blue)' 
            }}
          >
            Final Year Project Store
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            Premium academic resources for all Schools and Departments. ₦2,500 per download. Secure access and instant delivery.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            <Input
              type="text"
              placeholder="Search by project name, department, school, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-5 py-4 h-14 rounded-full text-base border-2"
              style={{ 
                background: 'var(--card-bg)', 
                borderColor: 'rgba(10,31,92,0.1)',
                color: 'var(--blue)'
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-5 justify-center mb-8">
          {/* School Select */}
          <div className="flex flex-col gap-2 min-w-[280px] flex-1 max-w-md">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--blue)' }}>
              Select School:
            </label>
            <Select value={selectedSchool} onValueChange={(value) => {
              setSelectedSchool(value);
              setSelectedDept('all');
            }}>
              <SelectTrigger 
                className="h-12 rounded-xl border-2"
                style={{ background: 'var(--card-bg)', borderColor: 'rgba(10,31,92,0.1)' }}
              >
                <SelectValue placeholder="All Schools" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools.map((school) => (
                  <SelectItem key={school.name} value={school.name}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department Select */}
          <div className="flex flex-col gap-2 min-w-[280px] flex-1 max-w-md">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--blue)' }}>
              Select Department:
            </label>
            <Select value={selectedDept} onValueChange={setSelectedDept}>
              <SelectTrigger 
                className="h-12 rounded-xl border-2"
                style={{ background: 'var(--card-bg)', borderColor: 'rgba(10,31,92,0.1)' }}
              >
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {selectedSchool === 'all' ? 'All Departments' : 'All Departments in Selected School'}
                </SelectItem>
                {getDepartments().map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: 'var(--accent)' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <p className="text-lg">No projects found for this selection.</p>
            <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div 
                key={project.id}
                className="rounded-2xl p-7 transition-all duration-200 hover:-translate-y-1"
                style={{ 
                  background: 'var(--card-bg)', 
                  boxShadow: 'var(--shadow)',
                  border: '1px solid rgba(10,31,92,0.05)'
                }}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <span 
                    className="text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-full truncate max-w-[70%]"
                    style={{ 
                      background: 'rgba(59,130,246,0.1)', 
                      color: 'var(--accent)' 
                    }}
                  >
                    {project.category}
                  </span>
                  {purchasedIds.includes(project.id) && (
                    <span 
                      className="text-xs font-semibold flex items-center gap-1 flex-shrink-0"
                      style={{ color: 'var(--success)' }}
                    >
                      <Check className="w-3 h-3" />
                      Owned
                    </span>
                  )}
                </div>

                {/* School Badge */}
                <div className="flex items-center gap-1.5 mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <University className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                  <span className="line-clamp-2">{project.school}</span>
                </div>

                {/* Title */}
                <h3 
                  className="text-lg font-bold mb-3 line-clamp-2"
                  style={{ 
                    fontFamily: 'Syne, sans-serif',
                    color: darkMode ? '#93c5fd' : 'var(--blue)'
                  }}
                >
                  {project.name}
                </h3>

                {/* Description */}
                <p 
                  className="text-sm mb-5 line-clamp-3"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {project.description}
                </p>

                {/* Footer */}
                <div 
                  className="flex justify-between items-center pt-5"
                  style={{ borderTop: '1px solid rgba(10,31,92,0.08)' }}
                >
                  <span 
                    className="text-2xl font-extrabold"
                    style={{ 
                      fontFamily: 'Syne, sans-serif',
                      color: 'var(--blue)'
                    }}
                  >
                    ₦{FIXED_PRICE.toLocaleString()}
                  </span>
                  
                  {purchasedIds.includes(project.id) ? (
                    <Button
                      onClick={() => handleDownload(project)}
                      className="gap-2"
                      style={{ background: 'var(--success)' }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleBuy(project)}
                      className="gap-2"
                      style={{ 
                        background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)'
                      }}
                    >
                      <Lock className="w-4 h-4" />
                      Buy Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Purchase Modal */}
      <Dialog open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen}>
        <DialogContent 
          className="sm:max-w-md rounded-2xl p-8"
          style={{ background: 'var(--card-bg)' }}
        >
          <DialogHeader>
            <DialogTitle 
              className="text-xl font-bold"
              style={{ fontFamily: 'Syne, sans-serif', color: 'var(--blue)' }}
            >
              Complete Purchase
            </DialogTitle>
          </DialogHeader>
          
          {selectedProject && (
            <div className="mt-4">
              <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                {selectedProject.name}
              </p>
              <p 
                className="text-3xl font-extrabold mb-6"
                style={{ fontFamily: 'Syne, sans-serif', color: 'var(--blue)' }}
              >
                ₦{FIXED_PRICE.toLocaleString()}
                <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                  one-time payment
                </span>
              </p>

              <div className="mb-5">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--blue)' }}>
                  Email Address (for receipt)
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-2"
                  style={{ borderColor: 'rgba(10,31,92,0.1)' }}
                />
              </div>

              <Button
                onClick={handlePurchase}
                disabled={processing}
                className="w-full h-14 text-base font-bold gap-2 mb-4"
                style={{ 
                  background: 'linear-gradient(135deg, var(--blue) 0%, var(--blue-light) 100%)'
                }}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ₦{FIXED_PRICE.toLocaleString()} & Download
                  </>
                )}
              </Button>

              <div 
                className="flex items-center justify-center gap-2 text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                <Shield className="w-4 h-4" />
                <span>Secured by Paystack. Instant access after payment.</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="py-12 px-[5%] text-center" style={{ background: '#060f2e', color: 'rgba(255,255,255,0.6)' }}>
        <div className="text-white font-bold text-xl mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          CYBER <span style={{ color: 'var(--accent)' }}>SWEEFT</span> SERVICES
        </div>
        <p className="text-sm opacity-80 mb-4">"Distance Is Not A Barrier"</p>
        <div className="flex items-center justify-center gap-2 text-xs opacity-60">
          <Lock className="w-3 h-3" />
          <span>Secure Payments • Instant Delivery</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
