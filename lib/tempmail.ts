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
    const filteredDomains = domains.filter((d: any) => !blockedDomains.includes(d.domain));
    
    // Use filtered if we have some, otherwise use all
    const domainsToUse = filteredDomains.length > 0 ? filteredDomains : domains;
    
    // Sort by length - shorter domains usually look more legit
    domainsToUse.sort((a: any, b: any) => a.domain.length - b.domain.length);
    
    // Pick from the shorter domains (more legit looking)
    const poolSize = Math.max(1, Math.floor(domainsToUse.length / 3));
    const randomIndex = Math.floor(Math.random() * poolSize);
    const domain = domainsToUse[randomIndex]?.domain;
    
    if (!domain) {
      throw new Error('Could not select a valid domain');
    }
    
    // Generate credentials
    const randomStr = Math.random().toString(36).substring(2, 12) + 
                     Math.random().toString(36).substring(2, 6);
    const address = `${randomStr}@${domain}`;
    const password = randomStr;
    
    // Create account
    const createRes = await fetch('https://api.mail.tm/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    
    if (!createRes.ok) {
      throw new Error(`Failed to create account: ${createRes.status}`);
    }
    
    // Get token
    const tokenRes = await fetch('https://api.mail.tm/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, password }),
    });
    
    if (!tokenRes.ok) {
      throw new Error(`Failed to get token: ${tokenRes.status}`);
    }
    
    const tokenData = await tokenRes.json();
    
    return {
      id: randomStr,
      address,
      token: tokenData.token,
    };
  } catch (error) {
    console.error('Error creating mail.tm account:', error);
    // Try fallback provider
    return await createFallbackAccount();
  }
}

// Fallback using 1secmail API with their actual domains
async function createFallbackAccount(): Promise<TempMailAccount> {
  try {
    // Generate random credentials
    const randomStr = Math.random().toString(36).substring(2, 12) + 
                     Math.random().toString(36).substring(2, 6);
    
    // 1secmail domains - less blocked than mail.tm
    const domains = ['wwjmp.com', 'esiix.com', 'xojxe.com', 'yoggm.com', '1secmail.net'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const address = `${randomStr}@${domain}`;
    
    // Create token for 1secmail (simpler API - no registration needed)
    return {
      id: randomStr,
      address,
      token: `${randomStr}:${domain}`, // Format: login:domain for 1secmail
    };
  } catch (error) {
    console.error('Fallback also failed:', error);
    throw new Error('All email providers failed');
  }
}

// Detect if token is from fallback provider (contains colon) or mail.tm (JWT)
function isFallbackToken(token: string): boolean {
  return token.includes(':') && token.split(':').length === 2;
}

export async function getMessages(token: string): Promise<EmailMessage[]> {
  // Handle fallback provider (tempmail.lol style)
  if (isFallbackToken(token)) {
    const [login, domain] = token.split(':');
    try {
      // Try 1secmail API for fallback (works with any domain)
      const res = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${login}&domain=${domain}`);
      if (!res.ok) return [];
      
      const messages = await res.json() || [];
      return messages.map((msg: any) => ({
        id: msg.id.toString(),
        accountId: login,
        msgid: msg.id.toString(),
        from: { address: msg.from, name: msg.from },
        to: [{ address: `${login}@${domain}`, name: '' }],
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
  
  // Handle mail.tm provider
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
  // Handle fallback provider
  if (isFallbackToken(token)) {
    const [login, domain] = token.split(':');
    try {
      const res = await fetch(
        `https://www.1secmail.com/api/v1/?action=readMessage&login=${login}&domain=${domain}&id=${messageId}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      return await res.json();
    } catch (error) {
      throw new Error('Failed to fetch message');
    }
  }
  
  // Handle mail.tm
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
  // Handle fallback provider
  if (isFallbackToken(token)) {
    const [login, domain] = token.split(':');
    try {
      await fetch(
        `https://www.1secmail.com/api/v1/?action=deleteMessage&login=${login}&domain=${domain}&id=${messageId}`
      );
    } catch (error) {
      // Ignore
    }
    return;
  }
  
  // Handle mail.tm
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
  // Handle fallback - nothing to do
  if (isFallbackToken(token)) {
    return;
  }
  
  // Handle mail.tm
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
