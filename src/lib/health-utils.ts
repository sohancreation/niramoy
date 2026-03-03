import type { UserProfile } from '@/contexts/UserContext';

export function calculateBMR(user: UserProfile): number {
  // Mifflin-St Jeor
  if (user.gender === 'male') {
    return 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
  }
  return 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
}

export function calculateTDEE(user: UserProfile): number {
  const bmr = calculateBMR(user);
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 };
  return Math.round(bmr * multipliers[user.activityLevel]);
}

export function calculateBMI(weight: number, heightCm: number): number {
  const hm = heightCm / 100;
  return Math.round((weight / (hm * hm)) * 10) / 10;
}

export type Goal = 'weightLoss' | 'maintenance' | 'muscleGain';
export type FoodPref = 'veg' | 'nonVeg' | 'mixed';

export interface DayMealPlan {
  day: string;
  dayBn: string;
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snacks: string[];
}

export interface MealPlan {
  days: DayMealPlan[];
  totalCalories: number;
  waterLiters: number;
}

const DAYS = [
  { en: 'Saturday', bn: 'শনিবার' },
  { en: 'Sunday', bn: 'রবিবার' },
  { en: 'Monday', bn: 'সোমবার' },
  { en: 'Tuesday', bn: 'মঙ্গলবার' },
  { en: 'Wednesday', bn: 'বুধবার' },
  { en: 'Thursday', bn: 'বৃহস্পতিবার' },
  { en: 'Friday', bn: 'শুক্রবার' },
];

export function generateDietPlan(user: UserProfile, goal: Goal, foodPref: FoodPref): MealPlan {
  const tdee = calculateTDEE(user);
  let targetCal = tdee;
  if (goal === 'weightLoss') targetCal = Math.round(tdee * 0.8);
  if (goal === 'muscleGain') targetCal = Math.round(tdee * 1.15);

  const allBreakfasts = {
    veg: [
      'Oatmeal with banana & almonds (350 cal)', 'Vegetable upma with coconut chutney (300 cal)',
      'Smoothie bowl with chia seeds (320 cal)', 'Poha with peanuts & lemon (280 cal)',
      'Idli with sambar (300 cal)', 'Muesli with yogurt & fruits (320 cal)',
      'Paratha with curd & pickle (340 cal)', 'Cornflakes with warm milk (250 cal)',
      'Cheela (besan) with mint chutney (290 cal)', 'Dalia with vegetables (310 cal)',
    ],
    nonVeg: [
      'Egg white omelette with toast (320 cal)', 'Chicken sausage with scrambled eggs (380 cal)',
      'Protein smoothie with banana (350 cal)', 'Boiled eggs with multigrain bread (300 cal)',
      'Egg bhurji with paratha (370 cal)', 'French toast with eggs (340 cal)',
      'Tuna sandwich with salad (360 cal)', 'Egg fried rice (light) (330 cal)',
      'Omelette wrap with veggies (310 cal)', 'Egg & avocado toast (350 cal)',
    ],
  };

  const allLunches = {
    veg: [
      'Brown rice, dal, mixed veg curry (450 cal)', 'Quinoa salad with chickpeas (400 cal)',
      'Roti with paneer bhurji & salad (420 cal)', 'Vegetable biryani with raita (460 cal)',
      'Chole with brown rice (430 cal)', 'Rajma rice with salad (440 cal)',
      'Lentil soup with multigrain bread (380 cal)', 'Vegetable pulao with curd (410 cal)',
      'Palak paneer with roti (420 cal)', 'Mixed dal khichdi with pickle (390 cal)',
    ],
    nonVeg: [
      'Grilled chicken with rice & veggies (500 cal)', 'Fish curry with brown rice (480 cal)',
      'Chicken salad with olive oil (420 cal)', 'Chicken biryani with raita (520 cal)',
      'Egg fried rice with veggies (450 cal)', 'Grilled fish with sweet potato (460 cal)',
      'Chicken wrap with salad (440 cal)', 'Shrimp stir-fry with rice (470 cal)',
      'Turkey sandwich with soup (430 cal)', 'Chicken curry with roti (490 cal)',
    ],
  };

  const allDinners = {
    veg: [
      'Khichdi with curd & salad (380 cal)', 'Veg stir-fry with tofu & rice (400 cal)',
      'Multigrain roti with dal & sabzi (370 cal)', 'Chapati with mixed dal (360 cal)',
      'Soup with whole grain bread (300 cal)', 'Grilled paneer with veggies (380 cal)',
      'Vegetable curry with quinoa (390 cal)', 'Mushroom rice with raita (370 cal)',
      'Stuffed paratha with curd (360 cal)', 'Moong dal chilla with chutney (330 cal)',
    ],
    nonVeg: [
      'Baked salmon with sweet potato (450 cal)', 'Chicken soup with bread (380 cal)',
      'Egg curry with roti & salad (400 cal)', 'Grilled fish with veggies (420 cal)',
      'Chicken stew with rice (410 cal)', 'Omelette with toast & salad (340 cal)',
      'Fish fry with mashed potato (430 cal)', 'Chicken tikka with roti (440 cal)',
      'Egg bhurji with chapati (370 cal)', 'Tandoori chicken with salad (400 cal)',
    ],
  };

  const allSnacks = [
    'Mixed nuts (150 cal)', 'Fruit salad (120 cal)', 'Roasted makhana (100 cal)',
    'Boiled eggs (140 cal)', 'Greek yogurt with berries (160 cal)', 'Trail mix (160 cal)',
    'Apple with peanut butter (180 cal)', 'Dates with almonds (150 cal)',
    'Popcorn (100 cal)', 'Hummus with carrots (130 cal)',
    'Protein bar (180 cal)', 'Banana shake (170 cal)',
    'Sprout chaat (130 cal)', 'Yogurt parfait (140 cal)',
  ];

  const pick = (arr: string[], count: number, avoid: Set<string>): string[] => {
    const available = arr.filter(x => !avoid.has(x));
    const result: string[] = [];
    for (let i = 0; i < count && available.length > 0; i++) {
      const idx = Math.floor(Math.random() * available.length);
      result.push(available.splice(idx, 1)[0]);
    }
    return result;
  };

  const usedBreakfasts = new Set<string>();
  const usedLunches = new Set<string>();
  const usedDinners = new Set<string>();
  const usedSnacks = new Set<string>();

  const bfPool = foodPref === 'veg' ? allBreakfasts.veg : foodPref === 'nonVeg' ? allBreakfasts.nonVeg : [...allBreakfasts.veg, ...allBreakfasts.nonVeg];
  const lPool = foodPref === 'veg' ? allLunches.veg : foodPref === 'nonVeg' ? allLunches.nonVeg : [...allLunches.veg, ...allLunches.nonVeg];
  const dPool = foodPref === 'veg' ? allDinners.veg : foodPref === 'nonVeg' ? allDinners.nonVeg : [...allDinners.veg, ...allDinners.nonVeg];

  const days: DayMealPlan[] = DAYS.map(dayInfo => {
    const bf = pick(bfPool, 2, usedBreakfasts);
    bf.forEach(x => usedBreakfasts.add(x));
    const ln = pick(lPool, 2, usedLunches);
    ln.forEach(x => usedLunches.add(x));
    const dn = pick(dPool, 2, usedDinners);
    dn.forEach(x => usedDinners.add(x));
    const sn = pick(allSnacks, 2, usedSnacks);
    sn.forEach(x => usedSnacks.add(x));

    // Reset used sets after 5 days to allow some repeat
    if (usedBreakfasts.size > bfPool.length - 3) usedBreakfasts.clear();
    if (usedLunches.size > lPool.length - 3) usedLunches.clear();
    if (usedDinners.size > dPool.length - 3) usedDinners.clear();
    if (usedSnacks.size > allSnacks.length - 3) usedSnacks.clear();

    return { day: dayInfo.en, dayBn: dayInfo.bn, breakfast: bf, lunch: ln, dinner: dn, snacks: sn };
  });

  const waterLiters = Math.round((user.weight * 0.033) * 10) / 10;
  return { days, totalCalories: targetCal, waterLiters };
}

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type Equipment = 'none' | 'home' | 'gym';

export interface ExerciseDay {
  day: string;
  exercises: { name: string; sets: string; calories: number }[];
  isRest: boolean;
}

export function generateExercisePlan(goal: Goal, level: FitnessLevel, equipment: Equipment): ExerciseDay[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const exercises: Record<string, { name: string; sets: string; calories: number }[]> = {
    'beginner-none': [
      { name: 'Walking (30 min)', sets: '1 session', calories: 150 },
      { name: 'Bodyweight Squats', sets: '3 x 10', calories: 50 },
      { name: 'Push-ups (knee)', sets: '3 x 8', calories: 40 },
      { name: 'Plank', sets: '3 x 20 sec', calories: 30 },
      { name: 'Jumping Jacks', sets: '3 x 15', calories: 60 },
    ],
    'beginner-home': [
      { name: 'Resistance Band Squats', sets: '3 x 12', calories: 60 },
      { name: 'Dumbbell Curls', sets: '3 x 10', calories: 40 },
      { name: 'Step-ups', sets: '3 x 10 each', calories: 70 },
      { name: 'Yoga Stretching', sets: '15 min', calories: 50 },
      { name: 'Crunches', sets: '3 x 15', calories: 35 },
    ],
    'intermediate-none': [
      { name: 'Running (30 min)', sets: '1 session', calories: 300 },
      { name: 'Burpees', sets: '4 x 10', calories: 100 },
      { name: 'Push-ups', sets: '4 x 15', calories: 60 },
      { name: 'Lunges', sets: '4 x 12 each', calories: 80 },
      { name: 'Mountain Climbers', sets: '3 x 20', calories: 70 },
    ],
    'intermediate-home': [
      { name: 'Dumbbell Bench Press', sets: '4 x 12', calories: 80 },
      { name: 'Dumbbell Rows', sets: '4 x 10', calories: 70 },
      { name: 'Jump Squats', sets: '3 x 15', calories: 90 },
      { name: 'Plank Variations', sets: '3 x 30 sec', calories: 40 },
      { name: 'Bicycle Crunches', sets: '3 x 20', calories: 50 },
    ],
    'advanced-gym': [
      { name: 'Barbell Squat', sets: '5 x 5', calories: 150 },
      { name: 'Deadlift', sets: '5 x 5', calories: 160 },
      { name: 'Bench Press', sets: '4 x 8', calories: 120 },
      { name: 'Pull-ups', sets: '4 x 10', calories: 90 },
      { name: 'Overhead Press', sets: '4 x 8', calories: 80 },
    ],
  };

  const key = `${level}-${equipment}`;
  const exList = exercises[key] || exercises['beginner-none']!;

  return days.map((day, i) => {
    if (i === 6 || (level === 'beginner' && i === 3)) {
      return { day, exercises: [], isRest: true };
    }
    const dayExercises = exList.slice(0, level === 'beginner' ? 3 : level === 'intermediate' ? 4 : 5);
    return { day, exercises: dayExercises, isRest: false };
  });
}

export interface Remedy {
  condition: string;
  conditionBn: string;
  remedies: { en: string; bn: string }[];
  warning: boolean;
}

export const homeRemedies: Remedy[] = [
  {
    condition: 'Common Cold',
    conditionBn: 'সর্দি-কাশি',
    remedies: [
      { en: 'Drink warm ginger-lemon-honey tea 3 times daily', bn: 'দিনে ৩ বার গরম আদা-লেবু-মধু চা পান করুন' },
      { en: 'Steam inhalation with eucalyptus oil for 10 minutes', bn: '১০ মিনিট ইউক্যালিপটাস তেল দিয়ে ভাপ নিন' },
      { en: 'Gargle with warm salt water twice daily', bn: 'দিনে দুইবার গরম লবণ পানি দিয়ে গড়গড়া করুন' },
    ],
    warning: true,
  },
  {
    condition: 'Headache',
    conditionBn: 'মাথাব্যথা',
    remedies: [
      { en: 'Apply peppermint oil on temples and forehead', bn: 'কপাল এবং মাথার দুই পাশে পিপারমিন্ট তেল লাগান' },
      { en: 'Stay hydrated — drink at least 2 glasses of water', bn: 'হাইড্রেটেড থাকুন — কমপক্ষে ২ গ্লাস পানি পান করুন' },
      { en: 'Rest in a dark, quiet room for 20 minutes', bn: '২০ মিনিট অন্ধকার, শান্ত ঘরে বিশ্রাম নিন' },
    ],
    warning: true,
  },
  {
    condition: 'Indigestion',
    conditionBn: 'বদহজম',
    remedies: [
      { en: 'Drink warm water with lemon and a pinch of baking soda', bn: 'লেবু এবং সামান্য বেকিং সোডা দিয়ে গরম পানি পান করুন' },
      { en: 'Chew fennel seeds after meals', bn: 'খাওয়ার পর মৌরি চিবিয়ে খান' },
      { en: 'Eat smaller, more frequent meals throughout the day', bn: 'সারাদিন ছোট ছোট করে বেশিবার খান' },
    ],
    warning: true,
  },
  {
    condition: 'Mild Fever',
    conditionBn: 'হালকা জ্বর',
    remedies: [
      { en: 'Apply a cool, damp cloth on the forehead', bn: 'কপালে ঠান্ডা, ভেজা কাপড় রাখুন' },
      { en: 'Drink plenty of fluids — water, ORS, coconut water', bn: 'প্রচুর তরল পান করুন — পানি, ওআরএস, ডাবের পানি' },
      { en: 'Take light food like khichdi or soup', bn: 'হালকা খাবার খান যেমন খিচুড়ি বা স্যুপ' },
    ],
    warning: true,
  },
  {
    condition: 'Sore Throat',
    conditionBn: 'গলা ব্যথা',
    remedies: [
      { en: 'Gargle with warm salt water 3-4 times daily', bn: 'দিনে ৩-৪ বার গরম লবণ পানি দিয়ে গড়গড়া করুন' },
      { en: 'Drink warm turmeric milk before bed', bn: 'ঘুমানোর আগে গরম হলুদ দুধ পান করুন' },
      { en: 'Suck on honey and ginger lozenges', bn: 'মধু এবং আদার লজেন্স চুষুন' },
    ],
    warning: true,
  },
];

export interface HealthLog {
  date: string;
  weight?: number;
  bp?: string;
  water?: number;
  exercise?: boolean;
  sleep?: number;
}

export function getHealthLogs(): HealthLog[] {
  const saved = localStorage.getItem('hm-health-logs');
  return saved ? JSON.parse(saved) : [];
}

export function saveHealthLog(log: HealthLog) {
  const logs = getHealthLogs();
  const idx = logs.findIndex(l => l.date === log.date);
  if (idx >= 0) {
    logs[idx] = { ...logs[idx], ...log };
  } else {
    logs.push(log);
  }
  localStorage.setItem('hm-health-logs', JSON.stringify(logs));
}

export function getStreak(): number {
  const logs = getHealthLogs().sort((a, b) => b.date.localeCompare(a.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < logs.length; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA');
    if (logs.find(l => l.date === dateStr)) {
      streak++;
    } else break;
  }
  return streak;
}
