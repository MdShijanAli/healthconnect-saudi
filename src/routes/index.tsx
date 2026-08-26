import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  HeartPulse,
  KeyRound,
  Lock,
  Users,
  Stethoscope,
  Pill,
  ScrollText,
  Search,
  ShieldCheck,
  Video,
  Check,
  Quote,
  Facebook,
  Linkedin,
  Twitter,
  Instagram,
  Globe,
  UserPlus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { content, type Lang } from "@/lib/landing-content";
import { HealthcareFlowDialog } from "@/components/healthcare-flow-dialog";
import heroDashboard from "@/assets/hero-dashboard.jpg";
import roleClinics from "@/assets/role-clinics.jpg";
import roleDoctors from "@/assets/role-doctors.jpg";
import rolePatients from "@/assets/role-patients.jpg";
import appPreview from "@/assets/app-preview.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sehaty Cloud — Clinic & Healthcare Management Platform" },
      {
        name: "description",
        content:
          "Sehaty Cloud connects clinics, doctors and patients in Saudi Arabia with scheduling, EMR, e-prescriptions, billing and telemedicine in Arabic and English.",
      },
      { property: "og:title", content: "Sehaty Cloud — Clinic & Healthcare Management Platform" },
      {
        property: "og:description",
        content:
          "One secure platform for appointments, medical records, e-prescriptions, billing and telemedicine — built for Saudi clinics in Arabic and English.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const featureIcons = [
  Users,
  Stethoscope,
  CalendarCheck,
  FileText,
  Pill,
  FlaskConical,
  CreditCard,
  Video,
  Activity,
];

const securityIcons = [Lock, KeyRound, ScrollText, ShieldCheck];
const bookingIcons = [UserPlus, Search, CalendarCheck, HeartPulse];
const roleImages = [roleClinics, roleDoctors, rolePatients];

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "start";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}

function Index() {
  const [lang, setLang] = useState<Lang>("en");
  const [activeRole, setActiveRole] = useState(0);
  const t = content[lang];
  const isRtl = t.dir === "rtl";

  return (
    <div dir={t.dir} lang={lang} className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <nav className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            <span className="gradient-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground">
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="truncate text-lg font-extrabold tracking-tight">{t.nav.brand}</span>
          </a>

          <div className="flex items-center justify-end gap-1.5">
            <ul className="hidden items-center gap-1 lg:flex">
              {t.nav.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="ms-1 inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-2 text-xs font-semibold transition-colors hover:border-primary/50 hover:text-primary"
              aria-label="Toggle language"
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "en" ? "AR" : "EN"}
            </button>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              {t.nav.login}
            </Button>
            <Button variant="hero" size="sm">
              {t.nav.getStarted}
            </Button>
          </div>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden gradient-soft">
          <div className="glow-top pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
          <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className={isRtl ? "text-right" : "text-left"}>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  {t.hero.badge}
                </span>
                <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  {t.hero.title}{" "}
                  <span className="text-gradient">{t.hero.titleAccent}</span>
                </h1>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {t.hero.subtitle}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="hero" size="lg">
                    {t.hero.ctaPrimary}
                    <ArrowRight className={isRtl ? "rotate-180" : ""} />
                  </Button>
                  <Button variant="outline" size="lg">
                    {t.hero.ctaSecondary}
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">{t.hero.note}</p>
              </div>

              <div className="relative">
                <div className="gradient-brand absolute -inset-3 rounded-[2rem] opacity-15 blur-2xl" />
                <img
                  src={heroDashboard}
                  alt="Sehaty Cloud clinic dashboard showing appointments, patients and analytics"
                  width={1600}
                  height={1104}
                  className="relative w-full rounded-3xl border border-border/70 shadow-lift"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto -mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:grid-cols-2 sm:p-8 lg:grid-cols-4">
            {t.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-extrabold tracking-tight text-gradient sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <SectionHeading
            eyebrow={t.features.eyebrow}
            title={t.features.title}
            subtitle={t.features.subtitle}
          />
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.items.map((item, i) => {
              const Icon = featureIcons[i] ?? ClipboardList;
              return (
                <article
                  key={item.title}
                  className="card-hover rounded-3xl border border-border bg-card p-6 shadow-soft"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* Role tabs */}
        <section id="solutions" className="scroll-mt-24 bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.roles.eyebrow} title={t.roles.title} />
            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {t.roles.tabs.map((tab, i) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveRole(i)}
                  className={
                    "rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 " +
                    (activeRole === i
                      ? "gradient-brand text-primary-foreground shadow-soft"
                      : "border border-border bg-card text-muted-foreground hover:text-foreground")
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {(() => {
              const role = t.roles.tabs[activeRole] ?? t.roles.tabs[0]!;
              return (
                <div className="mt-12 grid items-center gap-10 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-2">
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {role.heading}
                    </h3>
                    <ul className="mt-6 space-y-3.5">
                      {role.points.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                          <span className="text-sm leading-relaxed text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <img
                    src={roleImages[activeRole] ?? roleImages[0]}
                    alt={role.heading}
                    loading="lazy"
                    width={1200}
                    height={900}
                    className="w-full rounded-2xl border border-border object-cover shadow-soft"
                  />
                </div>
              );
            })()}

          </div>
        </section>

        {/* Doctor registration */}
        <section id="providers" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">

          <SectionHeading
            eyebrow={t.doctorReg.eyebrow}
            title={t.doctorReg.title}
            subtitle={t.doctorReg.subtitle}
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {t.doctorReg.steps.map((step, i) => (
              <article
                key={step.title}
                className="card-hover relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-soft"
              >
                <span className="text-5xl font-extrabold text-gradient">{`0${i + 1}`}</span>
                <h3 className="mt-4 text-lg font-bold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-10 text-center">
            <HealthcareFlowDialog type="doctor" lang={lang}>
              <Button variant="hero" size="lg">
                {t.doctorReg.cta}
                <ArrowRight className={isRtl ? "rotate-180" : ""} />
              </Button>
            </HealthcareFlowDialog>
          </div>

        </section>

        {/* Patient booking flow */}
        <section id="booking" className="scroll-mt-24 bg-surface py-20 sm:py-28">

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.booking.eyebrow} title={t.booking.title} />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {t.booking.steps.map((step, i) => {
                const Icon = bookingIcons[i] ?? CalendarCheck;
                return (
                  <article
                    key={step.title}
                    className="card-hover rounded-3xl border border-border bg-card p-6 text-center shadow-soft"
                  >
                    <span className="gradient-brand mx-auto grid h-14 w-14 place-items-center rounded-2xl text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {`0${i + 1}`}
                    </p>
                    <h3 className="mt-1 text-base font-bold tracking-tight">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  </article>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <HealthcareFlowDialog type="booking" lang={lang}>
                <Button variant="hero" size="lg">{t.booking.cta}</Button>
              </HealthcareFlowDialog>
            </div>

          </div>
        </section>

        {/* App preview */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading
                eyebrow={t.app.eyebrow}
                title={t.app.title}
                subtitle={t.app.subtitle}
                align="start"
              />
              <ul className="mt-8 space-y-3">
                {t.app.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm font-medium">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="gradient-brand absolute inset-x-6 bottom-6 top-10 rounded-[2rem] opacity-10 blur-2xl" />
              <img
                src={appPreview}
                alt="Sehaty Cloud mobile patient app and web clinic dashboard"
                loading="lazy"
                width={1408}
                height={1008}
                className="relative w-full"
              />
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="about" className="bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow={t.security.eyebrow}
              title={t.security.title}
              subtitle={t.security.subtitle}
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {t.security.items.map((item, i) => {
                const Icon = securityIcons[i] ?? ShieldCheck;
                return (
                  <article
                    key={item.title}
                    className="card-hover rounded-3xl border border-border bg-card p-6 shadow-soft"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-5 text-base font-bold tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <SectionHeading eyebrow={t.testimonials.eyebrow} title={t.testimonials.title} />
          <div className="mt-14 grid gap-5 lg:grid-cols-3">
            {t.testimonials.items.map((item) => (
              <figure
                key={item.name}
                className="card-hover flex h-full flex-col rounded-3xl border border-border bg-card p-7 shadow-soft"
              >
                <Quote className="h-7 w-7 text-primary/40" />
                <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-foreground/90">
                  {item.quote}
                </blockquote>
                <figcaption className="mt-6 flex min-w-0 items-center gap-3 border-t border-border pt-5">
                  <span className="gradient-brand grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-primary-foreground">
                    {item.name.replace("Dr. ", "").charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{item.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {item.role} · {item.clinic}
                    </span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              eyebrow={t.pricing.eyebrow}
              title={t.pricing.title}
              subtitle={t.pricing.subtitle}
            />
            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {t.pricing.tiers.map((tier) => (
                <article
                  key={tier.name}
                  className={
                    "card-hover relative flex flex-col rounded-3xl border bg-card p-7 shadow-soft " +
                    (tier.popular ? "border-primary/50 ring-1 ring-primary/20" : "border-border")
                  }
                >
                  {tier.popular ? (
                    <span className="gradient-brand absolute -top-3 start-7 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                      {t.pricing.badge}
                    </span>
                  ) : null}
                  <h3 className="text-lg font-bold tracking-tight">{tier.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{tier.desc}</p>
                  <p className="mt-5 flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                    <span className="pb-1 text-xs text-muted-foreground">{t.pricing.period}</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button variant={tier.popular ? "hero" : "outline"} className="mt-7 w-full">
                    {tier.cta}
                  </Button>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            {t.partners.title}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {t.partners.logos.map((logo) => (
              <div
                key={logo}
                className="flex h-16 items-center justify-center rounded-2xl border border-border bg-card px-4 text-sm font-bold text-muted-foreground shadow-soft transition-colors hover:text-primary"
              >
                {logo}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-surface py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <SectionHeading eyebrow={t.faq.eyebrow} title={t.faq.title} />
            <Accordion type="single" collapsible className="mt-10 space-y-3">
              {t.faq.items.map((item, i) => (
                <AccordionItem
                  key={item.q}
                  value={`item-${i}`}
                  className="rounded-2xl border border-border bg-card px-5 shadow-soft"
                >
                  <AccordionTrigger className="text-start text-sm font-semibold hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="gradient-brand relative overflow-hidden rounded-[2rem] px-6 py-16 text-center shadow-lift sm:px-12">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              {t.finalCta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
              {t.finalCta.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary">
                {t.finalCta.cta}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                {t.finalCta.secondary}
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.4fr]">
            <div>
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="gradient-brand grid h-9 w-9 shrink-0 place-items-center rounded-xl text-primary-foreground">
                  <HeartPulse className="h-5 w-5" />
                </span>
                <span className="truncate text-lg font-extrabold tracking-tight">{t.nav.brand}</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t.footer.about}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{t.footer.location}</p>
              <div className="mt-5 flex gap-2">
                {[Twitter, Linkedin, Facebook, Instagram].map((Icon, i) => (
                  <a
                    key={i}
                    href="#contact"
                    aria-label="Social link"
                    className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {t.footer.columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-bold tracking-tight">{col.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#top"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="text-sm font-bold tracking-tight">{t.footer.newsletterTitle}</h3>
              <p className="mt-4 text-sm text-muted-foreground">{t.footer.newsletterDesc}</p>
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                <Input
                  type="email"
                  required
                  placeholder={t.footer.placeholder}
                  className="h-10 rounded-full"
                  aria-label={t.footer.placeholder}
                />
                <Button type="submit" variant="hero">
                  {t.footer.subscribe}
                </Button>
              </form>
            </div>
          </div>

          <p className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            {t.footer.rights}
          </p>
        </div>
      </footer>
    </div>
  );
}
