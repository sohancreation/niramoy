import React, { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Loader2, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VAPI_PUBLIC_KEY = 'b54db819-e560-4dab-97db-7acd46f26b54';
const ASSISTANT_ID = '97c942cb-99c1-4503-80d0-d00227056685';

interface VapiWellnessChatProps {
  lang: 'en' | 'bn';
  onCallStarted?: () => void;
  onCallEnded?: (durationSeconds: number) => void;
  maxDurationSeconds?: number;
}

export default function VapiWellnessChat({ lang, onCallStarted, onCallEnded, maxDurationSeconds }: VapiWellnessChatProps) {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const vapiRef = useRef<Vapi | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoEndRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-end call after maxDurationSeconds
  useEffect(() => {
    if (status === 'active' && maxDurationSeconds) {
      autoEndRef.current = setTimeout(() => {
        const finalDuration = maxDurationSeconds;
        vapiRef.current?.stop();
        setStatus('ended');
        if (timerRef.current) clearInterval(timerRef.current);
        onCallEnded?.(finalDuration);
      }, maxDurationSeconds * 1000);
    }
    return () => {
      if (autoEndRef.current) clearTimeout(autoEndRef.current);
    };
  }, [status, maxDurationSeconds]);

  useEffect(() => {
    return () => {
      vapiRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCall = useCallback(async () => {
    try {
      setStatus('connecting');

      const vapi = new Vapi(VAPI_PUBLIC_KEY);
      vapiRef.current = vapi;

      vapi.on('call-start', () => {
        setStatus('active');
        setDuration(0);
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
        onCallStarted?.();
      });

      vapi.on('call-end', () => {
        setStatus('ended');
        if (timerRef.current) clearInterval(timerRef.current);
        onCallEnded?.(duration);
      });

      vapi.on('error', (e) => {
        console.error('Vapi error:', e);
        setStatus('idle');
        if (timerRef.current) clearInterval(timerRef.current);
      });

      await vapi.start(ASSISTANT_ID);
    } catch (err) {
      console.error('Failed to start Vapi call:', err);
      setStatus('idle');
    }
  }, []);

  const endCall = useCallback(() => {
    vapiRef.current?.stop();
    setStatus('ended');
    if (timerRef.current) clearInterval(timerRef.current);
    onCallEnded?.(duration);
  }, [duration, onCallEnded]);

  const toggleMute = useCallback(() => {
    if (vapiRef.current) {
      const newMuted = !isMuted;
      vapiRef.current.setMuted(newMuted);
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const resetCall = useCallback(() => {
    setStatus('idle');
    setDuration(0);
    setIsMuted(false);
  }, []);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      {/* Visual indicator */}
      <div className="relative">
        <motion.div
          className="w-36 h-36 rounded-full flex items-center justify-center border-2"
          style={{
            borderColor: status === 'active' ? 'hsl(var(--success))' : status === 'connecting' ? 'hsl(var(--warning))' : 'hsl(var(--muted))',
            background: status === 'active' ? 'hsl(var(--success) / 0.08)' : 'hsl(var(--muted) / 0.2)',
          }}
          animate={status === 'active' ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {status === 'connecting' && <Loader2 className="h-12 w-12 text-warning animate-spin" />}
          {status === 'active' && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Phone className="h-12 w-12 text-[hsl(var(--success))]" />
            </motion.div>
          )}
          {(status === 'idle' || status === 'ended') && (
            <Phone className="h-12 w-12 text-muted-foreground" />
          )}
        </motion.div>

        {/* Pulsing rings when active */}
        {status === 'active' && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[hsl(var(--success))]"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[hsl(var(--success))]"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            />
          </>
        )}
      </div>

      {/* Status text */}
      <div className="text-center">
        <p className="text-lg font-semibold text-foreground">
          {status === 'idle' && (lang === 'en' ? 'Ready to Talk' : 'কথা বলতে প্রস্তুত')}
          {status === 'connecting' && (lang === 'en' ? 'Connecting...' : 'সংযোগ হচ্ছে...')}
          {status === 'active' && (lang === 'en' ? 'In Session' : 'সেশন চলছে')}
          {status === 'ended' && (lang === 'en' ? 'Session Ended' : 'সেশন শেষ')}
        </p>
        {status === 'active' && (
          <Badge variant="outline" className="mt-1">{formatTime(duration)}</Badge>
        )}
        <p className="text-xs text-muted-foreground mt-2 max-w-[260px]">
          {lang === 'en'
            ? 'Speak with our AI wellness consultant about stress, anxiety, or emotional support.'
            : 'চাপ, উদ্বেগ বা মানসিক সহায়তা নিয়ে আমাদের এআই পরামর্শকের সাথে কথা বলুন।'}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {status === 'idle' || status === 'ended' ? (
          <Button
            onClick={status === 'ended' ? resetCall : startCall}
            className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success)/.8)] text-[hsl(var(--success-foreground))] gap-2 px-6"
            size="lg"
          >
            <Phone className="h-5 w-5" />
            {status === 'ended'
              ? (lang === 'en' ? 'Call Again' : 'আবার কল করুন')
              : (lang === 'en' ? 'Start' : 'শুরু করুন')}
          </Button>
        ) : status === 'connecting' ? (
          <Button disabled size="lg" className="gap-2 px-6">
            <Loader2 className="h-5 w-5 animate-spin" />
            {lang === 'en' ? 'Connecting...' : 'সংযুক্ত হচ্ছে...'}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              className="h-12 w-12 rounded-full"
            >
              {isMuted ? <MicOff className="h-5 w-5 text-destructive" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Button
              onClick={endCall}
              size="lg"
              className="bg-destructive hover:bg-destructive/80 text-destructive-foreground gap-2 px-6"
            >
              <PhoneOff className="h-5 w-5" />
              {lang === 'en' ? 'End Call' : 'কল শেষ'}
            </Button>
          </>
        )}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center max-w-[280px]">
        {lang === 'en'
          ? '⚠️ This is an AI assistant, not a licensed therapist. For emergencies, call 16789.'
          : '⚠️ এটি একটি এআই সহকারী, লাইসেন্সপ্রাপ্ত থেরাপিস্ট নয়। জরুরি অবস্থায় ১৬৭৮৯ কল করুন।'}
      </p>
    </div>
  );
}
