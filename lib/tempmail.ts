import { TempMailAccount, EmailMessage } from '@/types';

// Use 1secmail API - less known domains, better acceptance
const API_BASE = 'https://www.1secmail.com/api/v1';

// List of domains from 1secmail (these rotate and are less blocked)
const DOMAINS = [
  '1secmail.com',
  '1secmail.net',
  '1secmail.org',
  'wwjmp.com',
  'esiix.com',
  'xojxe.com',
  'yoggm.com'
];

export async function createAccount(): Promise<TempMailAccount> {
  // Generate random username
  const randomStr = Math.random().toString(36).substring(2, 12) + 
                   Math.random().toString(36).substring(2, 6);
  
  // Pick a random domain
  const domain = DOMAINS[Math.floor(Math.random() * DOMAINS.length)];
  const address = `${randomStr}@${domain}`;
  
  // 1secmail doesn't need registration - just return the address
  // The "token" is just the credentials for this simple API
  return {
    id: randomStr,
    address,
    token: `${randomStr}:${domain}`, // Store login:domain as token
  };
}

export async function getMessages(token: string): Promise<EmailMessage[]> {
  const [login, domain] = token.split(':');
  
  try {
    const res = await fetch(`${API_BASE}/?action=getMessages&login=${login}&domain=${domain}`);
    if (!res.ok) return [];
    
    // Transform 1secmail format to our EmailMessage format
    const messages = await res.json() || [];
    return messages.map((msg: any) => ({
      id: msg.id.toString(),
      accountId: login,
      msgid: msg.id.toString(),
      from: {
        address: msg.from,
        name: msg.from,
      },
      to: [{
        address: `${login}@${domain}`,
        name: '',
      }],
      subject: msg.subject,
      intro: msg.subject,
      seen: false,
      isDeleted: false,
      hasAttachments: false,
      size: 0,
      downloadUrl: '',
      createdAt: msg.date,
      updatedAt: msg.date,
    }));
  } catch (error) {
    return [];
  }
}

export async function getMessage(token: string, messageId: string): Promise<any> {
  const [login, domain] = token.split(':');
  
  try {
    const res = await fetch(
      `${API_BASE}/?action=readMessage&login=${login}&domain=${domain}&id=${messageId}`
    );
    
    if (!res.ok) throw new Error('Failed to fetch message');
    
    const data = await res.json();
    return {
      id: data.id.toString(),
      from: {
        address: data.from,
        name: data.from,
      },
      to: [{
        address: `${login}@${domain}`,
        name: '',
      }],
      subject: data.subject,
      text: data.textBody,
      html: data.htmlBody,
      createdAt: data.date,
    };
  } catch (error) {
    throw new Error('Failed to fetch message');
  }
}

export async function deleteMessage(token: string, messageId: string): Promise<void> {
  const [login, domain] = token.split(':');
  
  try {
    await fetch(
      `${API_BASE}/?action=deleteMessage&login=${login}&domain=${domain}&id=${messageId}`
    );
  } catch (error) {
    // Ignore errors on delete
  }
}

export async function deleteAccount(token: string): Promise<void> {
  // 1secmail auto-deletes, nothing to do
  return;
}
