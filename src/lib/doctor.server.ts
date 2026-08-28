import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type {
  availabilitySchema,
  consultationSchema,
  doctorProfileSchema,
  medicineSchema,
  rescheduleAppointmentSchema,
  timeOffSchema,
  updateAppointmentSchema,
} from "@/lib/doctor-schemas";
import type { z } from "zod";

type Client = SupabaseClient<Database>;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function assertDoctor(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "doctor")
    .maybeSingle();
  if (error || !data) throw new Error("Forbidden");
  return userId;
}

type ProfileLite = { full_name: string; phone: string };

async function profilesByIds(ids: string[]) {
  if (!ids.length) return new Map<string, ProfileLite>();
  const db = await admin();
  const { data } = await db.from("profiles").select("id, full_name, phone").in("id", Array.from(new Set(ids)));
  return new Map((data ?? []).map((p) => [p.id, { full_name: p.full_name, phone: p.phone }]));
}

export type DoctorAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  reason: string;
  status: Database["public"]["Enums"]["appointment_status"];
  cancelReason: string | null;
  hasPrescription: boolean;
};

async function decorate(
  rows: Database["public"]["Tables"]["appointments"]["Row"][],
): Promise<DoctorAppointment[]> {
  const profiles = await profilesByIds(rows.map((r) => r.patient_id));
  const db = await admin();
  const { data: scripts } = rows.length
    ? await db.from("prescriptions").select("appointment_id").in("appointment_id", rows.map((r) => r.id))
    : { data: [] };
  const withScript = new Set((scripts ?? []).map((s) => s.appointment_id));
  return rows.map((row) => ({
    id: row.id,
    patientId: row.patient_id,
    patientName: profiles.get(row.patient_id)?.full_name ?? "Patient",
    patientPhone: profiles.get(row.patient_id)?.phone ?? "",
    date: row.appointment_date,
    time: row.appointment_time.slice(0, 5),
    reason: row.reason,
    status: row.status,
    cancelReason: row.cancel_reason,
    hasPrescription: withScript.has(row.id),
  }));
}

export async function fetchDoctorAppointments(supabase: Client, doctorId: string) {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });
  if (error) throw new Error(error.message);
  return decorate(data ?? []);
}

export async function fetchDoctorDashboard(supabase: Client, doctorId: string) {
  const all = await fetchDoctorAppointments(supabase, doctorId);
  const today = new Date().toISOString().slice(0, 10);
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const todays = all.filter((a) => a.date === today && a.status !== "cancelled");
  const week = all.filter((a) => a.date >= today && a.date <= weekEnd && a.status !== "cancelled");
  const patients = new Set(all.map((a) => a.patientId));
  const pendingPrescriptions = all.filter(
    (a) => a.status !== "cancelled" && a.date <= today && !a.hasPrescription,
  ).length;

  return {
    stats: {
      todayCount: todays.length,
      pendingPrescriptions,
      totalPatients: patients.size,
      weekCount: week.length,
    },
    today: todays,
    upcoming: week.filter((a) => a.date > today).slice(0, 5),
  };
}

export async function fetchAvailability(supabase: Client, doctorId: string) {
  const [{ data: days }, { data: off }] = await Promise.all([
    supabase.from("doctor_availability").select("*").eq("doctor_id", doctorId).order("weekday"),
    supabase.from("doctor_time_off").select("*").eq("doctor_id", doctorId).order("off_date"),
  ]);
  return {
    days: (days ?? []).map((d) => ({
      weekday: d.weekday,
      isEnabled: d.is_enabled,
      startTime: d.start_time.slice(0, 5),
      endTime: d.end_time.slice(0, 5),
    })),
    timeOff: (off ?? []).map((d) => ({ id: d.id, offDate: d.off_date, note: d.note })),
  };
}

export async function saveAvailability(
  supabase: Client,
  doctorId: string,
  input: z.infer<typeof availabilitySchema>,
) {
  const rows = input.days.map((d) => ({
    doctor_id: doctorId,
    weekday: d.weekday,
    is_enabled: d.isEnabled,
    start_time: d.startTime,
    end_time: d.endTime,
  }));
  const { error } = await supabase.from("doctor_availability").upsert(rows, { onConflict: "doctor_id,weekday" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function addTimeOff(supabase: Client, doctorId: string, input: z.infer<typeof timeOffSchema>) {
  const { error } = await supabase
    .from("doctor_time_off")
    .upsert({ doctor_id: doctorId, off_date: input.offDate, note: input.note }, { onConflict: "doctor_id,off_date" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function removeTimeOff(supabase: Client, doctorId: string, id: string) {
  const { error } = await supabase.from("doctor_time_off").delete().eq("id", id).eq("doctor_id", doctorId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function updateAppointment(
  supabase: Client,
  doctorId: string,
  input: z.infer<typeof updateAppointmentSchema>,
) {
  const { error } = await supabase
    .from("appointments")
    .update({ status: input.status, cancel_reason: input.cancelReason ?? null })
    .eq("id", input.appointmentId)
    .eq("doctor_id", doctorId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function rescheduleAppointment(
  supabase: Client,
  doctorId: string,
  input: z.infer<typeof rescheduleAppointmentSchema>,
) {
  const { error } = await supabase
    .from("appointments")
    .update({
      appointment_date: input.appointmentDate,
      appointment_time: input.appointmentTime,
      status: "confirmed",
    })
    .eq("id", input.appointmentId)
    .eq("doctor_id", doctorId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function fetchMedicines(supabase: Client, doctorId: string) {
  const { data, error } = await supabase
    .from("doctor_medicines")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    commonDosage: m.common_dosage,
    category: m.category,
  }));
}

export async function saveMedicine(
  supabase: Client,
  doctorId: string,
  input: z.infer<typeof medicineSchema>,
) {
  if (input.id) {
    const { error } = await supabase
      .from("doctor_medicines")
      .update({ name: input.name, common_dosage: input.commonDosage, category: input.category })
      .eq("id", input.id)
      .eq("doctor_id", doctorId);
    if (error) throw new Error(error.message);
    return { ok: true };
  }
  const { error } = await supabase.from("doctor_medicines").upsert(
    { doctor_id: doctorId, name: input.name, common_dosage: input.commonDosage, category: input.category },
    { onConflict: "doctor_id,name" },
  );
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteMedicine(supabase: Client, doctorId: string, id: string) {
  const { error } = await supabase.from("doctor_medicines").delete().eq("id", id).eq("doctor_id", doctorId);
  if (error) throw new Error(error.message);
  return { ok: true };
}

async function prescriptionsFor(doctorId: string, patientId: string) {
  const db = await admin();
  const { data } = await db
    .from("prescriptions")
    .select("id, appointment_id, diagnosis, advice, created_at")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  const ids = (data ?? []).map((p) => p.id);
  const { data: items } = ids.length
    ? await db.from("prescription_items").select("*").in("prescription_id", ids).order("sort_order")
    : { data: [] };
  return (data ?? []).map((p) => ({
    id: p.id,
    appointmentId: p.appointment_id,
    diagnosis: p.diagnosis,
    advice: p.advice,
    createdAt: p.created_at,
    items: (items ?? [])
      .filter((i) => i.prescription_id === p.id)
      .map((i) => ({
        medicineName: i.medicine_name,
        dosage: i.dosage,
        frequency: i.frequency,
        duration: i.duration,
        instructions: i.instructions,
      })),
  }));
}

export async function fetchPatientOverview(supabase: Client, doctorId: string, patientId: string) {
  const { data: visits, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("patient_id", patientId)
    .order("appointment_date", { ascending: false });
  if (error) throw new Error(error.message);
  if (!visits?.length) throw new Error("You do not have access to this patient.");

  const db = await admin();
  const [{ data: profile }, { data: details }] = await Promise.all([
    db.from("profiles").select("full_name, phone").eq("id", patientId).maybeSingle(),
    db.from("patient_profiles").select("date_of_birth, gender").eq("user_id", patientId).maybeSingle(),
  ]);

  return {
    patient: {
      id: patientId,
      fullName: profile?.full_name ?? "Patient",
      phone: profile?.phone ?? "",
      dateOfBirth: details?.date_of_birth ?? null,
      gender: details?.gender ?? null,
      age: details?.date_of_birth
        ? Math.floor((Date.now() - new Date(details.date_of_birth).getTime()) / 31557600000)
        : null,
    },
    visits: visits.map((v) => ({
      id: v.id,
      date: v.appointment_date,
      time: v.appointment_time.slice(0, 5),
      reason: v.reason,
      status: v.status,
    })),
    prescriptions: await prescriptionsFor(doctorId, patientId),
  };
}

export async function fetchConsultation(supabase: Client, doctorId: string, appointmentId: string) {
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("doctor_id", doctorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!appointment) throw new Error("Appointment not found.");

  const overview = await fetchPatientOverview(supabase, doctorId, appointment.patient_id);
  const existing = overview.prescriptions.find((p) => p.appointmentId === appointmentId) ?? null;

  return {
    appointment: {
      id: appointment.id,
      date: appointment.appointment_date,
      time: appointment.appointment_time.slice(0, 5),
      reason: appointment.reason,
      status: appointment.status,
    },
    patient: overview.patient,
    pastVisits: overview.visits.filter((v) => v.id !== appointmentId),
    pastPrescriptions: overview.prescriptions.filter((p) => p.appointmentId !== appointmentId),
    existing,
    medicines: await fetchMedicines(supabase, doctorId),
  };
}

export async function saveConsultation(
  supabase: Client,
  doctorId: string,
  input: z.infer<typeof consultationSchema>,
) {
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("id, patient_id")
    .eq("id", input.appointmentId)
    .eq("doctor_id", doctorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!appointment) throw new Error("Appointment not found.");

  const db = await admin();
  const { data: prescription, error: upsertError } = await db
    .from("prescriptions")
    .upsert(
      {
        appointment_id: input.appointmentId,
        doctor_id: doctorId,
        patient_id: appointment.patient_id,
        diagnosis: input.diagnosis,
        advice: input.advice,
      },
      { onConflict: "appointment_id" },
    )
    .select("id")
    .single();
  if (upsertError) throw new Error(upsertError.message);

  await db.from("prescription_items").delete().eq("prescription_id", prescription.id);
  if (input.items.length) {
    const { error: itemsError } = await db.from("prescription_items").insert(
      input.items.map((item, index) => ({
        prescription_id: prescription.id,
        medicine_name: item.medicineName,
        dosage: item.dosage,
        frequency: item.frequency,
        duration: item.duration,
        instructions: item.instructions,
        sort_order: index,
      })),
    );
    if (itemsError) throw new Error(itemsError.message);
  }

  const { error: statusError } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", input.appointmentId)
    .eq("doctor_id", doctorId);
  if (statusError) throw new Error(statusError.message);

  return { ok: true, prescriptionId: prescription.id };
}

export async function fetchDoctorProfile(supabase: Client, doctorId: string) {
  const { data, error } = await supabase
    .from("doctor_profiles")
    .select("*")
    .eq("user_id", doctorId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Doctor profile not found.");
  const db = await admin();
  const { data: specializations } = await db
    .from("specializations")
    .select("name")
    .order("sort_order");
  return {
    specialization: data.specialization,
    bio: data.bio,
    consultationFee: Number(data.consultation_fee),
    yearsExperience: data.years_experience,
    profilePhotoPath: data.profile_photo_path,
    licenseNumber: data.medical_license_number,
    approvalStatus: data.approval_status,
    specializationOptions: (specializations ?? []).map((s) => s.name),
  };
}

export async function updateDoctorProfile(
  supabase: Client,
  doctorId: string,
  input: z.infer<typeof doctorProfileSchema>,
) {
  const { error } = await supabase
    .from("doctor_profiles")
    .update({
      specialization: input.specialization,
      bio: input.bio,
      consultation_fee: input.consultationFee,
      years_experience: input.yearsExperience,
      ...(input.profilePhotoPath ? { profile_photo_path: input.profilePhotoPath } : {}),
    })
    .eq("user_id", doctorId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
