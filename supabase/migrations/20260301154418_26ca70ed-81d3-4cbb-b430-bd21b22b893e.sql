
-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  doctor_name TEXT,
  diagnosis TEXT,
  medicines JSONB DEFAULT '[]'::jsonb,
  dietary_restrictions JSONB DEFAULT '[]'::jsonb,
  exercise_restrictions JSONB DEFAULT '[]'::jsonb,
  ai_summary TEXT,
  raw_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prescriptions" ON public.prescriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prescriptions" ON public.prescriptions FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public) VALUES ('prescriptions', 'prescriptions', true);

-- Storage policies
CREATE POLICY "Users can upload own prescriptions" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own prescriptions" ON storage.objects FOR SELECT USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own prescriptions" ON storage.objects FOR DELETE USING (bucket_id = 'prescriptions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public can view prescriptions" ON storage.objects FOR SELECT USING (bucket_id = 'prescriptions');
