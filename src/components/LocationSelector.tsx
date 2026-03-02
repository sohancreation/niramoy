import React, { useMemo, useState, useEffect } from 'react';
import { bangladeshDivisions } from '@/lib/bangladesh-locations';
import { type Language } from '@/lib/translations';

interface LocationSelectorProps {
  value: string;
  onChange: (val: string) => void;
  lang: Language;
}

export default function LocationSelector({ value, onChange, lang }: LocationSelectorProps) {
  // Parse existing value: "Upazilla, District, Division"
  const parts = value ? value.split(', ') : [];
  const [division, setDivision] = useState(parts[2] || '');
  const [district, setDistrict] = useState(parts[1] || '');
  const [upazilla, setUpazilla] = useState(parts[0] || '');

  // Sync from external value changes
  useEffect(() => {
    const p = value ? value.split(', ') : [];
    setDivision(p[2] || '');
    setDistrict(p[1] || '');
    setUpazilla(p[0] || '');
  }, [value]);

  const selectedDivision = useMemo(
    () => bangladeshDivisions.find(d => d.en === division),
    [division]
  );

  const selectedDistrict = useMemo(
    () => selectedDivision?.districts.find(d => d.en === district),
    [selectedDivision, district]
  );

  const handleDivisionChange = (val: string) => {
    setDivision(val);
    setDistrict('');
    setUpazilla('');
    onChange('');
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setUpazilla('');
    onChange('');
  };

  const handleUpazillaChange = (val: string) => {
    setUpazilla(val);
    if (val && district && division) {
      onChange(`${val}, ${district}, ${division}`);
    }
  };

  const selectClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground";

  return (
    <div className="space-y-3">
      {/* Division */}
      <select className={selectClass} value={division} onChange={e => handleDivisionChange(e.target.value)}>
        <option value="">{lang === 'en' ? '-- Select Division --' : '-- বিভাগ নির্বাচন করুন --'}</option>
        {bangladeshDivisions.map(div => (
          <option key={div.en} value={div.en}>{lang === 'bn' ? div.bn : div.en}</option>
        ))}
      </select>

      {/* Zilla (District) */}
      {division && (
        <select className={selectClass} value={district} onChange={e => handleDistrictChange(e.target.value)}>
          <option value="">{lang === 'en' ? '-- Select Zilla --' : '-- জেলা নির্বাচন করুন --'}</option>
          {selectedDivision?.districts.map(dist => (
            <option key={dist.en} value={dist.en}>{lang === 'bn' ? dist.bn : dist.en}</option>
          ))}
        </select>
      )}

      {/* Upazilla */}
      {district && selectedDistrict && (
        <select className={selectClass} value={upazilla} onChange={e => handleUpazillaChange(e.target.value)}>
          <option value="">{lang === 'en' ? '-- Select Upazilla --' : '-- উপজেলা নির্বাচন করুন --'}</option>
          {selectedDistrict.upazillas.map(up => (
            <option key={up.en} value={up.en}>{lang === 'bn' ? up.bn : up.en}</option>
          ))}
        </select>
      )}
    </div>
  );
}
