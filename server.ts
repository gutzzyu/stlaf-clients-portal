import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Robust body parsing middleware that avoids conflicting with Vercel's built-in parser
app.use((req, res, next) => {
  if (process.env.VERCEL && req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});

  // CORS Middleware for cross-origin requests (e.g. from sandboxed or iframe preview origins)
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Helper to generate a highly professional fallback legal proposal when Gemini API key is missing or calls fail
  const generateFallbackProposal = (formData: any, matterId: string) => {
    const {
      clientType,
      clientName,
      industry,
      address,
      country,
      contactPerson,
      designation,
      consultationPreference,
      consultationDate,
      preferredTime,
      clientConcerns,
      servicesSelected
    } = formData;

    const timeSlots = Array.isArray(preferredTime) && preferredTime.length > 0 
      ? preferredTime.join(', ') 
      : 'To be finalized';

    const servicesList = Array.isArray(servicesSelected) && servicesSelected.length > 0 
      ? servicesSelected.map((s: string) => `  - ${s}`).join('\n') 
      : '  - General Legal Consultation / Advisory';

    return `======================================================================
PRELIMINARY LEGAL CONSULTATION PROPOSAL & CASE BRIEF
======================================================================
MATTER REFERENCE ID: ${matterId}
DATE OF GENERATION: ${new Date().toLocaleDateString()}
STATUS: PRE-CONSULTATION ASSIGNED BRIEF

Dear ${contactPerson || clientName},

Thank you for selecting our firm to assist with your legal representation and consulting needs. We have successfully logged your structured intake profile and initiated our preliminary matter review.

----------------------------------------------------------------------
1. EXECUTIVE SUMMARY & CLIENT PROFILE
----------------------------------------------------------------------
This document serves as a preliminary case brief and formal consultation proposal prepared for:
- Prospective Client: ${clientName}
- Entity Classification: ${clientType}
- Registered Sector/Industry: ${industry || 'Not Specified / General Sector'}
- Corporate Headquarters/Residential Address: ${address}
- Jurisdictional Country of Origin: ${country || 'Not Specified'}

We acknowledge the receipt of your request and have assigned Matter Reference ID: ${matterId} to your file. All future correspondence regarding this matter should reference this identifier.

----------------------------------------------------------------------
2. REQUESTED LEGAL SERVICES & SCOPE
----------------------------------------------------------------------
You have requested professional legal services regarding:
${servicesList}

Based on the specific services requested and intake concerns provided below:
"${clientConcerns || 'No specific concerns outlined yet. General legal consultation and advisory requested.'}"

Our designated counsel will conduct a preliminary assessment focusing on:
- Regulatory compliance and statutory implications related to your industry: ${industry || 'General commercial sector'}.
- Specific statutory filings, compliance benchmarks, or legal processes corresponding directly to your selected services.
- Identification of immediate risks, compliance liabilities, or legal avenues within ${country || 'the primary jurisdiction'}.

----------------------------------------------------------------------
3. UPCOMING CONSULTATION DETAILS
----------------------------------------------------------------------
Your upcoming formal meeting has been registered with the following preferences:
- Mode/Platform: ${consultationPreference}
- Requested Date: ${consultationDate}
- Preferred Time Window(s): ${timeSlots}

A calendar block confirmation will be dispatched separately to register this time with our legal team.

----------------------------------------------------------------------
4. CONSULTATION PREPARATION INSTRUCTIONS
----------------------------------------------------------------------
To maximize the efficacy of your consultation with our lead counsel on ${consultationDate}, please prepare and have the following documents ready for review:
1. Constitutional and Incorporation documents (e.g. Articles, Bylaws, or registration certificates) if representing a corporate entity.
2. Any contract, commercial agreement, or communication thread directly relevant to your outlined concerns.
3. Primary government-issued identification or corporate profile overview.
4. Chronological timeline of events leading up to the current inquiry.

Should you have any immediate questions or need to reschedule your consultation, please contact our administrative desk. We look forward to speaking with you.

Sincerely,

Senior Counsel & Partners
LegalFlow Architect Group
======================================================================`;
  };

  // API Route to draft the proposal using Gemini 2.5 Flash
  app.post('/api/draft-proposal', async (req, res) => {
    try {
      const { formData, matterId } = req.body;

      if (!formData || !matterId) {
        return res.status(400).json({ error: 'Missing required fields (formData or matterId)' });
      }

      const {
        clientType,
        clientName,
        industry,
        address,
        country,
        numberOfEmployees,
        contactPerson,
        designation,
        email,
        contactNumber,
        consultationPreference,
        consultationDate,
        preferredTime,
        clientConcerns,
        howDidYouFindUs,
        servicesSelected
      } = formData;

      let proposalText = '';

      if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY not set. Generating high-quality fallback legal proposal template.');
        proposalText = generateFallbackProposal(formData, matterId);
      } else {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

          const systemInstruction = "You are an elite, highly professional corporate legal counsel and legal technologist. Draft a formal, structured legal consultation proposal/matter brief based on the provided client intake metadata. The output should be professional, formal, and structured with clean formatting.";

          const servicesListText = Array.isArray(servicesSelected) && servicesSelected.length > 0 
            ? servicesSelected.map(s => `- ${s}`).join('\n') 
            : '- General Legal Consultation / Advisory';

          const prompt = `Please draft a professional legal consultation proposal and case brief for the following prospective matter:

MATTER REFERENCE ID: ${matterId}
CLIENT PROFILE:
- Client Name: ${clientName}
- Client Type: ${clientType}
- Industry: ${industry || 'Not Specified'}
- Principal/Residential Address: ${address}
- Country of Origin: ${country || 'Not Specified'}
- Number of Employees: ${numberOfEmployees || 'Not Applicable'}

PRIMARY CONTACT DETAILS:
- Contact Person: ${contactPerson}
- Designation: ${designation}
- Email Address: ${email}
- Contact Number: ${contactNumber}

SERVICES REQUESTED:
${servicesListText}

CONSULTATION DETAILS:
- Preference: Scheduled for a ${consultationPreference}
- Date Requested: ${consultationDate}
- Preferred Time Slot(s): ${Array.isArray(preferredTime) && preferredTime.length > 0 ? preferredTime.join(', ') : 'Not Specific'}
- How they found us: ${howDidYouFindUs}

CLIENT CONCERNS & CASE INTAKE:
"${clientConcerns || 'No specific concerns outlined yet. General legal consultation requested.'}"

Please generate a formal, well-formatted, and authoritative legal consultation proposal. It should include:
1. Executive Summary: Acknowledging their profile, matter, and the specific services requested.
2. Scope of Preliminary Review: Outlining the potential legal dimensions of their concerns and the specific regulatory frameworks involved in their chosen services.
3. Consultation Preparation Instructions: Concrete suggestions on what documents they should prepare before the upcoming consultation on ${consultationDate} via ${consultationPreference}.
4. Professional sign-off.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: prompt,
            config: {
              systemInstruction: systemInstruction,
              temperature: 0.2, // low temperature for precise template generation
            }
          });

          proposalText = response.text || generateFallbackProposal(formData, matterId);
        } catch (apiError) {
          console.error('Failed to query Gemini model. Generating high-quality fallback instead:', apiError);
          proposalText = generateFallbackProposal(formData, matterId);
        }
      }

      res.json({ proposal: proposalText });
    } catch (error) {
      console.error('Error generating proposal:', error);
      res.status(500).json({ error: 'Failed to generate proposal' });
    }
  });

  // Proxy endpoint to send an email via Gmail API from the server-side (bypasses browser CORS blocks)
  app.post('/api/google/gmail/send', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { raw } = req.body;

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy send email error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Proxy endpoint to append data to a Google Sheet from the server-side
  app.post('/api/google/sheets/append', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { spreadsheetId, sheetName, values } = req.body;

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}:append?valueInputOption=USER_ENTERED`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy append to sheet error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Proxy endpoint to create a Google Sheet from the server-side
  app.post('/api/google/sheets/create', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { title } = req.body;

      const url = 'https://sheets.googleapis.com/v4/spreadsheets';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: { title }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy create spreadsheet error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Proxy endpoint to create a Google Doc and insert initial text
  app.post('/api/google/docs/create', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { title, text } = req.body;

      // 1. Create the empty Google Doc
      const createResponse = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title })
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        return res.status(createResponse.status).json(errorData);
      }

      const docData = await createResponse.json();
      const documentId = docData.documentId;

      // 2. If initial text is provided, insert it
      if (text && documentId) {
        const updateUrl = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`;
        const updateResponse = await fetch(updateUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  text: text,
                  location: { index: 1 }
                }
              }
            ]
          })
        });

        if (!updateResponse.ok) {
          console.error('Failed to populate Google Doc with text:', await updateResponse.text().catch(() => ''));
        }
      }

      res.json(docData);
    } catch (error: any) {
      console.error('Proxy create document error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Proxy endpoint to copy a Google Drive file (such as a template document)
  app.post('/api/google/drive/copy', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { fileId, name } = req.body;
      if (!fileId) {
        return res.status(400).json({ error: 'Missing required field: fileId' });
      }

      const url = `https://www.googleapis.com/drive/v3/files/${fileId}/copy`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || 'Copy of Template'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy copy file error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Proxy endpoint to retrieve Google Drive file metadata to verify access
  app.post('/api/google/drive/get-metadata', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { fileId } = req.body;
      if (!fileId) {
        return res.status(400).json({ error: 'Missing required field: fileId' });
      }

      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy get metadata error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Proxy endpoint to perform batch update on a Google Doc
  app.post('/api/google/docs/batch-update', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { documentId, requests } = req.body;
      if (!documentId || !requests) {
        return res.status(400).json({ error: 'Missing required fields: documentId or requests' });
      }

      const url = `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy batch update error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Proxy endpoint to share a file in Google Drive
  app.post('/api/google/drive/share', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { fileId, emailAddress, role } = req.body;

      const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: role || 'writer',
          type: 'user',
          emailAddress
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return res.status(response.status).json(errorData);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy share file error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Proxy endpoint to upload a file to Google Drive
  app.post('/api/google/drive/upload', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Missing Authorization header' });
      }
      const { name, mimeType, base64Data } = req.body;
      if (!name || !mimeType || !base64Data) {
        return res.status(400).json({ error: 'Missing required parameters: name, mimeType, or base64Data' });
      }

      const buffer = Buffer.from(base64Data, 'base64');
      const boundary = 'foo_bar_boundary';
      const delimiter = `\r\n--${boundary}\r\n`;
      const close_delim = `\r\n--${boundary}--`;

      const metadata = {
        name,
        mimeType
      };

      const multipartRequestBody = Buffer.concat([
        Buffer.from(delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metadata) + delimiter),
        Buffer.from(`Content-Type: ${mimeType}\r\n\r\n`),
        buffer,
        Buffer.from(close_delim)
      ]);

      const url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': multipartRequestBody.length.toString()
        },
        body: multipartRequestBody
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Google Drive API upload failed:', errorText);
        return res.status(response.status).json({ error: `Google Drive API error: ${errorText}` });
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error('Proxy upload file error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

// Export app for Vercel Serverless Functions
export default app;

if (!process.env.VERCEL) {
  const startLocalServer = async () => {
    const PORT = 3000;
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
  };

  startLocalServer();
}
