import { getAccessToken } from './auth';

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

// Utility to append a row to a Google Sheet
export const appendToSheet = async (spreadsheetId: string, sheetName: string, values: any[]) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(getApiUrl('/api/google/sheets/append'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spreadsheetId,
      sheetName,
      values: [values]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to append to sheet: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

export const createSpreadsheet = async (title: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(getApiUrl('/api/google/sheets/create'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create spreadsheet: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Utility to create a Google Document with initial text
export const createDocument = async (title: string, text: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(getApiUrl('/api/google/docs/create'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, text })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to create Google Doc: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Utility to share a Google Drive file with an email address
export const shareFileInDrive = async (fileId: string, emailAddress: string, role: 'reader' | 'writer' = 'writer') => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(getApiUrl('/api/google/drive/share'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId, emailAddress, role })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to share Google Drive file: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Utility to upload a file to Google Drive
export const uploadFileToDrive = async (name: string, mimeType: string, base64Data: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(getApiUrl('/api/google/drive/upload'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, mimeType, base64Data })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to upload file to Google Drive: ${errorData.error || errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Utility to send an email via Gmail
export const sendEmail = async (to: string, subject: string, bodyText: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    bodyText,
  ];
  
  const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join('\r\n'))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(getApiUrl('/api/google/gmail/send'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawEmail
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to send email: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Utility to copy a file in Google Drive
export const copyDriveFile = async (fileId: string, name: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(getApiUrl('/api/google/drive/copy'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId, name })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to copy template document: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

// Utility to verify access to a Google Drive file
export const verifyDriveFileAccess = async (fileId: string) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(getApiUrl('/api/google/drive/get-metadata'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || response.statusText || 'File not found or no permission');
  }

  return response.json();
};

// Utility to run batch updates on a Google Doc
export const batchUpdateDocument = async (documentId: string, requests: any[]) => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(getApiUrl('/api/google/docs/batch-update'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ documentId, requests })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to update template document placeholders: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
};

