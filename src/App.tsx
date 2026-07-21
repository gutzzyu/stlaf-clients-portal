/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './lib/auth';
import { createSpreadsheet, appendToSheet, sendEmail, createDocument, shareFileInDrive, uploadFileToDrive, copyDriveFile, batchUpdateDocument, verifyDriveFileAccess } from './lib/google-api';
import { Scale, LogOut, CheckCircle2, AlertCircle, Loader2, Search, Briefcase, ChevronUp, ChevronDown, Calendar, Clock, Settings, FileText, Upload } from 'lucide-react';

const CLIENT_TYPES = ['Corporate', 'Individual'];
const INDUSTRIES = ['Energy', 'Maritime', 'Aviation', 'Banking', 'Gaming'];
const COUNTRIES = ['Philippines', 'Singapore', 'Hong Kong', 'Vietnam', 'Malaysia', 'United Kingdom', 'United States of America', 'United Arab Emirates'];
const EMPLOYEES = ['1-29', '30-59', '60-99', '100-149', '150-200'];
const DESIGNATIONS = ['Individual', 'Company President', 'Company Director', 'Managing Partner', 'Partner', 'Manager', 'Others'];
const CONSULTATION_PREFERENCES = ['Personal Consultation', 'Zoom Meeting', 'Google Meet', 'Microsoft Teams'];
const PREFERRED_TIMES = [
  '8:30 AM - 9:30 AM',
  '9:30 AM - 10:30 AM',
  '10:30 AM - 11:30 AM',
  '1:00 PM - 2:00 PM',
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM'
];
const HOW_DID_YOU_FIND_US = [
  'LinkedIn',
  'Facebook',
  'Instagram',
  'Company Website',
  'Email Outreach',
  'Word of Mouth (Referral)',
  'Events/Seminars'
];

const SERVICES_CATEGORIES = [
  {
    name: 'SEC & Corporate Governance',
    services: [
      'Amendment of AOI (Regular Amendment)',
      'Amendment of AOI (Increase/Decrease in Authorize Capital Stock)',
      'Amendment of By-Laws',
      'Amendment of GIS',
      'SEC Reportorial Requirement',
      'Application for SEC Amnesty Program',
      'Petition to Lift Order of Revocation',
      'Petition to Lift Order of Suspension',
      'Return of Securities Deposits',
      'SEC Incorporation (Stock)',
      'SEC Incorporation (Non-stock)',
      'SEC Branch Office Registration',
      'SEC Representative Office Registration',
      'Corporate Secretarial Works'
    ]
  },
  {
    name: 'Compliance & Regulatory',
    services: [
      'DPA Compliance',
      'AML Compliance',
      'Compliance Health Check',
      'Documents Requests',
      'Request for TIN Verification',
      'AMLA Registration',
      'BSRD Registration'
    ]
  },
  {
    name: 'Government Registrations & Permits',
    services: [
      'BIR Registration',
      'Business Permit Registration',
      'Business Permit Renewal',
      'Sanitary Permit',
      'DTI Permit',
      'Social Security System',
      'PhilHealth',
      'Pag-IBIG',
      'Food and Drug Administration',
      'Bureau of Customs',
      'BIR Transfer of TIN'
    ]
  },
  {
    name: 'Business Closure',
    services: [
      'Business Closure w/ SEC',
      'Business Closure w/ LGU',
      'Business Closure w/ BIR',
      'Business Closure w/ SSS',
      'Business Closure w/ PhilHealth',
      'Business Closure w/ Pag-IBIG'
    ]
  },
  {
    name: 'Property & Estate',
    services: [
      'Estate Planning',
      'Extrajudicial Settlement',
      'Transfer of Real Property – Sale',
      'Transfer of Real Property – Donation',
      'Transfer of Personal Property – Sale',
      'Transfer of Personal Property – Donation',
      'Residential Free Patent',
      'Occupancy Permit',
      'Renovation Permit',
      'Last Will and Testament'
    ]
  },
  {
    name: 'Intellectual Property',
    services: [
      'Copyright Registration',
      'Patent Registration',
      'Trademark Registration'
    ]
  },
  {
    name: 'Taxation & Labor Cases',
    services: [
      'BIR Tax Case - BIR level',
      'BIR Tax Case - CTA level',
      'BIR Tax Case - SC level',
      'Tax Treaty Relief Application/Request for Confirmation',
      'Tax Sparing Application',
      'Labor Case-SENA'
    ]
  }
];

const ALL_SERVICES_LIST = SERVICES_CATEGORIES.flatMap(cat => cat.services);

const getRomanNumeral = (num: number): string => {
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  return roman[num - 1] || String(num);
};

const SERVICE_PREGENERATED_DESCRIPTIONS: Record<string, string> = {
  // SEC & Corporate Governance
  'Amendment of AOI (Regular Amendment)': "Legal preparation, drafting, and facilitation of regular Articles of Incorporation (AOI) amendments. This service covers the verification of corporate approvals, drafting of the amended articles, and management of the formal documentary filing process through the SEC's eAMEND facility.",
  'Amendment of AOI (Increase/Decrease in Authorize Capital Stock)': "Comprehensive assistance in modifying the corporation's Authorized Capital Stock. This includes drafting of the amended Articles of Incorporation, preparation of the Treasurer's Affidavit, SEC filings, board resolutions, and securing the necessary regulatory clearances.",
  'Amendment of By-Laws': "Drafting and filing of amended By-Laws to update corporate governance rules, meeting protocols, officer duties, and internal administrative procedures in full compliance with the Revised Corporation Code.",
  'Amendment of GIS': "Preparation and filing of an Amended General Information Sheet (GIS) with the SEC to formally record changes in stockholders, directors, officers, or other mandatory corporate disclosures.",
  'SEC Reportorial Requirement': "Assistance with annual corporate compliance filings, including the preparation and submission of the General Information Sheet (GIS) and coordination for Annual Financial Statements (AFS) filing.",
  'Application for SEC Amnesty Program': "Professional support in preparing petition papers and applications under the SEC Amnesty Program to settle accumulated penalties and restore the corporation's active compliant status.",
  'Petition to Lift Order of Revocation': "Drafting, filing, and representation for the Petition to Lift Order of Revocation of the corporation's certificate of registration, addressing historical compliance issues and restoring corporate existence.",
  'Petition to Lift Order of Suspension': "Legal advocacy and administrative support in filing a Petition to Lift Order of Suspension with the SEC, resolving the underlying compliance defaults to resume normal business operations.",
  'Return of Securities Deposits': "Assistance in navigating the SEC requirements to secure the return or release of securities deposits previously placed by foreign corporations or special entities.",
  'SEC Incorporation (Stock)': "Full-service assistance in organizing a domestic stock corporation, including name verification, drafting of the Articles of Incorporation and By-Laws, registration with the SEC, and issuance of the Certificate of Incorporation.",
  'SEC Incorporation (Non-stock)': "Structuring and registering a domestic non-stock corporation (such as associations or foundations), including drafting dedicated purposes, By-Laws, trustee lists, and securing SEC approval.",
  'SEC Branch Office Registration': "Legal assistance for foreign corporations looking to establish a branch office in the Philippines, including securing the SEC license to do business and registering resident agents.",
  'SEC Representative Office Registration': "Assistance in establishing a representative office for a foreign entity to act as a liaison center, including drafting requirements and obtaining the necessary SEC license.",
  'Corporate Secretarial Works': "Retainer or project-based Corporate Secretary services, including drafting board resolutions, secretary's certificates, taking minutes of meetings, and maintaining the corporate stock and transfer book.",

  // Compliance & Regulatory
  'DPA Compliance': "Comprehensive compliance program under the Data Privacy Act (DPA) of 2012, including drafting Privacy Policies, consent forms, Data Sharing Agreements, and registering Data Protection Officers (DPOs) with the National Privacy Commission (NPC).",
  'AML Compliance': "Design and implementation of Anti-Money Laundering (AML) compliance programs, including drafting Know-Your-Customer (KYC) guidelines, internal policies, and ensuring full compliance with AMLC regulations.",
  'Compliance Health Check': "A thorough diagnostic review of corporate documents, licenses, permits, and tax registries to identify regulatory gaps, potential exposure, and compile a clear rectification roadmap.",
  'Documents Requests': "Drafting and processing requests for certified copies of corporate documents, certificates of good standing, or official records from various government agencies.",
  'Request for TIN Verification': "Official verification and reconciliation of taxpayer identification numbers (TIN) with the Bureau of Internal Revenue (BIR) to prevent transaction delays.",
  'AMLA Registration': "Facilitating the mandatory registration of covered persons or institutions with the Anti-Money Laundering Council (AMLC) portal and preparing compliance materials.",
  'BSRD Registration': "Registration with the Bangko Sentral ng Pilipinas (BSP) for the Bangko Sentral Registration Document (BSRD) to formally record foreign direct investments and facilitate capital repatriation.",

  // Government Registrations & Permits
  'BIR Registration': "Comprehensive registration with the Bureau of Internal Revenue (BIR), including securing the Certificate of Registration (COR / Form 2303), processing authority to print receipts (ATP), and registering books of accounts.",
  'Business Permit Registration': "Facilitating the end-to-end process of securing a new Mayor's / Business Permit from the Local Government Unit (LGU), including barangay clearance, zoning clearances, and fire safety certificates.",
  'Business Permit Renewal': "Handling the annual renewal of the Mayor's / Business Permit with the LGU, including assessment of local business taxes and filing required certifications.",
  'Sanitary Permit': "Securing the sanitary permit and health certificates from the local health office, ensuring compliance with local sanitation standards and health codes.",
  'DTI Permit': "Registration of a sole proprietorship business name with the Department of Trade and Industry (DTI), including scope selection (barangay, city, regional, or national).",
  'Social Security System': "Registration of the business entity as an employer with the Social Security System (SSS) and setting up the employer portal for staff contributions.",
  'PhilHealth': "Employer registration with the Philippine Health Insurance Corporation (PhilHealth), ensuring compliance with mandatory employee healthcare coverage.",
  'Pag-IBIG': "Employer registration with the Home Development Mutual Fund (HDMF / Pag-IBIG), establishing employee housing fund accounts.",
  'Food and Drug Administration': "Assistance in securing a License to Operate (LTO) or Certificate of Product Registration (CPR) from the Food and Drug Administration (FDA) for food, drugs, or cosmetics.",
  'Bureau of Customs': "Registration and accreditation of the business entity as an importer or exporter with the Bureau of Customs (BOC) and the Client Profile Registration System (CPRS).",
  'BIR Transfer of TIN': "Processing the transfer of taxpayer registration / tax district (LDO) with the BIR due to change in corporate address or business jurisdiction.",

  // Business Closure
  'Business Closure w/ SEC': "Formal application to shorten corporate term or dissolve the corporation with the SEC, including auditing, publishing notices, and obtaining the SEC Certificate of Dissolution.",
  'Business Closure w/ LGU': "Processing the cancellation of the Mayor's / Business Permit with the LGU, including assessment of terminal business taxes and retirement of business registration.",
  'Business Closure w/ BIR': "Processing the formal closure of the taxpayer branch or main office with the BIR, including tax audit coordination, surrendering receipts, and obtaining the crucial BIR Tax Clearance.",
  'Business Closure w/ SSS': "Formal notification and retirement of employer registration with the SSS to stop employee contribution liabilities.",
  'Business Closure w/ PhilHealth': "Processing the official retirement of employer registration with PhilHealth to settle terminal contributions.",
  'Business Closure w/ Pag-IBIG': "Formal notification and retirement of employer registration with the Pag-IBIG Fund to wrap up employee accounts.",

  // Property & Estate
  'Estate Planning': "Custom structuring of estate distribution to minimize estate taxes and preserve family wealth, including drafting trusts, holding company structures, and asset allocation strategies.",
  'Extrajudicial Settlement': "Drafting and publication of the Deed of Extrajudicial Settlement of Estate among heirs, including securing the necessary estate tax clearances and property transfers.",
  'Transfer of Real Property – Sale': "Processing the title transfer for real estate sales, including drafting the Deed of Absolute Sale, filing and paying Capital Gains Tax (CGT) and Documentary Stamp Tax (DST) with the BIR, securing the CAR, and registering with the Registry of Deeds.",
  'Transfer of Real Property – Donation': "Processing title transfer via donation, including drafting the Deed of Donation, filing Donor's Tax returns with the BIR, obtaining the CAR, and updating the land title and tax declarations.",
  'Transfer of Personal Property – Sale': "Preparation of Deed of Sale for vehicles, shares of stock, or other tangible personal property, including tax filings if applicable.",
  'Transfer of Personal Property – Donation': "Drafting Deeds of Donation for personal property, cash, or shares, and advising on Donor's Tax exemptions and filings.",
  'Residential Free Patent': "Assistance in filing applications for residential free patents with the DENR to secure original land titles for eligible long-term occupants.",
  'Occupancy Permit': "Compiling requirements and processing applications with the local Office of the Building Official to secure the Certificate of Occupancy for newly constructed or renovated properties.",
  'Renovation Permit': "Securing local building and renovation permits to ensure all structural changes comply with the National Building Code.",
  'Last Will and Testament': "Legal drafting, structuring, and witnessing of a Notarial or Holographic Last Will and Testament, ensuring compliance with strict Civil Code formal requirements.",

  // Intellectual Property
  'Copyright Registration': "Filing and registration of literary, artistic, or scientific works with the Intellectual Property Office of the Philippines (IPOPHL) or National Library to secure copyright protection.",
  'Patent Registration': "Drafting, filing, and prosecution of patent or utility model applications with IPOPHL to protect novel inventions and technological solutions.",
  'Trademark Registration': "Comprehensive trademark search, preparation of applications, and representation before IPOPHL to protect brand names, logos, slogans, and trade dress.",

  // Taxation & Labor Cases
  'BIR Tax Case - BIR level': "Administrative representation, drafting of protests, and negotiations with the BIR in response to Letters of Authority (LOA), Preliminary Assessment Notices (PAN), or Final Assessment Notices (FAN).",
  'BIR Tax Case - CTA level': "Legal advocacy, preparation of petitions for review, and full representation before the Court of Tax Appeals (CTA) for disputed assessments or tax refund claims.",
  'BIR Tax Case - SC level': "Preparation of petitions for review on certiorari and representation before the Supreme Court for high-stakes taxation cases.",
  'Tax Treaty Relief Application/Request for Confirmation': "Preparation and filing of applications with the BIR's International Tax Affairs Division (ITAD) to confirm the availability of lower tax rates or tax exemptions under existing tax treaties.",
  'Tax Sparing Application': "Filing for the application of the tax sparing rule under the Tax Code to secure a lower withholding tax rate on dividends paid to foreign parent corporations.",
  'Labor Case-SENA': "Legal representation and counsel during the Single Entry Approach (SENA) mandatory conciliation and mediation proceedings before the DOLE or NLRC to reach amicable settlements."
};

const wrapAndAlignText = (text: string, firstLinePrefix: string, subsequentLinePrefix: string, maxLineLength: number = 90): string => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const prefix = lines.length === 0 ? firstLinePrefix : subsequentLinePrefix;
    const testLine = currentLine ? currentLine + ' ' + word : word;
    
    if (prefix.length + testLine.length > maxLineLength) {
      if (currentLine) {
        lines.push(prefix + currentLine);
        currentLine = word;
      } else {
        lines.push(prefix + word);
        currentLine = '';
      }
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    const prefix = lines.length === 0 ? firstLinePrefix : subsequentLinePrefix;
    lines.push(prefix + currentLine);
  }

  return lines.join('\n');
};

const getApiUrl = (path: string): string => {
  let origin = window.location.origin;
  
  if (origin === 'null' || !origin) {
    if (document.referrer) {
      try {
        origin = new URL(document.referrer).origin;
      } catch (e) {
        // Fallback to ancestorOrigins if available
        const ancestorOrigins = (window.location as any).ancestorOrigins;
        origin = (ancestorOrigins && ancestorOrigins[0]) || '';
      }
    } else {
      const ancestorOrigins = (window.location as any).ancestorOrigins;
      origin = (ancestorOrigins && ancestorOrigins[0]) || '';
    }
  }

  if (!origin || origin === 'null') {
    return path;
  }
  
  return `${origin.replace(/\/$/, '')}${path}`;
};

const getServicePlaceholder = (serviceName: string): string => {
  return serviceName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const extractDocId = (input: string): string => {
  const trimmed = input.trim();
  const docMatch = trimmed.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
  if (docMatch && docMatch[1]) {
    return docMatch[1];
  }
  const idMatch = trimmed.match(/([a-zA-Z0-9-_]{25,100})/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }
  return trimmed;
};

const DEFAULT_PROPOSAL_TEMPLATE = `======================================================================
PRELIMINARY LEGAL CONSULTATION PROPOSAL & CASE BRIEF
======================================================================
MATTER REFERENCE ID: {{MATTER_ID}}
DATE OF GENERATION: {{DATE}}
STATUS: PRE-CONSULTATION ASSIGNED BRIEF

----------------------------------------------------------------------
1. CLIENT PROFILE & MATTER OVERVIEW
----------------------------------------------------------------------
- Client Name: {{CLIENT_NAME}}
- Entity Classification: {{CLIENT_TYPE}}
- Registered Sector/Industry: {{INDUSTRY}}
- Principal/Residential Address: {{ADDRESS}}
- Jurisdictional Country of Origin: {{COUNTRY}}
- Number of Employees: {{EMPLOYEES}}

----------------------------------------------------------------------
2. PRIMARY CONTACT DETAILS
----------------------------------------------------------------------
- Contact Person: {{CONTACT_PERSON}}
- Designation: {{DESIGNATION}}
- Email Address: {{EMAIL}}
- Contact Number: {{CONTACT_NUMBER}}

----------------------------------------------------------------------
3. REQUESTED LEGAL SERVICES & SCOPE
----------------------------------------------------------------------
You have requested professional legal services regarding:
{{SERVICES}}

----------------------------------------------------------------------
4. RELEVANT CLIENT CONCERNS
----------------------------------------------------------------------
"{{CONCERNS}}"

----------------------------------------------------------------------
5. UPCOMING CONSULTATION DETAILS
----------------------------------------------------------------------
Your upcoming formal meeting has been registered with the following preferences:
- Mode/Platform: {{CONSULTATION_PREFERENCE}}
- Requested Date: {{CONSULTATION_DATE}}
- Preferred Time Window(s): {{PREFERRED_TIME}}

Sincerely,

Corporate Department
======================================================================`;

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const isAdmin = user?.email === 'andrewmanuel310@gmail.com' || user?.email === 'stlaf.legal08@gmail.com';

  const [showAdminSettings, setShowAdminSettings] = useState<boolean>(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [submittedDetails, setSubmittedDetails] = useState<{
    matterId: string;
    clientName: string;
    email: string;
    consultationPreference: string;
    consultationDate: string;
    preferredTime: string[];
    docUrl?: string;
    uploadedFileUrl?: string;
    templateErrorMsg?: string;
  } | null>(null);

  const [proposalTemplate, setProposalTemplate] = useState<string>(() => {
    const stored = localStorage.getItem('proposalTemplate');
    if (!stored || stored.includes('AI-GENERATED PRELIMINARY MATTERS') || stored.includes('LegalFlow Architect Group')) {
      localStorage.setItem('proposalTemplate', DEFAULT_PROPOSAL_TEMPLATE);
      return DEFAULT_PROPOSAL_TEMPLATE;
    }
    return stored;
  });

  const [spreadsheetId, setSpreadsheetId] = useState<string>(
    localStorage.getItem('matterSpreadsheetId') || ''
  );
  
  const [firmEmail, setFirmEmail] = useState<string>(
    localStorage.getItem('firmEmail') || 'stlaf.legal08@gmail.com'
  );

  const [lawyerName, setLawyerName] = useState<string>(
    localStorage.getItem('lawyerName') || ''
  );

  const [templateDocId, setTemplateDocId] = useState<string>(
    localStorage.getItem('templateDocId') || ''
  );

  const [templateVerificationStatus, setTemplateVerificationStatus] = useState<{
    type: 'idle' | 'verifying' | 'success' | 'error';
    message: string;
    details?: string;
  }>({ type: 'idle', message: '' });

  const handleVerifyTemplate = async () => {
    if (!templateDocId) {
      setTemplateVerificationStatus({
        type: 'error',
        message: 'Please enter a Template Google Doc ID or URL first.'
      });
      return;
    }

    setTemplateVerificationStatus({ type: 'verifying', message: 'Verifying Google Doc access...' });
    try {
      const extractedId = extractDocId(templateDocId);
      const metadata = await verifyDriveFileAccess(extractedId);
      
      if (metadata.mimeType && metadata.mimeType !== 'application/vnd.google-apps.document') {
        setTemplateVerificationStatus({
          type: 'error',
          message: 'Format Issue: Word File Detected!',
          details: `The document "${metadata.name || 'Untitled'}" is a Microsoft Word file (.docx). Google Docs API only supports editing native Google Doc files. You can convert it to a Google Doc in 5 seconds in Google Drive!`
        });
        return;
      }

      setTemplateVerificationStatus({
        type: 'success',
        message: `Successfully connected! Found Doc: "${metadata.name || 'Untitled Document'}"`
      });
    } catch (err: any) {
      setTemplateVerificationStatus({
        type: 'error',
        message: 'Access failed.',
        details: err.message || 'File not found or no permission'
      });
    }
  };

  const [showPlaceholderGuide, setShowPlaceholderGuide] = useState<boolean>(false);
  const [placeholderSearch, setPlaceholderSearch] = useState<string>('');

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setProposalTemplate(value);
    localStorage.setItem('proposalTemplate', value);
  };

  const [formData, setFormData] = useState({
    clientType: 'Corporate',
    clientName: '',
    industry: '',
    address: '',
    country: '',
    numberOfEmployees: '',
    contactPerson: '',
    designation: '',
    email: '',
    contactNumber: '',
    servicesSelected: [] as string[],
    consultationPreference: '',
    consultationDate: '',
    preferredTime: [] as string[],
    clientConcerns: '',
    howDidYouFindUs: '',
  });

  const [servicesSearch, setServicesSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'SEC & Corporate Governance': true,
  });

  const [currentStep, setCurrentStep] = useState(1);

  const toggleCategory = (catName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  const validateStep1 = () => {
    const step1Errors: Record<string, boolean> = {};
    if (!formData.clientType) step1Errors.clientType = true;
    if (!formData.clientName.trim()) step1Errors.clientName = true;
    if (!formData.address.trim()) step1Errors.address = true;
    if (!formData.contactPerson.trim()) step1Errors.contactPerson = true;
    if (!formData.designation) step1Errors.designation = true;
    if (!formData.email.trim()) step1Errors.email = true;
    if (!formData.contactNumber.trim()) step1Errors.contactNumber = true;

    setErrors(step1Errors);
    return Object.keys(step1Errors).length === 0;
  };

  const validateStep3 = () => {
    const step3Errors: Record<string, boolean> = {};
    if (!formData.consultationPreference) step3Errors.consultationPreference = true;
    if (!formData.consultationDate) step3Errors.consultationDate = true;
    if (!formData.howDidYouFindUs) step3Errors.howDidYouFindUs = true;

    setErrors(step3Errors);
    return Object.keys(step3Errors).length === 0;
  };

  const handleNextStep1 = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      setStatus({ type: 'idle', message: '' });
    } else {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
    }
  };

  const handleNextStep2 = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentStep(3);
    setStatus({ type: 'idle', message: '' });
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setStatus({ type: 'idle', message: '' });
    }
  };

  useEffect(() => {
    initAuth(
      (user) => {
        setUser(user);
        setNeedsAuth(false);
        if (user?.email === 'andrewmanuel310@gmail.com' || user?.email === 'stlaf.legal08@gmail.com') {
          if (!localStorage.getItem('matterSpreadsheetId')) {
            setShowAdminSettings(true);
          }
        } else {
          setShowAdminSettings(false);
        }
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
        setShowAdminSettings(false);
      }
    );
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const initializeSheet = async () => {
    setStatus({ type: 'loading', message: 'Creating new database spreadsheet...' });
    try {
      const sheet = await createSpreadsheet('Legal Intake Matters DB');
      setSpreadsheetId(sheet.spreadsheetId);
      localStorage.setItem('matterSpreadsheetId', sheet.spreadsheetId);
      
      // Add headers
      await appendToSheet(sheet.spreadsheetId, 'Sheet1', [
        'Timestamp', 
        'Matter ID', 
        'Client Type', 
        'Client Name', 
        'Industry', 
        'Principal/Residential Address', 
        'Country', 
        'Number of Employees', 
        'Contact Person', 
        'Designation', 
        'Email Address', 
        'Contact Number', 
        'Services Requested',
        'Consultation Preference', 
        'Consultation Date', 
        'Preferred Time Slot(s)', 
        'Client Concerns', 
        'How Did You Find Us',
        'Supporting Documents'
      ]);
      
      setStatus({ type: 'success', message: 'Spreadsheet created successfully.' });
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 3000);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to create spreadsheet' });
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'firmEmail') {
      setFirmEmail(value);
      localStorage.setItem('firmEmail', value);
    } else if (name === 'spreadsheetId') {
      setSpreadsheetId(value);
      localStorage.setItem('matterSpreadsheetId', value);
    } else if (name === 'templateDocId') {
      setTemplateDocId(value);
      localStorage.setItem('templateDocId', value);
    } else if (name === 'lawyerName') {
      setLawyerName(value);
      localStorage.setItem('lawyerName', value);
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'preferredTime') {
        setFormData((prev) => ({
          ...prev,
          preferredTime: checked
            ? [...prev.preferredTime, value]
            : prev.preferredTime.filter((t) => t !== value),
        }));
      } else if (name === 'servicesSelected') {
        setFormData((prev) => ({
          ...prev,
          servicesSelected: checked
            ? [...prev.servicesSelected, value]
            : prev.servicesSelected.filter((s) => s !== value),
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Clear validation error when field is updated
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: false }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};

    // Validate required fields
    if (!formData.clientType) newErrors.clientType = true;
    if (!formData.clientName.trim()) newErrors.clientName = true;
    if (!formData.address.trim()) newErrors.address = true;
    if (!formData.contactPerson.trim()) newErrors.contactPerson = true;
    if (!formData.designation) newErrors.designation = true;
    if (!formData.email.trim()) newErrors.email = true;
    if (!formData.contactNumber.trim()) newErrors.contactNumber = true;
    if (!formData.consultationPreference) newErrors.consultationPreference = true;
    if (!formData.consultationDate) newErrors.consultationDate = true;
    if (!formData.howDidYouFindUs) newErrors.howDidYouFindUs = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    if (!spreadsheetId) {
      setStatus({ type: 'error', message: 'Please set or create a Spreadsheet ID first.' });
      return;
    }
    if (!firmEmail) {
      setStatus({ type: 'error', message: 'Firm Email is required for direct proposals.' });
      return;
    }

    setStatus({ type: 'loading', message: 'Processing intake...' });

    try {
      const timestamp = Date.now();
      const matterId = `MATTER-${timestamp}`;
      const dateStr = new Date().toISOString();

      let uploadedFileUrl = '';
      let templateErrorMsgDuringSubmit = '';
      if (selectedFile) {
        try {
          setStatus({ type: 'loading', message: `Uploading ${selectedFile.name} to Google Drive...` });
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(selectedFile);
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]);
            };
            reader.onerror = (e) => reject(e);
          });

          const uploadRes = await uploadFileToDrive(
            selectedFile.name,
            selectedFile.type || 'application/octet-stream',
            base64
          );

          if (uploadRes && uploadRes.id) {
            uploadedFileUrl = `https://drive.google.com/file/d/${uploadRes.id}/view?usp=drivesdk`;
            try {
              await shareFileInDrive(uploadRes.id, firmEmail, 'reader');
            } catch (shareErr) {
              console.warn('Failed to share uploaded file with firm:', shareErr);
            }
          }
        } catch (uploadErr: any) {
          console.error('File upload failed:', uploadErr);
          setStatus({ type: 'error', message: `Warning: File upload failed (${uploadErr.message || 'unknown'}). Proceeding with intake...` });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      setStatus({ type: 'loading', message: 'Logging to CRM...' });
      
      // Stage 2: CRM Log
      await appendToSheet(spreadsheetId, 'Sheet1', [
        dateStr,
        matterId,
        formData.clientType,
        formData.clientName,
        formData.industry,
        formData.address,
        formData.country || 'Not Specified',
        formData.numberOfEmployees || 'Not Applicable',
        formData.contactPerson,
        formData.designation,
        formData.email,
        formData.contactNumber,
        formData.servicesSelected.join(', ') || 'None Selected',
        formData.consultationPreference,
        formData.consultationDate,
        formData.preferredTime.join(', ') || 'None Selected',
        formData.clientConcerns || 'No concerns specified',
        formData.howDidYouFindUs,
        uploadedFileUrl || 'None'
      ]);

      // Stage 3: Consultation Track (Default in place)
      setStatus({ type: 'loading', message: 'Sending consultation email...' });
      const subjectClient = `Consultation Booking Confirmation - ${formData.clientName}`;
      
      const servicesLabelStr = formData.servicesSelected.length > 0
        ? formData.servicesSelected.map(s => `  - ${s}`).join('\n')
        : '  - General Legal Consultation';

      const bodyClient = `Hello ${formData.contactPerson || formData.clientName},\n\nThank you for reaching out to us. We have successfully logged your intake application.\n\nHere are your scheduled consultation preferences:\n- Services Requested:\n${servicesLabelStr}\n- Consultation Preference: ${formData.consultationPreference}\n- Consultation Date: ${formData.consultationDate}\n- Requested Time Slots: ${formData.preferredTime.join(', ') || 'None specified'}\n\nReference Matter ID: ${matterId}\n\nOur team will review your details and contact you shortly to confirm the scheduled block.\n\nBest regards,\nLegal Team`;
      
      await sendEmail(formData.email, subjectClient, bodyClient);

      // Stage 4: Direct Proposal Track
      setStatus({ type: 'loading', message: 'Drafting legal proposal via AI...' });
      
      const response = await fetch(getApiUrl('/api/draft-proposal'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          matterId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate legal proposal draft');
      }

      const data = await response.json();
      
      // Stage 5: Google Docs Proposal Generation & Sharing
      const dateStrReadable = new Date().toLocaleDateString();
      const servicesStr = formData.servicesSelected.join(', ') || 'General Legal Consultation';
      const timeSlots = formData.preferredTime.join(', ') || 'None Selected';

      let filledDocText = proposalTemplate
        .replace(/{{MATTER_ID}}/g, matterId)
        .replace(/{{DATE}}/g, dateStrReadable)
        .replace(/{{CLIENT_NAME}}/g, formData.clientName)
        .replace(/{{CLIENT_TYPE}}/g, formData.clientType)
        .replace(/{{INDUSTRY}}/g, formData.industry || 'Not Specified')
        .replace(/{{ADDRESS}}/g, formData.address)
        .replace(/{{PRINCIPAL_ADDRESS}}/g, formData.address)
        .replace(/{{COUNTRY}}/g, formData.country || 'Not Specified')
        .replace(/{{EMPLOYEES}}/g, formData.numberOfEmployees || 'Not Applicable')
        .replace(/{{CONTACT_PERSON}}/g, formData.contactPerson)
        .replace(/{{DESIGNATION}}/g, formData.designation)
        .replace(/{{EMAIL}}/g, formData.email)
        .replace(/{{CONTACT_NUMBER}}/g, formData.contactNumber)
        .replace(/{{SERVICES}}/g, servicesStr)
        .replace(/{{CONCERNS}}/g, formData.clientConcerns || 'No concerns specified')
        .replace(/{{CONSULTATION_DATE}}/g, formData.consultationDate)
        .replace(/{{PREFERRED_TIME}}/g, timeSlots)
        .replace(/{{CONSULTATION_PREFERENCE}}/g, formData.consultationPreference)
        .replace(/{{AI_PROPOSAL}}/g, data.proposal);

      // Define active categories and phase numbers for dynamic ordering
      const activeCategories = SERVICES_CATEGORIES.filter(cat => 
        cat.services.some(s => formData.servicesSelected.includes(s))
      );

      const categoryPhaseNumbers: Record<string, number> = {};
      activeCategories.forEach((cat, idx) => {
        categoryPhaseNumbers[cat.name] = idx + 1;
      });

      // Replace Category placeholders
      const CATEGORY_PLACEHOLDERS: Record<string, string> = {
        'SEC & Corporate Governance': 'SERVICES_SEC_CORPORATE',
        'Compliance & Regulatory': 'SERVICES_COMPLIANCE',
        'Government Registrations & Permits': 'SERVICES_GOVERNMENT',
        'Business Closure': 'SERVICES_CLOSURE',
        'Property & Estate': 'SERVICES_PROPERTY_ESTATE',
        'Intellectual Property': 'SERVICES_INTELLECTUAL_PROPERTY',
        'Taxation & Labor Cases': 'SERVICES_TAXATION_LABOR',
      };

      SERVICES_CATEGORIES.forEach(cat => {
        const key = CATEGORY_PLACEHOLDERS[cat.name];
        if (key) {
          const selectedInCat = cat.services.filter(s => formData.servicesSelected.includes(s));
          let replacement = '';
          if (selectedInCat.length > 0) {
            const phaseNum = categoryPhaseNumbers[cat.name];
            const phaseRoman = getRomanNumeral(phaseNum);
            replacement = `PHASE ${phaseRoman}. ${cat.name}\n` + 
              selectedInCat.map((s, index) => {
                const desc = SERVICE_PREGENERATED_DESCRIPTIONS[s] || 'No description available.';
                const firstLinePrefix = `       ${index + 1}.  `;
                const subsequentLinePrefix = " ".repeat(firstLinePrefix.length);
                return wrapAndAlignText(desc, firstLinePrefix, subsequentLinePrefix);
              }).join('\n\n');
          }
          const regex = new RegExp(`{{${key}}}`, 'g');
          filledDocText = filledDocText.replace(regex, replacement);
        }
      });

      // Replace Individual Service placeholders
      SERVICES_CATEGORIES.forEach(cat => {
        cat.services.forEach(s => {
          const isSelected = formData.servicesSelected.includes(s);
          const rawKey = getServicePlaceholder(s);
          
          const serviceRegex = new RegExp(`{{SERVICE_${rawKey}}}`, 'g');
          filledDocText = filledDocText.replace(serviceRegex, isSelected ? s : '');
          
          const checkRegex = new RegExp(`{{CHECK_${rawKey}}}`, 'g');
          filledDocText = filledDocText.replace(checkRegex, isSelected ? '[✓]' : '[ ]');

          const hasRegex = new RegExp(`{{HAS_${rawKey}}}`, 'g');
          filledDocText = filledDocText.replace(hasRegex, isSelected ? 'YES' : 'NO');
        });
      });

      // Clean up multiple consecutive newlines (3 or more) to keep formatting consistent
      filledDocText = filledDocText.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').trim();

      let docUrl = '';
      try {
        const docTitle = `Draft Proposal - ${formData.clientName} (${matterId})`;
        const cleanedTemplateId = templateDocId ? extractDocId(templateDocId) : '';

        if (cleanedTemplateId) {
          setStatus({ type: 'loading', message: 'Cloning Google Doc template...' });
          try {
            const copiedFile = await copyDriveFile(cleanedTemplateId, docTitle);
            
            if (copiedFile && copiedFile.id) {
              setStatus({ type: 'loading', message: 'Replacing template placeholders...' });
              
              // Build the replacements list
              const replacements: { placeholder: string; value: string }[] = [
                { placeholder: '{{MATTER_ID}}', value: matterId },
                { placeholder: '{{DATE}}', value: dateStrReadable },
                { placeholder: '{{CLIENT_NAME}}', value: formData.clientName },
                { placeholder: '{{CLIENT_TYPE}}', value: formData.clientType },
                { placeholder: '{{INDUSTRY}}', value: formData.industry || 'Not Specified' },
                { placeholder: '{{ADDRESS}}', value: formData.address },
                { placeholder: '{{PRINCIPAL_ADDRESS}}', value: formData.address },
                { placeholder: '{{COUNTRY}}', value: formData.country || 'Not Specified' },
                { placeholder: '{{EMPLOYEES}}', value: formData.numberOfEmployees || 'Not Applicable' },
                { placeholder: '{{CONTACT_PERSON}}', value: formData.contactPerson },
                { placeholder: '{{DESIGNATION}}', value: formData.designation },
                { placeholder: '{{EMAIL}}', value: formData.email },
                { placeholder: '{{CONTACT_NUMBER}}', value: formData.contactNumber },
                { placeholder: '{{SERVICES}}', value: servicesStr },
                { placeholder: '{{CONCERNS}}', value: formData.clientConcerns || 'No concerns specified' },
                { placeholder: '{{CONSULTATION_DATE}}', value: formData.consultationDate },
                { placeholder: '{{PREFERRED_TIME}}', value: timeSlots },
                { placeholder: '{{CONSULTATION_PREFERENCE}}', value: formData.consultationPreference },
                { placeholder: '{{AI_PROPOSAL}}', value: data.proposal }
              ];

              // Add Category list replacements
              SERVICES_CATEGORIES.forEach(cat => {
                const key = CATEGORY_PLACEHOLDERS[cat.name];
                if (key) {
                  const selectedInCat = cat.services.filter(s => formData.servicesSelected.includes(s));
                  let replacementVal = '';
                  if (selectedInCat.length > 0) {
                    const phaseNum = categoryPhaseNumbers[cat.name];
                    const phaseRoman = getRomanNumeral(phaseNum);
                    replacementVal = `PHASE ${phaseRoman}. ${cat.name}\n` + 
                      selectedInCat.map((s, index) => {
                        const desc = SERVICE_PREGENERATED_DESCRIPTIONS[s] || 'No description available.';
                        const firstLinePrefix = `       ${index + 1}.  `;
                        const subsequentLinePrefix = " ".repeat(firstLinePrefix.length);
                        return wrapAndAlignText(desc, firstLinePrefix, subsequentLinePrefix);
                      }).join('\n\n');
                  }
                  replacements.push({ placeholder: `{{${key}}}`, value: replacementVal });
                }
              });

              // Add Individual Service replacements
              SERVICES_CATEGORIES.forEach(cat => {
                cat.services.forEach(s => {
                  const isSelected = formData.servicesSelected.includes(s);
                  const rawKey = getServicePlaceholder(s);
                  
                  replacements.push({ placeholder: `{{SERVICE_${rawKey}}}`, value: isSelected ? s : '' });
                  replacements.push({ placeholder: `{{CHECK_${rawKey}}}`, value: isSelected ? '[✓]' : '[ ]' });
                  replacements.push({ placeholder: `{{HAS_${rawKey}}}`, value: isSelected ? 'YES' : 'NO' });
                });
              });

              // Turn into batch update requests
              const requests = replacements.map(r => ({
                replaceAllText: {
                  containsText: {
                    text: r.placeholder,
                    matchCase: true
                  },
                  replaceText: r.value || ''
                }
              }));

              await batchUpdateDocument(copiedFile.id, requests);
              docUrl = `https://docs.google.com/document/d/${copiedFile.id}/edit`;
              
              try {
                setStatus({ type: 'loading', message: 'Sharing Google Doc with firm...' });
                await shareFileInDrive(copiedFile.id, firmEmail, 'writer');
              } catch (shareErr) {
                console.warn('Failed to share doc with firm. Proceeding with email.', shareErr);
              }
            }
          } catch (cloneErr: any) {
            console.warn('Template cloning or replacement failed. Falling back to fresh document:', cloneErr);
            templateErrorMsgDuringSubmit = cloneErr.message || String(cloneErr);
            // Fallback: create fresh document instead
            setStatus({ type: 'loading', message: 'Cloning failed. Generating fresh Google Doc...' });
            const docData = await createDocument(docTitle, filledDocText);
            if (docData && docData.documentId) {
              docUrl = `https://docs.google.com/document/d/${docData.documentId}/edit`;
              try {
                setStatus({ type: 'loading', message: 'Sharing Google Doc with firm...' });
                await shareFileInDrive(docData.documentId, firmEmail, 'writer');
              } catch (shareErr) {
                console.warn('Failed to share doc with firm. Proceeding with email.', shareErr);
              }
            }
          }
        } else {
          setStatus({ type: 'loading', message: 'Generating proposal Google Doc...' });
          const docData = await createDocument(docTitle, filledDocText);
          if (docData && docData.documentId) {
            docUrl = `https://docs.google.com/document/d/${docData.documentId}/edit`;
            try {
              setStatus({ type: 'loading', message: 'Sharing Google Doc with firm...' });
              await shareFileInDrive(docData.documentId, firmEmail, 'writer');
            } catch (shareErr) {
              console.warn('Failed to share doc with firm. Proceeding with email.', shareErr);
            }
          }
        }
      } catch (docErr: any) {
        console.error('Google Doc creation/cloning failed:', docErr);
      }

      setStatus({ type: 'loading', message: 'Sending proposal to firm inbox...' });
      const subjectFirm = `ACTION REQUIRED: Draft Proposal Ready - ${formData.clientName}`;
      
      const salutation = lawyerName.trim() ? `Dear ${lawyerName.trim()},` : 'Dear Legal Team,';
      let emailBody = '';
      if (docUrl) {
        emailBody = `${salutation}

A new client intake form has been submitted and registered.

Client: ${formData.clientName} (${formData.clientType})

We have successfully generated a formal legal proposal Google Doc in your Drive and shared it with you.

Access the Google Doc here:
${docUrl}

Below is the formatted content of the proposal for your immediate reference:

${filledDocText}

Sincerely,
STLAF Intake Automation System`;
      } else {
        emailBody = `${salutation}

A new client intake form has been submitted and registered.

Client: ${formData.clientName} (${formData.clientType})

(Note: Google Doc creation failed, but here is the drafted proposal content for your reference)

Below is the formatted content of the proposal for your immediate reference:

${filledDocText}

Sincerely,
STLAF Intake Automation System`;
      }

      await sendEmail(firmEmail, subjectFirm, emailBody);
      setStatus({ 
        type: 'success', 
        message: 'Intake logged! Google Doc proposal generated, shared, and confirmation email sent.' 
      });

      // Save details for thank you page
      setSubmittedDetails({
        matterId,
        clientName: formData.clientName,
        email: formData.email,
        consultationPreference: formData.consultationPreference,
        consultationDate: formData.consultationDate,
        preferredTime: [...formData.preferredTime],
        docUrl: docUrl || undefined,
        uploadedFileUrl: uploadedFileUrl || undefined,
        templateErrorMsg: templateErrorMsgDuringSubmit || undefined
      });

      // Clear Form on Success
      setFormData({
        clientType: 'Corporate',
        clientName: '',
        industry: '',
        address: '',
        country: '',
        numberOfEmployees: '',
        contactPerson: '',
        designation: '',
        email: '',
        contactNumber: '',
        servicesSelected: [],
        consultationPreference: '',
        consultationDate: '',
        preferredTime: [],
        clientConcerns: '',
        howDidYouFindUs: '',
      });
      setSelectedFile(null);
      setErrors({});
      setCurrentStep(1);

    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'An error occurred during processing.' });
    }
  };

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-900">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">STLAF | Clients Portal</h1>
          <p className="text-slate-500 mb-8">Sign in with Google to enable Workspace integrations (Sheets & Gmail).</p>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center space-x-3 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 py-3 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>Sign in with Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  const inputClass = (fieldName: string) => `
    w-full bg-white border p-2.5 rounded text-sm outline-none transition-all duration-200
    ${errors[fieldName] 
      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500' 
      : 'border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]'
    }
  `;

  return (
    <div className="min-h-screen h-full bg-slate-50 font-sans text-slate-900 flex flex-col overflow-x-hidden">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-700 sticky top-0 z-10 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-amber-600 rounded flex items-center justify-center font-bold text-lg text-white">S</div>
          <h1 className="text-xl font-semibold tracking-tight">STLAF <span className="text-slate-400 font-light text-sm italic">| Clients Portal</span></h1>
        </div>
        <div className="flex items-center space-x-4 sm:space-x-6 text-xs uppercase tracking-widest text-slate-400">
          {isAdmin && (
            <button
              onClick={() => setShowAdminSettings(prev => !prev)}
              className={`flex items-center px-3 py-1.5 rounded transition-all duration-200 ${showAdminSettings ? 'bg-slate-800 text-white border border-slate-700 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title="Toggle Admin Configuration"
            >
              <Settings className="w-4 h-4 mr-1.5" />
              <span>Admin Config</span>
            </button>
          )}
          <div className="hidden sm:flex items-center">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
            {user.email}
            <span className="ml-2 px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px] font-bold text-slate-300">
              {isAdmin ? 'ADMIN' : 'USER'}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center text-slate-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 ml-2" />
          </button>
        </div>
      </header>
 
      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 w-full max-w-[1400px] mx-auto">
        
        {/* Settings Panel */}
        <div className={`w-full md:w-1/3 flex flex-col gap-4 ${isAdmin && showAdminSettings ? '' : 'hidden'}`}>
          <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col">
            <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-4">Workflow Configuration</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">CRM Database (Google Sheets ID)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="spreadsheetId"
                    value={spreadsheetId}
                    onChange={handleSettingsChange}
                    placeholder="Enter ID or create new..."
                    className="flex-1 bg-slate-50 rounded border border-slate-200 p-2.5 text-sm focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none"
                  />
                  <button
                    onClick={initializeSheet}
                    disabled={status.type === 'loading'}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded text-sm font-medium transition-colors border border-slate-200"
                  >
                    Create
                  </button>
                </div>
              </div>
 
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Firm Inbox (For Direct Proposals)</label>
                <input
                  type="email"
                  name="firmEmail"
                  value={firmEmail}
                  onChange={handleSettingsChange}
                  placeholder="lawyer@firm.com"
                  className="w-full bg-slate-50 rounded border border-slate-200 p-2.5 text-sm focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Assigned Lawyer Name</label>
                <input
                  type="text"
                  name="lawyerName"
                  value={lawyerName}
                  onChange={handleSettingsChange}
                  placeholder="e.g. Atty. Sadsad / Atty. Tamesis"
                  className="w-full bg-slate-50 rounded border border-slate-200 p-2.5 text-sm focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none"
                />
                <p className="text-[9px] text-slate-400 leading-normal">
                  If set, firm email notifications will address this lawyer specifically (e.g. "Dear Atty. Sadsad,") instead of "Dear Legal Team,".
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Template Google Doc (ID or URL)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    name="templateDocId"
                    value={templateDocId}
                    onChange={handleSettingsChange}
                    placeholder="Paste existing Google Doc link or ID..."
                    className="flex-1 bg-slate-50 rounded border border-slate-200 p-2.5 text-sm focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyTemplate}
                    disabled={templateVerificationStatus.type === 'verifying'}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2.5 rounded text-sm font-medium transition-colors border border-slate-200 disabled:opacity-50"
                  >
                    {templateVerificationStatus.type === 'verifying' ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 leading-normal">
                  If set, we will automatically clone this Google Doc and replace placeholders inside it, preserving your document's beautiful layout, branding, logos, and custom typography perfectly!
                </p>

                {templateVerificationStatus.type !== 'idle' && (
                  <div className={`mt-2 p-2.5 rounded text-xs border ${
                    templateVerificationStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                    templateVerificationStatus.type === 'verifying' ? 'bg-blue-50 border-blue-200 text-blue-800' :
                    'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <div className="font-semibold flex items-center">
                      {templateVerificationStatus.type === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 flex-shrink-0" />}
                      {templateVerificationStatus.message}
                    </div>
                    {templateVerificationStatus.details && (
                      <div className="text-[10px] text-red-600 mt-1 font-mono break-all">
                        Error: {templateVerificationStatus.details}
                      </div>
                    )}
                    {templateVerificationStatus.type === 'error' && (
                      <div className="mt-2 text-[10px] text-slate-600 space-y-1.5 border-t border-red-100 pt-1.5 leading-relaxed">
                        <span className="font-bold block text-red-700">Troubleshooting Steps:</span>
                        {templateVerificationStatus.message.includes('Word File') ? (
                          <div className="space-y-1 text-slate-700 bg-amber-50/50 p-2 rounded border border-amber-100">
                            <span className="font-bold text-amber-800">To convert your Word Document (.docx) to a Google Doc:</span>
                            <p>1. Open the file in Google Drive.</p>
                            <p>2. Click on <span className="font-semibold">File</span> in the top-left menu.</p>
                            <p>3. Choose <span className="font-semibold">"Save as Google Docs"</span>.</p>
                            <p>4. This creates a brand new native Google Doc version in your Drive. Paste the URL of that <span className="font-bold">new Google Doc</span> here!</p>
                          </div>
                        ) : (
                          <>
                            <p>1. Ensure your template Google Doc is shared as <span className="font-semibold">"Anyone with the link can view"</span>.</p>
                            <p>2. Check that the logged-in Google Account ({user.email}) has view access to this document.</p>
                            <p>3. If you just authorized the scopes, try logging out and logging back in again to refresh the access token permissions.</p>
                            <p>4. If the document is a Word document (.docx), double-click it in Drive, select <span className="font-semibold">File &gt; Save as Google Docs</span>, and use the new document's URL instead.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
 
          {/* Proposal Template Section */}
          <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="w-4 h-4 text-slate-500" />
              <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Proposal Template Editor</h2>
            </div>
            <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
              Use placeholders like <code className="bg-slate-100 px-1 rounded text-slate-600 font-mono text-[10px]">&#123;&#123;MATTER_ID&#125;&#125;</code>, <code className="bg-slate-100 px-1 rounded text-slate-600 font-mono text-[10px]">&#123;&#123;CLIENT_NAME&#125;&#125;</code>, <code className="bg-slate-100 px-1 rounded text-slate-600 font-mono text-[10px]">&#123;&#123;SERVICES&#125;&#125;</code>, or <code className="bg-slate-100 px-1 rounded text-slate-600 font-mono text-[10px]">&#123;&#123;AI_PROPOSAL&#125;&#125;</code> to format the Google Doc.
            </p>
            <textarea
              value={proposalTemplate}
              onChange={handleTemplateChange}
              rows={12}
              className="w-full bg-slate-50 rounded border border-slate-200 p-2 text-xs font-mono focus:ring-[#7C3AED] focus:border-[#7C3AED] outline-none resize-y"
              placeholder="Paste custom template..."
            />
          </section>

          {/* Template Placeholder Guide */}
          <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col">
            <div 
              className="flex items-center justify-between cursor-pointer select-none" 
              onClick={() => setShowPlaceholderGuide(!showPlaceholderGuide)}
            >
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-[#7C3AED]" />
                <h2 className="text-sm font-bold uppercase text-slate-700 tracking-wider">Template Placeholders</h2>
              </div>
              {showPlaceholderGuide ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
            
            {showPlaceholderGuide && (
              <div className="space-y-4 text-xs mt-3 pt-3 border-t border-slate-100">
                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">General Client Info</h3>
                  <p className="text-[10px] text-slate-400 mb-2">Click any placeholder to copy it to clipboard.</p>
                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px] text-slate-600">
                    <button 
                      type="button" 
                      onClick={() => navigator.clipboard.writeText('{{MATTER_ID}}')} 
                      className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left transition-all active:scale-95 truncate"
                      title="Click to copy {{MATTER_ID}}"
                    >
                      &#123;&#123;MATTER_ID&#125;&#125;
                    </button>
                    <button 
                      type="button" 
                      onClick={() => navigator.clipboard.writeText('{{CLIENT_NAME}}')} 
                      className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left transition-all active:scale-95 truncate"
                      title="Click to copy {{CLIENT_NAME}}"
                    >
                      &#123;&#123;CLIENT_NAME&#125;&#125;
                    </button>
                    <button 
                      type="button" 
                      onClick={() => navigator.clipboard.writeText('{{PRINCIPAL_ADDRESS}}')} 
                      className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left transition-all active:scale-95 truncate col-span-2 text-[#7C3AED] font-semibold"
                      title="Click to copy {{PRINCIPAL_ADDRESS}}"
                    >
                      &#123;&#123;PRINCIPAL_ADDRESS&#125;&#125;
                    </button>
                    <button 
                      type="button" 
                      onClick={() => navigator.clipboard.writeText('{{ADDRESS}}')} 
                      className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left transition-all active:scale-95 truncate"
                      title="Click to copy {{ADDRESS}}"
                    >
                      &#123;&#123;ADDRESS&#125;&#125;
                    </button>
                    <button 
                      type="button" 
                      onClick={() => navigator.clipboard.writeText('{{CONTACT_PERSON}}')} 
                      className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left transition-all active:scale-95 truncate"
                      title="Click to copy {{CONTACT_PERSON}}"
                    >
                      &#123;&#123;CONTACT_PERSON&#125;&#125;
                    </button>
                    <button 
                      type="button" 
                      onClick={() => navigator.clipboard.writeText('{{EMAIL}}')} 
                      className="bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left transition-all active:scale-95 truncate"
                      title="Click to copy {{EMAIL}}"
                    >
                      &#123;&#123;EMAIL&#125;&#125;
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Service Categories (Phase Lists)</h3>
                  <p className="text-[10px] text-slate-400 mb-1.5">Inserts the formatted Phase Title (e.g. <strong>PHASE I. SEC &amp; Corporate Governance</strong>) along with a beautifully structured, numbered list of professional descriptions of each checked service in that category (or blank if none are selected).</p>
                  <div className="space-y-1 font-mono text-[9px] text-slate-600">
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText('{{SERVICES_SEC_CORPORATE}}')} 
                      className="w-full bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left flex justify-between items-center transition-all active:scale-95"
                    >
                      <span>SEC & Corp Gov:</span>
                      <span className="text-[#7C3AED] font-semibold">&#123;&#123;SERVICES_SEC_CORPORATE&#125;&#125;</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText('{{SERVICES_COMPLIANCE}}')} 
                      className="w-full bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left flex justify-between items-center transition-all active:scale-95"
                    >
                      <span>Compliance & Reg:</span>
                      <span className="text-[#7C3AED] font-semibold">&#123;&#123;SERVICES_COMPLIANCE&#125;&#125;</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText('{{SERVICES_GOVERNMENT}}')} 
                      className="w-full bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left flex justify-between items-center transition-all active:scale-95"
                    >
                      <span>Gov Reg & Permits:</span>
                      <span className="text-[#7C3AED] font-semibold">&#123;&#123;SERVICES_GOVERNMENT&#125;&#125;</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText('{{SERVICES_CLOSURE}}')} 
                      className="w-full bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left flex justify-between items-center transition-all active:scale-95"
                    >
                      <span>Business Closure:</span>
                      <span className="text-[#7C3AED] font-semibold">&#123;&#123;SERVICES_CLOSURE&#125;&#125;</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText('{{SERVICES_PROPERTY_ESTATE}}')} 
                      className="w-full bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left flex justify-between items-center transition-all active:scale-95"
                    >
                      <span>Property & Estate:</span>
                      <span className="text-[#7C3AED] font-semibold">&#123;&#123;SERVICES_PROPERTY_ESTATE&#125;&#125;</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText('{{SERVICES_INTELLECTUAL_PROPERTY}}')} 
                      className="w-full bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left flex justify-between items-center transition-all active:scale-95"
                    >
                      <span>Intellectual Property:</span>
                      <span className="text-[#7C3AED] font-semibold">&#123;&#123;SERVICES_INTELLECTUAL_PROPERTY&#125;&#125;</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => navigator.clipboard.writeText('{{SERVICES_TAXATION_LABOR}}')} 
                      className="w-full bg-slate-50 hover:bg-slate-100 p-1.5 rounded border border-slate-200 text-left flex justify-between items-center transition-all active:scale-95"
                    >
                      <span>Taxation & Labor:</span>
                      <span className="text-[#7C3AED] font-semibold">&#123;&#123;SERVICES_TAXATION_LABOR&#125;&#125;</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-700 mb-1">Individual Service Placeholders</h3>
                  <p className="text-[10px] text-slate-400 mb-2">Search for any service to copy its individual placeholders.</p>
                  <input
                    type="text"
                    value={placeholderSearch}
                    onChange={(e) => setPlaceholderSearch(e.target.value)}
                    placeholder="Search services (e.g., DPA, SEC)..."
                    className="w-full bg-slate-50 rounded border border-slate-200 p-1.5 text-xs mb-2 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-100 rounded p-1">
                    {ALL_SERVICES_LIST
                      .filter(s => s.toLowerCase().includes(placeholderSearch.toLowerCase()))
                      .map(s => {
                        const key = getServicePlaceholder(s);
                        return (
                          <div key={s} className="bg-slate-50 p-1.5 rounded border border-slate-200 text-[10px] space-y-1">
                            <span className="font-medium text-slate-700 block truncate" title={s}>{s}</span>
                            <div className="grid grid-cols-1 gap-1 font-mono text-[9px]">
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(`{{SERVICE_${key}}}`)}
                                className="flex justify-between items-center bg-white border border-slate-150 p-1 rounded text-[#7C3AED] hover:bg-slate-100 text-left active:scale-[0.98] transition-all"
                                title="Copies service text only when selected"
                              >
                                <span>&#123;&#123;SERVICE_{key}&#125;&#125;</span>
                                <span className="text-[8px] text-slate-400">Copy Name</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(`{{CHECK_${key}}}`)}
                                className="flex justify-between items-center bg-white border border-slate-150 p-1 rounded text-slate-700 hover:bg-slate-100 text-left active:scale-[0.98] transition-all"
                                title="Copies checkbox status [✓] or [ ]"
                              >
                                <span>&#123;&#123;CHECK_{key}&#125;&#125;</span>
                                <span className="text-[8px] text-slate-400">Copy Checkbox</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </section>
          
          {/* Status Notifications when sidebar is visible */}
          {status.type !== 'idle' && (
            <div className={`rounded p-4 flex items-start space-x-3 text-sm border ${
              status.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {status.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin mt-0.5 flex-shrink-0" />}
              {status.type === 'error' && <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              {status.type === 'success' && <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              <span className="font-medium">{status.message}</span>
            </div>
          )}
        </div>
 
        {/* Intake Form */}
        <div className={`w-full flex flex-col gap-4 ${isAdmin && showAdminSettings ? 'md:w-2/3' : 'max-w-4xl mx-auto w-full'}`}>
          {/* Status Notifications when sidebar is hidden */}
          {!(isAdmin && showAdminSettings) && status.type !== 'idle' && (
            <div className={`rounded p-4 flex items-start space-x-3 text-sm border ${
              status.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
              status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {status.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin mt-0.5 flex-shrink-0" />}
              {status.type === 'error' && <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              {status.type === 'success' && <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />}
              <span className="font-medium">{status.message}</span>
            </div>
          )}

          <section className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm h-full flex flex-col">
            {submittedDetails ? (
              <div className="flex flex-col items-center justify-center text-center py-8 px-4 max-w-2xl mx-auto space-y-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 animate-bounce" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Thank You! Your Intake is Logged</h2>
                  <p className="text-slate-500 text-sm mt-2">
                    We have successfully registered your case matter and scheduled your preliminary consultation preferences.
                  </p>
                </div>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-4 shadow-xs">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider border-b border-slate-200 pb-2">
                    Matter Registration Summary
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block font-medium uppercase text-[9px]">Matter Reference ID</span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-150 px-1.5 py-0.5 rounded text-[11px] block mt-1 w-max border border-slate-200">
                        {submittedDetails.matterId}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium uppercase text-[9px]">Client Name</span>
                      <span className="font-semibold text-slate-900 mt-1 block">{submittedDetails.clientName}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium uppercase text-[9px]">Consultation Preference</span>
                      <span className="font-medium text-slate-900 mt-1 block">{submittedDetails.consultationPreference}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block font-medium uppercase text-[9px]">Scheduled Consultation Date</span>
                      <span className="font-medium text-slate-900 mt-1 block">{submittedDetails.consultationDate}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block font-medium uppercase text-[9px]">Preferred Time Slot(s)</span>
                      <span className="font-medium text-slate-900 mt-1 block">
                        {submittedDetails.preferredTime.join(', ') || 'None selected'}
                      </span>
                    </div>

                    {submittedDetails.docUrl && (
                      <div className="sm:col-span-2 pt-3 border-t border-slate-200">
                        <span className="text-slate-400 block font-medium uppercase text-[9px]">Generated Proposal (Google Doc)</span>
                        <a 
                          href={submittedDetails.docUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#7C3AED] hover:text-[#6D28D9] font-semibold flex items-center mt-1 text-xs"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" />
                          Open Google Doc Proposal ↗
                        </a>
                      </div>
                    )}

                    {submittedDetails.uploadedFileUrl && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                        <span className="text-slate-400 block font-medium uppercase text-[9px]">Uploaded Support File</span>
                        <a 
                          href={submittedDetails.uploadedFileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[#7C3AED] hover:text-[#6D28D9] font-semibold flex items-center mt-1 text-xs"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          View Supporting Document in Drive / Sheets ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {submittedDetails.templateErrorMsg && (
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-5 text-left space-y-3">
                    <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>Template Format Issue (Word Document Detected)</span>
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      We found your template document, but cloning or placeholders replacement failed because the file is stored in a <span className="font-bold">Microsoft Word/Office format (.docx)</span> in Google Drive. The Google Docs API only supports editing native Google Doc formats.
                    </p>
                    <div className="text-xs text-amber-900 bg-amber-100/50 p-3 rounded-lg border border-amber-200/60 leading-relaxed">
                      <span className="font-bold block text-[11px] mb-1">How to convert your Word Doc (.docx) to a native Google Doc:</span>
                      <ol className="list-decimal pl-4 space-y-1">
                        <li>Open your <span className="font-semibold">template document</span> in Google Drive (double-click it).</li>
                        <li>In the top menu, click <span className="font-semibold">File</span>.</li>
                        <li>Click <span className="font-semibold">Save as Google Docs</span>.</li>
                        <li>Google Drive will create a brand new, native Google Doc version of your file in the same folder.</li>
                        <li>Copy the ID or URL of that <span className="font-semibold">new native Google Doc</span>, paste it in Admin settings, and you're good to go!</li>
                      </ol>
                    </div>
                    <p className="text-[11px] text-amber-700/80 italic">
                      Note: To ensure your intake succeeded today, we automatically fell back to generating a beautiful, clean, standard Google Doc proposal.
                    </p>
                  </div>
                )}

                <div className="text-xs text-slate-400 max-w-md leading-relaxed">
                  A formal consultation confirmation receipt has been sent to <span className="font-semibold text-slate-600">{submittedDetails.email}</span>. A custom-drafted preliminary legal proposal was dispatched to the firm inbox.
                </div>

                <button
                  type="button"
                  onClick={() => setSubmittedDetails(null)}
                  className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-2.5 px-8 rounded text-xs shadow-md transition-all uppercase tracking-wider"
                >
                  Submit Another Consultation Profile
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-5 gap-2">
                  <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Intake Form — Step {currentStep} of 3</h2>
                  <div className="text-[11px] text-slate-400 font-medium">Ref ID: Pending Submit</div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-50 p-3 rounded border border-slate-100">
                  <div className="flex flex-col space-y-1">
                    <div className={`h-1.5 rounded-full transition-colors duration-300 ${currentStep >= 1 ? 'bg-[#7C3AED]' : 'bg-slate-200'}`} />
                    <span className={`text-[10px] font-bold uppercase ${currentStep === 1 ? 'text-[#7C3AED]' : 'text-slate-400'}`}>1. Client Info</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className={`h-1.5 rounded-full transition-colors duration-300 ${currentStep >= 2 ? 'bg-[#7C3AED]' : 'bg-slate-200'}`} />
                    <span className={`text-[10px] font-bold uppercase ${currentStep === 2 ? 'text-[#7C3AED]' : 'text-slate-400'}`}>2. Services Wanted</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className={`h-1.5 rounded-full transition-colors duration-300 ${currentStep >= 3 ? 'bg-[#7C3AED]' : 'bg-slate-200'}`} />
                    <span className={`text-[10px] font-bold uppercase ${currentStep === 3 ? 'text-[#7C3AED]' : 'text-slate-400'}`}>3. Details & Booking</span>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
              {currentStep === 1 && (
                <div className="space-y-5">
                  {/* CLIENT TYPE */}
              <div className="space-y-1.5">
                <label htmlFor="clientType" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  CLIENT TYPE <span className="text-red-500">*</span>
                </label>
                <select
                  id="clientType"
                  name="clientType"
                  value={formData.clientType}
                  onChange={handleFormChange}
                  className={inputClass('clientType')}
                >
                  <option value="">Select an option ...</option>
                  {CLIENT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.clientType && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>

              {/* CLIENT NAME */}
              <div className="space-y-1.5">
                <label htmlFor="clientName" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  CLIENT NAME <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="clientName"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleFormChange}
                  placeholder="Enter client name"
                  className={inputClass('clientName')}
                />
                {errors.clientName && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>

              {/* INDUSTRY (if applicable) */}
              <div className="space-y-1.5">
                <label htmlFor="industry" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  INDUSTRY (if applicable)
                </label>
                <select
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleFormChange}
                  className={inputClass('industry')}
                >
                  <option value="">Select an option ...</option>
                  {INDUSTRIES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* PRINCIPAL/RESIDENTIAL ADDRESS */}
              <div className="space-y-1.5">
                <label htmlFor="address" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  PRINCIPAL/RESIDENTIAL ADDRESS <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  placeholder="Enter complete address"
                  className={inputClass('address')}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>

              {/* COUNTRY */}
              <div className="space-y-1.5">
                <label htmlFor="country" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  COUNTRY
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleFormChange}
                  className={inputClass('country')}
                >
                  <option value="">Select an option ...</option>
                  {COUNTRIES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* NUMBER OF EMPLOYEES (if applicable) */}
              <div className="space-y-1.5">
                <label htmlFor="numberOfEmployees" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  NUMBER OF EMPLOYEES (if applicable)
                </label>
                <select
                  id="numberOfEmployees"
                  name="numberOfEmployees"
                  value={formData.numberOfEmployees}
                  onChange={handleFormChange}
                  className={inputClass('numberOfEmployees')}
                >
                  <option value="">Select an option ...</option>
                  {EMPLOYEES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* CONTACT PERSON */}
              <div className="space-y-1.5">
                <label htmlFor="contactPerson" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  CONTACT PERSON <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contactPerson"
                  name="contactPerson"
                  rows={2}
                  value={formData.contactPerson}
                  onChange={handleFormChange}
                  placeholder="Name of contact person"
                  className={inputClass('contactPerson')}
                />
                {errors.contactPerson && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>

              {/* DESIGNATION */}
              <div className="space-y-1.5">
                <label htmlFor="designation" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  DESIGNATION <span className="text-red-500">*</span>
                </label>
                <select
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleFormChange}
                  className={inputClass('designation')}
                >
                  <option value="">Select an option ...</option>
                  {DESIGNATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.designation && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>

              {/* EMAIL ADDRESS */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  EMAIL ADDRESS <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="client@example.com"
                  className={inputClass('email')}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>

              {/* CONTACT NUMBER */}
              <div className="space-y-1.5">
                <label htmlFor="contactNumber" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  CONTACT NUMBER <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleFormChange}
                  placeholder="+1-234-567-8900"
                  className={inputClass('contactNumber')}
                />
                {errors.contactNumber && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>
            </div>
          )}

            {currentStep === 2 && (
              <div className="space-y-5">
                {/* SERVICES REQUESTED (CHECKBOX LIST WITH SEARCH & COLLAPSIBLE CATEGORIES) */}
              <div className="space-y-2 bg-slate-50 p-4 rounded border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#7C3AED]" />
                      SERVICES REQUESTED
                    </label>
                    <p className="text-[11px] text-slate-500">Select any legal and compliance services you require</p>
                  </div>
                  {formData.servicesSelected.length > 0 && (
                    <span className="self-start sm:self-center px-2 py-0.5 text-[10px] font-bold bg-[#7C3AED] text-white rounded-full">
                      {formData.servicesSelected.length} Selected
                    </span>
                  )}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search 50+ services (e.g., BIR, SEC, AOI...)"
                    value={servicesSearch}
                    onChange={(e) => setServicesSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded text-xs focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none"
                  />
                  {servicesSearch && (
                    <button
                      type="button"
                      onClick={() => setServicesSearch('')}
                      className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Categories List */}
                <div className="space-y-2 mt-2 max-h-[360px] overflow-y-auto pr-1">
                  {SERVICES_CATEGORIES.map((category) => {
                    const filteredServices = category.services.filter((service) =>
                      service.toLowerCase().includes(servicesSearch.toLowerCase())
                    );

                    // If searching, only show categories that have matching services
                    if (servicesSearch && filteredServices.length === 0) return null;

                    const isExpanded = servicesSearch ? true : !!expandedCategories[category.name];
                    const selectedCount = category.services.filter(s => formData.servicesSelected.includes(s)).length;

                    return (
                      <div key={category.name} className="bg-white border border-slate-100 rounded shadow-xs overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.name)}
                          className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">{category.name}</span>
                            {selectedCount > 0 && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#7C3AED]/10 text-[#7C3AED] rounded-full">
                                {selectedCount}
                              </span>
                            )}
                          </div>
                          {!servicesSearch && (
                            isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="p-2 grid grid-cols-1 gap-1.5 bg-white border-t border-slate-50">
                            {filteredServices.map((service) => {
                              const isChecked = formData.servicesSelected.includes(service);
                              return (
                                <label
                                  key={service}
                                  className={`flex items-start gap-2.5 p-1.5 rounded cursor-pointer transition-colors ${
                                    isChecked ? 'bg-[#7C3AED]/5 border border-transparent' : 'hover:bg-slate-50 border border-transparent'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    name="servicesSelected"
                                    value={service}
                                    checked={isChecked}
                                    onChange={handleFormChange}
                                    className="mt-0.5 rounded border-slate-300 text-[#7C3AED] focus:ring-[#7C3AED] h-3.5 w-3.5"
                                  />
                                  <span className="text-xs text-slate-600 font-medium leading-normal">{service}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

            {currentStep === 3 && (
              <div className="space-y-5">
                {/* CONSULTATION PREFERENCES (Dropdown) */}
              <div className="space-y-1.5">
                <label htmlFor="consultationPreference" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  CONSULTATION PREFERENCES <span className="text-red-500">*</span>
                </label>
                <select
                  id="consultationPreference"
                  name="consultationPreference"
                  value={formData.consultationPreference}
                  onChange={handleFormChange}
                  className={inputClass('consultationPreference')}
                >
                  <option value="">Select an option ...</option>
                  {CONSULTATION_PREFERENCES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.consultationPreference && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>

              {/* CONSULTATION DATE */}
              <div className="space-y-1.5">
                <label htmlFor="consultationDate" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  CONSULTATION DATE <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="consultationDate"
                  name="consultationDate"
                  value={formData.consultationDate}
                  onChange={handleFormChange}
                  className={inputClass('consultationDate')}
                />
                {errors.consultationDate && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>

              {/* PREFERRED TIME (GMT+8) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-2">
                  PREFERRED TIME (GMT+8)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-3 rounded border border-slate-100 shadow-sm">
                  <div className="flex flex-col space-y-2">
                    {PREFERRED_TIMES.slice(0, 3).map(time => (
                      <label key={time} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          name="preferredTime"
                          value={time}
                          checked={formData.preferredTime.includes(time)}
                          onChange={handleFormChange}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-600 font-medium">{time}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-col space-y-2">
                    {PREFERRED_TIMES.slice(3, 6).map(time => (
                      <label key={time} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          name="preferredTime"
                          value={time}
                          checked={formData.preferredTime.includes(time)}
                          onChange={handleFormChange}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-600 font-medium">{time}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-col space-y-2">
                    {PREFERRED_TIMES.slice(6).map(time => (
                      <label key={time} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          name="preferredTime"
                          value={time}
                          checked={formData.preferredTime.includes(time)}
                          onChange={handleFormChange}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs text-slate-600 font-medium">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* CLIENT CONCERNS */}
              <div className="space-y-1.5">
                <label htmlFor="clientConcerns" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  CLIENT CONCERNS
                </label>
                <textarea
                  id="clientConcerns"
                  name="clientConcerns"
                  rows={3}
                  value={formData.clientConcerns}
                  onChange={handleFormChange}
                  placeholder="Please outline any concerns or legal services needed"
                  className="w-full bg-white border border-slate-200 p-2.5 rounded text-sm focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none resize-none"
                />
              </div>

              {/* Supporting Documents */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Supporting Documents (PDF, Image, or DOCX)
                </label>
                <div className="w-full bg-white border border-slate-200 p-3 rounded text-sm flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 cursor-pointer" 
                    />
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-slate-500 italic font-medium">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>

              {/* How did you find us? */}
              <div className="space-y-1.5">
                <label htmlFor="howDidYouFindUs" className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  How did you find us? <span className="text-red-500">*</span>
                </label>
                <select
                  id="howDidYouFindUs"
                  name="howDidYouFindUs"
                  value={formData.howDidYouFindUs}
                  onChange={handleFormChange}
                  className={inputClass('howDidYouFindUs')}
                >
                  <option value="">Select an option ...</option>
                  {HOW_DID_YOU_FIND_US.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors.howDidYouFindUs && <p className="text-red-500 text-xs mt-1 font-medium">This field is required</p>}
              </div>
            </div>
          )}

            {/* Submit & Navigation Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <p>✓ Always schedules consultation & emails client confirmation.</p>
                <p>✓ Drafts personalized AI proposal & emails firm inbox instantly.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-6 rounded text-xs transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 uppercase tracking-wide border border-slate-200"
                  >
                    Back
                  </button>
                )}
                {currentStep === 1 && (
                  <button
                    type="button"
                    onClick={handleNextStep1}
                    className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-2.5 px-6 rounded text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C3AED] uppercase tracking-wide"
                  >
                    Next
                  </button>
                )}
                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={handleNextStep2}
                    className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold py-2.5 px-6 rounded text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C3AED] uppercase tracking-wide"
                  >
                    Next
                  </button>
                )}
                {currentStep === 3 && (
                  <button
                    type="submit"
                    disabled={status.type === 'loading'}
                    className="w-full sm:w-auto bg-[#FA8F83] hover:bg-[#F2786B] text-white font-bold py-2.5 px-8 rounded text-xs shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FA8F83] disabled:opacity-50 tracking-wide uppercase"
                  >
                    {status.type === 'loading' ? 'Processing...' : 'Submit'}
                  </button>
                )}
              </div>
            </div>
          </form>
              </>
            )}
          </section>
        </div>
        
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center text-[11px] text-slate-500 mt-auto">
        <div className="flex gap-6">
          <div><span className="font-bold text-slate-700">Database:</span> Google Sheets Active</div>
          <div><span className="font-bold text-slate-700">Comms:</span> Gmail Active</div>
        </div>
        <div className="flex items-center gap-2 text-blue-600 font-semibold">
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg> 
          High-Speed Workflow Execution
        </div>
      </footer>
    </div>
  );
}
