'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Copy, 
  RefreshCw, 
  Trash2, 
  Mail, 
  Inbox, 
  Clock, 
  Shield,
  Eye,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TempMailAccount, EmailMessage } from '@/types';

export default function Home() {
  const [account, setAccount] = useState<TempMailAccount | null>(null);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [messageContent, setMessageContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load account from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tempmail_account');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAccount(parsed);
      } catch (e) {
        localStorage.removeItem('tempmail_account');
      }
    }
  }, []);

  // Save account to localStorage
  useEffect(() => {
    if (account) {
      localStorage.setItem('tempmail_account', JSON.stringify(account));
    } else {
      localStorage.removeItem('tempmail_account');
    }
  }, [account]);

  // Fetch messages when account changes
  const fetchMessages = useCallback(async () => {
    if (!account?.token) return;
    
    setRefreshing(true);
    try {
      const res = await fetch(`/api/messages?token=${account.token}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setMessages(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [account]);

  useEffect(() => {
    fetchMessages();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const createAccount = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/account', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to create account');
      const data = await res.json();
      setAccount(data);
      setMessages([]);
      setSelectedMessage(null);
      setMessageContent(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!account?.token) return;
    
    setLoading(true);
    try {
      await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: account.token }),
      });
    } catch (err) {
      // Ignore errors on delete
    } finally {
      setAccount(null);
      setMessages([]);
      setSelectedMessage(null);
      setMessageContent(null);
      setLoading(false);
    }
  };

  const viewMessage = async (message: EmailMessage) => {
    if (!account?.token) return;
    
    setSelectedMessage(message);
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${message.id}?token=${account.token}`);
      if (!res.ok) throw new Error('Failed to fetch message');
      const data = await res.json();
      setMessageContent(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!account?.token) return;
    
    try {
      await fetch(`/api/messages/${messageId}?token=${account.token}`, {
        method: 'DELETE',
      });
      setMessages(prev => prev.filter(m => m.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
        setMessageContent(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyEmail = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Extract verification codes from message
  const extractCode = (text: string): string | null => {
    if (!text) return null;
    
    // Common patterns for verification codes
    const patterns = [
      /\b(\d{4,8})\b/,  // 4-8 digit numbers
      /code[\s:]?(\d{4,8})/i,
      /code[\s:]?([A-Z0-9]{4,8})/i,
      /verification[\s:]?(\d{4,8})/i,
      /otp[\s:]?(\d{4,8})/i,
      /pin[\s:]?(\d{4,8})/i,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const code = messageContent ? extractCode(messageContent.text || messageContent.html || '') : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">TempMail</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <div className="hidden sm:flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>Secure & Anonymous</span>
            </div>
            <div className="hidden sm:flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Auto-destruct</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Email Address Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-8">
          {!account ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Get Your Temporary Email
              </h2>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Create a temporary email address instantly. Receive verification codes and emails without using your personal email.
              </p>
              <button
                onClick={createAccount}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                {loading ? 'Creating...' : 'Create Email Address'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1 block">
                    Your Temporary Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-lg sm:text-xl font-mono text-slate-900 bg-slate-100 px-3 py-2 rounded-lg break-all">
                      {account.address}
                    </code>
                    <button
                      onClick={copyEmail}
                      className={cn(
                        "p-2 rounded-lg transition-colors flex-shrink-0",
                        copied 
                          ? "bg-green-100 text-green-600" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                      title="Copy email"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchMessages}
                    disabled={refreshing}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                    Refresh
                  </button>
                  <button
                    onClick={deleteAccount}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                Emails are automatically deleted after some time. Refresh to check for new messages.
              </p>
            </div>
          )}
        </div>

        {account && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Messages List */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-primary-600" />
                  Inbox ({messages.length})
                </h3>
                {refreshing && <Loader2 className="w-5 h-5 animate-spin text-primary-600" />}
              </div>
              
              <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>No messages yet</p>
                    <p className="text-sm mt-1">New emails will appear here automatically</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => viewMessage(message)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors hover:bg-slate-50",
                        selectedMessage?.id === message.id && "bg-primary-50 hover:bg-primary-50",
                        !message.seen && "bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-900 truncate">
                            {message.from.name || message.from.address}
                          </p>
                          <p className="text-sm text-slate-600 truncate mt-0.5">
                            {message.subject}
                          </p>
                          <p className="text-sm text-slate-500 truncate mt-1">
                            {message.intro}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs text-slate-400 whitespace-nowrap">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Message Content */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-600" />
                  Message Content
                </h3>
              </div>
              
              <div className="p-4 max-h-[500px] overflow-y-auto">
                {!selectedMessage ? (
                  <div className="text-center py-12 text-slate-500">
                    <Eye className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p>Select a message to view its content</p>
                  </div>
                ) : loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto" />
                    <p className="mt-2 text-slate-500">Loading message...</p>
                  </div>
                ) : messageContent ? (
                  <div className="space-y-4">
                    {/* Verification Code Alert */}
                    {code && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 font-medium mb-1">
                          Verification Code Detected
                        </p>
                        <code className="text-2xl font-mono font-bold text-green-800 tracking-wider">
                          {code}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(code);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="ml-3 text-sm text-green-600 hover:text-green-800 underline"
                        >
                          {copied ? 'Copied!' : 'Copy code'}
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">From</label>
                      <p className="text-slate-900">
                        {messageContent.from?.name} &lt;{messageContent.from?.address}&gt;
                      </p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Subject</label>
                      <p className="text-slate-900 font-medium">{messageContent.subject}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-slate-600">Date</label>
                      <p className="text-slate-900">
                        {new Date(messageContent.createdAt).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="border-t border-slate-200 pt-4">
                      <label className="text-sm font-medium text-slate-600 mb-2 block">Content</label>
                      {messageContent.html ? (
                        <div 
                          className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-lg overflow-auto"
                          dangerouslySetInnerHTML={{ __html: messageContent.html }}
                        />
                      ) : (
                        <pre className="bg-slate-50 p-4 rounded-lg whitespace-pre-wrap text-sm text-slate-800 overflow-auto">
                          {messageContent.text}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        {!account && (
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Private & Secure</h3>
              <p className="text-slate-600 text-sm">
                No registration required. Your emails are automatically deleted and your privacy is protected.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Instant Delivery</h3>
              <p className="text-slate-600 text-sm">
                Emails arrive in seconds. Perfect for receiving verification codes and sign-up confirmations.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Auto Cleanup</h3>
              <p className="text-slate-600 text-sm">
                Old emails are automatically deleted. No spam, no clutter, no long-term storage.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
