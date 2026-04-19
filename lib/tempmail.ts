import axios from 'axios';
import { TempMailAccount, EmailMessage } from '@/types';

const MAIL_TM_API = 'https://api.mail.tm';

export async function createAccount(): Promise<TempMailAccount> {
  // Get available domains
  const domainsRes = await axios.get(`${MAIL_TM_API}/domains`);
  const domain = domainsRes.data['hydra:member'][0].domain;
  
  // Generate random credentials
  const randomStr = Math.random().toString(36).substring(2, 15);
  const address = `${randomStr}@${domain}`;
  const password = randomStr;
  
  // Create account
  await axios.post(`${MAIL_TM_API}/accounts`, {
    address,
    password,
  });
  
  // Get auth token
  const tokenRes = await axios.post(`${MAIL_TM_API}/token`, {
    address,
    password,
  });
  
  return {
    id: randomStr,
    address,
    token: tokenRes.data.token,
  };
}

export async function getMessages(token: string): Promise<EmailMessage[]> {
  const res = await axios.get(`${MAIL_TM_API}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return res.data['hydra:member'] || [];
}

export async function getMessage(token: string, messageId: string): Promise<any> {
  const res = await axios.get(`${MAIL_TM_API}/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return res.data;
}

export async function deleteMessage(token: string, messageId: string): Promise<void> {
  await axios.delete(`${MAIL_TM_API}/messages/${messageId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function deleteAccount(token: string): Promise<void> {
  await axios.delete(`${MAIL_TM_API}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
