import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  doctorRegistrationSchema,
  patientBookingSchema,
  type DoctorRegistrationInput,
  type PatientBookingInput,
} from "@/lib/healthcare-flow-schemas";
import {
  submitDoctorRegistration,
  submitPatientBooking,
} from "@/lib/healthcare-flows.functions";
import type { Lang } from "@/lib/landing-content";

type FlowType = "doctor" | "booking";

const initialDoctor: DoctorRegistrationInput = {
  fullName: "",
  email: "",
  phone: "",
  specialty: "",
  licenseNumber: "",
  yearsExperience: 0,
  clinicName: "",
  city: "",
  consultationType: "both",
};

const initialBooking: PatientBookingInput = {
  patientName: "",
  email: "",
  phone: "",
  specialty: "",
  doctorPreference: "",
  appointmentDate: "",
  appointmentTime: "",
  visitType: "in_person",
  reason: "",
};

const copy = {
  en: {
    doctor: {
      title: "Join as a Provider",
      description: "Complete your profile for verification by our clinical onboarding team.",
      steps: ["Profile", "Credentials", "Practice"],
      success: "Application received",
      successText: "Our provider team will review your credentials and contact you shortly.",
    },
    booking: {
      title: "Book an Appointment",
      description: "Tell us what care you need and choose a suitable appointment time.",
      steps: ["Patient", "Doctor", "Schedule", "Confirm"],
      success: "Appointment requested",
      successText: "Your request is saved. The clinic will contact you to confirm the appointment.",
    },
    next: "Continue",
    back: "Back",
    submit: "Submit request",
    required: "Please complete all required fields correctly.",
    failed: "We couldn't save your request. Please try again.",
    reference: "Reference",
    done: "Done",
  },
  ar: {
    doctor: {
      title: "انضم كمقدم خدمة",
      description: "أكمل ملفك للتحقق منه من قبل فريق تسجيل الممارسين.",
      steps: ["الملف", "المؤهلات", "الممارسة"],
      success: "تم استلام الطلب",
      successText: "سيراجع فريقنا مؤهلاتك ويتواصل معك قريباً.",
    },
    booking: {
      title: "احجز موعداً",
      description: "أخبرنا بالرعاية التي تحتاجها واختر موعداً مناسباً.",
      steps: ["المريض", "الطبيب", "الموعد", "التأكيد"],
      success: "تم طلب الموعد",
      successText: "تم حفظ طلبك. ستتواصل معك العيادة لتأكيد الموعد.",
    },
    next: "متابعة",
    back: "رجوع",
    submit: "إرسال الطلب",
    required: "يرجى إكمال جميع الحقول المطلوبة بشكل صحيح.",
    failed: "تعذر حفظ طلبك. يرجى المحاولة مرة أخرى.",
    reference: "الرقم المرجعي",
    done: "تم",
  },
} as const;

function Field({ label, ...props }: React.ComponentProps<typeof Input> & { label: string }) {
  const id = props.name;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} className="h-11" {...props} />
    </div>
  );
}

export function HealthcareFlowDialog({
  type,
  lang,
  children,
}: {
  type: FlowType;
  lang: Lang;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [doctor, setDoctor] = useState(initialDoctor);
  const [booking, setBooking] = useState(initialBooking);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const sendDoctor = useServerFn(submitDoctorRegistration);
  const sendBooking = useServerFn(submitPatientBooking);
  const text = copy[lang];
  const flow = text[type];
  const isRtl = lang === "ar";

  const reset = () => {
    setStep(0);
    setDoctor(initialDoctor);
    setBooking(initialBooking);
    setError("");
    setReference("");
    setSubmitting(false);
  };

  const validateStep = () => {
    if (type === "doctor") {
      if (step === 0) return doctor.fullName.length >= 2 && doctor.email.includes("@") && doctor.phone.length >= 8;
      if (step === 1) return doctor.specialty.length >= 2 && doctor.licenseNumber.length >= 3 && doctor.yearsExperience >= 0;
      return doctor.city.length >= 2;
    }
    if (step === 0) return booking.patientName.length >= 2 && booking.email.includes("@") && booking.phone.length >= 8;
    if (step === 1) return booking.specialty.length >= 2;
    if (step === 2) return Boolean(booking.appointmentDate && booking.appointmentTime && booking.visitType);
    return booking.reason.trim().length >= 5;
  };

  const advance = () => {
    if (!validateStep()) {
      setError(text.required);
      return;
    }
    setError("");
    setStep((current) => current + 1);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = type === "doctor" ? doctorRegistrationSchema.safeParse(doctor) : patientBookingSchema.safeParse(booking);
    if (!parsed.success) {
      setError(text.required);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = type === "doctor"
        ? await sendDoctor({ data: doctorRegistrationSchema.parse(doctor) })
        : await sendBooking({ data: patientBookingSchema.parse(booking) });
      setReference(result.reference);
    } catch {
      setError(text.failed);
    } finally {
      setSubmitting(false);
    }
  };

  const updateDoctor = (key: keyof DoctorRegistrationInput, value: string | number) => {
    setError("");
    setDoctor((current) => ({ ...current, [key]: value }));
  };
  const updateBooking = (key: keyof PatientBookingInput, value: string) => {
    setError("");
    setBooking((current) => ({ ...current, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent dir={isRtl ? "rtl" : "ltr"} className="max-h-[92vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
        <div className="border-b border-border px-6 pb-5 pt-6 sm:px-8">
          <DialogHeader className={isRtl ? "text-right" : "text-left"}>
            <DialogTitle className="text-2xl">{flow.title}</DialogTitle>
            <DialogDescription>{flow.description}</DialogDescription>
          </DialogHeader>
          {!reference ? (
            <div className="mt-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${flow.steps.length}, minmax(0, 1fr))` }}>
              {flow.steps.map((label, index) => (
                <div key={label} className="min-w-0">
                  <div className={index <= step ? "h-1.5 rounded-full bg-primary" : "h-1.5 rounded-full bg-muted"} />
                  <p className={index === step ? "mt-2 truncate text-xs font-semibold text-primary" : "mt-2 truncate text-xs text-muted-foreground"}>{label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {reference ? (
          <div className="px-6 py-12 text-center sm:px-8">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
            <h3 className="mt-5 text-2xl font-bold">{flow.success}</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">{flow.successText}</p>
            <p className="mt-5 text-sm font-semibold">{text.reference}: {reference}</p>
            <Button className="mt-7" onClick={() => setOpen(false)}>{text.done}</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6 px-6 pb-6 sm:px-8 sm:pb-8">
            <div className="grid gap-4 sm:grid-cols-2">
              {type === "doctor" && step === 0 ? <>
                <Field name="fullName" label={isRtl ? "الاسم الكامل *" : "Full name *"} value={doctor.fullName} onChange={(e) => updateDoctor("fullName", e.target.value)} maxLength={100} autoComplete="name" />
                <Field name="email" type="email" label={isRtl ? "البريد الإلكتروني *" : "Email *"} value={doctor.email} onChange={(e) => updateDoctor("email", e.target.value)} maxLength={255} autoComplete="email" />
                <Field name="phone" type="tel" label={isRtl ? "رقم الجوال *" : "Mobile number *"} value={doctor.phone} onChange={(e) => updateDoctor("phone", e.target.value)} maxLength={20} autoComplete="tel" />
              </> : null}
              {type === "doctor" && step === 1 ? <>
                <Field name="specialty" label={isRtl ? "التخصص *" : "Specialty *"} value={doctor.specialty} onChange={(e) => updateDoctor("specialty", e.target.value)} maxLength={100} />
                <Field name="licenseNumber" label={isRtl ? "رقم الترخيص *" : "License number *"} value={doctor.licenseNumber} onChange={(e) => updateDoctor("licenseNumber", e.target.value)} maxLength={50} />
                <Field name="yearsExperience" type="number" min={0} max={70} label={isRtl ? "سنوات الخبرة *" : "Years of experience *"} value={doctor.yearsExperience} onChange={(e) => updateDoctor("yearsExperience", Number(e.target.value))} />
              </> : null}
              {type === "doctor" && step === 2 ? <>
                <Field name="clinicName" label={isRtl ? "اسم العيادة" : "Clinic name"} value={doctor.clinicName} onChange={(e) => updateDoctor("clinicName", e.target.value)} maxLength={120} />
                <Field name="city" label={isRtl ? "المدينة *" : "City *"} value={doctor.city} onChange={(e) => updateDoctor("city", e.target.value)} maxLength={80} />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="consultationType">{isRtl ? "نوع الاستشارة *" : "Consultation type *"}</Label>
                  <select id="consultationType" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={doctor.consultationType} onChange={(e) => updateDoctor("consultationType", e.target.value)}>
                    <option value="in_person">{isRtl ? "حضوري" : "In person"}</option><option value="video">{isRtl ? "فيديو" : "Video"}</option><option value="both">{isRtl ? "كلاهما" : "Both"}</option>
                  </select>
                </div>
              </> : null}

              {type === "booking" && step === 0 ? <>
                <Field name="patientName" label={isRtl ? "اسم المريض *" : "Patient name *"} value={booking.patientName} onChange={(e) => updateBooking("patientName", e.target.value)} maxLength={100} autoComplete="name" />
                <Field name="email" type="email" label={isRtl ? "البريد الإلكتروني *" : "Email *"} value={booking.email} onChange={(e) => updateBooking("email", e.target.value)} maxLength={255} autoComplete="email" />
                <Field name="phone" type="tel" label={isRtl ? "رقم الجوال *" : "Mobile number *"} value={booking.phone} onChange={(e) => updateBooking("phone", e.target.value)} maxLength={20} autoComplete="tel" />
              </> : null}
              {type === "booking" && step === 1 ? <>
                <Field name="specialty" label={isRtl ? "التخصص المطلوب *" : "Required specialty *"} value={booking.specialty} onChange={(e) => updateBooking("specialty", e.target.value)} maxLength={100} />
                <Field name="doctorPreference" label={isRtl ? "الطبيب المفضل" : "Preferred doctor"} value={booking.doctorPreference} onChange={(e) => updateBooking("doctorPreference", e.target.value)} maxLength={100} />
              </> : null}
              {type === "booking" && step === 2 ? <>
                <Field name="appointmentDate" type="date" min={new Date().toISOString().slice(0, 10)} label={isRtl ? "التاريخ *" : "Date *"} value={booking.appointmentDate} onChange={(e) => updateBooking("appointmentDate", e.target.value)} />
                <Field name="appointmentTime" type="time" label={isRtl ? "الوقت *" : "Time *"} value={booking.appointmentTime} onChange={(e) => updateBooking("appointmentTime", e.target.value)} />
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="visitType">{isRtl ? "نوع الزيارة *" : "Visit type *"}</Label>
                  <select id="visitType" className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={booking.visitType} onChange={(e) => updateBooking("visitType", e.target.value)}>
                    <option value="in_person">{isRtl ? "في العيادة" : "At the clinic"}</option><option value="video">{isRtl ? "استشارة فيديو" : "Video consultation"}</option>
                  </select>
                </div>
              </> : null}
              {type === "booking" && step === 3 ? <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="reason">{isRtl ? "سبب الزيارة *" : "Reason for visit *"}</Label>
                <Textarea id="reason" value={booking.reason} onChange={(e) => updateBooking("reason", e.target.value)} maxLength={1000} rows={5} placeholder={isRtl ? "صف الأعراض أو سبب الموعد" : "Briefly describe your symptoms or reason for the appointment"} />
                <p className="text-end text-xs text-muted-foreground">{booking.reason.length}/1000</p>
              </div> : null}
            </div>

            {error ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
            <div className="flex items-center justify-between border-t border-border pt-5">
              <Button type="button" variant="outline" onClick={() => { setError(""); setStep((current) => Math.max(0, current - 1)); }} disabled={step === 0 || submitting}>
                <ArrowLeft className={isRtl ? "rotate-180" : ""} />{text.back}
              </Button>
              {step < flow.steps.length - 1 ? (
                <Button type="button" onClick={advance}>{text.next}<ArrowRight className={isRtl ? "rotate-180" : ""} /></Button>
              ) : (
                <Button type="submit" variant="hero" disabled={submitting}>{submitting ? <Loader2 className="animate-spin" /> : null}{text.submit}</Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}