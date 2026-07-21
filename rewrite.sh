#!/bin/bash
cat << 'APP_EOF' > src/App.tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './lib/auth';
import { createSpreadsheet, appendToSheet, sendEmail } from './lib/google-api';
import { Scale, LogOut, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

const CLIENT_TYPES = ['Corporate', 'Individual'];
const INDUSTRIES = ['Energy', 'Maritime', 'Aviation', 'Banking', 'Gaming'];
const COUNTRIES = ['Philippines', 'Singapore', 'Hongkong', 'Vietnam', 'Malaysia', 'United Kingdom', 'USA', 'UAE'];
const EMPLOYEES = ['1-29', '30-59', '60-99', '100-149', '150-200'];
const DESIGNATIONS = ['Individual', 'Company President', 'Company Director', 'Managing Partner', 'Partner', 'Manager', 'Others'];
const CONSULTATION_PREFERENCES = ['Personal consultation', 'Zoom', 'Google Meet', 'Teams'];
const PREFERRED_TIMES = ['8:30 AM - 9:30 AM', '9:30 AM - 10:30 AM', '10:30 AM - 11:30 AM', '1:00 PM - 2:00 PM', '2:00 PM - 3:00 PM', '3:00 PM - 4:00 PM', '4:00 PM - 5:00 PM'];
const HOW_DID_YOU_FIND_US = ['LinkedIn', 'Facebook', 'Insta', 'Company website', 'Email outreach', 'Word of mouth (referral)', 'Events/Seminars'];

export default function App() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [spreadsheetId, setSpreadsheetId] = useState<string>(
    localStorage.getItem('matterSpreadsheetId') || ''
  );
  
  const [firmEmail, setFirmEmail] = useState<string>(
    localStorage.getItem('firmEmail') || ''
  );

  const [formData, setFormData] = useState({
    clientType: CLIENT_TYPES[0],
    clientName: '',
    industry: INDUSTRIES[0],
    address: '',
    country: COUNTRIES[0],
    numberOfEmployees: EMPLOYEES[0],
    contactPerson: '',
    designation: DESIGNATIONS[0],
    email: '',
    contactNumber: '',
    consultationPreference: CONSULTATION_PREFERENCES[0],
    consultationDate: '',
    preferredTime: [] as string[],
    clientConcerns: '',
    howDidYouFindUs: HOW_DID_YOU_FIND_US[0],
  });

  const [status, setStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });

  useEffect(() => {
    initAuth(
      (user) => {
        setUser(user);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
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
        'Timestamp', 'Matter ID', 'Client Type', 'Client Name', 'Industry', 'Address', 'Country', 'Number of Employees', 'Contact Person', 'Designation', 'Email', 'Contact Number', 'Consultation Preference', 'Consultation Date', 'Preferred Time', 'Client Concerns', 'How Did You Find Us'
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
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'preferredTime') {
        setFormData(prev => ({
          ...prev,
          preferredTime: checked 
            ? [...prev.preferredTime, value]
            : prev.preferredTime.filter(t => t !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setStatus({ type: 'loading', message: 'Logging to CRM...' });
      
      // Stage 2: CRM Log
      await appendToSheet(spreadsheetId, 'Sheet1', [
        dateStr,
        matterId,
        formData.clientType,
        formData.clientName,
        formData.industry,
        formData.address,
        formData.country,
        formData.numberOfEmployees,
        formData.contactPerson,
        formData.designation,
        formData.email,
        formData.contactNumber,
        formData.consultationPreference,
        formData.consultationDate,
        formData.preferredTime.join(', '),
        formData.clientConcerns,
        formData.howDidYouFindUs
      ]);

      // Stage 3: Consultation Track
      setStatus({ type: 'loading', message: 'Sending consultation email...' });
      const subjectClient = `Consultation Booking: ${formData.clientName}`;
      const bodyClient = `Hello ${formData.contactPerson || formData.clientName},\n\nThank you for reaching out to us. We have received your consultation request for ${formData.consultationDate}.\n\nReference Matter ID: ${matterId}\n\nOur team will review your preferences and contact you shortly to confirm the appointment.\n\nBest regards,\nLegal Team`;
      
      await sendEmail(formData.email, subjectClient, bodyClient);

      // Stage 4: Direct Proposal Track
      setStatus({ type: 'loading', message: 'Drafting legal proposal via AI...' });
      
      const response = await fetch('/api/draft-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          matterId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate proposal');
      }

      const data = await response.json();
      
      setStatus({ type: 'loading', message: 'Sending proposal to firm...' });
      const subjectFirm = `ACTION REQUIRED: Direct Proposal Ready - ${formData.clientName}`;
      
      await sendEmail(firmEmail, subjectFirm, data.proposal);
      setStatus({ type: 'success', message: 'Intake logged. Consultation email sent to client. Proposal drafted and sent to firm inbox.' });

      setFormData({
        clientType: CLIENT_TYPES[0],
        clientName: '',
        industry: INDUSTRIES[0],
        address: '',
        country: COUNTRIES[0],
        numberOfEmployees: EMPLOYEES[0],
        contactPerson: '',
        designation: DESIGNATIONS[0],
        email: '',
        contactNumber: '',
        consultationPreference: CONSULTATION_PREFERENCES[0],
        consultationDate: '',
        preferredTime: [],
        clientConcerns: '',
        howDidYouFindUs: HOW_DID_YOU_FIND_US[0],
      });

    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: err.message || 'An error occurred during processing.' });
    }
  };

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-900">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">LegalFlow Architect v2.5</h1>
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

  return (
    <div className="min-h-screen h-full bg-slate-50 font-sans text-slate-900 flex flex-col overflow-x-hidden">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-700 sticky top-0 z-10 w-full">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-lg">L</div>
          <h1 className="text-xl font-semibold tracking-tight">LegalFlow <span className="text-slate-400 font-light text-sm italic">Architect v2.5</span></h1>
        </div>
        <div className="flex space-x-6 text-xs uppercase tracking-widest text-slate-400">
          <div className="hidden sm:flex items-center"><span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>{user.email}</div>
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
        <div className="w-full md:w-1/3 flex flex-col gap-4">
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
                    className="flex-1 bg-slate-50 rounded border border-slate-200 p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                  className="w-full bg-slate-50 rounded border border-slate-200 p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </section>
          
          {/* Status Notifications */}
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
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Stage 1: Structured Intake</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="clientType" className="text-[10px] text-slate-400 uppercase font-semibold">Client Type *</label>
                  <select
                    id="clientType"
                    name="clientType"
                    value={formData.clientType}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    {CLIENT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="clientName" className="text-[10px] text-slate-400 uppercase font-semibold">Client Name *</label>
                  <input
                    type="text"
                    id="clientName"
                    name="clientName"
                    required
                    value={formData.clientName}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="industry" className="text-[10px] text-slate-400 uppercase font-semibold">Industry (if applicable)</label>
                  <select
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select an option ...</option>
                    {INDUSTRIES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="country" className="text-[10px] text-slate-400 uppercase font-semibold">Country</label>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select an option ...</option>
                    {COUNTRIES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="address" className="text-[10px] text-slate-400 uppercase font-semibold">Principal/Residential Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="numberOfEmployees" className="text-[10px] text-slate-400 uppercase font-semibold">Number of Employees (if applicable)</label>
                  <select
                    id="numberOfEmployees"
                    name="numberOfEmployees"
                    value={formData.numberOfEmployees}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select an option ...</option>
                    {EMPLOYEES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="contactPerson" className="text-[10px] text-slate-400 uppercase font-semibold">Contact Person *</label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    required
                    value={formData.contactPerson}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="designation" className="text-[10px] text-slate-400 uppercase font-semibold">Designation *</label>
                  <select
                    id="designation"
                    name="designation"
                    required
                    value={formData.designation}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select an option ...</option>
                    {DESIGNATIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="email" className="text-[10px] text-slate-400 uppercase font-semibold">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="contactNumber" className="text-[10px] text-slate-400 uppercase font-semibold">Contact Number *</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    required
                    value={formData.contactNumber}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="consultationPreference" className="text-[10px] text-slate-400 uppercase font-semibold">Consultation Preferences *</label>
                  <select
                    id="consultationPreference"
                    name="consultationPreference"
                    required
                    value={formData.consultationPreference}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select an option ...</option>
                    {CONSULTATION_PREFERENCES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="consultationDate" className="text-[10px] text-slate-400 uppercase font-semibold">Consultation Date *</label>
                  <input
                    type="date"
                    id="consultationDate"
                    name="consultationDate"
                    required
                    value={formData.consultationDate}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="howDidYouFindUs" className="text-[10px] text-slate-400 uppercase font-semibold">How did you find us? *</label>
                  <select
                    id="howDidYouFindUs"
                    name="howDidYouFindUs"
                    required
                    value={formData.howDidYouFindUs}
                    onChange={handleFormChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="">Select an option ...</option>
                    {HOW_DID_YOU_FIND_US.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">Preferred Time (GMT+8)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PREFERRED_TIMES.map(time => (
                    <label key={time} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="preferredTime"
                        value={time}
                        checked={formData.preferredTime.includes(time)}
                        onChange={handleFormChange}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{time}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="clientConcerns" className="text-[10px] text-slate-400 uppercase font-semibold">Client Concerns</label>
                <textarea
                  id="clientConcerns"
                  name="clientConcerns"
                  rows={3}
                  value={formData.clientConcerns}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Supporting Documents</label>
                <div className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded text-sm flex items-center">
                  <input type="file" className="text-sm text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300" />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <p>Sends booking link via email & drafts AI proposal.</p>
                </div>
                <button
                  type="submit"
                  disabled={status.type === 'loading'}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-2 px-6 rounded text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
                >
                  Process Intake
                </button>
              </div>
            </form>
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
APP_EOF

cat << 'SERVER_EOF' > server.ts
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/draft-proposal', async (req, res) => {
    try {
      const { formData, matterId } = req.body;

      if (!formData || !matterId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemInstruction = "You are a direct, precise legal assistant. Generate a highly structured, standard preliminary legal proposal template. You must strictly use the provided variables and inject them into the corresponding template fields. Do not analyze, interpret, or hallucinate any facts outside of the provided inputs.";

      const prompt = `Client Name: ${formData.clientName}
Matter ID: ${matterId}
Client Type: ${formData.clientType}
Industry: ${formData.industry}
Country: ${formData.country}
Contact Person: ${formData.contactPerson}
Designation: ${formData.designation}
Client Concerns: ${formData.clientConcerns}

Generate a clean, structured preliminary legal proposal text block addressing the client's profile and concerns. Keep it brief and professional.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2, // low temperature for precise template generation
        }
      });

      res.json({ proposal: response.text });
    } catch (error) {
      console.error('Error generating proposal:', error);
      res.status(500).json({ error: 'Failed to generate proposal' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
SERVER_EOF

chmod +x rewrite.sh
./rewrite.sh