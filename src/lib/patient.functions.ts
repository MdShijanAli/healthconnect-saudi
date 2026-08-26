import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireActivePatient } from "@/lib/require-patient";
import { createNotification } from "@/lib/notifications";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";
import {
  bookAppointmentSchema,
  cancelPatientAppointmentSchema,
  getAvailableSlotsSchema,
  getDoctorAvailabilitySchema,
  getDoctorProfileSchema,
  markNotificationReadSchema,
  reschedulePatientAppointmentSchema,
  searchDoctorsSchema,
  updatePatientProfileSchema,
} from "@/lib/patient-schemas";

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours! * 60 + minutes!;
}

function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function generateSlots(startTime: string, endTime: string, intervalMinutes = 30): string[] {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const slots: string[] = [];
  for (let t = start; t + intervalMinutes <= end; t += intervalMinutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

function isWithinCutoff(date: string, time: string, cutoffHours: number): boolean {
  const appointmentAt = new Date(`${date}T${time}:00`);
  return appointmentAt.getTime() - Date.now() < cutoffHours * 60 * 60 * 1000;
}

export const getPatientDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().slice(0, 5);

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select("id, doctor_id, appointment_date, appointment_time, status, reason")
      .eq("patient_id", context.userId)
      .in("status", ["pending", "scheduled"])
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });
    if (error) throw new Error(error.message);

    const upcoming = appointments.find(
      (a) =>
        a.appointment_date > today ||
        (a.appointment_date === today && a.appointment_time.slice(0, 5) >= nowTime),
    );

    if (!upcoming) return { upcomingAppointment: null };

    const [{ data: doctorProfile }, { data: profile }] = await Promise.all([
      supabaseAdmin
        .from("doctor_profiles")
        .select("specialization")
        .eq("user_id", upcoming.doctor_id)
        .single(),
      supabaseAdmin.from("profiles").select("full_name").eq("id", upcoming.doctor_id).single(),
    ]);

    return {
      upcomingAppointment: {
        id: upcoming.id,
        date: upcoming.appointment_date,
        time: upcoming.appointment_time,
        status: upcoming.status,
        reason: upcoming.reason,
        doctorName: profile?.full_name ?? "Unknown",
        specialization: doctorProfile?.specialization ?? "",
      },
    };
  });

export const searchDoctorsForPatient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => searchDoctorsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const { data: doctors, error } = await supabaseAdmin.rpc("list_public_doctors");
    if (error) throw new Error(error.message);

    let filtered = doctors;
    if (data.specialization) {
      filtered = filtered.filter((d) => d.specialization === data.specialization);
    }
    if (data.query) {
      const q = data.query.toLowerCase();
      filtered = filtered.filter((d) => d.full_name.toLowerCase().includes(q));
    }

    if (data.availability && filtered.length > 0) {
      const ids = filtered.map((d) => d.user_id);
      const todayStr = new Date().toISOString().slice(0, 10);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);
      const rangeEnd = data.availability === "today" ? todayStr : weekEndStr;

      const [{ data: availabilities, error: availError }, { data: leaves, error: leaveError }] =
        await Promise.all([
          supabaseAdmin
            .from("doctor_availability")
            .select("doctor_id, day_of_week")
            .in("doctor_id", ids)
            .eq("is_enabled", true),
          supabaseAdmin
            .from("doctor_unavailable_dates")
            .select("doctor_id, date")
            .in("doctor_id", ids)
            .gte("date", todayStr)
            .lte("date", rangeEnd),
        ]);
      if (availError) throw new Error(availError.message);
      if (leaveError) throw new Error(leaveError.message);

      const enabledDaysByDoctor = new Map<string, Set<number>>();
      for (const a of availabilities ?? []) {
        const set = enabledDaysByDoctor.get(a.doctor_id) ?? new Set<number>();
        set.add(a.day_of_week);
        enabledDaysByDoctor.set(a.doctor_id, set);
      }
      const leaveDatesByDoctor = new Map<string, Set<string>>();
      for (const l of leaves ?? []) {
        const set = leaveDatesByDoctor.get(l.doctor_id) ?? new Set<string>();
        set.add(l.date);
        leaveDatesByDoctor.set(l.doctor_id, set);
      }

      const todayDow = new Date().getDay();
      filtered = filtered.filter((d) => {
        const enabledDays = enabledDaysByDoctor.get(d.user_id);
        if (!enabledDays) return false;
        const leaveDates = leaveDatesByDoctor.get(d.user_id);
        if (data.availability === "today") {
          return enabledDays.has(todayDow) && !leaveDates?.has(todayStr);
        }
        for (let i = 0; i < 7; i++) {
          const day = new Date();
          day.setDate(day.getDate() + i);
          const dateStr = day.toISOString().slice(0, 10);
          if (enabledDays.has(day.getDay()) && !leaveDates?.has(dateStr)) return true;
        }
        return false;
      });
    }

    return Promise.all(
      filtered.map(async (doctor) => {
        if (!doctor.profile_photo_path) return { ...doctor, photoUrl: null };
        const { data: signed } = await supabaseAdmin.storage
          .from("profile-photos")
          .createSignedUrl(doctor.profile_photo_path, 3600);
        return { ...doctor, photoUrl: signed?.signedUrl ?? null };
      }),
    );
  });

export const getDoctorProfileForPatient = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => getDoctorProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const { data: doctor, error } = await supabaseAdmin
      .from("doctor_profiles")
      .select(
        "user_id, specialization, years_experience, consultation_fee, bio, profile_photo_path, approval_status, is_active",
      )
      .eq("user_id", data.doctorId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!doctor || doctor.approval_status !== "approved" || !doctor.is_active) {
      throw new Error("This doctor is not available for booking.");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.doctorId)
      .single();
    if (profileError) throw new Error(profileError.message);

    let photoUrl: string | null = null;
    if (doctor.profile_photo_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from("profile-photos")
        .createSignedUrl(doctor.profile_photo_path, 3600);
      photoUrl = signed?.signedUrl ?? null;
    }

    return {
      userId: doctor.user_id,
      fullName: profile.full_name,
      specialization: doctor.specialization,
      yearsExperience: doctor.years_experience,
      consultationFee: doctor.consultation_fee,
      bio: doctor.bio,
      photoUrl,
    };
  });

export const getDoctorAvailabilityForBooking = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => getDoctorAvailabilitySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const [{ data: days, error }, { data: leaves, error: leaveError }] = await Promise.all([
      supabaseAdmin
        .from("doctor_availability")
        .select("day_of_week, is_enabled")
        .eq("doctor_id", data.doctorId),
      supabaseAdmin
        .from("doctor_unavailable_dates")
        .select("date")
        .eq("doctor_id", data.doctorId)
        .gte("date", new Date().toISOString().slice(0, 10)),
    ]);
    if (error) throw new Error(error.message);
    if (leaveError) throw new Error(leaveError.message);

    return {
      enabledDays: (days ?? []).filter((d) => d.is_enabled).map((d) => d.day_of_week),
      unavailableDates: (leaves ?? []).map((l) => l.date),
    };
  });

export const getAvailableSlots = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => getAvailableSlotsSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const dayOfWeek = new Date(`${data.date}T00:00:00`).getDay();

    const [
      { data: availability, error },
      { data: leave, error: leaveError },
      { data: booked, error: bookedError },
    ] = await Promise.all([
      supabaseAdmin
        .from("doctor_availability")
        .select("is_enabled, start_time, end_time")
        .eq("doctor_id", data.doctorId)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle(),
      supabaseAdmin
        .from("doctor_unavailable_dates")
        .select("id")
        .eq("doctor_id", data.doctorId)
        .eq("date", data.date)
        .maybeSingle(),
      supabaseAdmin
        .from("appointments")
        .select("appointment_time")
        .eq("doctor_id", data.doctorId)
        .eq("appointment_date", data.date)
        .in("status", ["pending", "scheduled"]),
    ]);
    if (error) throw new Error(error.message);
    if (leaveError) throw new Error(leaveError.message);
    if (bookedError) throw new Error(bookedError.message);

    if (!availability || !availability.is_enabled || leave) return [];

    const bookedTimes = new Set((booked ?? []).map((b) => b.appointment_time.slice(0, 5)));
    const isToday = data.date === new Date().toISOString().slice(0, 10);
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    return generateSlots(availability.start_time.slice(0, 5), availability.end_time.slice(0, 5))
      .filter((slot) => !bookedTimes.has(slot))
      .filter((slot) => !isToday || timeToMinutes(slot) > nowMinutes);
  });

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => bookAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from("doctor_profiles")
      .select("consultation_fee, approval_status, is_active")
      .eq("user_id", data.doctorId)
      .maybeSingle();
    if (doctorError) throw new Error(doctorError.message);
    if (!doctor || doctor.approval_status !== "approved" || !doctor.is_active) {
      throw new Error("This doctor is not available for booking.");
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("doctor_id", data.doctorId)
      .eq("appointment_date", data.date)
      .eq("appointment_time", data.time)
      .in("status", ["pending", "scheduled"])
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) throw new Error("That time slot was just booked. Please pick another.");

    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        doctor_id: data.doctorId,
        patient_id: context.userId,
        appointment_date: data.date,
        appointment_time: data.time,
        status: "pending",
        fee: doctor.consultation_fee,
        reason: data.reason,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { data: doctorProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.doctorId)
      .single();
    await createNotification(supabaseAdmin, {
      userId: context.userId,
      type: "booking_confirmation",
      title: "Booking request sent",
      body: `Your appointment request with ${doctorProfile?.full_name ?? "your doctor"} on ${data.date} at ${data.time} has been sent and is awaiting confirmation.`,
      relatedAppointmentId: appointment.id,
    });

    return { appointmentId: appointment.id };
  });

export const listPatientAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const { data: appointments, error } = await supabaseAdmin
      .from("appointments")
      .select(
        "id, doctor_id, appointment_date, appointment_time, status, reason, cancel_reason, fee",
      )
      .eq("patient_id", context.userId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    if (error) throw new Error(error.message);

    const ids = [...new Set(appointments.map((a) => a.doctor_id))];
    const [{ data: profiles, error: profileError }, { data: doctorProfiles, error: doctorError }] =
      await Promise.all([
        ids.length
          ? supabaseAdmin.from("profiles").select("id, full_name").in("id", ids)
          : Promise.resolve({ data: [], error: null }),
        ids.length
          ? supabaseAdmin
              .from("doctor_profiles")
              .select("user_id, specialization")
              .in("user_id", ids)
          : Promise.resolve({ data: [], error: null }),
      ]);
    if (profileError) throw new Error(profileError.message);
    if (doctorError) throw new Error(doctorError.message);

    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const specializationById = new Map(
      (doctorProfiles ?? []).map((d) => [d.user_id, d.specialization]),
    );

    return appointments.map((a) => ({
      ...a,
      doctorName: nameById.get(a.doctor_id) ?? "Unknown",
      specialization: specializationById.get(a.doctor_id) ?? "",
    }));
  });

export const cancelPatientAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => cancelPatientAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .select("id, appointment_date, appointment_time, status")
      .eq("id", data.appointmentId)
      .eq("patient_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.status !== "pending" && appointment.status !== "scheduled") {
      throw new Error("This appointment can no longer be cancelled.");
    }
    if (isWithinCutoff(appointment.appointment_date, appointment.appointment_time.slice(0, 5), 2)) {
      throw new Error("Appointments can't be cancelled within 2 hours of the scheduled time.");
    }

    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({ status: "cancelled", cancel_reason: data.reason ?? null })
      .eq("id", data.appointmentId);
    if (updateError) throw new Error(updateError.message);

    return { ok: true };
  });

export const reschedulePatientAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => reschedulePatientAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .select("id, doctor_id, appointment_date, appointment_time, status")
      .eq("id", data.appointmentId)
      .eq("patient_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!appointment) throw new Error("Appointment not found");
    if (appointment.status !== "pending" && appointment.status !== "scheduled") {
      throw new Error("This appointment can no longer be rescheduled.");
    }
    if (isWithinCutoff(appointment.appointment_date, appointment.appointment_time.slice(0, 5), 2)) {
      throw new Error("Appointments can't be rescheduled within 2 hours of the scheduled time.");
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("doctor_id", appointment.doctor_id)
      .eq("appointment_date", data.date)
      .eq("appointment_time", data.time)
      .in("status", ["pending", "scheduled"])
      .neq("id", data.appointmentId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) throw new Error("That time slot is already booked. Please pick another.");

    const { error: updateError } = await supabaseAdmin
      .from("appointments")
      .update({ appointment_date: data.date, appointment_time: data.time })
      .eq("id", data.appointmentId);
    if (updateError) throw new Error(updateError.message);

    return { ok: true };
  });

export const listPatientPrescriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const { data: prescriptions, error } = await supabaseAdmin
      .from("prescriptions")
      .select("id, doctor_id, diagnosis_notes, advice_notes, created_at")
      .eq("patient_id", context.userId)
      .order("created_at", { ascending: false });
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

    const doctorIds = [...new Set(prescriptions.map((p) => p.doctor_id))];
    const [{ data: profiles, error: profileError }, { data: doctorProfiles, error: doctorError }] =
      await Promise.all([
        doctorIds.length
          ? supabaseAdmin.from("profiles").select("id, full_name").in("id", doctorIds)
          : Promise.resolve({ data: [], error: null }),
        doctorIds.length
          ? supabaseAdmin
              .from("doctor_profiles")
              .select("user_id, specialization")
              .in("user_id", doctorIds)
          : Promise.resolve({ data: [], error: null }),
      ]);
    if (profileError) throw new Error(profileError.message);
    if (doctorError) throw new Error(doctorError.message);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const specializationById = new Map(
      (doctorProfiles ?? []).map((d) => [d.user_id, d.specialization]),
    );

    return prescriptions.map((p) => ({
      ...p,
      doctorName: nameById.get(p.doctor_id) ?? "Unknown",
      specialization: specializationById.get(p.doctor_id) ?? "",
      items: itemsByPrescription.get(p.id) ?? [],
    }));
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);
    const { data, error } = await supabaseAdmin
      .from("notifications")
      .select("id, type, title, body, is_read, created_at, related_appointment_id")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => markNotificationReadSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", context.userId)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyPatientProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const [{ data: profile, error }, { data: patientProfile, error: patientError }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("full_name, phone").eq("id", context.userId).single(),
        supabaseAdmin
          .from("patient_profiles")
          .select("date_of_birth, gender, profile_photo_path")
          .eq("user_id", context.userId)
          .single(),
      ]);
    if (error) throw new Error(error.message);
    if (patientError) throw new Error(patientError.message);

    let photoUrl: string | null = null;
    if (patientProfile.profile_photo_path) {
      const { data: signed } = await supabaseAdmin.storage
        .from("profile-photos")
        .createSignedUrl(patientProfile.profile_photo_path, 3600);
      photoUrl = signed?.signedUrl ?? null;
    }

    return {
      fullName: profile.full_name,
      phone: profile.phone,
      dateOfBirth: patientProfile.date_of_birth,
      gender: patientProfile.gender,
      photoUrl,
    };
  });

export const updatePatientProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updatePatientProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await requireActivePatient(supabaseAdmin, context.userId);

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone })
      .eq("id", context.userId);
    if (profileError) throw new Error(profileError.message);

    const patientUpdate: TablesUpdate<"patient_profiles"> = {
      date_of_birth: data.dateOfBirth,
      gender: data.gender,
    };
    if (data.profilePhotoPath !== undefined)
      patientUpdate.profile_photo_path = data.profilePhotoPath;
    const { error } = await supabaseAdmin
      .from("patient_profiles")
      .update(patientUpdate)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);

    return { ok: true };
  });
