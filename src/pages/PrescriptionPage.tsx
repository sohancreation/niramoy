import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLang } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFamilyFilter } from '@/hooks/use-family-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Upload, FileText, Pill, AlertCircle, CheckCircle2, Loader2,
  Trash2, Clock, Utensils, Dumbbell, Camera, Image, ChevronDown, ChevronUp
} from 'lucide-react';

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  timing?: string;
  instructions?: string;
}

interface Restriction {
  restriction: string;
  reason: string;
}

interface Prescription {
  id: string;
  image_url: string;
  file_type: string;
  analysis_status: string;
  doctor_name?: string;
  diagnosis?: string;
  medicines: Medicine[];
  dietary_restrictions: Restriction[];
  exercise_restrictions: Restriction[];
  ai_summary?: string;
  raw_analysis?: any;
  created_at: string;
}

export default function PrescriptionPage() {
  const { lang } = useLang();
  const { user: authUser } = useAuth();
  const { applyFilter, insertPayload, familyMemberId } = useFamilyFilter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPrescriptions = useCallback(async () => {
    if (!authUser) return;
    const { data } = await applyFilter(
      supabase
        .from('prescriptions')
        .select('*')
        .eq('user_id', authUser.id)
    ).order('created_at', { ascending: false });
    if (data) {
      setPrescriptions(data.map((p: any) => ({
        ...p,
        medicines: (p.medicines as Medicine[]) || [],
        dietary_restrictions: (p.dietary_restrictions as Restriction[]) || [],
        exercise_restrictions: (p.exercise_restrictions as Restriction[]) || [],
      })));
    }
  }, [authUser]);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(lang === 'en' ? 'Please upload an image (JPG/PNG) or PDF file' : 'অনুগ্রহ করে ছবি (JPG/PNG) অথবা PDF ফাইল আপলোড করুন');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(lang === 'en' ? 'File size must be under 10MB' : 'ফাইলের আকার ১০MB এর নিচে হতে হবে');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${authUser.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('prescriptions').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage.from('prescriptions').createSignedUrl(fileName, 3600);
      if (!urlData?.signedUrl) throw new Error('Failed to create signed URL');
      const imageUrl = urlData.signedUrl;
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';

      const { data: prescription, error: insertError } = await supabase
        .from('prescriptions')
        .insert({
          user_id: authUser.id,
          image_url: imageUrl,
          file_type: fileType,
          analysis_status: 'analyzing',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(lang === 'en' ? 'Prescription uploaded! Analyzing...' : 'প্রেসক্রিপশন আপলোড হয়েছে! বিশ্লেষণ করা হচ্ছে...');
      fetchPrescriptions();

      // Trigger AI analysis
      setAnalyzing(prescription.id);
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-prescription', {
        body: { imageUrl, prescriptionId: prescription.id },
      });

      if (analysisError) throw analysisError;

      toast.success(lang === 'en' ? 'Prescription analyzed successfully!' : 'প্রেসক্রিপশন সফলভাবে বিশ্লেষণ হয়েছে!');
      setExpandedId(prescription.id);
      fetchPrescriptions();
    } catch (err: any) {
      console.error('Upload/analysis error:', err);
      toast.error(lang === 'en' ? 'Failed to process prescription' : 'প্রেসক্রিপশন প্রক্রিয়া ব্যর্থ হয়েছে');
    } finally {
      setUploading(false);
      setAnalyzing(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    if (!authUser) return;
    try {
      const path = imageUrl.split('/prescriptions/')[1];
      if (path) await supabase.storage.from('prescriptions').remove([path]);
      await supabase.from('prescriptions').delete().eq('id', id);
      toast.success(lang === 'en' ? 'Prescription deleted' : 'প্রেসক্রিপশন মুছে ফেলা হয়েছে');
      fetchPrescriptions();
    } catch {
      toast.error(lang === 'en' ? 'Failed to delete' : 'মুছতে ব্যর্থ');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {lang === 'en' ? '📋 Prescription Manager' : '📋 প্রেসক্রিপশন ম্যানেজার'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === 'en'
              ? 'Upload prescriptions for AI analysis — get medicine schedules, diet & exercise guidance'
              : 'AI বিশ্লেষণের জন্য প্রেসক্রিপশন আপলোড করুন — ওষুধের সময়সূচী, ডায়েট ও ব্যায়াম নির্দেশনা পান'}
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-full bg-primary/10">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-lg text-foreground">
                  {lang === 'en' ? 'Upload Prescription' : 'প্রেসক্রিপশন আপলোড করুন'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === 'en' ? 'Take a photo or upload PDF/image of your prescription' : 'আপনার প্রেসক্রিপশনের ছবি তুলুন বা PDF/ছবি আপলোড করুন'}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="gradient-primary border-0"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Image className="h-4 w-4 mr-2" />}
                  {lang === 'en' ? 'Choose File' : 'ফাইল নির্বাচন করুন'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {lang === 'en' ? 'Supports JPG, PNG, WebP, PDF (max 10MB)' : 'JPG, PNG, WebP, PDF সমর্থিত (সর্বোচ্চ ১০MB)'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions List */}
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {lang === 'en' ? 'No prescriptions uploaded yet' : 'এখনো কোনো প্রেসক্রিপশন আপলোড করা হয়নি'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => {
              const isExpanded = expandedId === rx.id;
              const isAnalyzing = analyzing === rx.id || rx.analysis_status === 'analyzing';

              return (
                <Card key={rx.id} className="overflow-hidden">
                  {/* Header row */}
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : rx.id)}
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {rx.file_type === 'pdf' ? (
                        <div className="w-full h-full flex items-center justify-center bg-destructive/10">
                          <FileText className="h-8 w-8 text-destructive" />
                        </div>
                      ) : (
                        <img src={rx.image_url} alt="Prescription" className="w-full h-full object-cover" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground truncate">
                          {rx.doctor_name
                            ? `Dr. ${rx.doctor_name}`
                            : (lang === 'en' ? 'Prescription' : 'প্রেসক্রিপশন')}
                        </p>
                        {isAnalyzing ? (
                          <Badge variant="secondary" className="gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {lang === 'en' ? 'Analyzing...' : 'বিশ্লেষণ হচ্ছে...'}
                          </Badge>
                        ) : rx.analysis_status === 'completed' ? (
                          <Badge className="bg-success/10 text-success border-success/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {lang === 'en' ? 'Analyzed' : 'বিশ্লেষিত'}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {lang === 'en' ? 'Pending' : 'অপেক্ষমাণ'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(rx.created_at)}
                        {rx.diagnosis && ` • ${rx.diagnosis}`}
                      </p>
                      {rx.medicines.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <Pill className="h-3 w-3 inline mr-1" />
                          {rx.medicines.length} {lang === 'en' ? 'medicines' : 'ওষুধ'}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleDelete(rx.id, rx.image_url); }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && rx.analysis_status === 'completed' && (
                    <div className="border-t border-border p-4 space-y-6 bg-muted/20">
                      {/* AI Summary */}
                      {rx.raw_analysis && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <h4 className="font-heading font-semibold text-foreground mb-2">
                            🤖 {lang === 'en' ? 'AI Analysis Summary' : 'AI বিশ্লেষণের সারাংশ'}
                          </h4>
                          <p className="text-sm text-foreground/80">
                            {lang === 'en' ? rx.raw_analysis.summary_en : (rx.raw_analysis.summary_bn || rx.raw_analysis.summary_en)}
                          </p>
                        </div>
                      )}

                      {/* Medicines */}
                      {rx.medicines.length > 0 && (
                        <div>
                          <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Pill className="h-5 w-5 text-primary" />
                            {lang === 'en' ? 'Medicine Schedule' : 'ওষুধের সময়সূচী'}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {rx.medicines.map((med, idx) => (
                              <Card key={idx} className="bg-card">
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex items-start justify-between">
                                    <h5 className="font-semibold text-foreground">{med.name}</h5>
                                    <Badge variant="outline" className="text-xs">{med.dosage}</Badge>
                                  </div>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <p className="flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5" />
                                      {med.frequency}
                                    </p>
                                    {med.duration && <p>📅 {lang === 'en' ? 'Duration' : 'সময়কাল'}: {med.duration}</p>}
                                    {med.timing && <p>⏰ {med.timing}</p>}
                                    {med.instructions && (
                                      <p className="text-xs bg-warning/10 text-warning rounded px-2 py-1 mt-1">
                                        ⚠️ {med.instructions}
                                      </p>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Dietary Restrictions */}
                      {rx.dietary_restrictions.length > 0 && (
                        <div>
                          <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-success" />
                            {lang === 'en' ? 'Dietary Recommendations' : 'খাদ্যতালিকা সংক্রান্ত সুপারিশ'}
                          </h4>
                          <div className="space-y-2">
                            {rx.dietary_restrictions.map((dr, idx) => (
                              <div key={idx} className="flex items-start gap-3 bg-success/5 border border-success/20 rounded-lg p-3">
                                <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <Utensils className="h-3 w-3 text-success" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{dr.restriction}</p>
                                  <p className="text-xs text-muted-foreground">{dr.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exercise Restrictions */}
                      {rx.exercise_restrictions.length > 0 && (
                        <div>
                          <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Dumbbell className="h-5 w-5 text-info" />
                            {lang === 'en' ? 'Exercise Recommendations' : 'ব্যায়াম সংক্রান্ত সুপারিশ'}
                          </h4>
                          <div className="space-y-2">
                            {rx.exercise_restrictions.map((er, idx) => (
                              <div key={idx} className="flex items-start gap-3 bg-info/5 border border-info/20 rounded-lg p-3">
                                <div className="w-6 h-6 rounded-full bg-info/10 flex items-center justify-center shrink-0 mt-0.5">
                                  <Dumbbell className="h-3 w-3 text-info" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{er.restriction}</p>
                                  <p className="text-xs text-muted-foreground">{er.reason}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prescription Image */}
                      {rx.file_type !== 'pdf' && (
                        <div>
                          <h4 className="font-heading font-semibold text-foreground mb-3">
                            {lang === 'en' ? 'Original Prescription' : 'মূল প্রেসক্রিপশন'}
                          </h4>
                          <img src={rx.image_url} alt="Prescription" className="max-w-md rounded-lg border border-border" />
                        </div>
                      )}

                      {/* Note about plan integration */}
                      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                        <p className="text-sm text-foreground/80">
                          💡 {lang === 'en'
                            ? 'Your diet and exercise plans will automatically adapt based on these prescription restrictions. Generate new plans from the Diet Plan or Exercise page to see updated recommendations.'
                            : 'আপনার ডায়েট ও ব্যায়ামের পরিকল্পনা এই প্রেসক্রিপশনের নিষেধাজ্ঞার ভিত্তিতে স্বয়ংক্রিয়ভাবে আপডেট হবে। আপডেট করা সুপারিশ দেখতে ডায়েট প্ল্যান বা ব্যায়াম পৃষ্ঠা থেকে নতুন পরিকল্পনা তৈরি করুন।'}
                        </p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
