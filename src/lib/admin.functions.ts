import { createServerFn } from "@tanstack/react-start";
import { requireMockAuth } from "@/lib/mock-auth";
import { requireSuperAdmin } from "@/lib/require-admin";
import { genId, isoNow, mockDb } from "@/lib/mock-db";
import {
  toggleDoctorActiveSchema,
  togglePatientBlockedSchema,
  createSpecializationSchema,
  updateSpecializationSchema,
  deleteSpecializationSchema,
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
  deleteSubscriptionPlanSchema,
  reportsFilterSchema,
  getSignedPhotoUrlSchema,
} from "@/lib/admin-schemas";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireSuperAdmin(context.userId);

    const today = daysAgo(0);
    const sevenDaysAgo = daysAgo(6);

    const approvedDoctors = mockDb.doctorProfiles.filter((d) => d.approvalStatus === "approved");
    const totalPatients = mockDb.patientProfiles.length;
    const todaysAppointments = mockDb.appointments.filter((a) => a.appointmentDate === today).length;
    const totalRevenue = mockDb.appointments
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + Number(a.fee), 0);

    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) days.push({ date: daysAgo(i), count: 0 });
    const dayIndex = new Map(days.map((d, i) => [d.date, i]));
    for (const a of mockDb.appointments) {
      if (a.appointmentDate < sevenDaysAgo) continue;
      const idx = dayIndex.get(a.appointmentDate);
      if (idx !== undefined) days[idx]!.count += 1;
    }

    const recentDoctors = [...mockDb.doctorProfiles]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    return {
      totalDoctors: approvedDoctors.length,
      totalPatients,
      todaysAppointments,
      totalRevenue,
      appointmentsLast7Days: days,
      recentDoctorRequests: recentDoctors.map((d) => ({
        userId: d.userId,
        fullName: mockDb.profiles.find((p) => p.id === d.userId)?.fullName ?? "Unknown",
        specialization: d.specialization,
        status: d.approvalStatus,
        createdAt: d.createdAt,
      })),
    };
  });

export const listDoctors = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireSuperAdmin(context.userId);

    const doctors = mockDb.doctorProfiles
      .filter((d) => d.approvalStatus === "approved")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return doctors.map((d) => {
      const profile = mockDb.profiles.find((p) => p.id === d.userId);
      const appts = mockDb.appointments.filter((a) => a.doctorId === d.userId);
      return {
        user_id: d.userId,
        specialization: d.specialization,
        medical_license_number: d.medicalLicenseNumber,
        years_experience: d.yearsExperience,
        consultation_fee: d.consultationFee,
        bio: d.bio,
        profile_photo_path: d.profilePhotoPath,
        is_active: d.isActive,
        created_at: d.createdAt,
        profile: profile ? { full_name: profile.fullName, phone: profile.phone } : null,
        totalAppointments: appts.length,
        totalPatients: new Set(appts.map((a) => a.patientId)).size,
      };
    });
  });

export const toggleDoctorActive = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => toggleDoctorActiveSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    const doctor = mockDb.doctorProfiles.find((d) => d.userId === data.doctorId);
    if (!doctor) throw new Error("Doctor not found");
    doctor.isActive = data.isActive;
    doctor.updatedAt = isoNow();
    return { ok: true };
  });

export const listPatients = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireSuperAdmin(context.userId);

    const patients = [...mockDb.patientProfiles].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return patients.map((p) => {
      const profile = mockDb.profiles.find((prof) => prof.id === p.userId);
      const user = mockDb.users.find((u) => u.id === p.userId);
      const apptCount = mockDb.appointments.filter((a) => a.patientId === p.userId).length;
      return {
        user_id: p.userId,
        date_of_birth: p.dateOfBirth,
        gender: p.gender,
        is_blocked: p.isBlocked,
        created_at: p.createdAt,
        profile: profile ? { full_name: profile.fullName, phone: profile.phone } : null,
        email: user?.email ?? null,
        totalAppointments: apptCount,
      };
    });
  });

export const togglePatientBlocked = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => togglePatientBlockedSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    const patient = mockDb.patientProfiles.find((p) => p.userId === data.patientId);
    if (!patient) throw new Error("Patient not found");
    patient.isBlocked = data.isBlocked;
    patient.updatedAt = isoNow();
    return { ok: true };
  });

export const createSpecialization = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => createSpecializationSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    mockDb.specializations.push({
      id: genId(),
      name: data.name,
      icon: data.icon,
      description: data.description,
      displayOrder: data.displayOrder,
    });
    return { ok: true };
  });

export const updateSpecialization = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => updateSpecializationSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    const spec = mockDb.specializations.find((s) => s.id === data.id);
    if (!spec) throw new Error("Specialization not found");
    spec.name = data.name;
    spec.icon = data.icon;
    spec.description = data.description;
    spec.displayOrder = data.displayOrder;
    return { ok: true };
  });

export const deleteSpecialization = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => deleteSpecializationSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    mockDb.specializations = mockDb.specializations.filter((s) => s.id !== data.id);
    return { ok: true };
  });

export const listSubscriptionPlans = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireSuperAdmin(context.userId);
    return [...mockDb.subscriptionPlans]
      .sort((a, b) => a.price - b.price)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        billing_cycle: p.billingCycle,
        features: p.features,
        is_active: p.isActive,
      }));
  });

export const createSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => createSubscriptionPlanSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    mockDb.subscriptionPlans.push({
      id: genId(),
      name: data.name,
      price: data.price,
      billingCycle: data.billingCycle,
      features: data.features,
      isActive: data.isActive,
    });
    return { ok: true };
  });

export const updateSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => updateSubscriptionPlanSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    const plan = mockDb.subscriptionPlans.find((p) => p.id === data.id);
    if (!plan) throw new Error("Plan not found");
    plan.name = data.name;
    plan.price = data.price;
    plan.billingCycle = data.billingCycle;
    plan.features = data.features;
    plan.isActive = data.isActive;
    return { ok: true };
  });

export const deleteSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => deleteSubscriptionPlanSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    mockDb.subscriptionPlans = mockDb.subscriptionPlans.filter((p) => p.id !== data.id);
    return { ok: true };
  });

export const listDoctorsForFilter = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireSuperAdmin(context.userId);
    return mockDb.doctorProfiles
      .filter((d) => d.approvalStatus === "approved")
      .map((d) => ({
        id: d.userId,
        fullName: mockDb.profiles.find((p) => p.id === d.userId)?.fullName ?? "Unknown",
      }));
  });

export const getReportsData = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .inputValidator((input) => reportsFilterSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);

    let appointments = [...mockDb.appointments];
    if (data.startDate) appointments = appointments.filter((a) => a.appointmentDate >= data.startDate!);
    if (data.endDate) appointments = appointments.filter((a) => a.appointmentDate <= data.endDate!);
    if (data.doctorId) appointments = appointments.filter((a) => a.doctorId === data.doctorId);
    appointments.sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));

    const rows = appointments.map((a) => ({
      id: a.id,
      doctor_id: a.doctorId,
      patient_id: a.patientId,
      appointment_date: a.appointmentDate,
      appointment_time: a.appointmentTime,
      status: a.status,
      fee: a.fee,
      doctorName: mockDb.profiles.find((p) => p.id === a.doctorId)?.fullName ?? "Unknown",
      patientName: mockDb.profiles.find((p) => p.id === a.patientId)?.fullName ?? "Unknown",
    }));

    const totalRevenue = rows
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + Number(r.fee), 0);

    return { rows, totalRevenue, totalAppointments: rows.length };
  });

export const getSignedPhotoUrl = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .inputValidator((input) => getSignedPhotoUrlSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);
    return { url: data.path };
  });
