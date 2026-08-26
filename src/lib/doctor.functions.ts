import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireApprovedDoctor } from "@/lib/require-doctor";
import { createNotification } from "@/lib/notifications";
import type { supabaseAdmin as SupabaseAdminClient } from "@/integrations/supabase/client.server";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import {
  acceptAppointmentSchema,
  addUnavailableDateSchema,
  cancelAppointmentSchema,
  completeConsultationSchema,
  createMedicineSchema,
  deleteMedicineSchema,
  getConsultationContextSchema,
  getPatientProfileSchema,
  markAppointmentCompleteSchema,
  removeUnavailableDateSchema,
  rescheduleAppointmentSchema,
  saveAvailabilitySchema,
  updateDoctorProfileSchema,
  updateMedicineSchema,
} from "@/lib/doctor-schemas";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekRange(): { weekStart: string; weekEnd: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { weekStart: start.toISOString().slice(0, 10), weekEnd: end.toISOString().slice(0, 10) };
}

export const getDoctorDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);

    const today = todayStr();
    const { weekStart, weekEnd } = weekRange();

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("id, patient_id, appointment_date, appointment_time, status, reason")
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);

    const todayAppointments = appointments.filter(
      (a) => (a.status === "pending" || a.status === "scheduled") && a.appointment_date === today,
    );
    const pendingPrescriptions = appointments.filter(
      (a) => a.status === "scheduled" && a.appointment_date <= today,
    ).length;
    const totalPatients = new Set(appointments.map((a) => a.patient_id)).size;
    const thisWeekSchedule = appointments.filter(
      (a) =>
        (a.status === "pending" || a.status === "scheduled") &&
        a.appointment_date >= weekStart &&
        a.appointment_date <= weekEnd,
    ).length;

    const patientIds = [...new Set(todayAppointments.map((a) => a.patient_id))];
    const { data: profiles, error: profileError } = patientIds.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", patientIds)
      : { data: [], error: null };
    if (profileError) throw new Error(profileError.message);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    return {
      todaysAppointments: todayAppointments.length,
      pendingPrescriptions,
      totalPatients,
      thisWeekSchedule,
      todayAppointmentsList: todayAppointments
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
        .map((a) => ({
          id: a.id,
          patientId: a.patient_id,
          patientName: nameById.get(a.patient_id) ?? "Unknown",
          time: a.appointment_time,
          status: a.status,
          reason: a.reason,
        })),
    };
  });

export const getAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);

    const { data: days, error } = await supabaseAdmin
      .from("doctor_availability")
      .select("day_of_week, is_enabled, start_time, end_time")
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);

    const byDay = new Map(days.map((d) => [d.day_of_week, d]));
    const fullWeek = Array.from({ length: 7 }, (_, i) => {
      const existing = byDay.get(i);
      return {
        dayOfWeek: i,
        isEnabled: existing?.is_enabled ?? false,
        startTime: (existing?.start_time ?? "09:00:00").slice(0, 5),
        endTime: (existing?.end_time ?? "17:00:00").slice(0, 5),
      };
    });

    const { data: unavailableDates, error: datesError } = await supabaseAdmin
      .from("doctor_unavailable_dates")
      .select("id, date, reason")
      .eq("doctor_id", context.userId)
      .order("date", { ascending: true });
    if (datesError) throw new Error(datesError.message);

    return { days: fullWeek, unavailableDates: unavailableDates ?? [] };
  });

export const saveAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => saveAvailabilitySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);

    const rows = data.days.map((d) => ({
      doctor_id: context.userId,
      day_of_week: d.dayOfWeek,
      is_enabled: d.isEnabled,
      start_time: d.startTime,
      end_time: d.endTime,
    }));
    const { error } = await supabaseAdmin
      .from("doctor_availability")
      .upsert(rows, { onConflict: "doctor_id,day_of_week" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addUnavailableDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => addUnavailableDateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin.from("doctor_unavailable_dates").insert({
      doctor_id: context.userId,
      date: data.date,
      reason: data.reason ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeUnavailableDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => removeUnavailableDateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("doctor_unavailable_dates")
      .delete()
      .eq("id", data.id)
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listDoctorAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select(
        "id, patient_id, appointment_date, appointment_time, status, reason, cancel_reason, fee",
      )
      .eq("doctor_id", context.userId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = [...new Set(appointments.map((a) => a.patient_id))];
    const { data: profiles, error: profileError } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name, phone").in("id", ids)
      : { data: [], error: null };
    if (profileError) throw new Error(profileError.message);
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

    return appointments.map((a) => ({ ...a, patient: profileById.get(a.patient_id) ?? null }));
  });

export const acceptAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => acceptAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { data: updated, error } = await supabaseAdmin
      .from("appointments")
      .update({ status: "scheduled" })
      .eq("id", data.appointmentId)
      .eq("doctor_id", context.userId)
      .eq("status", "pending")
      .select("patient_id, appointment_date, appointment_time")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (updated) {
      const { data: doctorProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", context.userId)
        .single();
      await createNotification(supabaseAdmin, {
        userId: updated.patient_id,
        type: "appointment_accepted",
        title: "Appointment confirmed",
        body: `${doctorProfile?.full_name ?? "Your doctor"} confirmed your appointment on ${updated.appointment_date} at ${updated.appointment_time.slice(0, 5)}.`,
        relatedAppointmentId: data.appointmentId,
      });
    }

    return { ok: true };
  });

export const rescheduleAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => rescheduleAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ appointment_date: data.date, appointment_time: data.time })
      .eq("id", data.appointmentId)
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAppointmentComplete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => markAppointmentCompleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", data.appointmentId)
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => cancelAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { data: updated, error } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled", cancel_reason: data.reason })
      .eq("id", data.appointmentId)
      .eq("doctor_id", context.userId)
      .select("patient_id")
      .maybeSingle();
    if (error) throw new Error(error.message);

    if (updated) {
      const { data: doctorProfile } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", context.userId)
        .single();
      await createNotification(supabaseAdmin, {
        userId: updated.patient_id,
        type: "appointment_cancelled",
        title: "Appointment cancelled",
        body: `${doctorProfile?.full_name ?? "Your doctor"} cancelled your appointment. Reason: ${data.reason}`,
        relatedAppointmentId: data.appointmentId,
      });
    }

    return { ok: true };
  });

async function fetchPrescriptionsWithItems(
  supabaseAdmin: typeof SupabaseAdminClient,
  filters: { doctorId: string; patientId?: string; appointmentIds?: string[] },
) {
  let query = supabaseAdmin
    .from("prescriptions")
    .select("id, appointment_id, diagnosis_notes, advice_notes, created_at")
    .eq("doctor_id", filters.doctorId)
    .order("created_at", { ascending: false });
  if (filters.patientId) query = query.eq("patient_id", filters.patientId);
  if (filters.appointmentIds) {
    if (filters.appointmentIds.length === 0) return [];
    query = query.in("appointment_id", filters.appointmentIds);
  }

  const { data: prescriptions, error } = await query;
  if (error) throw new Error(error.message);

  type PrescriptionItemRow = Pick<
    Tables<"prescription_items">,
    | "id"
    | "prescription_id"
    | "medicine_name"
    | "dosage"
    | "frequency"
    | "duration"
    | "instructions"
  >;

  const prescriptionIds = prescriptions.map((p) => p.id);
  const {
    data: items,
    error: itemsError,
  }: { data: PrescriptionItemRow[] | null; error: { message: string } | null } =
    prescriptionIds.length
      ? await supabaseAdmin
          .from("prescription_items")
          .select("id, prescription_id, medicine_name, dosage, frequency, duration, instructions")
          .in("prescription_id", prescriptionIds)
      : { data: [], error: null };
  if (itemsError) throw new Error(itemsError.message);

  const itemsByPrescription = new Map<string, PrescriptionItemRow[]>();
  for (const item of items ?? []) {
    const list = itemsByPrescription.get(item.prescription_id) ?? [];
    list.push(item);
    itemsByPrescription.set(item.prescription_id, list);
  }

  return prescriptions.map((p) => ({ ...p, items: itemsByPrescription.get(p.id) ?? [] }));
}

export const getPatientProfileForDoctor = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => getPatientProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("id, appointment_date, appointment_time, status, reason, cancel_reason")
      .eq("doctor_id", context.userId)
      .eq("patient_id", data.patientId)
      .order("appointment_date", { ascending: false });
    if (error) throw new Error(error.message);
    if (appointments.length === 0) throw new Error("This patient has no visit history with you.");

    const [{ data: profile, error: profileError }, { data: patientProfile, error: patientError }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("full_name, phone").eq("id", data.patientId).single(),
        supabaseAdmin
          .from("patient_profiles")
          .select("date_of_birth, gender")
          .eq("user_id", data.patientId)
          .single(),
      ]);
    if (profileError) throw new Error(profileError.message);
    if (patientError) throw new Error(patientError.message);

    const prescriptions = await fetchPrescriptionsWithItems(supabaseAdmin, {
      doctorId: context.userId,
      patientId: data.patientId,
    });

    return { profile, patientProfile, appointments, prescriptions };
  });

export const getConsultationContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => getConsultationContextSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);

    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .select("id, patient_id, appointment_date, appointment_time, status, reason")
      .eq("id", data.appointmentId)
      .eq("doctor_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!appointment) throw new Error("Appointment not found");

    const [
      { data: profile, error: profileError },
      { data: patientProfile, error: patientError },
      { data: pastAppointments, error: pastError },
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("full_name, phone")
        .eq("id", appointment.patient_id)
        .single(),
      supabaseAdmin
        .from("patient_profiles")
        .select("date_of_birth, gender")
        .eq("user_id", appointment.patient_id)
        .single(),
      supabaseAdmin
        .from("appointments")
        .select("id, appointment_date, appointment_time, status, reason")
        .eq("doctor_id", context.userId)
        .eq("patient_id", appointment.patient_id)
        .neq("id", data.appointmentId)
        .order("appointment_date", { ascending: false })
        .limit(10),
    ]);
    if (profileError) throw new Error(profileError.message);
    if (patientError) throw new Error(patientError.message);
    if (pastError) throw new Error(pastError.message);

    const prescriptions = await fetchPrescriptionsWithItems(supabaseAdmin, {
      doctorId: context.userId,
      appointmentIds: pastAppointments.map((a) => a.id),
    });
    const prescriptionByAppointment = new Map(prescriptions.map((p) => [p.appointment_id, p]));

    const age = Math.floor(
      (Date.now() - new Date(patientProfile.date_of_birth).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000),
    );

    return {
      appointment,
      patient: { fullName: profile.full_name, phone: profile.phone, ...patientProfile, age },
      pastVisits: pastAppointments.map((a) => ({
        ...a,
        prescription: prescriptionByAppointment.get(a.id) ?? null,
      })),
    };
  });

export const completeConsultation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => completeConsultationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);

    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from("appointments")
      .select("id, patient_id")
      .eq("id", data.appointmentId)
      .eq("doctor_id", context.userId)
      .maybeSingle();
    if (appointmentError) throw new Error(appointmentError.message);
    if (!appointment) throw new Error("Appointment not found");

    const { data: prescription, error: prescriptionError } = await supabaseAdmin
      .from("prescriptions")
      .insert({
        appointment_id: data.appointmentId,
        doctor_id: context.userId,
        patient_id: appointment.patient_id,
        diagnosis_notes: data.diagnosisNotes ?? null,
        advice_notes: data.adviceNotes ?? null,
      })
      .select("id")
      .single();
    if (prescriptionError) throw new Error(prescriptionError.message);

    const itemRows = data.items.map((item) => ({
      prescription_id: prescription.id,
      medicine_id: item.medicineId,
      medicine_name: item.medicineName,
      dosage: item.dosage ?? null,
      frequency: item.frequency ?? null,
      duration: item.duration ?? null,
      instructions: item.instructions ?? null,
    }));
    const { error: itemsError } = await supabaseAdmin.from("prescription_items").insert(itemRows);
    if (itemsError) throw new Error(itemsError.message);

    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", data.appointmentId);
    if (updateError) throw new Error(updateError.message);

    const { data: doctorProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", context.userId)
      .single();
    await createNotification(supabaseAdmin, {
      userId: appointment.patient_id,
      type: "prescription_ready",
      title: "Prescription ready",
      body: `${doctorProfile?.full_name ?? "Your doctor"} completed your consultation and issued a prescription.`,
      relatedAppointmentId: data.appointmentId,
    });

    return { ok: true };
  });

export const listMedicines = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { data, error } = await supabaseAdmin
      .from("doctor_medicines")
      .select("id, name, common_dosage, category")
      .eq("doctor_id", context.userId)
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  });

export const createMedicine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => createMedicineSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { data: medicine, error } = await supabaseAdmin
      .from("doctor_medicines")
      .insert({
        doctor_id: context.userId,
        name: data.name,
        common_dosage: data.commonDosage ?? null,
        category: data.category ?? null,
      })
      .select("id, name, common_dosage, category")
      .single();
    if (error) throw new Error(error.message);
    return medicine;
  });

export const updateMedicine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateMedicineSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("doctor_medicines")
      .update({
        name: data.name,
        common_dosage: data.commonDosage ?? null,
        category: data.category ?? null,
      })
      .eq("id", data.id)
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMedicine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => deleteMedicineSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const { error } = await supabaseAdmin
      .from("doctor_medicines")
      .delete()
      .eq("id", data.id)
      .eq("doctor_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateDoctorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateDoctorProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);
    const update: TablesUpdate<"doctor_profiles"> = {
      specialization: data.specialization,
      bio: data.bio,
      consultation_fee: data.consultationFee,
    };
    if (data.profilePhotoPath !== undefined) update.profile_photo_path = data.profilePhotoPath;
    const { error } = await supabaseAdmin
      .from("doctor_profiles")
      .update(update)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyDoctorProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireApprovedDoctor(supabaseAdmin, context.userId);

    const { data: doctor, error } = await supabaseAdmin
      .from("doctor_profiles")
      .select("specialization, bio, consultation_fee, profile_photo_path")
      .eq("user_id", context.userId)
      .single();
    if (error) throw new Error(error.message);

    let photoUrl: string | null = null;
    if (doctor.profile_photo_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from("profile-photos")
        .createSignedUrl(doctor.profile_photo_path, 3600);
      photoUrl = signed?.signedUrl ?? null;
    }

    return { ...doctor, photoUrl };
  });
