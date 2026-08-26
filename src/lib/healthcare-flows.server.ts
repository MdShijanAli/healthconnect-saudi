import type { DoctorRegistrationInput, PatientBookingInput } from "./healthcare-flow-schemas";

export async function saveDoctorRegistration(input: DoctorRegistrationInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("doctor_registrations")
    .insert({
      full_name: input.fullName,
      email: input.email,
      phone: input.phone,
      specialty: input.specialty,
      license_number: input.licenseNumber,
      years_experience: input.yearsExperience,
      clinic_name: input.clinicName || null,
      city: input.city,
      consultation_type: input.consultationType,
    })
    .select("id")
    .single();

  if (error) throw new Error("Unable to save provider application");
  return { reference: data.id.slice(0, 8).toUpperCase() };
}

export async function savePatientBooking(input: PatientBookingInput) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("patient_bookings")
    .insert({
      patient_name: input.patientName,
      email: input.email,
      phone: input.phone,
      specialty: input.specialty,
      doctor_preference: input.doctorPreference || null,
      appointment_date: input.appointmentDate,
      appointment_time: input.appointmentTime,
      visit_type: input.visitType,
      reason: input.reason,
    })
    .select("id")
    .single();

  if (error) throw new Error("Unable to save appointment request");
  return { reference: data.id.slice(0, 8).toUpperCase() };
}