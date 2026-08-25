export type Lang = "en" | "ar";

export const content = {
  en: {
    dir: "ltr" as const,
    nav: {
      links: [
        { label: "Features", href: "#features" },
        { label: "Solutions", href: "#solutions" },
        { label: "For Doctors", href: "#providers" },
        { label: "Booking", href: "#booking" },
        { label: "Pricing", href: "#pricing" },
        { label: "Contact", href: "#contact" },

      ],
      login: "Login",
      getStarted: "Get Started",
      brand: "Sehaty Cloud",
    },
    hero: {
      badge: "Built for Saudi healthcare · Arabic & English",
      title: "One platform connecting clinics, doctors and patients",
      titleAccent: "across the Kingdom",
      subtitle:
        "Sehaty Cloud unifies scheduling, medical records, e-prescriptions, billing and telemedicine in a single secure system — so your team spends less time on admin and more time on care.",
      ctaPrimary: "Book a Demo",
      ctaSecondary: "Get Started Free",
      note: "No credit card required · 14-day free trial",
    },
    stats: [
      { value: "500+", label: "Clinics onboarded" },
      { value: "50,000+", label: "Patients served" },
      { value: "99.9%", label: "Platform uptime" },
      { value: "24/7", label: "Arabic support" },
    ],
    features: {
      eyebrow: "Core capabilities",
      title: "Everything a modern clinic runs on",
      subtitle: "Nine connected modules, one patient record, zero duplicated data entry.",
      items: [
        {
          title: "Patient Management",
          desc: "Unified profiles with history, documents, insurance and visit timeline.",
        },
        {
          title: "Doctor Dashboard",
          desc: "Daily schedule, waiting queue and clinical notes in one focused view.",
        },
        {
          title: "Appointment Booking",
          desc: "Online, walk-in and call-centre booking with automatic SMS reminders.",
        },
        {
          title: "EMR / Digital Records",
          desc: "Structured electronic medical records with templates per specialty.",
        },
        {
          title: "E-Prescription",
          desc: "Digital prescriptions sent straight to partner pharmacies.",
        },
        {
          title: "Lab & Pharmacy",
          desc: "Order tests, track samples and receive results inside the record.",
        },
        {
          title: "Billing & Insurance",
          desc: "Invoices, VAT, cash and insurance claim workflows end to end.",
        },
        {
          title: "Telemedicine",
          desc: "Secure video consultations with in-call notes and prescriptions.",
        },
        {
          title: "Analytics",
          desc: "Revenue, utilisation and clinical KPIs updated in real time.",
        },
      ],
    },
    roles: {
      eyebrow: "Built for every role",
      title: "One platform, three points of view",
      tabs: [
        {
          key: "clinics",
          label: "For Clinics",
          heading: "Run the whole clinic from one console",
          points: [
            "Multi-branch and multi-specialty management",
            "Staff roles, permissions and shift scheduling",
            "Insurance claims and revenue reporting",
            "Inventory for pharmacy and consumables",
          ],
        },
        {
          key: "doctors",
          label: "For Doctors",
          heading: "Less paperwork, more consultation time",
          points: [
            "Smart daily agenda with patient context",
            "Specialty-specific EMR templates",
            "One-tap e-prescriptions and lab orders",
            "Telemedicine from any device",
          ],
        },
        {
          key: "patients",
          label: "For Patients",
          heading: "Care that fits in your pocket",
          points: [
            "Search doctors by specialty, city and language",
            "Instant booking and rescheduling",
            "Digital records, reports and prescriptions",
            "Secure payments and insurance verification",
          ],
        },
      ],
    },
    doctorReg: {
      eyebrow: "For providers",
      title: "Start consulting in three steps",
      subtitle: "A guided onboarding designed around Saudi licensing requirements.",
      steps: [
        { title: "Register", desc: "Create your provider profile and add your specialty details." },
        { title: "Verify", desc: "Upload your license and credentials for fast-track verification." },
        { title: "Start Consulting", desc: "Publish availability and receive your first bookings." },
      ],
      cta: "Join as a Provider",
    },
    booking: {
      eyebrow: "For patients",
      title: "Booking care takes under two minutes",
      steps: [
        { title: "Register", desc: "Sign up with your mobile number and national ID." },
        { title: "Search Doctor", desc: "Filter by specialty, clinic, language and rating." },
        { title: "Book Appointment", desc: "Pick a slot, pay or verify insurance instantly." },
        { title: "Get Care", desc: "Visit in person or join a secure video consultation." },
      ],
      cta: "Book Appointment",
    },
    app: {
      eyebrow: "App preview",
      title: "A polished experience on mobile and desktop",
      subtitle:
        "Native-feeling patient app and a powerful web dashboard for clinic teams — fully localized for Arabic with right-to-left layouts.",
      bullets: ["iOS & Android patient app", "Web dashboard for staff", "Full RTL Arabic interface"],
    },
    security: {
      eyebrow: "Security & compliance",
      title: "Patient trust is the product",
      subtitle: "Healthcare-grade protection built into every layer of the platform.",
      items: [
        { title: "Data encryption", desc: "AES-256 at rest and TLS 1.3 in transit for every record." },
        { title: "Role-based access", desc: "Granular permissions so staff only see what they need." },
        { title: "Audit logging", desc: "Immutable trails of every view, edit and export." },
        { title: "Compliance ready", desc: "Aligned with Saudi data residency and health data regulations." },
      ],
    },
    testimonials: {
      eyebrow: "Testimonials",
      title: "Trusted by clinical teams",
      items: [
        {
          quote:
            "We cut no-shows by a third in the first quarter. Scheduling and reminders finally work as one system.",
          name: "Dr. Layla Al-Harbi",
          role: "Medical Director",
          clinic: "Nour Family Clinic, Riyadh",
        },
        {
          quote:
            "The EMR templates match how I actually consult. Notes take minutes instead of the whole evening.",
          name: "Dr. Omar Nasser",
          role: "Cardiologist",
          clinic: "Alhayat Medical Center, Jeddah",
        },
        {
          quote:
            "Insurance claims used to be our bottleneck. Now the whole cycle is tracked and settled far faster.",
          name: "Sara Al-Qahtani",
          role: "Operations Manager",
          clinic: "Sama Polyclinic, Dammam",
        },
      ],
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Plans that scale with your practice",
      subtitle: "Transparent pricing in SAR. Cancel anytime.",
      period: "/ month",
      tiers: [
        {
          name: "Starter",
          price: "SAR 349",
          desc: "For solo practitioners and small teams.",
          features: [
            "Up to 3 practitioners",
            "Appointments & patient records",
            "E-prescriptions",
            "Email support",
          ],
          cta: "Choose Plan",
          popular: false,
        },
        {
          name: "Clinic",
          price: "SAR 899",
          desc: "For growing multi-doctor clinics.",
          features: [
            "Up to 20 practitioners",
            "Billing & insurance claims",
            "Lab & pharmacy integrations",
            "Telemedicine included",
            "Priority Arabic support",
          ],
          cta: "Choose Plan",
          popular: true,
        },
        {
          name: "Enterprise",
          price: "Custom",
          desc: "For hospital groups and multi-branch networks.",
          features: [
            "Unlimited practitioners & branches",
            "Custom integrations & API access",
            "Dedicated success manager",
            "SLA and onboarding programme",
          ],
          cta: "Choose Plan",
          popular: false,
        },
      ],
      badge: "Most popular",
    },
    partners: {
      title: "Integrated with the systems you already use",
      logos: ["Bupa Arabia", "Tawuniya", "MADA Pay", "STC Pay", "LabCore", "PharmaLink"],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Common questions",
      items: [
        {
          q: "Is the platform available in Arabic?",
          a: "Yes. The entire product — patient app, clinic dashboard, notifications and invoices — is fully localized in Arabic with right-to-left layouts, and users can switch language at any time.",
        },
        {
          q: "Where is patient data stored?",
          a: "All patient data is stored in-Kingdom on encrypted infrastructure, with strict access controls and complete audit trails for every record interaction.",
        },
        {
          q: "How long does onboarding take?",
          a: "Most single-branch clinics are live within five working days, including data migration, staff accounts and training sessions delivered in Arabic or English.",
        },
        {
          q: "Can we migrate our existing records?",
          a: "Yes. Our team imports patient records, appointment history and billing data from spreadsheets or your current system at no additional cost on annual plans.",
        },
        {
          q: "Does it work with insurance providers?",
          a: "The platform supports eligibility checks, claim submission and reconciliation with major Saudi insurers, plus cash and card payment workflows.",
        },
        {
          q: "Is telemedicine included?",
          a: "Video consultations are included on the Clinic and Enterprise plans, with in-call notes, file sharing and e-prescriptions built into the session.",
        },
      ],
    },
    finalCta: {
      title: "Ready to modernise your clinic?",
      subtitle: "Join hundreds of Saudi providers delivering faster, safer, better-organised care.",
      cta: "Get Started",
      secondary: "Talk to Sales",
    },
    footer: {
      about:
        "Sehaty Cloud is a healthcare management platform for clinics, doctors and patients across Saudi Arabia.",
      columns: [
        { title: "Product", links: ["Features", "Solutions", "Pricing", "Telemedicine", "Integrations"] },
        { title: "Company", links: ["About us", "Careers", "Press", "Partners", "Contact"] },
        { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Data Processing", "Compliance"] },
      ],
      newsletterTitle: "Product updates",
      newsletterDesc: "Healthcare technology insights, once a month.",
      placeholder: "Your email address",
      subscribe: "Subscribe",
      rights: "© 2026 Sehaty Cloud. All rights reserved.",
      location: "Riyadh, Saudi Arabia",
    },
  },
  ar: {
    dir: "rtl" as const,
    nav: {
      links: [
        { label: "المميزات", href: "#features" },
        { label: "الحلول", href: "#solutions" },
        { label: "الأسعار", href: "#pricing" },
        { label: "من نحن", href: "#about" },
        { label: "تواصل معنا", href: "#contact" },
      ],
      login: "تسجيل الدخول",
      getStarted: "ابدأ الآن",
      brand: "صحتي كلاود",
    },
    hero: {
      badge: "مصمم للقطاع الصحي السعودي · عربي وإنجليزي",
      title: "منصة واحدة تربط العيادات والأطباء والمرضى",
      titleAccent: "في جميع أنحاء المملكة",
      subtitle:
        "توحّد صحتي كلاود المواعيد والملفات الطبية والوصفات الإلكترونية والفوترة والطب الاتصالي في نظام آمن واحد، ليتفرغ فريقك للرعاية بدل الأعمال الإدارية.",
      ctaPrimary: "احجز عرضًا توضيحيًا",
      ctaSecondary: "ابدأ مجانًا",
      note: "بدون بطاقة ائتمانية · تجربة مجانية ١٤ يومًا",
    },
    stats: [
      { value: "+٥٠٠", label: "عيادة مشتركة" },
      { value: "+٥٠٬٠٠٠", label: "مريض مستفيد" },
      { value: "٪٩٩٫٩", label: "جاهزية المنصة" },
      { value: "٢٤/٧", label: "دعم بالعربية" },
    ],
    features: {
      eyebrow: "القدرات الأساسية",
      title: "كل ما تحتاجه العيادة الحديثة",
      subtitle: "تسع وحدات مترابطة، ملف مريض واحد، بدون إدخال بيانات مكرر.",
      items: [
        { title: "إدارة المرضى", desc: "ملفات موحدة تشمل التاريخ الطبي والمستندات والتأمين والزيارات." },
        { title: "لوحة الطبيب", desc: "جدول اليوم وقائمة الانتظار والملاحظات السريرية في شاشة واحدة." },
        { title: "حجز المواعيد", desc: "حجز إلكتروني ومباشر ومن مركز الاتصال مع تذكيرات تلقائية." },
        { title: "الملف الطبي الرقمي", desc: "سجلات طبية إلكترونية منظمة بقوالب لكل تخصص." },
        { title: "الوصفة الإلكترونية", desc: "وصفات رقمية ترسل مباشرة إلى الصيدليات الشريكة." },
        { title: "المختبر والصيدلية", desc: "طلب الفحوصات وتتبع العينات واستلام النتائج داخل الملف." },
        { title: "الفوترة والتأمين", desc: "فواتير وضريبة القيمة المضافة ومطالبات التأمين من البداية للنهاية." },
        { title: "الطب الاتصالي", desc: "استشارات مرئية آمنة مع ملاحظات ووصفات أثناء المكالمة." },
        { title: "التحليلات", desc: "مؤشرات الإيرادات والتشغيل والأداء السريري بشكل لحظي." },
      ],
    },
    roles: {
      eyebrow: "لكل دور",
      title: "منصة واحدة بثلاث تجارب",
      tabs: [
        {
          key: "clinics",
          label: "للعيادات",
          heading: "أدر العيادة بالكامل من لوحة واحدة",
          points: [
            "إدارة عدة فروع وتخصصات",
            "أدوار الموظفين والصلاحيات والورديات",
            "مطالبات التأمين وتقارير الإيرادات",
            "مخزون الصيدلية والمستهلكات",
          ],
        },
        {
          key: "doctors",
          label: "للأطباء",
          heading: "أعمال ورقية أقل ووقت استشارة أطول",
          points: [
            "جدول يومي ذكي مع سياق المريض",
            "قوالب ملفات طبية حسب التخصص",
            "وصفات وطلبات مختبر بضغطة واحدة",
            "طب اتصالي من أي جهاز",
          ],
        },
        {
          key: "patients",
          label: "للمرضى",
          heading: "رعاية صحية في جيبك",
          points: [
            "ابحث عن الأطباء حسب التخصص والمدينة واللغة",
            "حجز وإعادة جدولة فورية",
            "سجلات وتقارير ووصفات رقمية",
            "مدفوعات آمنة والتحقق من التأمين",
          ],
        },
      ],
    },
    doctorReg: {
      eyebrow: "لمقدمي الخدمة",
      title: "ابدأ الاستشارات في ثلاث خطوات",
      subtitle: "تسجيل موجّه يراعي متطلبات الترخيص في المملكة.",
      steps: [
        { title: "التسجيل", desc: "أنشئ ملفك المهني وأضف بيانات تخصصك." },
        { title: "التحقق", desc: "ارفع الترخيص والمؤهلات للتحقق السريع." },
        { title: "بدء الاستشارات", desc: "انشر أوقاتك المتاحة واستقبل أول الحجوزات." },
      ],
      cta: "انضم كمقدم خدمة",
    },
    booking: {
      eyebrow: "للمرضى",
      title: "حجز الرعاية في أقل من دقيقتين",
      steps: [
        { title: "التسجيل", desc: "سجّل برقم جوالك وهويتك الوطنية." },
        { title: "ابحث عن طبيب", desc: "تصفية حسب التخصص والعيادة واللغة والتقييم." },
        { title: "احجز الموعد", desc: "اختر الوقت وادفع أو تحقق من التأمين فورًا." },
        { title: "احصل على الرعاية", desc: "زيارة حضورية أو استشارة مرئية آمنة." },
      ],
      cta: "احجز موعدًا",
    },
    app: {
      eyebrow: "معاينة التطبيق",
      title: "تجربة متقنة على الجوال وسطح المكتب",
      subtitle:
        "تطبيق مرضى سلس ولوحة تحكم قوية لفرق العيادات، معرّبة بالكامل مع تخطيط من اليمين إلى اليسار.",
      bullets: ["تطبيق للمرضى على iOS و Android", "لوحة تحكم للموظفين", "واجهة عربية كاملة RTL"],
    },
    security: {
      eyebrow: "الأمان والامتثال",
      title: "ثقة المريض هي المنتج",
      subtitle: "حماية بمعايير القطاع الصحي في كل طبقة من المنصة.",
      items: [
        { title: "تشفير البيانات", desc: "تشفير AES-256 للتخزين و TLS 1.3 أثناء النقل." },
        { title: "صلاحيات حسب الدور", desc: "صلاحيات دقيقة ليرى كل موظف ما يخصه فقط." },
        { title: "سجلات التدقيق", desc: "سجل غير قابل للتعديل لكل اطلاع وتعديل وتصدير." },
        { title: "جاهزية الامتثال", desc: "متوافق مع متطلبات إقامة البيانات وأنظمة البيانات الصحية." },
      ],
    },
    testimonials: {
      eyebrow: "آراء العملاء",
      title: "موثوق من الفرق الطبية",
      items: [
        {
          quote: "انخفضت حالات عدم الحضور بمقدار الثلث في الربع الأول. أصبح الجدول والتذكيرات نظامًا واحدًا.",
          name: "د. ليلى الحربي",
          role: "المدير الطبي",
          clinic: "عيادة نور للعائلة، الرياض",
        },
        {
          quote: "قوالب الملف الطبي تناسب طريقة عملي فعلًا. التوثيق صار دقائق بدل أمسية كاملة.",
          name: "د. عمر ناصر",
          role: "استشاري قلب",
          clinic: "مركز الحياة الطبي، جدة",
        },
        {
          quote: "كانت مطالبات التأمين عنق الزجاجة لدينا، والآن الدورة كاملة متتبعة وتُسوّى أسرع بكثير.",
          name: "سارة القحطاني",
          role: "مديرة العمليات",
          clinic: "مجمع سما الطبي، الدمام",
        },
      ],
    },
    pricing: {
      eyebrow: "الأسعار",
      title: "باقات تنمو مع منشأتك",
      subtitle: "أسعار واضحة بالريال السعودي. يمكن الإلغاء في أي وقت.",
      period: "/ شهريًا",
      tiers: [
        {
          name: "البداية",
          price: "٣٤٩ ر.س",
          desc: "للأطباء المستقلين والفرق الصغيرة.",
          features: ["حتى ٣ ممارسين", "المواعيد وملفات المرضى", "الوصفات الإلكترونية", "دعم بالبريد"],
          cta: "اختر الباقة",
          popular: false,
        },
        {
          name: "العيادة",
          price: "٨٩٩ ر.س",
          desc: "للعيادات متعددة الأطباء.",
          features: [
            "حتى ٢٠ ممارسًا",
            "الفوترة ومطالبات التأمين",
            "تكامل المختبر والصيدلية",
            "الطب الاتصالي مشمول",
            "دعم عربي ذو أولوية",
          ],
          cta: "اختر الباقة",
          popular: true,
        },
        {
          name: "المؤسسات",
          price: "حسب الطلب",
          desc: "للمجموعات الطبية والشبكات متعددة الفروع.",
          features: [
            "ممارسون وفروع بلا حدود",
            "تكاملات مخصصة وواجهات برمجية",
            "مدير نجاح مخصص",
            "اتفاقية مستوى خدمة وبرنامج تهيئة",
          ],
          cta: "اختر الباقة",
          popular: false,
        },
      ],
      badge: "الأكثر اختيارًا",
    },
    partners: {
      title: "متكامل مع الأنظمة التي تستخدمها",
      logos: ["بوبا العربية", "التعاونية", "مدى", "STC Pay", "لاب كور", "فارما لينك"],
    },
    faq: {
      eyebrow: "الأسئلة الشائعة",
      title: "أسئلة متكررة",
      items: [
        {
          q: "هل المنصة متوفرة بالعربية؟",
          a: "نعم، المنتج بالكامل — تطبيق المرضى ولوحة العيادة والإشعارات والفواتير — معرّب مع تخطيط من اليمين إلى اليسار، ويمكن تبديل اللغة في أي وقت.",
        },
        {
          q: "أين تُخزّن بيانات المرضى؟",
          a: "تُخزّن جميع بيانات المرضى داخل المملكة على بنية تحتية مشفّرة مع ضوابط وصول صارمة وسجلات تدقيق كاملة.",
        },
        {
          q: "كم تستغرق عملية التهيئة؟",
          a: "تبدأ معظم العيادات ذات الفرع الواحد خلال خمسة أيام عمل، شاملة نقل البيانات وحسابات الموظفين والتدريب بالعربية أو الإنجليزية.",
        },
        {
          q: "هل يمكن نقل سجلاتنا الحالية؟",
          a: "نعم، يتولى فريقنا استيراد ملفات المرضى وسجل المواعيد وبيانات الفوترة من الجداول أو نظامكم الحالي دون رسوم إضافية في الباقات السنوية.",
        },
        {
          q: "هل يعمل مع شركات التأمين؟",
          a: "تدعم المنصة التحقق من الأهلية وتقديم المطالبات والتسوية مع كبرى شركات التأمين السعودية إضافة إلى الدفع النقدي والبطاقات.",
        },
        {
          q: "هل الطب الاتصالي مشمول؟",
          a: "الاستشارات المرئية مشمولة في باقتي العيادة والمؤسسات، مع الملاحظات ومشاركة الملفات والوصفات داخل الجلسة.",
        },
      ],
    },
    finalCta: {
      title: "جاهز لتطوير عيادتك؟",
      subtitle: "انضم إلى مئات مقدمي الرعاية في المملكة لتقديم رعاية أسرع وأكثر أمانًا وتنظيمًا.",
      cta: "ابدأ الآن",
      secondary: "تحدث مع المبيعات",
    },
    footer: {
      about: "صحتي كلاود منصة لإدارة الرعاية الصحية للعيادات والأطباء والمرضى في المملكة العربية السعودية.",
      columns: [
        { title: "المنتج", links: ["المميزات", "الحلول", "الأسعار", "الطب الاتصالي", "التكاملات"] },
        { title: "الشركة", links: ["من نحن", "الوظائف", "المركز الإعلامي", "الشركاء", "تواصل معنا"] },
        { title: "قانوني", links: ["سياسة الخصوصية", "شروط الاستخدام", "معالجة البيانات", "الامتثال"] },
      ],
      newsletterTitle: "تحديثات المنتج",
      newsletterDesc: "رؤى في التقنية الصحية، مرة كل شهر.",
      placeholder: "بريدك الإلكتروني",
      subscribe: "اشترك",
      rights: "© ٢٠٢٦ صحتي كلاود. جميع الحقوق محفوظة.",
      location: "الرياض، المملكة العربية السعودية",
    },
  },
};
