export interface Upazilla {
  en: string;
  bn: string;
}

export interface District {
  en: string;
  bn: string;
  upazillas: Upazilla[];
}

export interface Division {
  en: string;
  bn: string;
  districts: District[];
}

export const bangladeshDivisions: Division[] = [
  {
    en: 'Dhaka', bn: 'ঢাকা',
    districts: [
      { en: 'Dhaka', bn: 'ঢাকা', upazillas: [
        { en: 'Dhanmondi', bn: 'ধানমন্ডি' }, { en: 'Gulshan', bn: 'গুলশান' }, { en: 'Mirpur', bn: 'মিরপুর' },
        { en: 'Mohammadpur', bn: 'মোহাম্মদপুর' }, { en: 'Uttara', bn: 'উত্তরা' }, { en: 'Tejgaon', bn: 'তেজগাঁও' },
        { en: 'Demra', bn: 'ডেমরা' }, { en: 'Savar', bn: 'সাভার' }, { en: 'Keraniganj', bn: 'কেরানীগঞ্জ' },
        { en: 'Dhamrai', bn: 'ধামরাই' }, { en: 'Dohar', bn: 'দোহার' }, { en: 'Nawabganj', bn: 'নবাবগঞ্জ' },
      ]},
      { en: 'Gazipur', bn: 'গাজীপুর', upazillas: [
        { en: 'Gazipur Sadar', bn: 'গাজীপুর সদর' }, { en: 'Kaliakair', bn: 'কালিয়াকৈর' }, { en: 'Kaliganj', bn: 'কালীগঞ্জ' },
        { en: 'Kapasia', bn: 'কাপাসিয়া' }, { en: 'Sreepur', bn: 'শ্রীপুর' },
      ]},
      { en: 'Narayanganj', bn: 'নারায়ণগঞ্জ', upazillas: [
        { en: 'Narayanganj Sadar', bn: 'নারায়ণগঞ্জ সদর' }, { en: 'Araihazar', bn: 'আড়াইহাজার' }, { en: 'Bandar', bn: 'বন্দর' },
        { en: 'Rupganj', bn: 'রূপগঞ্জ' }, { en: 'Sonargaon', bn: 'সোনারগাঁও' },
      ]},
      { en: 'Tangail', bn: 'টাঙ্গাইল', upazillas: [
        { en: 'Tangail Sadar', bn: 'টাঙ্গাইল সদর' }, { en: 'Basail', bn: 'বাসাইল' }, { en: 'Bhuapur', bn: 'ভুঞাপুর' },
        { en: 'Delduar', bn: 'দেলদুয়ার' }, { en: 'Ghatail', bn: 'ঘাটাইল' }, { en: 'Gopalpur', bn: 'গোপালপুর' },
        { en: 'Kalihati', bn: 'কালিহাতি' }, { en: 'Madhupur', bn: 'মধুপুর' }, { en: 'Mirzapur', bn: 'মির্জাপুর' },
        { en: 'Nagarpur', bn: 'নাগরপুর' }, { en: 'Sakhipur', bn: 'সখিপুর' }, { en: 'Dhanbari', bn: 'ধনবাড়ী' },
      ]},
      { en: 'Kishoreganj', bn: 'কিশোরগঞ্জ', upazillas: [
        { en: 'Kishoreganj Sadar', bn: 'কিশোরগঞ্জ সদর' }, { en: 'Austagram', bn: 'অষ্টগ্রাম' }, { en: 'Bajitpur', bn: 'বাজিতপুর' },
        { en: 'Bhairab', bn: 'ভৈরব' }, { en: 'Hossainpur', bn: 'হোসেনপুর' }, { en: 'Itna', bn: 'ইটনা' },
        { en: 'Karimganj', bn: 'করিমগঞ্জ' }, { en: 'Katiadi', bn: 'কটিয়াদী' }, { en: 'Kuliarchar', bn: 'কুলিয়ারচর' },
        { en: 'Mithamain', bn: 'মিঠামইন' }, { en: 'Nikli', bn: 'নিকলী' }, { en: 'Pakundia', bn: 'পাকুন্দিয়া' },
        { en: 'Tarail', bn: 'তাড়াইল' },
      ]},
      { en: 'Manikganj', bn: 'মানিকগঞ্জ', upazillas: [
        { en: 'Manikganj Sadar', bn: 'মানিকগঞ্জ সদর' }, { en: 'Daulatpur', bn: 'দৌলতপুর' }, { en: 'Ghior', bn: 'ঘিওর' },
        { en: 'Harirampur', bn: 'হরিরামপুর' }, { en: 'Saturia', bn: 'সাটুরিয়া' }, { en: 'Shivalaya', bn: 'শিবালয়' }, { en: 'Singair', bn: 'সিংগাইর' },
      ]},
      { en: 'Munshiganj', bn: 'মুন্সীগঞ্জ', upazillas: [
        { en: 'Munshiganj Sadar', bn: 'মুন্সীগঞ্জ সদর' }, { en: 'Gazaria', bn: 'গজারিয়া' }, { en: 'Lohajang', bn: 'লৌহজং' },
        { en: 'Sirajdikhan', bn: 'সিরাজদিখান' }, { en: 'Sreenagar', bn: 'শ্রীনগর' }, { en: 'Tongibari', bn: 'টঙ্গীবাড়ী' },
      ]},
      { en: 'Narsingdi', bn: 'নরসিংদী', upazillas: [
        { en: 'Narsingdi Sadar', bn: 'নরসিংদী সদর' }, { en: 'Belabo', bn: 'বেলাবো' }, { en: 'Monohardi', bn: 'মনোহরদী' },
        { en: 'Palash', bn: 'পলাশ' }, { en: 'Raipura', bn: 'রায়পুরা' }, { en: 'Shibpur', bn: 'শিবপুর' },
      ]},
      { en: 'Faridpur', bn: 'ফরিদপুর', upazillas: [
        { en: 'Faridpur Sadar', bn: 'ফরিদপুর সদর' }, { en: 'Alfadanga', bn: 'আলফাডাঙ্গা' }, { en: 'Bhanga', bn: 'ভাঙ্গা' },
        { en: 'Boalmari', bn: 'বোয়ালমারী' }, { en: 'Charbhadrasan', bn: 'চরভদ্রাসন' }, { en: 'Madhukhali', bn: 'মধুখালী' },
        { en: 'Nagarkanda', bn: 'নগরকান্দা' }, { en: 'Sadarpur', bn: 'সদরপুর' }, { en: 'Saltha', bn: 'সালথা' },
      ]},
      { en: 'Gopalganj', bn: 'গোপালগঞ্জ', upazillas: [
        { en: 'Gopalganj Sadar', bn: 'গোপালগঞ্জ সদর' }, { en: 'Kashiani', bn: 'কাশিয়ানী' }, { en: 'Kotalipara', bn: 'কোটালীপাড়া' },
        { en: 'Muksudpur', bn: 'মুকসুদপুর' }, { en: 'Tungipara', bn: 'টুঙ্গিপাড়া' },
      ]},
      { en: 'Madaripur', bn: 'মাদারীপুর', upazillas: [
        { en: 'Madaripur Sadar', bn: 'মাদারীপুর সদর' }, { en: 'Kalkini', bn: 'কালকিনি' }, { en: 'Rajoir', bn: 'রাজৈর' }, { en: 'Shibchar', bn: 'শিবচর' },
      ]},
      { en: 'Rajbari', bn: 'রাজবাড়ী', upazillas: [
        { en: 'Rajbari Sadar', bn: 'রাজবাড়ী সদর' }, { en: 'Baliakandi', bn: 'বালিয়াকান্দি' }, { en: 'Goalandaghat', bn: 'গোয়ালন্দ' },
        { en: 'Pangsha', bn: 'পাংশা' }, { en: 'Kalukhali', bn: 'কালুখালী' },
      ]},
      { en: 'Shariatpur', bn: 'শরীয়তপুর', upazillas: [
        { en: 'Shariatpur Sadar', bn: 'শরীয়তপুর সদর' }, { en: 'Bhedarganj', bn: 'ভেদরগঞ্জ' }, { en: 'Damudya', bn: 'ডামুড্যা' },
        { en: 'Gosairhat', bn: 'গোসাইরহাট' }, { en: 'Naria', bn: 'নড়িয়া' }, { en: 'Zanjira', bn: 'জাজিরা' },
      ]},
    ],
  },
  {
    en: 'Chattogram', bn: 'চট্টগ্রাম',
    districts: [
      { en: 'Chattogram', bn: 'চট্টগ্রাম', upazillas: [
        { en: 'Chattogram Sadar', bn: 'চট্টগ্রাম সদর' }, { en: 'Anwara', bn: 'আনোয়ারা' }, { en: 'Banshkhali', bn: 'বাঁশখালী' },
        { en: 'Boalkhali', bn: 'বোয়ালখালী' }, { en: 'Chandanaish', bn: 'চন্দনাইশ' }, { en: 'Fatikchhari', bn: 'ফটিকছড়ি' },
        { en: 'Hathazari', bn: 'হাটহাজারী' }, { en: 'Lohagara', bn: 'লোহাগাড়া' }, { en: 'Mirsharai', bn: 'মীরসরাই' },
        { en: 'Patiya', bn: 'পটিয়া' }, { en: 'Rangunia', bn: 'রাঙ্গুনিয়া' }, { en: 'Raozan', bn: 'রাউজান' },
        { en: 'Sandwip', bn: 'সন্দ্বীপ' }, { en: 'Satkania', bn: 'সাতকানিয়া' }, { en: 'Sitakunda', bn: 'সীতাকুণ্ড' },
      ]},
      { en: "Cox's Bazar", bn: 'কক্সবাজার', upazillas: [
        { en: "Cox's Bazar Sadar", bn: 'কক্সবাজার সদর' }, { en: 'Chakaria', bn: 'চকরিয়া' }, { en: 'Kutubdia', bn: 'কুতুবদিয়া' },
        { en: 'Maheshkhali', bn: 'মহেশখালী' }, { en: 'Pekua', bn: 'পেকুয়া' }, { en: 'Ramu', bn: 'রামু' },
        { en: 'Teknaf', bn: 'টেকনাফ' }, { en: 'Ukhia', bn: 'উখিয়া' },
      ]},
      { en: 'Comilla', bn: 'কুমিল্লা', upazillas: [
        { en: 'Comilla Sadar', bn: 'কুমিল্লা সদর' }, { en: 'Barura', bn: 'বরুড়া' }, { en: 'Brahmanpara', bn: 'ব্রাহ্মণপাড়া' },
        { en: 'Burichang', bn: 'বুড়িচং' }, { en: 'Chandina', bn: 'চান্দিনা' }, { en: 'Chauddagram', bn: 'চৌদ্দগ্রাম' },
        { en: 'Daudkandi', bn: 'দাউদকান্দি' }, { en: 'Debidwar', bn: 'দেবিদ্বার' }, { en: 'Homna', bn: 'হোমনা' },
        { en: 'Laksam', bn: 'লাকসাম' }, { en: 'Muradnagar', bn: 'মুরাদনগর' }, { en: 'Nangalkot', bn: 'নাঙ্গলকোট' },
        { en: 'Titas', bn: 'তিতাস' },
      ]},
      { en: 'Feni', bn: 'ফেনী', upazillas: [
        { en: 'Feni Sadar', bn: 'ফেনী সদর' }, { en: 'Chhagalnaiya', bn: 'ছাগলনাইয়া' }, { en: 'Daganbhuiyan', bn: 'দাগনভূঁইয়া' },
        { en: 'Parshuram', bn: 'পরশুরাম' }, { en: 'Sonagazi', bn: 'সোনাগাজী' }, { en: 'Fulgazi', bn: 'ফুলগাজী' },
      ]},
      { en: 'Brahmanbaria', bn: 'ব্রাহ্মণবাড়িয়া', upazillas: [
        { en: 'Brahmanbaria Sadar', bn: 'ব্রাহ্মণবাড়িয়া সদর' }, { en: 'Akhaura', bn: 'আখাউড়া' }, { en: 'Ashuganj', bn: 'আশুগঞ্জ' },
        { en: 'Bancharampur', bn: 'বাঞ্ছারামপুর' }, { en: 'Kasba', bn: 'কসবা' }, { en: 'Nabinagar', bn: 'নবীনগর' },
        { en: 'Nasirnagar', bn: 'নাসিরনগর' }, { en: 'Sarail', bn: 'সরাইল' }, { en: 'Bijoynagar', bn: 'বিজয়নগর' },
      ]},
      { en: 'Rangamati', bn: 'রাঙামাটি', upazillas: [
        { en: 'Rangamati Sadar', bn: 'রাঙামাটি সদর' }, { en: 'Bagaichhari', bn: 'বাঘাইছড়ি' }, { en: 'Barkal', bn: 'বরকল' },
        { en: 'Belaichhari', bn: 'বিলাইছড়ি' }, { en: 'Juraichhari', bn: 'জুরাছড়ি' }, { en: 'Kaptai', bn: 'কাপ্তাই' },
        { en: 'Kawkhali', bn: 'কাউখালী' }, { en: 'Langadu', bn: 'লংগদু' }, { en: 'Naniarchar', bn: 'নানিয়ারচর' }, { en: 'Rajasthali', bn: 'রাজস্থলী' },
      ]},
      { en: 'Noakhali', bn: 'নোয়াখালী', upazillas: [
        { en: 'Noakhali Sadar', bn: 'নোয়াখালী সদর' }, { en: 'Begumganj', bn: 'বেগমগঞ্জ' }, { en: 'Chatkhil', bn: 'চাটখিল' },
        { en: 'Companiganj', bn: 'কোম্পানীগঞ্জ' }, { en: 'Hatiya', bn: 'হাতিয়া' }, { en: 'Kabirhat', bn: 'কবিরহাট' },
        { en: 'Senbagh', bn: 'সেনবাগ' }, { en: 'Sonaimuri', bn: 'সোনাইমুড়ী' }, { en: 'Subarnachar', bn: 'সুবর্ণচর' },
      ]},
      { en: 'Chandpur', bn: 'চাঁদপুর', upazillas: [
        { en: 'Chandpur Sadar', bn: 'চাঁদপুর সদর' }, { en: 'Faridganj', bn: 'ফরিদগঞ্জ' }, { en: 'Haimchar', bn: 'হাইমচর' },
        { en: 'Haziganj', bn: 'হাজীগঞ্জ' }, { en: 'Kachua', bn: 'কচুয়া' }, { en: 'Matlab Dakshin', bn: 'মতলব দক্ষিণ' },
        { en: 'Matlab Uttar', bn: 'মতলব উত্তর' }, { en: 'Shahrasti', bn: 'শাহরাস্তি' },
      ]},
      { en: 'Lakshmipur', bn: 'লক্ষ্মীপুর', upazillas: [
        { en: 'Lakshmipur Sadar', bn: 'লক্ষ্মীপুর সদর' }, { en: 'Kamalnagar', bn: 'কমলনগর' }, { en: 'Raipur', bn: 'রায়পুর' },
        { en: 'Ramganj', bn: 'রামগঞ্জ' }, { en: 'Ramgati', bn: 'রামগতি' },
      ]},
      { en: 'Khagrachhari', bn: 'খাগড়াছড়ি', upazillas: [
        { en: 'Khagrachhari Sadar', bn: 'খাগড়াছড়ি সদর' }, { en: 'Dighinala', bn: 'দীঘিনালা' }, { en: 'Laxmichhari', bn: 'লক্ষ্মীছড়ি' },
        { en: 'Mahalchhari', bn: 'মহালছড়ি' }, { en: 'Manikchhari', bn: 'মানিকছড়ি' }, { en: 'Matiranga', bn: 'মাটিরাঙ্গা' },
        { en: 'Panchhari', bn: 'পানছড়ি' }, { en: 'Ramgarh', bn: 'রামগড়' },
      ]},
      { en: 'Bandarban', bn: 'বান্দরবান', upazillas: [
        { en: 'Bandarban Sadar', bn: 'বান্দরবান সদর' }, { en: 'Alikadam', bn: 'আলীকদম' }, { en: 'Lama', bn: 'লামা' },
        { en: 'Naikhongchhari', bn: 'নাইক্ষ্যংছড়ি' }, { en: 'Rowangchhari', bn: 'রোয়াংছড়ি' }, { en: 'Ruma', bn: 'রুমা' }, { en: 'Thanchi', bn: 'থানচি' },
      ]},
    ],
  },
  {
    en: 'Rajshahi', bn: 'রাজশাহী',
    districts: [
      { en: 'Rajshahi', bn: 'রাজশাহী', upazillas: [
        { en: 'Rajshahi Sadar', bn: 'রাজশাহী সদর' }, { en: 'Bagha', bn: 'বাঘা' }, { en: 'Bagmara', bn: 'বাগমারা' },
        { en: 'Charghat', bn: 'চারঘাট' }, { en: 'Durgapur', bn: 'দুর্গাপুর' }, { en: 'Godagari', bn: 'গোদাগাড়ী' },
        { en: 'Mohanpur', bn: 'মোহনপুর' }, { en: 'Paba', bn: 'পবা' }, { en: 'Puthia', bn: 'পুঠিয়া' }, { en: 'Tanore', bn: 'তানোর' },
      ]},
      { en: 'Bogura', bn: 'বগুড়া', upazillas: [
        { en: 'Bogura Sadar', bn: 'বগুড়া সদর' }, { en: 'Adamdighi', bn: 'আদমদীঘি' }, { en: 'Dhunat', bn: 'ধুনট' },
        { en: 'Dhupchanchia', bn: 'দুপচাঁচিয়া' }, { en: 'Gabtali', bn: 'গাবতলী' }, { en: 'Kahaloo', bn: 'কাহালু' },
        { en: 'Nandigram', bn: 'নন্দীগ্রাম' }, { en: 'Sariakandi', bn: 'সারিয়াকান্দি' }, { en: 'Shajahanpur', bn: 'শাজাহানপুর' },
        { en: 'Sherpur', bn: 'শেরপুর' }, { en: 'Shibganj', bn: 'শিবগঞ্জ' }, { en: 'Sonatala', bn: 'সোনাতলা' },
      ]},
      { en: 'Pabna', bn: 'পাবনা', upazillas: [
        { en: 'Pabna Sadar', bn: 'পাবনা সদর' }, { en: 'Atgharia', bn: 'আটঘরিয়া' }, { en: 'Bera', bn: 'বেড়া' },
        { en: 'Bhangura', bn: 'ভাঙ্গুড়া' }, { en: 'Chatmohar', bn: 'চাটমোহর' }, { en: 'Faridpur', bn: 'ফরিদপুর' },
        { en: 'Ishwardi', bn: 'ঈশ্বরদী' }, { en: 'Santhia', bn: 'সাঁথিয়া' }, { en: 'Sujanagar', bn: 'সুজানগর' },
      ]},
      { en: 'Sirajganj', bn: 'সিরাজগঞ্জ', upazillas: [
        { en: 'Sirajganj Sadar', bn: 'সিরাজগঞ্জ সদর' }, { en: 'Belkuchi', bn: 'বেলকুচি' }, { en: 'Chauhali', bn: 'চৌহালি' },
        { en: 'Kamarkhanda', bn: 'কামারখন্দ' }, { en: 'Kazipur', bn: 'কাজীপুর' }, { en: 'Raiganj', bn: 'রায়গঞ্জ' },
        { en: 'Shahjadpur', bn: 'শাহজাদপুর' }, { en: 'Tarash', bn: 'তাড়াশ' }, { en: 'Ullahpara', bn: 'উল্লাপাড়া' },
      ]},
      { en: 'Natore', bn: 'নাটোর', upazillas: [
        { en: 'Natore Sadar', bn: 'নাটোর সদর' }, { en: 'Bagatipara', bn: 'বাগাতিপাড়া' }, { en: 'Baraigram', bn: 'বড়াইগ্রাম' },
        { en: 'Gurudaspur', bn: 'গুরুদাসপুর' }, { en: 'Lalpur', bn: 'লালপুর' }, { en: 'Singra', bn: 'সিংড়া' },
      ]},
      { en: 'Naogaon', bn: 'নওগাঁ', upazillas: [
        { en: 'Naogaon Sadar', bn: 'নওগাঁ সদর' }, { en: 'Atrai', bn: 'আত্রাই' }, { en: 'Badalgachhi', bn: 'বদলগাছি' },
        { en: 'Dhamoirhat', bn: 'ধামইরহাট' }, { en: 'Manda', bn: 'মান্দা' }, { en: 'Mohadevpur', bn: 'মহাদেবপুর' },
        { en: 'Niamatpur', bn: 'নিয়ামতপুর' }, { en: 'Patnitala', bn: 'পত্নীতলা' }, { en: 'Porsha', bn: 'পোরশা' },
        { en: 'Raninagar', bn: 'রাণীনগর' }, { en: 'Sapahar', bn: 'সাপাহার' },
      ]},
      { en: 'Chapainawabganj', bn: 'চাঁপাইনবাবগঞ্জ', upazillas: [
        { en: 'Chapainawabganj Sadar', bn: 'চাঁপাইনবাবগঞ্জ সদর' }, { en: 'Bholahat', bn: 'ভোলাহাট' }, { en: 'Gomastapur', bn: 'গোমস্তাপুর' },
        { en: 'Nachole', bn: 'নাচোল' }, { en: 'Shibganj', bn: 'শিবগঞ্জ' },
      ]},
      { en: 'Joypurhat', bn: 'জয়পুরহাট', upazillas: [
        { en: 'Joypurhat Sadar', bn: 'জয়পুরহাট সদর' }, { en: 'Akkelpur', bn: 'আক্কেলপুর' }, { en: 'Kalai', bn: 'কালাই' },
        { en: 'Khetlal', bn: 'ক্ষেতলাল' }, { en: 'Panchbibi', bn: 'পাঁচবিবি' },
      ]},
    ],
  },
  {
    en: 'Khulna', bn: 'খুলনা',
    districts: [
      { en: 'Khulna', bn: 'খুলনা', upazillas: [
        { en: 'Khulna Sadar', bn: 'খুলনা সদর' }, { en: 'Batiaghata', bn: 'বটিয়াঘাটা' }, { en: 'Dacope', bn: 'দাকোপ' },
        { en: 'Dumuria', bn: 'ডুমুরিয়া' }, { en: 'Dighalia', bn: 'দিঘলিয়া' }, { en: 'Koyra', bn: 'কয়রা' },
        { en: 'Paikgachha', bn: 'পাইকগাছা' }, { en: 'Phultala', bn: 'ফুলতলা' }, { en: 'Rupsha', bn: 'রূপসা' }, { en: 'Terokhada', bn: 'তেরখাদা' },
      ]},
      { en: 'Jessore', bn: 'যশোর', upazillas: [
        { en: 'Jessore Sadar', bn: 'যশোর সদর' }, { en: 'Abhaynagar', bn: 'অভয়নগর' }, { en: 'Bagherpara', bn: 'বাঘারপাড়া' },
        { en: 'Chaugachha', bn: 'চৌগাছা' }, { en: 'Jhikargachha', bn: 'ঝিকরগাছা' }, { en: 'Keshabpur', bn: 'কেশবপুর' },
        { en: 'Manirampur', bn: 'মণিরামপুর' }, { en: 'Sharsha', bn: 'শার্শা' },
      ]},
      { en: 'Satkhira', bn: 'সাতক্ষীরা', upazillas: [
        { en: 'Satkhira Sadar', bn: 'সাতক্ষীরা সদর' }, { en: 'Assasuni', bn: 'আশাশুনি' }, { en: 'Debhata', bn: 'দেবহাটা' },
        { en: 'Kalaroa', bn: 'কলারোয়া' }, { en: 'Kaliganj', bn: 'কালীগঞ্জ' }, { en: 'Shyamnagar', bn: 'শ্যামনগর' }, { en: 'Tala', bn: 'তালা' },
      ]},
      { en: 'Kushtia', bn: 'কুষ্টিয়া', upazillas: [
        { en: 'Kushtia Sadar', bn: 'কুষ্টিয়া সদর' }, { en: 'Bheramara', bn: 'ভেড়ামারা' }, { en: 'Daulatpur', bn: 'দৌলতপুর' },
        { en: 'Khoksa', bn: 'খোকসা' }, { en: 'Kumarkhali', bn: 'কুমারখালী' }, { en: 'Mirpur', bn: 'মিরপুর' },
      ]},
      { en: 'Bagerhat', bn: 'বাগেরহাট', upazillas: [
        { en: 'Bagerhat Sadar', bn: 'বাগেরহাট সদর' }, { en: 'Chitalmari', bn: 'চিতলমারী' }, { en: 'Fakirhat', bn: 'ফকিরহাট' },
        { en: 'Kachua', bn: 'কচুয়া' }, { en: 'Mollahat', bn: 'মোল্লাহাট' }, { en: 'Mongla', bn: 'মোংলা' },
        { en: 'Morrelganj', bn: 'মোড়েলগঞ্জ' }, { en: 'Rampal', bn: 'রামপাল' }, { en: 'Sarankhola', bn: 'শরণখোলা' },
      ]},
      { en: 'Jhenaidah', bn: 'ঝিনাইদহ', upazillas: [
        { en: 'Jhenaidah Sadar', bn: 'ঝিনাইদহ সদর' }, { en: 'Harinakunda', bn: 'হরিণাকুণ্ডু' }, { en: 'Kaliganj', bn: 'কালীগঞ্জ' },
        { en: 'Kotchandpur', bn: 'কোটচাঁদপুর' }, { en: 'Maheshpur', bn: 'মহেশপুর' }, { en: 'Shailkupa', bn: 'শৈলকুপা' },
      ]},
      { en: 'Magura', bn: 'মাগুরা', upazillas: [
        { en: 'Magura Sadar', bn: 'মাগুরা সদর' }, { en: 'Mohammadpur', bn: 'মোহাম্মদপুর' }, { en: 'Shalikha', bn: 'শালিখা' }, { en: 'Sreepur', bn: 'শ্রীপুর' },
      ]},
      { en: 'Narail', bn: 'নড়াইল', upazillas: [
        { en: 'Narail Sadar', bn: 'নড়াইল সদর' }, { en: 'Kalia', bn: 'কালিয়া' }, { en: 'Lohagara', bn: 'লোহাগড়া' },
      ]},
      { en: 'Chuadanga', bn: 'চুয়াডাঙ্গা', upazillas: [
        { en: 'Chuadanga Sadar', bn: 'চুয়াডাঙ্গা সদর' }, { en: 'Alamdanga', bn: 'আলমডাঙ্গা' }, { en: 'Damurhuda', bn: 'দামুড়হুদা' }, { en: 'Jibannagar', bn: 'জীবননগর' },
      ]},
      { en: 'Meherpur', bn: 'মেহেরপুর', upazillas: [
        { en: 'Meherpur Sadar', bn: 'মেহেরপুর সদর' }, { en: 'Gangni', bn: 'গাংনী' }, { en: 'Mujibnagar', bn: 'মুজিবনগর' },
      ]},
    ],
  },
  {
    en: 'Barishal', bn: 'বরিশাল',
    districts: [
      { en: 'Barishal', bn: 'বরিশাল', upazillas: [
        { en: 'Barishal Sadar', bn: 'বরিশাল সদর' }, { en: 'Agailjhara', bn: 'আগৈলঝাড়া' }, { en: 'Babuganj', bn: 'বাবুগঞ্জ' },
        { en: 'Bakerganj', bn: 'বাকেরগঞ্জ' }, { en: 'Banaripara', bn: 'বানারীপাড়া' }, { en: 'Gournadi', bn: 'গৌরনদী' },
        { en: 'Hizla', bn: 'হিজলা' }, { en: 'Mehendiganj', bn: 'মেহেন্দিগঞ্জ' }, { en: 'Muladi', bn: 'মুলাদী' }, { en: 'Wazirpur', bn: 'উজিরপুর' },
      ]},
      { en: 'Patuakhali', bn: 'পটুয়াখালী', upazillas: [
        { en: 'Patuakhali Sadar', bn: 'পটুয়াখালী সদর' }, { en: 'Bauphal', bn: 'বাউফল' }, { en: 'Dashmina', bn: 'দশমিনা' },
        { en: 'Dumki', bn: 'দুমকি' }, { en: 'Galachipa', bn: 'গলাচিপা' }, { en: 'Kalapara', bn: 'কলাপাড়া' }, { en: 'Mirzaganj', bn: 'মির্জাগঞ্জ' },
        { en: 'Rangabali', bn: 'রাঙ্গাবালী' },
      ]},
      { en: 'Bhola', bn: 'ভোলা', upazillas: [
        { en: 'Bhola Sadar', bn: 'ভোলা সদর' }, { en: 'Borhanuddin', bn: 'বোরহানউদ্দিন' }, { en: 'Charfasson', bn: 'চরফ্যাশন' },
        { en: 'Daulatkhan', bn: 'দৌলতখান' }, { en: 'Lalmohan', bn: 'লালমোহন' }, { en: 'Manpura', bn: 'মনপুরা' }, { en: 'Tazumuddin', bn: 'তজুমদ্দিন' },
      ]},
      { en: 'Pirojpur', bn: 'পিরোজপুর', upazillas: [
        { en: 'Pirojpur Sadar', bn: 'পিরোজপুর সদর' }, { en: 'Bhandaria', bn: 'ভাণ্ডারিয়া' }, { en: 'Kawkhali', bn: 'কাউখালী' },
        { en: 'Mathbaria', bn: 'মঠবাড়িয়া' }, { en: 'Nazirpur', bn: 'নাজিরপুর' }, { en: 'Nesarabad', bn: 'নেছারাবাদ' }, { en: 'Zianagar', bn: 'জিয়ানগর' },
      ]},
      { en: 'Jhalokathi', bn: 'ঝালকাঠি', upazillas: [
        { en: 'Jhalokathi Sadar', bn: 'ঝালকাঠি সদর' }, { en: 'Kathalia', bn: 'কাঠালিয়া' }, { en: 'Nalchity', bn: 'নলছিটি' }, { en: 'Rajapur', bn: 'রাজাপুর' },
      ]},
      { en: 'Barguna', bn: 'বরগুনা', upazillas: [
        { en: 'Barguna Sadar', bn: 'বরগুনা সদর' }, { en: 'Amtali', bn: 'আমতলী' }, { en: 'Bamna', bn: 'বামনা' },
        { en: 'Betagi', bn: 'বেতাগী' }, { en: 'Patharghata', bn: 'পাথরঘাটা' }, { en: 'Taltali', bn: 'তালতলি' },
      ]},
    ],
  },
  {
    en: 'Sylhet', bn: 'সিলেট',
    districts: [
      { en: 'Sylhet', bn: 'সিলেট', upazillas: [
        { en: 'Sylhet Sadar', bn: 'সিলেট সদর' }, { en: 'Balaganj', bn: 'বালাগঞ্জ' }, { en: 'Beanibazar', bn: 'বিয়ানীবাজার' },
        { en: 'Bishwanath', bn: 'বিশ্বনাথ' }, { en: 'Companiganj', bn: 'কোম্পানীগঞ্জ' }, { en: 'Dakshin Surma', bn: 'দক্ষিণ সুরমা' },
        { en: 'Fenchuganj', bn: 'ফেঞ্চুগঞ্জ' }, { en: 'Golapganj', bn: 'গোলাপগঞ্জ' }, { en: 'Gowainghat', bn: 'গোয়াইনঘাট' },
        { en: 'Jaintiapur', bn: 'জৈন্তাপুর' }, { en: 'Kanaighat', bn: 'কানাইঘাট' }, { en: 'Zakiganj', bn: 'জকিগঞ্জ' }, { en: 'Osmani Nagar', bn: 'ওসমানী নগর' },
      ]},
      { en: 'Moulvibazar', bn: 'মৌলভীবাজার', upazillas: [
        { en: 'Moulvibazar Sadar', bn: 'মৌলভীবাজার সদর' }, { en: 'Barlekha', bn: 'বড়লেখা' }, { en: 'Juri', bn: 'জুড়ী' },
        { en: 'Kamalganj', bn: 'কমলগঞ্জ' }, { en: 'Kulaura', bn: 'কুলাউড়া' }, { en: 'Rajnagar', bn: 'রাজনগর' }, { en: 'Sreemangal', bn: 'শ্রীমঙ্গল' },
      ]},
      { en: 'Habiganj', bn: 'হবিগঞ্জ', upazillas: [
        { en: 'Habiganj Sadar', bn: 'হবিগঞ্জ সদর' }, { en: 'Ajmiriganj', bn: 'আজমিরীগঞ্জ' }, { en: 'Bahubal', bn: 'বাহুবল' },
        { en: 'Baniachong', bn: 'বানিয়াচং' }, { en: 'Chunarughat', bn: 'চুনারুঘাট' }, { en: 'Lakhai', bn: 'লাখাই' },
        { en: 'Madhabpur', bn: 'মাধবপুর' }, { en: 'Nabiganj', bn: 'নবীগঞ্জ' }, { en: 'Sayestaganj', bn: 'শায়েস্তাগঞ্জ' },
      ]},
      { en: 'Sunamganj', bn: 'সুনামগঞ্জ', upazillas: [
        { en: 'Sunamganj Sadar', bn: 'সুনামগঞ্জ সদর' }, { en: 'Bishwamvarpur', bn: 'বিশ্বম্ভরপুর' }, { en: 'Chhatak', bn: 'ছাতক' },
        { en: 'Derai', bn: 'দিরাই' }, { en: 'Dharampasha', bn: 'ধরমপাশা' }, { en: 'Dowarabazar', bn: 'দোয়ারাবাজার' },
        { en: 'Jagannathpur', bn: 'জগন্নাথপুর' }, { en: 'Jamalganj', bn: 'জামালগঞ্জ' }, { en: 'Sulla', bn: 'শাল্লা' },
        { en: 'Tahirpur', bn: 'তাহিরপুর' },
      ]},
    ],
  },
  {
    en: 'Rangpur', bn: 'রংপুর',
    districts: [
      { en: 'Rangpur', bn: 'রংপুর', upazillas: [
        { en: 'Rangpur Sadar', bn: 'রংপুর সদর' }, { en: 'Badarganj', bn: 'বদরগঞ্জ' }, { en: 'Gangachara', bn: 'গঙ্গাচড়া' },
        { en: 'Kaunia', bn: 'কাউনিয়া' }, { en: 'Mithapukur', bn: 'মিঠাপুকুর' }, { en: 'Pirgachha', bn: 'পীরগাছা' },
        { en: 'Pirganj', bn: 'পীরগঞ্জ' }, { en: 'Taraganj', bn: 'তারাগঞ্জ' },
      ]},
      { en: 'Dinajpur', bn: 'দিনাজপুর', upazillas: [
        { en: 'Dinajpur Sadar', bn: 'দিনাজপুর সদর' }, { en: 'Biral', bn: 'বিরল' }, { en: 'Birampur', bn: 'বিরামপুর' },
        { en: 'Birganj', bn: 'বীরগঞ্জ' }, { en: 'Bochaganj', bn: 'বোচাগঞ্জ' }, { en: 'Chirirbandar', bn: 'চিরিরবন্দর' },
        { en: 'Fulbari', bn: 'ফুলবাড়ী' }, { en: 'Ghoraghat', bn: 'ঘোড়াঘাট' }, { en: 'Hakimpur', bn: 'হাকিমপুর' },
        { en: 'Kaharole', bn: 'কাহারোল' }, { en: 'Khansama', bn: 'খানসামা' }, { en: 'Nawabganj', bn: 'নবাবগঞ্জ' }, { en: 'Parbatipur', bn: 'পার্বতীপুর' },
      ]},
      { en: 'Kurigram', bn: 'কুড়িগ্রাম', upazillas: [
        { en: 'Kurigram Sadar', bn: 'কুড়িগ্রাম সদর' }, { en: 'Bhurungamari', bn: 'ভূরুঙ্গামারী' }, { en: 'Char Rajibpur', bn: 'চর রাজিবপুর' },
        { en: 'Chilmari', bn: 'চিলমারী' }, { en: 'Nageshwari', bn: 'নাগেশ্বরী' }, { en: 'Phulbari', bn: 'ফুলবাড়ী' },
        { en: 'Rajarhat', bn: 'রাজারহাট' }, { en: 'Rowmari', bn: 'রৌমারী' }, { en: 'Ulipur', bn: 'উলিপুর' },
      ]},
      { en: 'Gaibandha', bn: 'গাইবান্ধা', upazillas: [
        { en: 'Gaibandha Sadar', bn: 'গাইবান্ধা সদর' }, { en: 'Fulchhari', bn: 'ফুলছড়ি' }, { en: 'Gobindaganj', bn: 'গোবিন্দগঞ্জ' },
        { en: 'Palashbari', bn: 'পলাশবাড়ী' }, { en: 'Sadullapur', bn: 'সাদুল্লাপুর' }, { en: 'Saghata', bn: 'সাঘাটা' }, { en: 'Sundarganj', bn: 'সুন্দরগঞ্জ' },
      ]},
      { en: 'Nilphamari', bn: 'নীলফামারী', upazillas: [
        { en: 'Nilphamari Sadar', bn: 'নীলফামারী সদর' }, { en: 'Dimla', bn: 'ডিমলা' }, { en: 'Domar', bn: 'ডোমার' },
        { en: 'Jaldhaka', bn: 'জলঢাকা' }, { en: 'Kishoreganj', bn: 'কিশোরগঞ্জ' }, { en: 'Saidpur', bn: 'সৈয়দপুর' },
      ]},
      { en: 'Lalmonirhat', bn: 'লালমনিরহাট', upazillas: [
        { en: 'Lalmonirhat Sadar', bn: 'লালমনিরহাট সদর' }, { en: 'Aditmari', bn: 'আদিতমারী' }, { en: 'Hatibandha', bn: 'হাতীবান্ধা' },
        { en: 'Kaliganj', bn: 'কালীগঞ্জ' }, { en: 'Patgram', bn: 'পাটগ্রাম' },
      ]},
      { en: 'Thakurgaon', bn: 'ঠাকুরগাঁও', upazillas: [
        { en: 'Thakurgaon Sadar', bn: 'ঠাকুরগাঁও সদর' }, { en: 'Baliadangi', bn: 'বালিয়াডাঙ্গী' }, { en: 'Haripur', bn: 'হরিপুর' },
        { en: 'Pirganj', bn: 'পীরগঞ্জ' }, { en: 'Ranisankail', bn: 'রাণীশংকৈল' },
      ]},
      { en: 'Panchagarh', bn: 'পঞ্চগড়', upazillas: [
        { en: 'Panchagarh Sadar', bn: 'পঞ্চগড় সদর' }, { en: 'Atwari', bn: 'আটোয়ারী' }, { en: 'Boda', bn: 'বোদা' },
        { en: 'Debiganj', bn: 'দেবীগঞ্জ' }, { en: 'Tetulia', bn: 'তেতুলিয়া' },
      ]},
    ],
  },
  {
    en: 'Mymensingh', bn: 'ময়মনসিংহ',
    districts: [
      { en: 'Mymensingh', bn: 'ময়মনসিংহ', upazillas: [
        { en: 'Mymensingh Sadar', bn: 'ময়মনসিংহ সদর' }, { en: 'Bhaluka', bn: 'ভালুকা' }, { en: 'Dhobaura', bn: 'ধোবাউড়া' },
        { en: 'Fulbaria', bn: 'ফুলবাড়িয়া' }, { en: 'Gaffargaon', bn: 'গফরগাঁও' }, { en: 'Gauripur', bn: 'গৌরীপুর' },
        { en: 'Haluaghat', bn: 'হালুয়াঘাট' }, { en: 'Ishwarganj', bn: 'ঈশ্বরগঞ্জ' }, { en: 'Muktagachha', bn: 'মুক্তাগাছা' },
        { en: 'Nandail', bn: 'নান্দাইল' }, { en: 'Phulpur', bn: 'ফুলপুর' }, { en: 'Trishal', bn: 'ত্রিশাল' }, { en: 'Tarakanda', bn: 'তারাকান্দা' },
      ]},
      { en: 'Jamalpur', bn: 'জামালপুর', upazillas: [
        { en: 'Jamalpur Sadar', bn: 'জামালপুর সদর' }, { en: 'Bakshiganj', bn: 'বকশীগঞ্জ' }, { en: 'Dewanganj', bn: 'দেওয়ানগঞ্জ' },
        { en: 'Islampur', bn: 'ইসলামপুর' }, { en: 'Madarganj', bn: 'মাদারগঞ্জ' }, { en: 'Melandaha', bn: 'মেলান্দহ' }, { en: 'Sarishabari', bn: 'সরিষাবাড়ী' },
      ]},
      { en: 'Netrokona', bn: 'নেত্রকোনা', upazillas: [
        { en: 'Netrokona Sadar', bn: 'নেত্রকোনা সদর' }, { en: 'Atpara', bn: 'আটপাড়া' }, { en: 'Barhatta', bn: 'বারহাট্টা' },
        { en: 'Durgapur', bn: 'দুর্গাপুর' }, { en: 'Kalmakanda', bn: 'কলমাকান্দা' }, { en: 'Kendua', bn: 'কেন্দুয়া' },
        { en: 'Khaliajuri', bn: 'খালিয়াজুরী' }, { en: 'Madan', bn: 'মদন' }, { en: 'Mohanganj', bn: 'মোহনগঞ্জ' }, { en: 'Purbadhala', bn: 'পূর্বধলা' },
      ]},
      { en: 'Sherpur', bn: 'শেরপুর', upazillas: [
        { en: 'Sherpur Sadar', bn: 'শেরপুর সদর' }, { en: 'Jhenaigati', bn: 'ঝিনাইগাতী' }, { en: 'Nakla', bn: 'নকলা' },
        { en: 'Nalitabari', bn: 'নালিতাবাড়ী' }, { en: 'Sreebardi', bn: 'শ্রীবরদী' },
      ]},
    ],
  },
];
