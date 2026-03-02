import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { useLang } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { bangladeshDivisions } from '@/lib/bangladesh-locations';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, Phone, ExternalLink, AlertTriangle, Building2, Stethoscope, 
  Pill, Ambulance, Search, Star, Clock, Activity, UserRound 
} from 'lucide-react';

interface Facility {
  name: string;
  name_bn?: string;
  type: string;
  address: string;
  address_bn?: string;
  phone: string;
  emergency?: boolean;
  services?: string[];
  rating?: number;
  notes?: string;
}

const typeIcons: Record<string, React.ElementType> = {
  hospital: Building2,
  clinic: Stethoscope,
  pharmacy: Pill,
  ambulance: Ambulance,
  diagnostic: Activity,
  doctor: UserRound,
};

const typeColors: Record<string, string> = {
  hospital: 'bg-destructive/10 text-destructive border-destructive/20',
  clinic: 'bg-info/10 text-info border-info/20',
  pharmacy: 'bg-success/10 text-success border-success/20',
  ambulance: 'bg-warning/10 text-warning border-warning/20',
  diagnostic: 'bg-accent/10 text-accent border-accent/20',
  doctor: 'bg-primary/10 text-primary border-primary/20',
};

const typeLabels: Record<string, { en: string; bn: string }> = {
  all: { en: 'All', bn: 'সব' },
  hospital: { en: 'Hospitals', bn: 'হাসপাতাল' },
  clinic: { en: 'Clinics', bn: 'ক্লিনিক' },
  pharmacy: { en: 'Pharmacies', bn: 'ফার্মেসি' },
  diagnostic: { en: 'Diagnostic', bn: 'ডায়াগনস্টিক' },
  ambulance: { en: 'Ambulance', bn: 'অ্যাম্বুলেন্স' },
  doctor: { en: 'Doctors', bn: 'ডাক্তার' },
};

export default function FindCarePage() {
  const { lang } = useLang();
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [upazilla, setUpazilla] = useState('');
  const [careType, setCareType] = useState('all');
  const [results, setResults] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const selectedDivision = useMemo(
    () => bangladeshDivisions.find(d => d.en === division),
    [division]
  );
  const selectedDistrict = useMemo(
    () => selectedDivision?.districts.find(d => d.en === district),
    [selectedDivision, district]
  );

  const handleSearch = async () => {
    if (!district) return;
    setLoading(true);
    setSearched(true);
    setFilterType('all');

    try {
      const { data, error } = await supabase.functions.invoke('find-care', {
        body: { division, district, upazilla, careType: careType !== 'all' ? careType : undefined },
      });
      if (error) throw error;
      setResults(data?.facilities || []);
    } catch (e) {
      console.error('Find care error:', e);
      setResults([]);
    }
    setLoading(false);
  };

  const filtered = filterType === 'all' ? results : results.filter(r => r.type === filterType);
  const emergency = filtered.filter(r => r.emergency);
  const others = filtered.filter(r => !r.emergency);

  const selectClass = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
          <MapPin className="h-8 w-8 text-info" />
          {t('findCare', lang)}
        </h1>

        {/* Location Selector */}
        <div className="health-card space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            {lang === 'en' ? 'Select your area to find nearby healthcare facilities' : 'কাছের স্বাস্থ্যসেবা কেন্দ্র খুঁজতে আপনার এলাকা নির্বাচন করুন'}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Division */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {lang === 'en' ? 'Division' : 'বিভাগ'}
              </label>
              <select 
                className={selectClass} 
                value={division} 
                onChange={e => { setDivision(e.target.value); setDistrict(''); setUpazilla(''); }}
              >
                <option value="">{lang === 'en' ? '-- Select Division --' : '-- বিভাগ --'}</option>
                {bangladeshDivisions.map(div => (
                  <option key={div.en} value={div.en}>{lang === 'bn' ? div.bn : div.en}</option>
                ))}
              </select>
            </div>

            {/* Zilla */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {lang === 'en' ? 'Zilla (District)' : 'জেলা'}
              </label>
              <select 
                className={selectClass} 
                value={district} 
                onChange={e => { setDistrict(e.target.value); setUpazilla(''); }}
                disabled={!division}
              >
                <option value="">{lang === 'en' ? '-- Select Zilla --' : '-- জেলা --'}</option>
                {selectedDivision?.districts.map(dist => (
                  <option key={dist.en} value={dist.en}>{lang === 'bn' ? dist.bn : dist.en}</option>
                ))}
              </select>
            </div>

            {/* Upazilla */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                {lang === 'en' ? 'Upazilla' : 'উপজেলা'}
              </label>
              <select 
                className={selectClass} 
                value={upazilla} 
                onChange={e => setUpazilla(e.target.value)}
                disabled={!district}
              >
                <option value="">{lang === 'en' ? '-- Select Upazilla --' : '-- উপজেলা --'}</option>
                {selectedDistrict?.upazillas.map(up => (
                  <option key={up.en} value={up.en}>{lang === 'bn' ? up.bn : up.en}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Care Type Filter */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {lang === 'en' ? 'Looking for' : 'খুঁজছেন'}
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(typeLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCareType(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    careType === key 
                      ? 'gradient-primary text-primary-foreground border-transparent' 
                      : 'bg-secondary text-secondary-foreground border-border hover:bg-secondary/80'
                  }`}
                >
                  {label[lang]}
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={!district || loading} 
            className="gradient-primary border-0 text-primary-foreground w-full gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
                {lang === 'en' ? 'Searching...' : 'খোঁজা হচ্ছে...'}
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                {lang === 'en' ? 'Find Healthcare' : 'স্বাস্থ্যসেবা খুঁজুন'}
              </>
            )}
          </Button>
        </div>

        {/* Results */}
        {searched && !loading && (
          <div className="space-y-4 animate-in slide-in-from-bottom-4">
            {/* Result count & filter */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {results.length > 0 
                  ? `${filtered.length} ${lang === 'en' ? 'facilities found' : 'টি কেন্দ্র পাওয়া গেছে'}`
                  : (lang === 'en' ? 'No facilities found' : 'কোনো কেন্দ্র পাওয়া যায়নি')}
              </p>
              {results.length > 0 && (
                <div className="flex gap-1">
                  {['all', ...new Set(results.map(r => r.type))].map(type => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                        filterType === type ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {typeLabels[type]?.[lang] || type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Section */}
            {emergency.length > 0 && (
              <div className="rounded-xl border-2 border-destructive/30 bg-destructive/5 p-4 space-y-3">
                <h2 className="font-heading font-bold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {lang === 'en' ? '🚨 Emergency Services' : '🚨 জরুরি সেবা'}
                </h2>
                {emergency.map((c, i) => (
                  <FacilityCard key={i} facility={c} lang={lang} />
                ))}
              </div>
            )}

            {/* Other Results */}
            <div className="space-y-3">
              {others.map((c, i) => (
                <FacilityCard key={i} facility={c} lang={lang} />
              ))}
            </div>

            {results.length === 0 && (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {lang === 'en' ? 'No results found. Try selecting a different area.' : 'কোনো ফলাফল পাওয়া যায়নি। অন্য এলাকা নির্বাচন করুন।'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function FacilityCard({ facility, lang }: { facility: Facility; lang: 'en' | 'bn' }) {
  const Icon = typeIcons[facility.type] || Building2;
  const color = typeColors[facility.type] || 'bg-muted text-muted-foreground border-border';

  return (
    <div className="health-card flex flex-col sm:flex-row items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl border shrink-0 ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-heading font-semibold text-foreground leading-tight">
              {lang === 'bn' && facility.name_bn ? facility.name_bn : facility.name}
            </h3>
            {lang === 'bn' && facility.name_bn && (
              <p className="text-xs text-muted-foreground">{facility.name}</p>
            )}
          </div>
          {facility.emergency && (
            <Badge variant="destructive" className="shrink-0 text-[10px]">
              <Clock className="h-3 w-3 mr-1" /> 24/7
            </Badge>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          {lang === 'bn' && facility.address_bn ? facility.address_bn : facility.address}
        </p>

        {/* Rating */}
        {facility.rating && (
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={`h-3 w-3 ${i < facility.rating! ? 'text-warning fill-warning' : 'text-muted'}`} />
            ))}
            <span className="text-xs text-muted-foreground ml-1">{facility.rating}/5</span>
          </div>
        )}

        {/* Services */}
        {facility.services && facility.services.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {facility.services.map((s, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Notes */}
        {facility.notes && (
          <p className="text-xs text-muted-foreground/70 mt-1.5 italic">💡 {facility.notes}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3 flex-wrap">
          <a href={`tel:${facility.phone}`} className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
            <Phone className="h-3.5 w-3.5" /> {facility.phone}
          </a>
          <a 
            href={`https://www.google.com/maps/search/${encodeURIComponent(facility.name + ' ' + facility.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-info hover:underline font-medium"
          >
            <ExternalLink className="h-3 w-3" /> {lang === 'en' ? 'View on Maps' : 'ম্যাপে দেখুন'}
          </a>
        </div>
      </div>
    </div>
  );
}
