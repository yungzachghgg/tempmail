import { TempMailAccount, EmailMessage } from '@/types';

// Using mail.tm API with fresh domains (fetched dynamically)
// This gives us the latest domains that aren't on blocklists yet

export async function createAccount(): Promise<TempMailAccount> {
  // Use mail.tm API with fresh domains
  try {
    // Get fresh domains
    const res = await fetch('https://api.mail.tm/domains');
    const data = await res.json();
    let domains = data['hydra:member'] || [];
    
    if (domains.length === 0) {
      throw new Error('No domains available');
    }
    
    // Filter out commonly blocked domains
    const blockedDomains = ['deltajohnsons.com', 'johncockerill.com'];
    domains = domains.filter((d: any) => !blockedDomains.includes(d.domain));
    
    // Sort by length - shorter domains usually look more legit
    domains.sort((a: any, b: any) => a.domain.length - b.domain.length);
    
    // Pick from the first half (shorter, less obvious domains)
    const halfIndex = Math.floor(domains.length / 2);
    const domain = domains[Math.floor(Math.random() * halfIndex)].domain;
    
    // Generate credentials
    const randomStr = Math.random().toString(36).substring(2, 12) + 
                     Math.random().toString(36).substring(2, 6);
    const address = `${randomStr}@${domain}`;
    const password = randomStr;
    
    // Create account
    await fetch('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    
    // Get token
    const tokenRes = await fetch('https://api.mail.tm/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    const tokenData = await tokenRes.json();
    
    return {
      id: randomStr,
      address,
      token: tokenData.token,
    };
  } catch (error) {
    console.error('Error creating mail.tm account:', error);
    throw error;
  }
}

export async function getMessages(token: string): Promise<EmailMessage[]> {
  try {
    const res = await fetch('https://api.mail.tm/messages', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const messages = data['hydra:member'] || [];
    
    return messages.map((msg: any) => ({
      id: msg.id,
      accountId: '',
      msgid: msg.id,
      from: msg.from || { address: 'unknown', name: 'Unknown' },
      to: msg.to || [],
      subject: msg.subject || '(No subject)',
      intro: msg.intro || '',
      seen: msg.seen || false,
      isDeleted: false,
      hasAttachments: msg.hasAttachments || false,
      size: msg.size || 0,
      downloadUrl: '',
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

export async function getMessage(token: string, messageId: string): Promise<any> {
  try {
    const res = await fetch(`https://api.mail.tm/messages/${messageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });
    
    if (!res.ok) throw new Error('Failed to fetch message');
    
    return await res.json();
  } catch (error) {
    throw new Error('Failed to fetch message');
  }
}

export async function deleteMessage(token: string, messageId: string): Promise<void> {
  try {
    await fetch(`https://api.mail.tm/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    // Ignore errors on delete
  }
}

export async function deleteAccount(token: string): Promise<void> {
  try {
    await fetch('https://api.mail.tm/me', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    // Ignore errors
  }
}
