import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireSuperAdmin } from "@/lib/require-admin";
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
import type { supabaseAdmin } from "@/integrations/supabase/client.server";

async function getEmailMap(
  admin: typeof supabaseAdmin,
  userIds: string[],
): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(error.message);
  const wanted = new Set(userIds);
  const map = new Map<string, string>();
  for (const user of data.users) {
    if (wanted.has(user.id) && user.email) map.set(user.id, user.email);
  }
  return map;
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);

    const today = daysAgo(0);
    const sevenDaysAgo = daysAgo(6);

    const [
      doctorsRes,
      patientsRes,
      todayApptsRes,
      completedApptsRes,
      weekApptsRes,
      recentDoctorsRes,
    ] = await Promise.all([
      supabaseAdmin
        .from("doctor_profiles")
        .select("user_id", { count: "exact", head: true })
        .eq("approval_status", "approved"),
      supabaseAdmin.from("patient_profiles").select("user_id", { count: "exact", head: true }),
      supabaseAdmin
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("appointment_date", today),
      supabaseAdmin.from("appointments").select("fee").eq("status", "completed"),
      supabaseAdmin
        .from("appointments")
        .select("appointment_date")
        .gte("appointment_date", sevenDaysAgo),
      supabaseAdmin
        .from("doctor_profiles")
        .select("user_id, specialization, approval_status, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (doctorsRes.error) throw new Error(doctorsRes.error.message);
    if (patientsRes.error) throw new Error(patientsRes.error.message);
    if (todayApptsRes.error) throw new Error(todayApptsRes.error.message);
    if (completedApptsRes.error) throw new Error(completedApptsRes.error.message);
    if (weekApptsRes.error) throw new Error(weekApptsRes.error.message);
    if (recentDoctorsRes.error) throw new Error(recentDoctorsRes.error.message);

    const totalRevenue = (completedApptsRes.data ?? []).reduce(
      (sum, row) => sum + Number(row.fee),
      0,
    );

    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) days.push({ date: daysAgo(i), count: 0 });
    const dayIndex = new Map(days.map((d, i) => [d.date, i]));
    for (const row of weekApptsRes.data ?? []) {
      const idx = dayIndex.get(row.appointment_date);
      if (idx !== undefined) days[idx]!.count += 1;
    }

    const recentDoctors = recentDoctorsRes.data ?? [];
    const ids = recentDoctors.map((d) => d.user_id);
    const { data: profiles, error: profileError } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [], error: null };
    if (profileError) throw new Error(profileError.message);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    return {
      totalDoctors: doctorsRes.count ?? 0,
      totalPatients: patientsRes.count ?? 0,
      todaysAppointments: todayApptsRes.count ?? 0,
      totalRevenue,
      appointmentsLast7Days: days,
      recentDoctorRequests: recentDoctors.map((d) => ({
        userId: d.user_id,
        fullName: nameById.get(d.user_id) ?? "Unknown",
        specialization: d.specialization,
        status: d.approval_status,
        createdAt: d.created_at,
      })),
    };
  });

export const listDoctors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);

    const { data: doctors, error } = await supabaseAdmin
      .from("doctor_profiles")
      .select(
        "user_id, specialization, medical_license_number, years_experience, consultation_fee, bio, profile_photo_path, is_active, created_at",
      )
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = doctors.map((d) => d.user_id);
    const [{ data: profiles, error: profileError }, { data: appts, error: apptError }] =
      await Promise.all([
        ids.length
          ? supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids)
          : Promise.resolve({ data: [], error: null }),
        ids.length
          ? supabaseAdmin.from("appointments").select("doctor_id, patient_id").in("doctor_id", ids)
          : Promise.resolve({ data: [], error: null }),
      ]);
    if (profileError) throw new Error(profileError.message);
    if (apptError) throw new Error(apptError.message);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const apptCountByDoctor = new Map<string, number>();
    const patientSetByDoctor = new Map<string, Set<string>>();
    for (const a of appts ?? []) {
      apptCountByDoctor.set(a.doctor_id, (apptCountByDoctor.get(a.doctor_id) ?? 0) + 1);
      const set = patientSetByDoctor.get(a.doctor_id) ?? new Set<string>();
      set.add(a.patient_id);
      patientSetByDoctor.set(a.doctor_id, set);
    }

    return doctors.map((d) => ({
      ...d,
      profile: profileById.get(d.user_id) ?? null,
      totalAppointments: apptCountByDoctor.get(d.user_id) ?? 0,
      totalPatients: patientSetByDoctor.get(d.user_id)?.size ?? 0,
    }));
  });

export const toggleDoctorActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => toggleDoctorActiveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("doctor_profiles")
      .update({ is_active: data.isActive })
      .eq("user_id", data.doctorId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);

    const { data: patients, error } = await supabaseAdmin
      .from("patient_profiles")
      .select("user_id, date_of_birth, gender, is_blocked, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = patients.map((p) => p.user_id);
    const [{ data: profiles, error: profileError }, { data: appts, error: apptError }, emailMap] =
      await Promise.all([
        ids.length
          ? supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids)
          : Promise.resolve({ data: [], error: null }),
        ids.length
          ? supabaseAdmin.from("appointments").select("patient_id").in("patient_id", ids)
          : Promise.resolve({ data: [], error: null }),
        getEmailMap(supabaseAdmin, ids),
      ]);
    if (profileError) throw new Error(profileError.message);
    if (apptError) throw new Error(apptError.message);

    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const apptCountByPatient = new Map<string, number>();
    for (const a of appts ?? [])
      apptCountByPatient.set(a.patient_id, (apptCountByPatient.get(a.patient_id) ?? 0) + 1);

    return patients.map((p) => ({
      ...p,
      profile: profileById.get(p.user_id) ?? null,
      email: emailMap.get(p.user_id) ?? null,
      totalAppointments: apptCountByPatient.get(p.user_id) ?? 0,
    }));
  });

export const togglePatientBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => togglePatientBlockedSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("patient_profiles")
      .update({ is_blocked: data.isBlocked })
      .eq("user_id", data.patientId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createSpecialization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createSpecializationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin.from("specializations").insert({
      name: data.name,
      icon: data.icon,
      description: data.description,
      display_order: data.displayOrder,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateSpecialization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSpecializationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("specializations")
      .update({
        name: data.name,
        icon: data.icon,
        description: data.description,
        display_order: data.displayOrder,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSpecialization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => deleteSpecializationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin.from("specializations").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSubscriptionPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { data, error } = await supabaseAdmin
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const createSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createSubscriptionPlanSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin.from("subscription_plans").insert({
      name: data.name,
      price: data.price,
      billing_cycle: data.billingCycle,
      features: data.features,
      is_active: data.isActive,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSubscriptionPlanSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("subscription_plans")
      .update({
        name: data.name,
        price: data.price,
        billing_cycle: data.billingCycle,
        features: data.features,
        is_active: data.isActive,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => deleteSubscriptionPlanSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin.from("subscription_plans").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listDoctorsForFilter = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { data: doctors, error } = await supabaseAdmin
      .from("doctor_profiles")
      .select("user_id")
      .eq("approval_status", "approved");
    if (error) throw new Error(error.message);
    const ids = doctors.map((d) => d.user_id);
    const { data: profiles, error: profileError } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [], error: null };
    if (profileError) throw new Error(profileError.message);
    return (profiles ?? []).map((p) => ({ id: p.id, fullName: p.full_name }));
  });

export const getReportsData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => reportsFilterSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);

    let query = supabaseAdmin
      .from("appointments")
      .select("id, doctor_id, patient_id, appointment_date, appointment_time, status, fee")
      .order("appointment_date", { ascending: false });
    if (data.startDate) query = query.gte("appointment_date", data.startDate);
    if (data.endDate) query = query.lte("appointment_date", data.endDate);
    if (data.doctorId) query = query.eq("doctor_id", data.doctorId);

    const { data: appointments, error } = await query;
    if (error) throw new Error(error.message);

    const allIds = [...new Set(appointments.flatMap((a) => [a.doctor_id, a.patient_id]))];
    const { data: profiles, error: profileError } = allIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", allIds)
      : { data: [], error: null };
    if (profileError) throw new Error(profileError.message);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    const rows = appointments.map((a) => ({
      ...a,
      doctorName: nameById.get(a.doctor_id) ?? "Unknown",
      patientName: nameById.get(a.patient_id) ?? "Unknown",
    }));

    const totalRevenue = rows
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + Number(r.fee), 0);

    return { rows, totalRevenue, totalAppointments: rows.length };
  });

export const getSignedPhotoUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => getSignedPhotoUrlSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireSuperAdmin(supabaseAdmin, context.userId);
    const { data: signed, error } = await supabaseAdmin.storage
      .from("profile-photos")
      .createSignedUrl(data.path, 600);
    if (error) throw new Error(error.message);
    return { url: signed.signedUrl };
  });
