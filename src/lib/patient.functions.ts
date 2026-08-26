import { createServerFn } from "@tanstack/react-start";
import { requireMockAuth } from "@/lib/mock-auth";
import { requireActivePatient } from "@/lib/require-patient";
import { createNotification } from "@/lib/notifications";
import { genId, isoNow, mockDb } from "@/lib/mock-db";
import { listPublicDoctorsData } from "@/lib/public.functions";
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
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireActivePatient(context.userId);

    const today = new Date().toISOString().slice(0, 10);
    const nowTime = new Date().toTimeString().slice(0, 5);

    const appointments = mockDb.appointments
      .filter((a) => a.patientId === context.userId && (a.status === "pending" || a.status === "scheduled"))
      .sort(
        (a, b) =>
          a.appointmentDate.localeCompare(b.appointmentDate) ||
          a.appointmentTime.localeCompare(b.appointmentTime),
      );

    const upcoming = appointments.find(
      (a) =>
        a.appointmentDate > today ||
        (a.appointmentDate === today && a.appointmentTime.slice(0, 5) >= nowTime),
    );

    if (!upcoming) return { upcomingAppointment: null };

    const doctorProfile = mockDb.doctorProfiles.find((d) => d.userId === upcoming.doctorId);
    const profile = mockDb.profiles.find((p) => p.id === upcoming.doctorId);

    return {
      upcomingAppointment: {
        id: upcoming.id,
        date: upcoming.appointmentDate,
        time: upcoming.appointmentTime,
        status: upcoming.status,
        reason: upcoming.reason,
        doctorName: profile?.fullName ?? "Unknown",
        specialization: doctorProfile?.specialization ?? "",
      },
    };
  });

export const searchDoctorsForPatient = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .inputValidator((input) => searchDoctorsSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireActivePatient(context.userId);

    let filtered = listPublicDoctorsData();
    if (data.specialization) {
      filtered = filtered.filter((d) => d.specialization === data.specialization);
    }
    if (data.query) {
      const q = data.query.toLowerCase();
      filtered = filtered.filter((d) => d.full_name.toLowerCase().includes(q));
    }

    if (data.availability && filtered.length > 0) {
      const ids = new Set(filtered.map((d) => d.user_id));
      const todayStr = new Date().toISOString().slice(0, 10);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() + 6);
      const weekEndStr = weekEnd.toISOString().slice(0, 10);
      const rangeEnd = data.availability === "today" ? todayStr : weekEndStr;

      const enabledDaysByDoctor = new Map<string, Set<number>>();
      for (const a of mockDb.doctorAvailability) {
        if (!ids.has(a.doctorId) || !a.isEnabled) continue;
        const set = enabledDaysByDoctor.get(a.doctorId) ?? new Set<number>();
        set.add(a.dayOfWeek);
        enabledDaysByDoctor.set(a.doctorId, set);
      }
      const leaveDatesByDoctor = new Map<string, Set<string>>();
      for (const l of mockDb.doctorUnavailableDates) {
        if (!ids.has(l.doctorId) || l.date < todayStr || l.date > rangeEnd) continue;
        const set = leaveDatesByDoctor.get(l.doctorId) ?? new Set<string>();
        set.add(l.date);
        leaveDatesByDoctor.set(l.doctorId, set);
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

    return filtered;
  });

export const getDoctorProfileForPatient = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .inputValidator((input) => getDoctorProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireActivePatient(context.userId);

    const doctor = mockDb.doctorProfiles.find((d) => d.userId === data.doctorId);
    if (!doctor || doctor.approvalStatus !== "approved" || !doctor.isActive) {
      throw new Error("This doctor is not available for booking.");
    }
    const profile = mockDb.profiles.find((p) => p.id === data.doctorId);
    if (!profile) throw new Error("Doctor not found");

    return {
      userId: doctor.userId,
      fullName: profile.fullName,
      specialization: doctor.specialization,
      yearsExperience: doctor.yearsExperience,
      consultationFee: doctor.consultationFee,
      bio: doctor.bio,
      photoUrl: doctor.profilePhotoPath,
    };
  });

export const getDoctorAvailabilityForBooking = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .inputValidator((input) => getDoctorAvailabilitySchema.parse(input))
  .handler(async ({ data, context }) => {
    requireActivePatient(context.userId);

    const today = new Date().toISOString().slice(0, 10);
    return {
      enabledDays: mockDb.doctorAvailability
        .filter((d) => d.doctorId === data.doctorId && d.isEnabled)
        .map((d) => d.dayOfWeek),
      unavailableDates: mockDb.doctorUnavailableDates
        .filter((d) => d.doctorId === data.doctorId && d.date >= today)
        .map((d) => d.date),
    };
  });

export const getAvailableSlots = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .inputValidator((input) => getAvailableSlotsSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireActivePatient(context.userId);

    const dayOfWeek = new Date(`${data.date}T00:00:00`).getDay();
    const availability = mockDb.doctorAvailability.find(
      (d) => d.doctorId === data.doctorId && d.dayOfWeek === dayOfWeek,
    );
    const onLeave = mockDb.doctorUnavailableDates.some(
      (d) => d.doctorId === data.doctorId && d.date === data.date,
    );
    if (!availability || !availability.isEnabled || onLeave) return [];

    const bookedTimes = new Set(
      mockDb.appointments
        .filter(
          (a) =>
            a.doctorId === data.doctorId &&
            a.appointmentDate === data.date &&
            (a.status === "pending" || a.status === "scheduled"),
        )
        .map((a) => a.appointmentTime.slice(0, 5)),
    );
    const isToday = data.date === new Date().toISOString().slice(0, 10);
    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

    return generateSlots(availability.startTime.slice(0, 5), availability.endTime.slice(0, 5))
      .filter((slot) => !bookedTimes.has(slot))
      .filter((slot) => !isToday || timeToMinutes(slot) > nowMinutes);
  });

export const bookAppointment = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => bookAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireActivePatient(context.userId);

    const doctor = mockDb.doctorProfiles.find((d) => d.userId === data.doctorId);
    if (!doctor || doctor.approvalStatus !== "approved" || !doctor.isActive) {
      throw new Error("This doctor is not available for booking.");
    }

    const existing = mockDb.appointments.find(
      (a) =>
        a.doctorId === data.doctorId &&
        a.appointmentDate === data.date &&
        a.appointmentTime === data.time &&
        (a.status === "pending" || a.status === "scheduled"),
    );
    if (existing) throw new Error("That time slot was just booked. Please pick another.");

    const appointmentId = genId();
    mockDb.appointments.push({
      id: appointmentId,
      doctorId: data.doctorId,
      patientId: context.userId,
      appointmentDate: data.date,
      appointmentTime: data.time,
      status: "pending",
      fee: doctor.consultationFee,
      reason: data.reason,
      cancelReason: null,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    });

    const doctorName = mockDb.profiles.find((p) => p.id === data.doctorId)?.fullName ?? "your doctor";
    createNotification({
      userId: context.userId,
      type: "booking_confirmation",
      title: "Booking request sent",
      body: `Your appointment request with ${doctorName} on ${data.date} at ${data.time} has been sent and is awaiting confirmation.`,
      relatedAppointmentId: appointmentId,
    });

    return { appointmentId };
  });

export const listPatientAppointments = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireActivePatient(context.userId);

    const appointments = mockDb.appointments
      .filter((a) => a.patientId === context.userId)
      .sort(
        (a, b) =>
          b.appointmentDate.localeCompare(a.appointmentDate) ||
          b.appointmentTime.localeCompare(a.appointmentTime),
      );

    return appointments.map((a) => {
      const doctorProfile = mockDb.doctorProfiles.find((d) => d.userId === a.doctorId);
      return {
        id: a.id,
        doctor_id: a.doctorId,
        appointment_date: a.appointmentDate,
        appointment_time: a.appointmentTime,
        status: a.status,
        reason: a.reason,
        cancel_reason: a.cancelReason,
        fee: a.fee,
        doctorName: mockDb.profiles.find((p) => p.id === a.doctorId)?.fullName ?? "Unknown",
        specialization: doctorProfile?.specialization ?? "",
      };
    });
  });

export const cancelPatientAppointment = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => cancelPatientAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireActivePatient(context.userId);

    const appt = mockDb.appointments.find((a) => a.id === data.appointmentId && a.patientId === context.userId);
    if (!appt) throw new Error("Appointment not found");
    if (appt.status !== "pending" && appt.status !== "scheduled") {
      throw new Error("This appointment can no longer be cancelled.");
    }
    if (isWithinCutoff(appt.appointmentDate, appt.appointmentTime.slice(0, 5), 2)) {
      throw new Error("Appointments can't be cancelled within 2 hours of the scheduled time.");
    }

    appt.status = "cancelled";
    appt.cancelReason = data.reason ?? null;
    appt.updatedAt = isoNow();
    return { ok: true };
  });

export const reschedulePatientAppointment = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => reschedulePatientAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireActivePatient(context.userId);

    const appt = mockDb.appointments.find((a) => a.id === data.appointmentId && a.patientId === context.userId);
    if (!appt) throw new Error("Appointment not found");
    if (appt.status !== "pending" && appt.status !== "scheduled") {
      throw new Error("This appointment can no longer be rescheduled.");
    }
    if (isWithinCutoff(appt.appointmentDate, appt.appointmentTime.slice(0, 5), 2)) {
      throw new Error("Appointments can't be rescheduled within 2 hours of the scheduled time.");
    }

    const existing = mockDb.appointments.find(
      (a) =>
        a.doctorId === appt.doctorId &&
        a.appointmentDate === data.date &&
        a.appointmentTime === data.time &&
        (a.status === "pending" || a.status === "scheduled") &&
        a.id !== data.appointmentId,
    );
    if (existing) throw new Error("That time slot is already booked. Please pick another.");

    appt.appointmentDate = data.date;
    appt.appointmentTime = data.time;
    appt.updatedAt = isoNow();
    return { ok: true };
  });

export const listPatientPrescriptions = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireActivePatient(context.userId);

    const prescriptions = mockDb.prescriptions
      .filter((p) => p.patientId === context.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return prescriptions.map((p) => {
      const doctorProfile = mockDb.doctorProfiles.find((d) => d.userId === p.doctorId);
      return {
        id: p.id,
        doctor_id: p.doctorId,
        diagnosis_notes: p.diagnosisNotes,
        advice_notes: p.adviceNotes,
        created_at: p.createdAt,
        doctorName: mockDb.profiles.find((prof) => prof.id === p.doctorId)?.fullName ?? "Unknown",
        specialization: doctorProfile?.specialization ?? "",
        items: mockDb.prescriptionItems
          .filter((i) => i.prescriptionId === p.id)
          .map((i) => ({
            id: i.id,
            prescription_id: i.prescriptionId,
            medicine_name: i.medicineName,
            dosage: i.dosage,
            frequency: i.frequency,
            duration: i.duration,
            instructions: i.instructions,
          })),
      };
    });
  });

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireActivePatient(context.userId);
    return mockDb.notifications
      .filter((n) => n.userId === context.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        is_read: n.isRead,
        created_at: n.createdAt,
        related_appointment_id: n.relatedAppointmentId,
      }));
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => markNotificationReadSchema.parse(input))
  .handler(async ({ data, context }) => {
    const notification = mockDb.notifications.find((n) => n.id === data.id && n.userId === context.userId);
    if (notification) notification.isRead = true;
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    for (const n of mockDb.notifications) {
      if (n.userId === context.userId) n.isRead = true;
    }
    return { ok: true };
  });

export const getMyPatientProfile = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireActivePatient(context.userId);

    const profile = mockDb.profiles.find((p) => p.id === context.userId);
    const patientProfile = mockDb.patientProfiles.find((p) => p.userId === context.userId);
    if (!profile || !patientProfile) throw new Error("Profile not found");

    return {
      fullName: profile.fullName,
      phone: profile.phone,
      dateOfBirth: patientProfile.dateOfBirth,
      gender: patientProfile.gender,
      photoUrl: patientProfile.profilePhotoPath,
    };
  });

export const updatePatientProfile = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => updatePatientProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireActivePatient(context.userId);

    const profile = mockDb.profiles.find((p) => p.id === context.userId);
    const patientProfile = mockDb.patientProfiles.find((p) => p.userId === context.userId);
    if (!profile || !patientProfile) throw new Error("Profile not found");

    profile.fullName = data.fullName;
    profile.phone = data.phone;
    profile.updatedAt = isoNow();

    patientProfile.dateOfBirth = data.dateOfBirth;
    patientProfile.gender = data.gender;
    if (data.profilePhotoPath !== undefined) patientProfile.profilePhotoPath = data.profilePhotoPath;
    patientProfile.updatedAt = isoNow();

    return { ok: true };
  });
