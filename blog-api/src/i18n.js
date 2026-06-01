// =============================================================================
// UI strings for the public blog, in both supported languages.
// English is the default/base language; Persian is fully supported and RTL.
// =============================================================================
'use strict';

const LANGS = ['en', 'fa'];
const DEFAULT_LANG = 'en';

const strings = {
  en: {
    dir: 'ltr',
    htmlLang: 'en',
    locale: 'en_US',
    siteName: 'Simorgh AI',
    blog: 'Blog',
    blogTitle: 'Simorgh AI Blog',
    blogTagline: 'Insights on artificial intelligence, technology and the future of nations.',
    readMore: 'Read more',
    backToBlog: 'Back to the blog',
    backToHome: 'Home',
    publishedOn: 'Published',
    by: 'By',
    source: 'Source',
    tags: 'Tags',
    noPosts: 'No articles have been published yet. Check back soon.',
    switchPrompt: 'It looks like you prefer Persian. Would you like to switch?',
    switchYes: 'Switch to Persian',
    switchNo: 'Stay in English',
    otherLang: 'فارسی',
    // Email capture
    getFull: 'Get the full analysis by email',
    getFullDesc: 'Enter your email and we will send you our complete original analysis on this topic.',
    emailPlaceholder: 'you@example.com',
    subscribe: 'Send it to me',
    subscribeOk: 'Thank you! We will be in touch shortly.',
    subscribeErr: 'Something went wrong. Please try again.',
    emailInvalid: 'Please enter a valid email address.',
  },
  fa: {
    dir: 'rtl',
    htmlLang: 'fa',
    locale: 'fa_IR',
    siteName: 'سیمرغ',
    blog: 'بلاگ',
    blogTitle: 'بلاگ سیمرغ',
    blogTagline: 'تحلیل‌هایی درباره‌ی هوش مصنوعی، فناوری و آینده‌ی ملت‌ها.',
    readMore: 'ادامه‌ی مطلب',
    backToBlog: 'بازگشت به بلاگ',
    backToHome: 'خانه',
    publishedOn: 'منتشرشده',
    by: 'نویسنده',
    source: 'منبع',
    tags: 'برچسب‌ها',
    noPosts: 'هنوز مقاله‌ای منتشر نشده است. به‌زودی سر بزنید.',
    switchPrompt: 'به نظر می‌رسد فارسی‌زبان هستید. می‌خواهید به فارسی بروید؟',
    switchYes: 'برو به فارسی',
    switchNo: 'انگلیسی بمان',
    otherLang: 'English',
    // Email capture
    getFull: 'دریافت تحلیل کامل از طریق ایمیل',
    getFullDesc: 'ایمیلت را وارد کن تا تحلیل کاملِ اختصاصی ما درباره‌ی این موضوع را برایت بفرستیم.',
    emailPlaceholder: 'you@example.com',
    subscribe: 'برایم بفرست',
    subscribeOk: 'سپاس! به‌زودی با شما در تماس خواهیم بود.',
    subscribeErr: 'خطایی رخ داد. دوباره تلاش کنید.',
    emailInvalid: 'لطفاً یک ایمیل معتبر وارد کنید.',
  },
};

function t(lang, key) {
  const table = strings[lang] || strings[DEFAULT_LANG];
  return table[key] != null ? table[key] : strings[DEFAULT_LANG][key] || key;
}

function otherLang(lang) {
  return lang === 'fa' ? 'en' : 'fa';
}

module.exports = { LANGS, DEFAULT_LANG, strings, t, otherLang };
