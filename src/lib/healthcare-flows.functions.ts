import { createServerFn } from "@tanstack/react-start";

import {
  doctorRegistrationSchema,
  patientBookingSchema,
} from "./healthcare-flow-schemas";
import { saveDoctorRegistration, savePatientBooking } from "./healthcare-flows.server";

export const submitDoctorRegistration = createServerFn({ method: "POST" })
  .inputValidator((data) => doctorRegistrationSchema.parse(data))
  .handler(async ({ data }) => saveDoctorRegistration(data));

export const submitPatientBooking = createServerFn({ method: "POST" })
  .inputValidator((data) => patientBookingSchema.parse(data))
  .handler(async ({ data }) => savePatientBooking(data));