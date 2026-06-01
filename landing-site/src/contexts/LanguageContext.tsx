import React, { useState, createContext, useContext, ReactNode } from 'react';

type Language = 'en' | 'fa';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

const translations: Record<string, Record<Language, string>> = {
  'nav.home': { en: 'Home', fa: 'خانه' },
  'nav.products': { en: 'Products', fa: 'محصولات' },
  'nav.solutions': { en: 'Solutions', fa: 'راه‌حل‌ها' },
  'nav.about': { en: 'About Us', fa: 'درباره ما' },
  'nav.contact': { en: 'Contact', fa: 'تماس با ما' },
  'nav.getStarted': { en: 'Get Started', fa: 'شروع کنید' },

  'hero.title': { en: 'SIMORGH AI', fa: 'هوش مصنوعی سیمرغ' },
  'hero.subtitle': { en: 'Where Ancient Wisdom Meets Artificial Intelligence', fa: 'جایی که خرد باستانی با هوش مصنوعی تلاقی می‌کند' },
  'hero.cta1': { en: 'Get Started', fa: 'شروع کنید' },
  'hero.cta2': { en: 'Learn More', fa: 'بیشتر بدانید' },

  'features.sectionPrefix': { en: 'Our ', fa: '' },
  'features.sectionTitle': { en: 'Products', fa: 'محصولات ما' },
  'features.sectionSubtitle': { en: 'Cutting-edge AI solutions for the modern electrical industry', fa: 'راه‌حل‌های پیشرفته هوش مصنوعی برای صنعت برق مدرن' },
  'features.ai.title': { en: 'Simorgh AI', fa: 'هوش مصنوعی سیمرغ' },
  'features.ai.desc': { en: 'A smart solution for the automatic extraction of specialized electrical data from technical documents (including drawings, catalogs, and reports) and performing advanced electrical calculations such as voltage drop, current, power, and load flow analysis.', fa: 'یک راه‌حل هوشمند برای استخراج خودکار داده‌های تخصصی برق از مدارک فنی (شامل نقشه‌ها، کاتالوگ‌ها و گزارش‌ها) و انجام محاسبات پیشرفته برقی مانند افت ولتاژ، جریان، توان و تحلیل پخش بار است.' },
  'features.ml.title': { en: 'EPLANIX Design Suite', fa: 'مجموعه طراحی ایپلن ایکس' },
  'features.ml.desc': { en: 'Software for recording and managing project materials and consumables that automatically tracks inventory and calculates project costs', fa: 'نرم‌افزاری برای ثبت و مدیریت قطعات و مواد مصرفی پروژه‌ها که به‌صورت خودکار موجودی انبار را کنترل کرده و هزینه‌های پروژه را محاسبه می‌کند.' },
  'features.data.title': { en: 'EPLANIX', fa: 'نرم‌افزار ایپلن ایکس' },
  'features.data.desc': { en: 'Automatic drawing of single-line and layouts', fa: 'طراحی اتوماتیک نقشه‌های تک خطی و جانمایی' },
  'features.launch': { en: 'Launch App', fa: 'ورود به نرم‌افزار' },

  'services.sectionPrefix': { en: 'Our ', fa: '' },
  'services.sectionTitle': { en: 'Services', fa: 'خدمات ما' },
  'services.sectionSubtitle': { en: 'Comprehensive AI solutions tailored to your business needs', fa: 'راه‌حل‌های جامع هوش مصنوعی متناسب با نیازهای کسب‌وکار شما' },
  'services.intro': { en: 'We design, implement, and manage a complete AI platform for your organization — without the need to hire even a single in-house employee.', fa: 'ما بدون نیاز به استخدام حتی یک نفر نیروی داخلی، برای سازمان شما یک پایگاه کامل هوش مصنوعی طراحی، پیاده‌سازی و مدیریت می‌کنیم.' },
  'services.platformTitle': { en: 'This Platform:', fa: 'این پایگاه:' },
  'services.platform1': { en: 'Tailored to your company\'s structure and industry', fa: 'متناسب با ساختار و صنعت شرکت شما طراحی می‌شود' },
  'services.platform2': { en: 'Covers all current and future AI needs of the organization', fa: 'کلیه نیازهای فعلی و آینده هوش مصنوعی سازمان را پوشش می‌دهد' },
  'services.platform3': { en: 'Permanently managed by our expert team', fa: 'به‌صورت دائمی توسط تیم متخصص ما مدیریت می‌شود' },
  'services.cta.title': { en: 'Ready to Start Collaboration?', fa: 'آماده شروع همکاری هستید؟' },
  'services.cta.desc': { en: 'Our team is ready to provide consultation and set up your organization\'s AI platform', fa: 'تیم ما آماده ارائه مشاوره و راه‌اندازی پلتفرم هوش مصنوعی سازمان شماست' },
  'services.cta.button': { en: 'Request Consultation', fa: 'درخواست مشاوره' },
  'services.cta.note': { en: '*No commitment or initial cost', fa: '*بدون هیچگونه تعهد و هزینه اولیه' },
  'services.stat.clients.value': { en: '50+', fa: '۵۰+' },
  'services.stat.clients.label': { en: 'Active Clients', fa: 'مشتریان فعال' },
  'services.stat.support.value': { en: '24/7', fa: '۲۴/۷' },
  'services.stat.support.label': { en: 'Support', fa: 'پشتیبانی' },
  'services.stat.projects.value': { en: '100+', fa: '۱۰۰+' },
  'services.stat.projects.label': { en: 'Successful Projects', fa: 'پروژه موفق' },

  'about.label': { en: 'About Us', fa: 'درباره ما' },
  'about.title1': { en: 'Simorgh;', fa: 'سیمرغ؛' },
  'about.title2': { en: 'Soaring Toward Artificial Wisdom', fa: 'پرواز به سوی خرد مصنوعی' },
  'about.sectionSubtitle': { en: 'Discover the story behind Simorgh AI and our mission to transform the future', fa: 'داستان سیمرغ هوش مصنوعی و مأموریت ما برای تغییر آینده را کشف کنید' },
  'about.p1': { en: 'The Simorgh, in Iranian mythology, symbolizes wisdom, knowledge, and guidance. Inspired by this ancient concept, we at Simorgh Group are dedicated to developing artificial intelligence—an intelligence that, like the Simorgh, paves the path of wisdom and guides the way toward a smarter future.', fa: 'سیمرغ در اسطوره‌های ایرانی نماد خرد، دانایی و هدایت است. ما در گروه سیمرغ با الهام از این مفهوم کهن، به توسعه هوش مصنوعی می‌پردازیم هوشی که همچون سیمرغ، مسیر دانایی را هموار کرده و راهگشای آینده‌ای هوشمندتر است.' },
  'about.p2': { en: 'At Simorgh, we strive to create an artificial intelligence that is not only fast and efficient, but also wise and purpose-driven—because the future belongs to knowledge.', fa: 'به دنبال خلق هوش مصنوعی‌ای هستیم که نه‌تنها سریع و کارآمد، بلکه خردمند و هدفمند باشد چراکه آینده از آن دانایی است.' },
  'about.badge.innovation': { en: 'Innovation', fa: 'نوآوری' },
  'about.badge.excellence': { en: 'Excellence', fa: 'تعالی' },
  'about.badge.integrity': { en: 'Integrity', fa: 'صداقت' },

  'chat.title': { en: 'Simorgh Support', fa: 'پشتیبانی سیمرغ' },
  'chat.online': { en: 'Online', fa: 'آنلاین' },
  'chat.welcome': { en: 'Hello! I\'m Simorgh AI assistant. Ask me anything about our products: Simorgh AI Chatbot, EPLANIX Design Suite, and EPLANIX.', fa: 'سلام! من دستیار هوشمند سیمرغ هستم. هر سوالی درباره محصولات ما دارید بپرسید: چت‌بات سیمرغ، مجموعه طراحی ایپلن ایکس و نرم‌افزار ایپلن ایکس.' },
  'chat.inputPlaceholder': { en: 'Type your message...', fa: 'پیام خود را بنویسید...' },
  'chat.thinking': { en: 'Thinking...', fa: 'در حال فکر کردن...' },
  'chat.error': { en: 'Sorry, I couldn\'t process your request. Please try again.', fa: 'متأسفم، نتوانستم درخواست شما را پردازش کنم. لطفاً دوباره تلاش کنید.' },

  'nav.articles': { en: 'Articles', fa: 'مقالات' },

  'articles.badge': { en: 'Knowledge Base', fa: 'پایگاه دانش' },
  'articles.sectionPrefix': { en: 'Our ', fa: '' },
  'articles.sectionTitle': { en: 'Articles', fa: 'مقالات ما' },
  'articles.sectionSubtitle': { en: 'Explore our latest articles and technical insights in English and Persian', fa: 'آخرین مقالات و بینش‌های فنی ما را به فارسی و انگلیسی مطالعه کنید' },
  'articles.noArticles': { en: 'No articles available yet. Check back soon!', fa: 'هنوز مقاله‌ای موجود نیست. به زودی باز بیایید!' },
  'articles.downloadEn': { en: 'English', fa: 'انگلیسی' },
  'articles.downloadFa': { en: 'فارسی', fa: 'فارسی' },
  'articles.viewAll': { en: 'View All Articles', fa: 'مشاهده همه مقالات' },
  'articles.readMore': { en: 'Read more', fa: 'ادامه مطلب' },

  'chatmail.title': { en: 'Secure Messaging', fa: 'پیام‌رسان امن' },
  'chatmail.desc': { en: 'Connect with us via Delta Chat — a privacy-focused messenger', fa: 'از طریق دلتا چت با ما در ارتباط باشید — پیام‌رسان مبتنی بر حریم خصوصی' },
  'chatmail.download': { en: 'Download Delta Chat', fa: 'دانلود دلتا چت' },
  'chatmail.android': { en: 'Android APK', fa: 'نسخه اندروید' },
  'chatmail.windows': { en: 'Windows', fa: 'نسخه ویندوز' },
  'chatmail.linux': { en: 'Linux', fa: 'نسخه لینوکس' },

  'footer.desc': { en: 'Pioneering the next generation of artificial intelligence with ethical, scalable, and powerful solutions for the modern enterprise.', fa: 'پیشگامی در نسل بعدی هوش مصنوعی با راه‌حل‌های اخلاقی، مقیاس‌پذیر و قدرتمند برای سازمان‌های مدرن.' },
  'footer.platform': { en: 'Platform', fa: 'پلتفرم' },
  'footer.company': { en: 'Company', fa: 'شرکت' },
  'footer.solutions': { en: 'Solutions', fa: 'راه‌حل‌ها' },
  'footer.integration': { en: 'Integration', fa: 'یکپارچه‌سازی' },
  'footer.pricing': { en: 'Pricing', fa: 'قیمت‌گذاری' },
  'footer.docs': { en: 'Documentation', fa: 'مستندات' },
  'footer.careers': { en: 'Careers', fa: 'فرصت‌های شغلی' },
  'footer.blog': { en: 'Blog', fa: 'بلاگ' },
  'footer.copyright': { en: '© 2024 Simorgh AI. All rights reserved.', fa: '© ۲۰۲۴ سیمرغ AI. تمامی حقوق محفوظ است.' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const t = (key: string) => translations[key]?.[lang] || key;
  const isRtl = lang === 'fa';

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRtl }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
