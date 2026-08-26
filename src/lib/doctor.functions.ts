import { createServerFn } from "@tanstack/react-start";
import { requireMockAuth } from "@/lib/mock-auth";
import { requireApprovedDoctor } from "@/lib/require-doctor";
import { createNotification } from "@/lib/notifications";
import { genId, isoNow, mockDb, type PrescriptionItem } from "@/lib/mock-db";
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

function itemView(item: PrescriptionItem) {
  return {
    id: item.id,
    prescription_id: item.prescriptionId,
    medicine_name: item.medicineName,
    dosage: item.dosage,
    frequency: item.frequency,
    duration: item.duration,
    instructions: item.instructions,
  };
}

function prescriptionsWithItems(filters: { doctorId: string; patientId?: string; appointmentIds?: string[] }) {
  let prescriptions = mockDb.prescriptions.filter((p) => p.doctorId === filters.doctorId);
  if (filters.patientId) prescriptions = prescriptions.filter((p) => p.patientId === filters.patientId);
  if (filters.appointmentIds) {
    if (filters.appointmentIds.length === 0) return [];
    const ids = new Set(filters.appointmentIds);
    prescriptions = prescriptions.filter((p) => ids.has(p.appointmentId));
  }
  prescriptions = [...prescriptions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return prescriptions.map((p) => ({
    id: p.id,
    appointment_id: p.appointmentId,
    diagnosis_notes: p.diagnosisNotes,
    advice_notes: p.adviceNotes,
    created_at: p.createdAt,
    items: mockDb.prescriptionItems.filter((i) => i.prescriptionId === p.id).map(itemView),
  }));
}

export const getDoctorDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireApprovedDoctor(context.userId);

    const today = todayStr();
    const { weekStart, weekEnd } = weekRange();
    const appointments = mockDb.appointments.filter((a) => a.doctorId === context.userId);

    const todayAppointments = appointments.filter(
      (a) => (a.status === "pending" || a.status === "scheduled") && a.appointmentDate === today,
    );
    const pendingPrescriptions = appointments.filter(
      (a) => a.status === "scheduled" && a.appointmentDate <= today,
    ).length;
    const totalPatients = new Set(appointments.map((a) => a.patientId)).size;
    const thisWeekSchedule = appointments.filter(
      (a) =>
        (a.status === "pending" || a.status === "scheduled") &&
        a.appointmentDate >= weekStart &&
        a.appointmentDate <= weekEnd,
    ).length;

    return {
      todaysAppointments: todayAppointments.length,
      pendingPrescriptions,
      totalPatients,
      thisWeekSchedule,
      todayAppointmentsList: todayAppointments
        .sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime))
        .map((a) => ({
          id: a.id,
          patientId: a.patientId,
          patientName: mockDb.profiles.find((p) => p.id === a.patientId)?.fullName ?? "Unknown",
          time: a.appointmentTime,
          status: a.status,
          reason: a.reason,
        })),
    };
  });

export const getAvailability = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireApprovedDoctor(context.userId);

    const byDay = new Map(
      mockDb.doctorAvailability.filter((d) => d.doctorId === context.userId).map((d) => [d.dayOfWeek, d]),
    );
    const fullWeek = Array.from({ length: 7 }, (_, i) => {
      const existing = byDay.get(i);
      return {
        dayOfWeek: i,
        isEnabled: existing?.isEnabled ?? false,
        startTime: existing?.startTime ?? "09:00",
        endTime: existing?.endTime ?? "17:00",
      };
    });

    const unavailableDates = mockDb.doctorUnavailableDates
      .filter((d) => d.doctorId === context.userId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ id: d.id, date: d.date, reason: d.reason }));

    return { days: fullWeek, unavailableDates };
  });

export const saveAvailability = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => saveAvailabilitySchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);

    for (const d of data.days) {
      const existing = mockDb.doctorAvailability.find(
        (row) => row.doctorId === context.userId && row.dayOfWeek === d.dayOfWeek,
      );
      if (existing) {
        existing.isEnabled = d.isEnabled;
        existing.startTime = d.startTime;
        existing.endTime = d.endTime;
      } else {
        mockDb.doctorAvailability.push({
          id: genId(),
          doctorId: context.userId,
          dayOfWeek: d.dayOfWeek,
          isEnabled: d.isEnabled,
          startTime: d.startTime,
          endTime: d.endTime,
        });
      }
    }
    return { ok: true };
  });

export const addUnavailableDate = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => addUnavailableDateSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    mockDb.doctorUnavailableDates.push({
      id: genId(),
      doctorId: context.userId,
      date: data.date,
      reason: data.reason ?? null,
    });
    return { ok: true };
  });

export const removeUnavailableDate = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => removeUnavailableDateSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    mockDb.doctorUnavailableDates = mockDb.doctorUnavailableDates.filter(
      (d) => !(d.id === data.id && d.doctorId === context.userId),
    );
    return { ok: true };
  });

export const listDoctorAppointments = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireApprovedDoctor(context.userId);

    const appointments = mockDb.appointments
      .filter((a) => a.doctorId === context.userId)
      .sort(
        (a, b) =>
          b.appointmentDate.localeCompare(a.appointmentDate) ||
          b.appointmentTime.localeCompare(a.appointmentTime),
      );

    return appointments.map((a) => {
      const profile = mockDb.profiles.find((p) => p.id === a.patientId);
      return {
        id: a.id,
        patient_id: a.patientId,
        appointment_date: a.appointmentDate,
        appointment_time: a.appointmentTime,
        status: a.status,
        reason: a.reason,
        cancel_reason: a.cancelReason,
        fee: a.fee,
        patient: profile ? { id: profile.id, full_name: profile.fullName, phone: profile.phone } : null,
      };
    });
  });

export const acceptAppointment = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => acceptAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    const appt = mockDb.appointments.find(
      (a) => a.id === data.appointmentId && a.doctorId === context.userId && a.status === "pending",
    );
    if (appt) {
      appt.status = "scheduled";
      appt.updatedAt = isoNow();
      const doctorName = mockDb.profiles.find((p) => p.id === context.userId)?.fullName ?? "Your doctor";
      createNotification({
        userId: appt.patientId,
        type: "appointment_accepted",
        title: "Appointment confirmed",
        body: `${doctorName} confirmed your appointment on ${appt.appointmentDate} at ${appt.appointmentTime.slice(0, 5)}.`,
        relatedAppointmentId: data.appointmentId,
      });
    }
    return { ok: true };
  });

export const rescheduleAppointment = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => rescheduleAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    const appt = mockDb.appointments.find((a) => a.id === data.appointmentId && a.doctorId === context.userId);
    if (!appt) throw new Error("Appointment not found");
    appt.appointmentDate = data.date;
    appt.appointmentTime = data.time;
    appt.updatedAt = isoNow();
    return { ok: true };
  });

export const markAppointmentComplete = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => markAppointmentCompleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    const appt = mockDb.appointments.find((a) => a.id === data.appointmentId && a.doctorId === context.userId);
    if (!appt) throw new Error("Appointment not found");
    appt.status = "completed";
    appt.updatedAt = isoNow();
    return { ok: true };
  });

export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => cancelAppointmentSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    const appt = mockDb.appointments.find((a) => a.id === data.appointmentId && a.doctorId === context.userId);
    if (!appt) throw new Error("Appointment not found");
    appt.status = "cancelled";
    appt.cancelReason = data.reason;
    appt.updatedAt = isoNow();

    const doctorName = mockDb.profiles.find((p) => p.id === context.userId)?.fullName ?? "Your doctor";
    createNotification({
      userId: appt.patientId,
      type: "appointment_cancelled",
      title: "Appointment cancelled",
      body: `${doctorName} cancelled your appointment. Reason: ${data.reason}`,
      relatedAppointmentId: data.appointmentId,
    });

    return { ok: true };
  });

export const getPatientProfileForDoctor = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .inputValidator((input) => getPatientProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);

    const appointments = mockDb.appointments
      .filter((a) => a.doctorId === context.userId && a.patientId === data.patientId)
      .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));
    if (appointments.length === 0) throw new Error("This patient has no visit history with you.");

    const profile = mockDb.profiles.find((p) => p.id === data.patientId);
    const patientProfile = mockDb.patientProfiles.find((p) => p.userId === data.patientId);
    if (!profile || !patientProfile) throw new Error("Patient not found");

    return {
      profile: { full_name: profile.fullName, phone: profile.phone },
      patientProfile: { date_of_birth: patientProfile.dateOfBirth, gender: patientProfile.gender },
      appointments: appointments.map((a) => ({
        id: a.id,
        appointment_date: a.appointmentDate,
        appointment_time: a.appointmentTime,
        status: a.status,
        reason: a.reason,
        cancel_reason: a.cancelReason,
      })),
      prescriptions: prescriptionsWithItems({ doctorId: context.userId, patientId: data.patientId }),
    };
  });

export const getConsultationContext = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .inputValidator((input) => getConsultationContextSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);

    const appointment = mockDb.appointments.find(
      (a) => a.id === data.appointmentId && a.doctorId === context.userId,
    );
    if (!appointment) throw new Error("Appointment not found");

    const profile = mockDb.profiles.find((p) => p.id === appointment.patientId);
    const patientProfile = mockDb.patientProfiles.find((p) => p.userId === appointment.patientId);
    if (!profile || !patientProfile) throw new Error("Patient not found");

    const pastAppointments = mockDb.appointments
      .filter(
        (a) =>
          a.doctorId === context.userId && a.patientId === appointment.patientId && a.id !== data.appointmentId,
      )
      .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))
      .slice(0, 10);

    const prescriptions = prescriptionsWithItems({
      doctorId: context.userId,
      appointmentIds: pastAppointments.map((a) => a.id),
    });
    const prescriptionByAppointment = new Map(prescriptions.map((p) => [p.appointment_id, p]));

    const age = Math.floor(
      (Date.now() - new Date(patientProfile.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
    );

    return {
      appointment: {
        id: appointment.id,
        patient_id: appointment.patientId,
        appointment_date: appointment.appointmentDate,
        appointment_time: appointment.appointmentTime,
        status: appointment.status,
        reason: appointment.reason,
      },
      patient: {
        fullName: profile.fullName,
        phone: profile.phone,
        date_of_birth: patientProfile.dateOfBirth,
        gender: patientProfile.gender,
        age,
      },
      pastVisits: pastAppointments.map((a) => ({
        id: a.id,
        appointment_date: a.appointmentDate,
        appointment_time: a.appointmentTime,
        status: a.status,
        reason: a.reason,
        prescription: prescriptionByAppointment.get(a.id) ?? null,
      })),
    };
  });

export const completeConsultation = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => completeConsultationSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);

    const appointment = mockDb.appointments.find(
      (a) => a.id === data.appointmentId && a.doctorId === context.userId,
    );
    if (!appointment) throw new Error("Appointment not found");

    const prescriptionId = genId();
    mockDb.prescriptions.push({
      id: prescriptionId,
      appointmentId: data.appointmentId,
      doctorId: context.userId,
      patientId: appointment.patientId,
      diagnosisNotes: data.diagnosisNotes ?? null,
      adviceNotes: data.adviceNotes ?? null,
      createdAt: isoNow(),
    });

    for (const item of data.items) {
      mockDb.prescriptionItems.push({
        id: genId(),
        prescriptionId,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        dosage: item.dosage ?? null,
        frequency: item.frequency ?? null,
        duration: item.duration ?? null,
        instructions: item.instructions ?? null,
      });
    }

    appointment.status = "completed";
    appointment.updatedAt = isoNow();

    const doctorName = mockDb.profiles.find((p) => p.id === context.userId)?.fullName ?? "Your doctor";
    createNotification({
      userId: appointment.patientId,
      type: "prescription_ready",
      title: "Prescription ready",
      body: `${doctorName} completed your consultation and issued a prescription.`,
      relatedAppointmentId: data.appointmentId,
    });

    return { ok: true };
  });

export const listMedicines = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireApprovedDoctor(context.userId);
    return mockDb.doctorMedicines
      .filter((m) => m.doctorId === context.userId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((m) => ({ id: m.id, name: m.name, common_dosage: m.commonDosage, category: m.category }));
  });

export const createMedicine = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => createMedicineSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    if (
      mockDb.doctorMedicines.some(
        (m) => m.doctorId === context.userId && m.name.toLowerCase() === data.name.toLowerCase(),
      )
    ) {
      throw new Error("You already have a medicine with this name.");
    }
    const medicine = {
      id: genId(),
      doctorId: context.userId,
      name: data.name,
      commonDosage: data.commonDosage ?? null,
      category: data.category ?? null,
    };
    mockDb.doctorMedicines.push(medicine);
    return { id: medicine.id, name: medicine.name, common_dosage: medicine.commonDosage, category: medicine.category };
  });

export const updateMedicine = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => updateMedicineSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    const medicine = mockDb.doctorMedicines.find((m) => m.id === data.id && m.doctorId === context.userId);
    if (!medicine) throw new Error("Medicine not found");
    medicine.name = data.name;
    medicine.commonDosage = data.commonDosage ?? null;
    medicine.category = data.category ?? null;
    return { ok: true };
  });

export const deleteMedicine = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => deleteMedicineSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    mockDb.doctorMedicines = mockDb.doctorMedicines.filter(
      (m) => !(m.id === data.id && m.doctorId === context.userId),
    );
    return { ok: true };
  });

export const updateDoctorProfile = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => updateDoctorProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireApprovedDoctor(context.userId);
    const doctor = mockDb.doctorProfiles.find((d) => d.userId === context.userId);
    if (!doctor) throw new Error("Doctor profile not found");
    doctor.specialization = data.specialization;
    doctor.bio = data.bio;
    doctor.consultationFee = data.consultationFee;
    if (data.profilePhotoPath !== undefined) doctor.profilePhotoPath = data.profilePhotoPath;
    doctor.updatedAt = isoNow();
    return { ok: true };
  });

export const getMyDoctorProfile = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireApprovedDoctor(context.userId);
    const doctor = mockDb.doctorProfiles.find((d) => d.userId === context.userId);
    if (!doctor) throw new Error("Doctor profile not found");
    return {
      specialization: doctor.specialization,
      bio: doctor.bio,
      consultation_fee: doctor.consultationFee,
      profile_photo_path: doctor.profilePhotoPath,
      photoUrl: doctor.profilePhotoPath,
    };
  });
