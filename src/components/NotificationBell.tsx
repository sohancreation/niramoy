import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLang } from '@/contexts/LanguageContext';
import { Bell, X, Check, CheckCheck, Dumbbell, Utensils, Brain, Droplets, FileText, Heart, Sparkles, Pill, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

function getNotifIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('💊') || t.includes('ওষুধ') || t.includes('medicine')) return <Pill className="h-4 w-4 text-destructive" />;
  if (t.includes('🎯') || t.includes('টাস্ক') || t.includes('task')) return <Trophy className="h-4 w-4 text-warning" />;
  if (t.includes('📋') || t.includes('চেক-ইন') || t.includes('check-in')) return <Heart className="h-4 w-4 text-destructive" />;
  if (t.includes('📊') || t.includes('ট্র্যাকার') || t.includes('tracker')) return <Droplets className="h-4 w-4 text-info" />;
  if (t.includes('🧠') || t.includes('ai')) return <Sparkles className="h-4 w-4 text-primary" />;
  if (t.includes('ডায়েট') || t.includes('diet')) return <Utensils className="h-4 w-4 text-primary" />;
  if (t.includes('ব্যায়াম') || t.includes('exercise')) return <Dumbbell className="h-4 w-4 text-accent" />;
  if (t.includes('মাইন্ড') || t.includes('mind')) return <Brain className="h-4 w-4 text-[hsl(270,60%,50%)]" />;
  return <Bell className="h-4 w-4 text-muted-foreground" />;
}

function getNotifColor(type: string) {
  switch (type) {
    case 'success': return 'border-l-success bg-success/5';
    case 'error': return 'border-l-destructive bg-destructive/5';
    case 'warning': return 'border-l-warning bg-warning/5';
    default: return 'border-l-primary bg-primary/5';
  }
}

export default function NotificationBell() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true } as any).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true } as any).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const clearAll = async () => {
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return lang === 'en' ? 'Just now' : 'এইমাত্র';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-heading font-semibold text-sm text-foreground">
            {lang === 'en' ? 'Notifications' : 'নোটিফিকেশন'}
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={markAllRead}>
                <CheckCheck className="h-3 w-3" /> {lang === 'en' ? 'Read all' : 'সব পড়া'}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive" onClick={clearAll}>
                {lang === 'en' ? 'Clear' : 'মুছুন'}
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">
                {lang === 'en' ? 'No notifications yet' : 'এখনো কোনো নোটিফিকেশন নেই'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n, idx) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`px-4 py-3 flex gap-3 items-start border-l-2 ${getNotifColor(n.type)} ${!n.is_read ? 'bg-muted/30' : ''}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getNotifIcon(n.title)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    {!n.is_read && (
                      <button onClick={() => markAsRead(n.id)} className="p-1 hover:bg-muted rounded transition-colors" title="Mark read">
                        <Check className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                    <button onClick={() => deleteNotification(n.id)} className="p-1 hover:bg-destructive/10 rounded transition-colors" title="Delete">
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
