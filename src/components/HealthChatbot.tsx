import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Paperclip, FileText, 
  TrendingUp, Utensils, Dumbbell, Brain, Droplets, Moon, Pill, Heart, Zap, BarChart3, Lock, Crown } from 'lucide-react';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { useSubscription } from '@/hooks/use-subscription';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

type MsgContent = string | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
type Msg = { role: 'user' | 'assistant'; content: MsgContent; displayContent?: string; attachments?: { url: string; type: string; name: string }[] };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/health-chat`;

interface HealthChatbotProps {
  externalOpen?: boolean;
  onExternalToggle?: () => void;
}

const SMART_PROMPTS = {
  en: [
    { icon: BarChart3, text: "Analyze my health trends", color: "text-primary" },
    { icon: Utensils, text: "Review my diet plan progress", color: "text-accent" },
    { icon: Dumbbell, text: "How's my exercise routine going?", color: "text-success" },
    { icon: Brain, text: "My stress has been high lately", color: "text-[hsl(270,60%,50%)]" },
    { icon: Pill, text: "Check my medicine schedule", color: "text-destructive" },
    { icon: Moon, text: "Help me improve my sleep", color: "text-warning" },
    { icon: Droplets, text: "Am I drinking enough water?", color: "text-info" },
    { icon: TrendingUp, text: "What should I focus on today?", color: "text-primary" },
  ],
  bn: [
    { icon: BarChart3, text: "আমার স্বাস্থ্য ট্রেন্ড বিশ্লেষণ করো", color: "text-primary" },
    { icon: Utensils, text: "আমার ডায়েট প্ল্যান রিভিউ করো", color: "text-accent" },
    { icon: Dumbbell, text: "আমার ব্যায়াম রুটিন কেমন যাচ্ছে?", color: "text-success" },
    { icon: Brain, text: "আমার স্ট্রেস বেশি হচ্ছে", color: "text-[hsl(270,60%,50%)]" },
    { icon: Pill, text: "আমার ওষুধের সময়সূচি চেক করো", color: "text-destructive" },
    { icon: Moon, text: "ভালো ঘুমের উপায় বলো", color: "text-warning" },
    { icon: Droplets, text: "পর্যাপ্ত পানি পান করছি কি?", color: "text-info" },
    { icon: TrendingUp, text: "আজ কিসে ফোকাস করা উচিত?", color: "text-primary" },
  ],
};

export default function HealthChatbot({ externalOpen, onExternalToggle }: HealthChatbotProps) {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { canUseAiChat, aiChatRemainingToday, aiChatLimit, tier, incrementAiChatUsage } = useSubscription();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen || internalOpen;
  const toggleOpen = () => {
    if (externalOpen && onExternalToggle) onExternalToggle();
    setInternalOpen(prev => !prev);
  };
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<{ file: File; preview: string; type: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) return;
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      if (!isImage && !isPdf) return;
      if (isImage) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setAttachments(prev => [...prev, { file, preview: ev.target?.result as string, type: 'image' }]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, { file, preview: '', type: 'pdf' }]);
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const uploadFile = async (file: File): Promise<string> => {
    if (!authUser) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop();
    const fileName = `${authUser.id}/chat-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('prescriptions').upload(fileName, file);
    if (error) throw error;
    const { data } = await supabase.storage.from('prescriptions').createSignedUrl(fileName, 3600);
    if (!data?.signedUrl) throw new Error('Failed to create signed URL');
    return data.signedUrl;
  };

  const sendMessage = async (text: string) => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return;
    
    // Check AI chat limit
    if (!canUseAiChat) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'en'
          ? `⚠️ You've reached your daily AI chat limit (${aiChatLimit === 0 ? 'no access' : aiChatLimit + '/day'}). ${tier === 'free' ? 'Subscribe to get more questions!' : 'Upgrade to AI+ for unlimited questions!'}`
          : `⚠️ আপনার দৈনিক AI চ্যাট সীমা শেষ (${aiChatLimit === 0 ? 'অ্যাক্সেস নেই' : aiChatLimit + '/দিন'})। ${tier === 'free' ? 'আরো প্রশ্ন পেতে সাবস্ক্রাইব করুন!' : 'আনলিমিটেড প্রশ্নের জন্য AI+ আপগ্রেড করুন!'}`
      }]);
      return;
    }

    // Increment usage
    const allowed = await incrementAiChatUsage();
    if (!allowed) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'en' ? '⚠️ Daily question limit reached. Please try again tomorrow or upgrade your plan.' : '⚠️ দৈনিক প্রশ্ন সীমা শেষ। আগামীকাল আবার চেষ্টা করুন বা আপগ্রেড করুন।'
      }]);
      return;
    }

    setInput('');
    setIsLoading(true);

    const uploadedAttachments: { url: string; type: string; name: string }[] = [];

    try {
      for (const att of attachments) {
        const url = await uploadFile(att.file);
        uploadedAttachments.push({ url, type: att.type, name: att.file.name });
      }
    } catch (err) {
      console.error('Upload error:', err);
      setIsLoading(false);
      return;
    }
    setAttachments([]);

    let userContent: MsgContent;
    const displayText = text || (lang === 'en' ? 'Please analyze this file' : 'এই ফাইলটি বিশ্লেষণ করুন');

    if (uploadedAttachments.length > 0) {
      const parts: any[] = [];
      parts.push({ type: 'text', text: text || displayText });
      uploadedAttachments.forEach(att => {
        if (att.type === 'image') {
          parts.push({ type: 'image_url', image_url: { url: att.url } });
        } else {
          parts.push({ type: 'text', text: `[Uploaded PDF: ${att.name}] (URL: ${att.url})` });
        }
      });
      userContent = parts;
    } else {
      userContent = text;
    }

    const userMsg: Msg = {
      role: 'user',
      content: userContent,
      displayContent: displayText,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    let assistantSoFar = '';

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const apiMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to connect');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${e.message || 'Something went wrong. Please try again.'}` }]);
    }

    setIsLoading(false);
  };

  const send = () => sendMessage(input.trim());

  const getDisplayContent = (msg: Msg): string => {
    if (msg.displayContent) return msg.displayContent;
    if (typeof msg.content === 'string') return msg.content;
    const textParts = msg.content.filter((p): p is { type: 'text'; text: string } => p.type === 'text');
    return textParts.map(p => p.text).join(' ');
  };

  const prompts = SMART_PROMPTS[lang];

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1">
        <motion.button
          onClick={toggleOpen}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          className={`p-4 rounded-full shadow-elevated transition-all duration-300 ${
            open ? 'bg-destructive text-destructive-foreground rotate-90' : 'gradient-primary text-primary-foreground'
          }`}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </motion.button>
        {!open && (
          <motion.span 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[10px] font-medium text-muted-foreground"
          >
            {lang === 'en' ? 'Your AI Chatbot' : 'আপনার এআই চ্যাটবট'}
          </motion.span>
        )}
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[560px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-elevated flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-primary px-4 py-3 flex items-center gap-3">
              <div className="bg-primary-foreground/20 p-2 rounded-full">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-primary-foreground text-sm flex items-center gap-1.5">
                  {lang === 'en' ? 'Niramoy AI' : 'নিরাময় এআই'}
                  <span className="px-1.5 py-0.5 text-[9px] bg-primary-foreground/20 rounded-full">PRO</span>
                </h3>
                <p className="text-primary-foreground/70 text-[10px]">
                  {aiChatLimit === -1
                    ? (lang === 'en' ? 'Unlimited questions' : 'আনলিমিটেড প্রশ্ন')
                    : (lang === 'en' ? `${aiChatRemainingToday}/${aiChatLimit} questions left today` : `আজ ${aiChatRemainingToday}/${aiChatLimit} প্রশ্ন বাকি`)
                  }
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-primary-foreground/50 ml-auto" />
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <motion.div 
                      initial={{ scale: 0 }} animate={{ scale: 1 }} 
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="w-16 h-16 rounded-2xl gradient-primary mx-auto mb-3 flex items-center justify-center"
                    >
                      <Bot className="h-8 w-8 text-primary-foreground" />
                    </motion.div>
                    <p className="text-sm font-semibold text-foreground">
                      {lang === 'en' ? 'Hi! I know your health data 🧬' : 'হ্যালো! আমি আপনার স্বাস্থ্য ডেটা জানি 🧬'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {lang === 'en' 
                        ? 'I can analyze your trends, review plans, and give personalized advice' 
                        : 'আমি আপনার ট্রেন্ড বিশ্লেষণ, প্ল্যান রিভিউ এবং ব্যক্তিগত পরামর্শ দিতে পারি'}
                    </p>
                  </div>
                  
                  {/* Smart contextual prompts */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
                      {lang === 'en' ? 'Quick Actions' : 'দ্রুত অ্যাকশন'}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {prompts.slice(0, 6).map((p, i) => {
                        const Icon = p.icon;
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => sendMessage(p.text)}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors group"
                          >
                            <Icon className={`h-4 w-4 ${p.color} shrink-0 group-hover:scale-110 transition-transform`} />
                            <span className="text-[11px] text-foreground leading-tight">{p.text}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                    <div className="flex gap-1.5">
                      {prompts.slice(6).map((p, i) => {
                        const Icon = p.icon;
                        return (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (6 + i) * 0.05 }}
                            onClick={() => sendMessage(p.text)}
                            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-left transition-colors group"
                          >
                            <Icon className={`h-4 w-4 ${p.color} shrink-0 group-hover:scale-110 transition-transform`} />
                            <span className="text-[11px] text-foreground leading-tight">{p.text}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="shrink-0 w-7 h-7 rounded-full gradient-primary flex items-center justify-center mt-1">
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    msg.role === 'user' 
                      ? 'gradient-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {msg.attachments.map((att, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden">
                            {att.type === 'image' ? (
                              <img src={att.url} alt="Uploaded" className="w-full max-w-[200px] h-auto rounded-lg" />
                            ) : (
                              <div className="flex items-center gap-1.5 bg-primary-foreground/10 rounded-lg px-2 py-1">
                                <FileText className="h-3.5 w-3.5" />
                                <span className="text-xs truncate max-w-[120px]">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0.5">
                        <ReactMarkdown>{typeof msg.content === 'string' ? msg.content : getDisplayContent(msg)}</ReactMarkdown>
                      </div>
                    ) : (
                      getDisplayContent(msg)
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center mt-1">
                      <User className="h-3.5 w-3.5 text-secondary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                <div className="flex gap-2 items-center">
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    </div>
                  </div>
                </div>
              )}

              {/* Follow-up suggestions after AI response */}
              {messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                  className="flex flex-wrap gap-1.5 pt-1"
                >
                  {(lang === 'en' 
                    ? ['Tell me more', 'What else should I do?', 'Suggest a meal plan']
                    : ['আরও বলো', 'আর কি করা উচিত?', 'একটি খাবার প্ল্যান দাও']
                  ).map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-2.5 py-1.5 rounded-full bg-primary/10 text-primary text-[11px] hover:bg-primary/20 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="border-t border-border px-3 py-2 flex gap-2 overflow-x-auto">
                {attachments.map((att, idx) => (
                  <div key={idx} className="relative shrink-0">
                    {att.type === 'image' ? (
                      <img src={att.preview} alt="Preview" className="w-14 h-14 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg border border-border bg-muted flex flex-col items-center justify-center">
                        <FileText className="h-5 w-5 text-destructive" />
                        <span className="text-[8px] text-muted-foreground mt-0.5">PDF</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upgrade banner when no questions left */}
            {!canUseAiChat && (
              <div className="border-t border-border px-3 py-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Lock className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">
                      {lang === 'en' ? 'Daily limit reached' : 'দৈনিক সীমা শেষ'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {tier === 'free'
                        ? (lang === 'en' ? 'Free: 1 question/day' : 'ফ্রি: ১ প্রশ্ন/দিন')
                        : (lang === 'en' ? 'Pro: 10 questions/day' : 'প্রো: ১০ প্রশ্ন/দিন')
                      }
                    </p>
                  </div>
                  <Link to="/pricing">
                    <Button size="sm" className="gradient-primary border-0 text-primary-foreground text-[10px] h-7 px-3">
                      <Crown className="h-3 w-3 mr-1" />
                      {lang === 'en' ? 'Upgrade' : 'আপগ্রেড'}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || !canUseAiChat}
                  className="p-2.5 rounded-xl border border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                  title={lang === 'en' ? 'Attach file' : 'ফাইল সংযুক্ত করুন'}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                  multiple
                />
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder={!canUseAiChat
                    ? (lang === 'en' ? 'Upgrade to ask more questions...' : 'আরো প্রশ্ন করতে আপগ্রেড করুন...')
                    : (lang === 'en' ? 'Ask about your health...' : 'আপনার স্বাস্থ্য সম্পর্কে জিজ্ঞাসা করুন...')}
                  className="flex-1 px-3 py-2 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isLoading || !canUseAiChat}
                />
                <motion.button
                  onClick={send}
                  disabled={(!input.trim() && attachments.length === 0) || isLoading || !canUseAiChat}
                  whileTap={{ scale: 0.9 }}
                  className="p-2.5 rounded-xl gradient-primary text-primary-foreground disabled:opacity-50 transition-all hover:shadow-md"
                >
                  <Send className="h-4 w-4" />
                </motion.button>
              </div>
              <p className="text-[9px] text-muted-foreground text-center mt-1.5">
                {lang === 'en' ? '🧬 Synced with your health data, plans & prescriptions' : '🧬 আপনার স্বাস্থ্য ডেটা, প্ল্যান ও প্রেসক্রিপশনের সাথে সিঙ্ক'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
