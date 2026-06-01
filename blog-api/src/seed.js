// =============================================================================
// First-run seed.
// On an empty database we insert one ready-made bilingual article so the blog
// is not blank on first deploy. The content is Simorgh AI's own original
// commentary on a public RAND paper: it paraphrases and adds analysis, quotes
// only a short attributed line, and links to the original on rand.org. This is
// the legal, SEO-friendly approach (original content + source attribution),
// not a republication of the copyrighted paper.
// =============================================================================
'use strict';

const db = require('./db');

const FIRST_POST = {
  slug: 'a-new-age-of-nations',
  title_en: 'A New Age of Nations: Power and Advantage in the AI Era',
  title_fa: 'عصر جدیدی از ملت‌ها: قدرت و مزیت در عصر هوش مصنوعی',
  summary_en:
    'Our take on how artificial intelligence is reshaping national competitive advantage — and why societal strength, not raw technology, may decide who leads.',
  summary_fa:
    'نگاه ما به اینکه هوش مصنوعی چگونه مزیت رقابتی ملت‌ها را بازتعریف می‌کند — و چرا قدرتِ اجتماعی، نه صرفِ فناوری، تعیین‌کننده‌ی پیشتازی است.',
  body_en: `Artificial intelligence is often framed as a race for the best models and the
fastest chips. But a more interesting question is quietly emerging: **what makes
a *nation* competitive once AI is everywhere?**

In a recent RAND paper, *A New Age of Nations: Power and Advantage in the AI Era*,
analyst Michael J. Mazarr argues that the decisive factor will not be technological
mastery alone, but how well a society can absorb AI and manage its disruptions. As
he puts it:

> "Success in the AI era will depend more on societal integration and the ability
> to manage AI's effects than on technological mastery alone."

We find this framing compelling — and worth building on.

## Technology is the easy part

Models diffuse. Today's frontier capability is tomorrow's open-weight commodity.
What does *not* diffuse easily is the social fabric that lets a country actually
use these tools: trust in institutions, adaptable labour markets, education that
keeps pace, and a regulatory culture that can move without breaking things.

## Three societal foundations to watch

1. **Adaptive institutions** — can government and industry reorganise around AI
   without paralysis?
2. **Human capital** — not just engineers, but a workforce that can collaborate
   with AI across every sector.
3. **Social cohesion** — AI can either reinforce shared trust or accelerate its
   erosion through misinformation and inequality.

## What this means for builders

For companies like ours, the lesson is practical: the value is less in any single
model and more in **integrating AI deeply and responsibly into real workflows** —
the place where societal advantage is actually won or lost.

---

*This article is Simorgh AI's original commentary. To read the full RAND paper,
please use the official source linked below.*`,
  body_fa: `هوش مصنوعی معمولاً به‌شکل یک «مسابقه» برای بهترین مدل‌ها و سریع‌ترین تراشه‌ها
روایت می‌شود. اما پرسش جالب‌تری آرام‌آرام در حال شکل‌گیری است: **وقتی هوش مصنوعی
همه‌جا باشد، چه چیزی یک *ملت* را رقابت‌پذیر می‌کند؟**

در مقاله‌ای از مؤسسه‌ی RAND با عنوان *«عصر جدیدی از ملت‌ها: قدرت و مزیت در عصر
هوش مصنوعی»*، تحلیل‌گر مایکل جی. مازار استدلال می‌کند که عامل تعیین‌کننده، صرفاً
تسلط فناورانه نیست، بلکه میزان توانایی یک جامعه در جذب هوش مصنوعی و مدیریت
آشفتگی‌های آن است. به بیان او:

> «موفقیت در عصر هوش مصنوعی، بیش از آنکه به تسلط فناورانه‌ی صِرف وابسته باشد، به
> یکپارچگی اجتماعی و توانایی مدیریت اثرات هوش مصنوعی بستگی دارد.»

این چارچوب به نظر ما قانع‌کننده است — و ارزش گسترش‌دادن دارد.

## فناوری، بخش آسانِ ماجراست

مدل‌ها منتشر می‌شوند. قابلیتِ پیشروی امروز، کالای متن‌بازِ فردا خواهد بود. آنچه
به‌سادگی منتشر *نمی‌شود*، بافت اجتماعی‌ای است که به یک کشور اجازه می‌دهد واقعاً از
این ابزارها استفاده کند: اعتماد به نهادها، بازار کارِ انعطاف‌پذیر، آموزشی که
هم‌پای تغییر پیش برود، و فرهنگ مقرراتی که بتواند بدون فروپاشی حرکت کند.

## سه بنیان اجتماعی که باید پایید

1. **نهادهای سازگار** — آیا دولت و صنعت می‌توانند بدون فلج‌شدن، خود را حول هوش
   مصنوعی بازسازمان‌دهی کنند؟
2. **سرمایه‌ی انسانی** — نه فقط مهندسان، بلکه نیروی کاری که بتواند در هر بخشی با
   هوش مصنوعی همکاری کند.
3. **انسجام اجتماعی** — هوش مصنوعی می‌تواند اعتماد مشترک را تقویت کند یا با
   اطلاعات نادرست و نابرابری، فرسایش آن را شتاب دهد.

## این برای سازندگان چه معنایی دارد

برای شرکت‌هایی مانند ما، درس ماجرا کاربردی است: ارزش، کمتر در یک مدلِ منفرد و
بیشتر در **یکپارچه‌سازی عمیق و مسئولانه‌ی هوش مصنوعی در جریان‌های کاری واقعی** است
— همان‌جایی که مزیت اجتماعی، واقعاً برده یا باخته می‌شود.

---

*این مقاله، تحلیلِ اصیلِ سیمرغ است. برای مطالعه‌ی متن کامل مقاله‌ی RAND، لطفاً از
منبع رسمیِ لینک‌شده در پایین استفاده کنید.*`,
  cover_image: '',
  tags: 'AI, Geopolitics, Nations',
  author: 'Simorgh AI Team',
  source_name: 'RAND — Michael J. Mazarr, "A New Age of Nations: Power and Advantage in the AI Era" (Jan 2026)',
  source_url: 'https://www.rand.org/pubs/perspectives/PEA3691-14.html',
  status: 'published',
};

function seedIfEmpty() {
  const row = db.db.prepare('SELECT COUNT(*) AS n FROM posts').get();
  if (row.n > 0) return;
  db.createPost({ ...FIRST_POST, published_at: new Date().toISOString() });
  console.log('[blog-api] seeded first article:', FIRST_POST.slug);
}

module.exports = { seedIfEmpty };
