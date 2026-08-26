// In-memory dummy data store. Replaces the Supabase-backed database entirely.
// State lives for the lifetime of the server process (and resets on restart /
// dev server reload) — there is no real persistence layer here by design.

export type AppRole = "super_admin" | "doctor" | "patient";
export type DoctorApprovalStatus = "pending_approval" | "approved" | "rejected";
export type AppointmentStatus = "pending" | "scheduled" | "completed" | "cancelled";
export type NotificationType =
  | "booking_confirmation"
  | "appointment_accepted"
  | "appointment_cancelled"
  | "prescription_ready";
export type Gender = "male" | "female";
export type BillingCycle = "monthly" | "yearly";
export type ConsultationType = "in_person" | "video" | "both";
export type VisitType = "in_person" | "video";

export interface MockUser {
  id: string;
  email: string;
  password: string;
}

export interface Profile {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleRow {
  userId: string;
  role: AppRole;
}

export interface DoctorProfile {
  userId: string;
  specialization: string;
  medicalLicenseNumber: string;
  yearsExperience: number;
  consultationFee: number;
  bio: string;
  profilePhotoPath: string | null;
  approvalStatus: DoctorApprovalStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  isActive: boolean;
  reviewNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientProfile {
  userId: string;
  dateOfBirth: string;
  gender: Gender;
  profilePhotoPath: string | null;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Specialization {
  id: string;
  name: string;
  icon: string;
  description: string;
  displayOrder: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: BillingCycle;
  features: string[];
  isActive: boolean;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  fee: number;
  reason: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorAvailability {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
}

export interface DoctorUnavailableDate {
  id: string;
  doctorId: string;
  date: string;
  reason: string | null;
}

export interface DoctorMedicine {
  id: string;
  doctorId: string;
  name: string;
  commonDosage: string | null;
  category: string | null;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  diagnosisNotes: string | null;
  adviceNotes: string | null;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineId: string | null;
  medicineName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface NotificationRow {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedAppointmentId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DoctorRegistrationLead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  specialty: string;
  licenseNumber: string;
  yearsExperience: number;
  clinicName: string | null;
  city: string;
  consultationType: ConsultationType;
  status: string;
  createdAt: string;
}

export interface PatientBookingLead {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  specialty: string;
  doctorPreference: string | null;
  appointmentDate: string;
  appointmentTime: string;
  visitType: VisitType;
  reason: string;
  status: string;
  createdAt: string;
}

interface MockDb {
  users: MockUser[];
  sessions: Map<string, string>;
  profiles: Profile[];
  userRoles: UserRoleRow[];
  doctorProfiles: DoctorProfile[];
  patientProfiles: PatientProfile[];
  specializations: Specialization[];
  subscriptionPlans: SubscriptionPlan[];
  appointments: Appointment[];
  doctorAvailability: DoctorAvailability[];
  doctorUnavailableDates: DoctorUnavailableDate[];
  doctorMedicines: DoctorMedicine[];
  prescriptions: Prescription[];
  prescriptionItems: PrescriptionItem[];
  notifications: NotificationRow[];
  doctorRegistrationLeads: DoctorRegistrationLead[];
  patientBookingLeads: PatientBookingLead[];
}

function genId(): string {
  return crypto.randomUUID();
}

function isoNow(): string {
  return new Date().toISOString();
}

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildSeed(): MockDb {
  const db: MockDb = {
    users: [],
    sessions: new Map(),
    profiles: [],
    userRoles: [],
    doctorProfiles: [],
    patientProfiles: [],
    specializations: [],
    subscriptionPlans: [],
    appointments: [],
    doctorAvailability: [],
    doctorUnavailableDates: [],
    doctorMedicines: [],
    prescriptions: [],
    prescriptionItems: [],
    notifications: [],
    doctorRegistrationLeads: [],
    patientBookingLeads: [],
  };

  function addUser(email: string, password: string): string {
    const id = genId();
    db.users.push({ id, email, password });
    return id;
  }

  function addProfile(id: string, fullName: string, phone: string) {
    db.profiles.push({ id, fullName, phone, createdAt: isoNow(), updatedAt: isoNow() });
  }

  function addDoctor(opts: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    specialization: string;
    medicalLicenseNumber: string;
    yearsExperience: number;
    consultationFee: number;
    bio: string;
    approvalStatus: DoctorApprovalStatus;
    isActive: boolean;
    reviewNotes?: string | null;
  }): string {
    const id = addUser(opts.email, opts.password);
    addProfile(id, opts.fullName, opts.phone);
    db.userRoles.push({ userId: id, role: "doctor" });
    db.doctorProfiles.push({
      userId: id,
      specialization: opts.specialization,
      medicalLicenseNumber: opts.medicalLicenseNumber,
      yearsExperience: opts.yearsExperience,
      consultationFee: opts.consultationFee,
      bio: opts.bio,
      profilePhotoPath: null,
      approvalStatus: opts.approvalStatus,
      reviewedBy: null,
      reviewedAt: null,
      isActive: opts.isActive,
      reviewNotes: opts.reviewNotes ?? null,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    });
    return id;
  }

  function addPatient(opts: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    dateOfBirth: string;
    gender: Gender;
    isBlocked?: boolean;
  }): string {
    const id = addUser(opts.email, opts.password);
    addProfile(id, opts.fullName, opts.phone);
    db.userRoles.push({ userId: id, role: "patient" });
    db.patientProfiles.push({
      userId: id,
      dateOfBirth: opts.dateOfBirth,
      gender: opts.gender,
      profilePhotoPath: null,
      isBlocked: opts.isBlocked ?? false,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    });
    return id;
  }

  // --- Super admin ---
  const adminId = addUser("admin@sehatycloud.sa", "Admin@12345");
  addProfile(adminId, "Sehaty Admin", "+966500000001");
  db.userRoles.push({ userId: adminId, role: "super_admin" });

  // --- Doctors ---
  const sarah = addDoctor({
    email: "doctor@sehatycloud.sa",
    password: "Doctor@12345",
    fullName: "Dr. Sarah Al-Fahad",
    phone: "+966500000002",
    specialization: "Family Medicine",
    medicalLicenseNumber: "DEMO-LICENSE-0001",
    yearsExperience: 8,
    consultationFee: 150,
    bio: "Experienced family medicine physician providing comprehensive primary and preventive care for patients of all ages.",
    approvalStatus: "approved",
    isActive: true,
  });
  const omar = addDoctor({
    email: "omar.harbi@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Dr. Omar Al-Harbi",
    phone: "+966500000004",
    specialization: "Cardiology",
    medicalLicenseNumber: "DEMO-LICENSE-0002",
    yearsExperience: 12,
    consultationFee: 250,
    bio: "Board-certified cardiologist with over a decade of experience diagnosing and treating heart and vascular conditions, from hypertension to complex arrhythmias.",
    approvalStatus: "approved",
    isActive: true,
  });
  const layla = addDoctor({
    email: "layla.zahrani@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Dr. Layla Al-Zahrani",
    phone: "+966500000005",
    specialization: "Pediatrics",
    medicalLicenseNumber: "DEMO-LICENSE-0003",
    yearsExperience: 9,
    consultationFee: 120,
    bio: "Compassionate pediatrician dedicated to the health and development of infants, children and adolescents, with a focus on preventive care.",
    approvalStatus: "approved",
    isActive: true,
  });
  addDoctor({
    email: "yousef.qahtani@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Dr. Yousef Al-Qahtani",
    phone: "+966500000006",
    specialization: "Dermatology",
    medicalLicenseNumber: "DEMO-LICENSE-0004",
    yearsExperience: 6,
    consultationFee: 180,
    bio: "Dermatologist experienced in treating a wide range of skin, hair and nail conditions using the latest evidence-based approaches.",
    approvalStatus: "pending_approval",
    isActive: true,
  });
  addDoctor({
    email: "nora.mutairi@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Dr. Nora Al-Mutairi",
    phone: "+966500000007",
    specialization: "Orthopedics",
    medicalLicenseNumber: "DEMO-LICENSE-0005",
    yearsExperience: 11,
    consultationFee: 220,
    bio: "Orthopedic surgeon specializing in sports injuries, joint disorders and post-operative rehabilitation for patients of all ages.",
    approvalStatus: "pending_approval",
    isActive: true,
  });
  addDoctor({
    email: "khalid.otaibi@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Dr. Khalid Al-Otaibi",
    phone: "+966500000008",
    specialization: "Mental Health",
    medicalLicenseNumber: "DEMO-LICENSE-0006",
    yearsExperience: 7,
    consultationFee: 200,
    bio: "Psychiatrist with a focus on anxiety, depression and stress-related disorders, combining therapy and medication management.",
    approvalStatus: "rejected",
    isActive: false,
    reviewNotes:
      "Medical license could not be verified with the Saudi Commission for Health Specialties. Please resubmit with updated supporting documentation.",
  });

  // --- Patients ---
  const fahad = addPatient({
    email: "patient@sehatycloud.sa",
    password: "Patient@12345",
    fullName: "Fahad Al-Otaibi",
    phone: "+966500000003",
    dateOfBirth: "1990-05-14",
    gender: "male",
  });
  const mona = addPatient({
    email: "mona.shehri@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Mona Al-Shehri",
    phone: "+966500000009",
    dateOfBirth: "1988-03-22",
    gender: "female",
  });
  const abdullah = addPatient({
    email: "abdullah.dossari@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Abdullah Al-Dossari",
    phone: "+966500000010",
    dateOfBirth: "1979-11-05",
    gender: "male",
  });
  const reem = addPatient({
    email: "reem.ghamdi@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Reem Al-Ghamdi",
    phone: "+966500000011",
    dateOfBirth: "1995-07-14",
    gender: "female",
    isBlocked: true,
  });
  const sultan = addPatient({
    email: "sultan.anzi@sehatycloud.sa",
    password: "Demo@12345",
    fullName: "Sultan Al-Anzi",
    phone: "+966500000012",
    dateOfBirth: "1985-01-30",
    gender: "male",
  });

  // --- Specializations ---
  db.specializations.push(
    { id: genId(), name: "Family Medicine", icon: "Stethoscope", description: "Primary and preventive care for the whole family.", displayOrder: 1 },
    { id: genId(), name: "Pediatrics", icon: "Baby", description: "Medical care for infants, children and adolescents.", displayOrder: 2 },
    { id: genId(), name: "Cardiology", icon: "HeartPulse", description: "Diagnosis and treatment of heart and vascular conditions.", displayOrder: 3 },
    { id: genId(), name: "Dermatology", icon: "Sparkles", description: "Skin, hair and nail conditions.", displayOrder: 4 },
    { id: genId(), name: "Dentistry", icon: "Smile", description: "General and cosmetic dental care.", displayOrder: 5 },
    { id: genId(), name: "Orthopedics", icon: "Bone", description: "Bones, joints, ligaments and muscles.", displayOrder: 6 },
    { id: genId(), name: "Obstetrics & Gynecology", icon: "Flower2", description: "Women's reproductive health and pregnancy care.", displayOrder: 7 },
    { id: genId(), name: "Mental Health", icon: "Brain", description: "Psychiatry and psychological counseling.", displayOrder: 8 },
  );

  // --- Subscription plans ---
  db.subscriptionPlans.push(
    {
      id: genId(),
      name: "Basic",
      price: 199,
      billingCycle: "monthly",
      features: ["Up to 20 appointments per month", "Email support", "Basic analytics"],
      isActive: true,
    },
    {
      id: genId(),
      name: "Professional",
      price: 499,
      billingCycle: "monthly",
      features: ["Unlimited appointments", "Priority support", "Advanced analytics", "Custom branding"],
      isActive: true,
    },
    {
      id: genId(),
      name: "Enterprise",
      price: 4999,
      billingCycle: "yearly",
      features: ["Everything in Professional", "Dedicated account manager", "API access", "SLA guarantee"],
      isActive: true,
    },
  );

  // --- Weekly availability (Sun-Thu, 09:00-17:00) for approved doctors ---
  for (const doctorId of [sarah, omar, layla]) {
    for (let dow = 0; dow <= 4; dow++) {
      db.doctorAvailability.push({
        id: genId(),
        doctorId,
        dayOfWeek: dow,
        isEnabled: true,
        startTime: "09:00",
        endTime: "17:00",
      });
    }
  }

  // --- Doctor medicine lists ---
  const medsSarah = ["Amlodipine|5mg|Cardiovascular", "Paracetamol|500mg|Pain relief", "Amoxicillin|500mg|Antibiotic", "Vitamin C|1000mg|Supplement", "Ibuprofen|400mg|Pain relief"];
  const medsOmar = ["Aspirin|75mg|Cardiovascular", "Atorvastatin|20mg|Cardiovascular", "Metoprolol|50mg|Cardiovascular", "Clopidogrel|75mg|Cardiovascular", "Nitroglycerin|0.4mg|Cardiovascular"];
  const medsLayla = ["Cetirizine|10mg|Allergy", "Paracetamol (Pediatric)|120mg/5ml|Pain relief", "Amoxicillin (Pediatric)|250mg/5ml|Antibiotic", "Ibuprofen (Pediatric)|100mg/5ml|Pain relief", "Vitamin D3 Drops|400 IU|Supplement"];
  function addMedicines(doctorId: string, list: string[]) {
    for (const entry of list) {
      const [name, commonDosage, category] = entry.split("|");
      db.doctorMedicines.push({ id: genId(), doctorId, name: name!, commonDosage: commonDosage ?? null, category: category ?? null });
    }
  }
  addMedicines(sarah, medsSarah);
  addMedicines(omar, medsOmar);
  addMedicines(layla, medsLayla);

  // --- Appointments, prescriptions and notifications ---
  function addAppointment(opts: {
    doctorId: string;
    patientId: string;
    date: string;
    time: string;
    status: AppointmentStatus;
    fee: number;
    reason: string;
    cancelReason?: string;
  }): string {
    const id = genId();
    db.appointments.push({
      id,
      doctorId: opts.doctorId,
      patientId: opts.patientId,
      appointmentDate: opts.date,
      appointmentTime: opts.time,
      status: opts.status,
      fee: opts.fee,
      reason: opts.reason,
      cancelReason: opts.cancelReason ?? null,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    });
    return id;
  }

  function addPrescription(
    appointmentId: string,
    doctorId: string,
    patientId: string,
    diagnosisNotes: string,
    adviceNotes: string,
    items: { name: string; dosage: string; frequency: string; duration: string; instructions: string }[],
  ) {
    const id = genId();
    db.prescriptions.push({ id, appointmentId, doctorId, patientId, diagnosisNotes, adviceNotes, createdAt: isoNow() });
    for (const item of items) {
      db.prescriptionItems.push({
        id: genId(),
        prescriptionId: id,
        medicineId: null,
        medicineName: item.name,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
      });
    }
  }

  function addNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    relatedAppointmentId: string,
    isRead: boolean,
  ) {
    db.notifications.push({
      id: genId(),
      userId,
      type,
      title,
      body,
      relatedAppointmentId,
      isRead,
      createdAt: isoNow(),
    });
  }

  const a1 = addAppointment({ doctorId: sarah, patientId: fahad, date: dateOffset(-6), time: "10:00", status: "completed", fee: 150, reason: "Annual check-up and blood pressure review" });
  const a2 = addAppointment({ doctorId: sarah, patientId: mona, date: dateOffset(-2), time: "11:30", status: "completed", fee: 150, reason: "Persistent cough and fatigue" });
  addAppointment({ doctorId: sarah, patientId: abdullah, date: dateOffset(0), time: "10:00", status: "scheduled", fee: 150, reason: "Follow-up on medication" });
  const a4 = addAppointment({ doctorId: sarah, patientId: sultan, date: dateOffset(0), time: "14:00", status: "pending", fee: 150, reason: "General consultation" });
  const a5 = addAppointment({ doctorId: sarah, patientId: fahad, date: dateOffset(2), time: "11:00", status: "scheduled", fee: 150, reason: "Routine follow-up" });
  const a6 = addAppointment({ doctorId: sarah, patientId: reem, date: dateOffset(-8), time: "09:00", status: "cancelled", fee: 150, reason: "General consultation", cancelReason: "Patient requested to reschedule due to travel" });

  const a7 = addAppointment({ doctorId: omar, patientId: sultan, date: dateOffset(-4), time: "09:30", status: "completed", fee: 250, reason: "Chest discomfort and shortness of breath" });
  const a8 = addAppointment({ doctorId: omar, patientId: mona, date: dateOffset(0), time: "09:30", status: "scheduled", fee: 250, reason: "Cardiac screening" });
  const a9 = addAppointment({ doctorId: omar, patientId: abdullah, date: dateOffset(3), time: "15:00", status: "scheduled", fee: 250, reason: "Follow-up ECG review" });

  const a10 = addAppointment({ doctorId: layla, patientId: reem, date: dateOffset(-1), time: "13:00", status: "completed", fee: 120, reason: "Seasonal allergy consultation" });
  addAppointment({ doctorId: layla, patientId: fahad, date: dateOffset(1), time: "16:00", status: "pending", fee: 120, reason: "Wellness visit" });

  addPrescription(
    a1,
    sarah,
    fahad,
    "Mild hypertension, blood pressure slightly elevated at 138/88.",
    "Reduce sodium intake, moderate exercise 30 minutes a day, recheck in 4 weeks.",
    [
      { name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "30 days", instructions: "Take in the morning with water." },
      { name: "Paracetamol", dosage: "500mg", frequency: "As needed", duration: "30 days", instructions: "For headache, up to 3 times a day." },
    ],
  );
  addPrescription(
    a2,
    sarah,
    mona,
    "Upper respiratory tract infection.",
    "Rest, stay hydrated, follow up if symptoms persist beyond 7 days.",
    [
      { name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily", duration: "7 days", instructions: "Complete the full course even if symptoms improve." },
      { name: "Vitamin C", dosage: "1000mg", frequency: "Once daily", duration: "14 days", instructions: "Take with food." },
    ],
  );
  addPrescription(
    a7,
    omar,
    sultan,
    "Stable angina, ECG shows mild ST changes.",
    "Avoid strenuous activity, follow a low-fat diet, cardiology follow-up in 3 months.",
    [
      { name: "Aspirin", dosage: "75mg", frequency: "Once daily", duration: "Ongoing", instructions: "Take with food to reduce stomach irritation." },
      { name: "Atorvastatin", dosage: "20mg", frequency: "Once daily at night", duration: "90 days", instructions: "Recheck lipid panel after 3 months." },
    ],
  );
  addPrescription(
    a10,
    layla,
    reem,
    "Seasonal allergic rhinitis.",
    "Avoid known allergens, use antihistamine as needed.",
    [{ name: "Cetirizine", dosage: "10mg", frequency: "Once daily", duration: "14 days", instructions: "May cause drowsiness." }],
  );

  addNotification(fahad, "prescription_ready", "Prescription ready", "Dr. Sarah Al-Fahad completed your consultation and issued a prescription.", a1, true);
  addNotification(fahad, "appointment_accepted", "Appointment confirmed", "Dr. Sarah Al-Fahad confirmed your appointment.", a5, false);
  addNotification(mona, "prescription_ready", "Prescription ready", "Dr. Sarah Al-Fahad completed your consultation and issued a prescription.", a2, false);
  addNotification(mona, "booking_confirmation", "Booking request sent", "Your appointment request with Dr. Omar Al-Harbi has been sent and is awaiting confirmation.", a8, true);
  addNotification(sultan, "prescription_ready", "Prescription ready", "Dr. Omar Al-Harbi completed your consultation and issued a prescription.", a7, true);
  addNotification(sultan, "booking_confirmation", "Booking request sent", "Your appointment request with Dr. Sarah Al-Fahad has been sent and is awaiting confirmation.", a4, false);
  addNotification(abdullah, "appointment_accepted", "Appointment confirmed", "Dr. Sarah Al-Fahad confirmed your appointment.", a1, false);
  addNotification(abdullah, "booking_confirmation", "Booking request sent", "Your appointment request with Dr. Omar Al-Harbi has been sent and is awaiting confirmation.", a9, true);
  addNotification(reem, "appointment_cancelled", "Appointment cancelled", "Dr. Sarah Al-Fahad cancelled your appointment. Reason: Patient requested to reschedule due to travel", a6, true);
  addNotification(reem, "prescription_ready", "Prescription ready", "Dr. Layla Al-Zahrani completed your consultation and issued a prescription.", a10, false);

  return db;
}

// Module-level singleton so every server function shares the same in-memory
// state for the life of the server process.
const globalForMockDb = globalThis as unknown as { __mockDb?: MockDb };
export const mockDb: MockDb = globalForMockDb.__mockDb ?? buildSeed();
globalForMockDb.__mockDb = mockDb;

export { genId, isoNow };
