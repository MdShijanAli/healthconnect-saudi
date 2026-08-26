import { createServerFn } from "@tanstack/react-start";
import { requireMockAuth } from "@/lib/mock-auth";
import { completeRegistrationSchema, reviewDoctorSchema } from "@/lib/auth-schemas";
import { requireSuperAdmin } from "@/lib/require-admin";
import { isoNow, mockDb } from "@/lib/mock-db";

export const completeRegistration = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => completeRegistrationSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (mockDb.userRoles.some((r) => r.userId === context.userId)) {
      throw new Error("This account is already registered.");
    }

    mockDb.profiles.push({
      id: context.userId,
      fullName: data.fullName,
      phone: data.phone,
      createdAt: isoNow(),
      updatedAt: isoNow(),
    });
    mockDb.userRoles.push({ userId: context.userId, role: data.role });

    if (data.role === "patient") {
      mockDb.patientProfiles.push({
        userId: context.userId,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        profilePhotoPath: null,
        isBlocked: false,
        createdAt: isoNow(),
        updatedAt: isoNow(),
      });
    } else {
      mockDb.doctorProfiles.push({
        userId: context.userId,
        specialization: data.specialization,
        medicalLicenseNumber: data.medicalLicenseNumber,
        yearsExperience: data.yearsExperience,
        consultationFee: data.consultationFee,
        bio: data.bio,
        profilePhotoPath: data.profilePhotoPath,
        approvalStatus: "pending_approval",
        reviewedBy: null,
        reviewedAt: null,
        isActive: true,
        reviewNotes: null,
        createdAt: isoNow(),
        updatedAt: isoNow(),
      });
    }

    return { role: data.role };
  });

export const getPortalContext = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    const profile = mockDb.profiles.find((p) => p.id === context.userId);
    const role = mockDb.userRoles.find((r) => r.userId === context.userId);
    if (!profile || !role) throw new Error("Your account setup is incomplete.");

    const doctor = mockDb.doctorProfiles.find((d) => d.userId === context.userId);
    const patient = mockDb.patientProfiles.find((p) => p.userId === context.userId);

    return {
      userId: profile.id,
      fullName: profile.fullName,
      phone: profile.phone,
      role: role.role,
      doctorStatus: doctor?.approvalStatus ?? null,
      patientBlocked: patient?.isBlocked ?? false,
    };
  });

export const listPendingDoctors = createServerFn({ method: "GET" })
  .middleware([requireMockAuth])
  .handler(async ({ context }) => {
    requireSuperAdmin(context.userId);

    return mockDb.doctorProfiles
      .filter((d) => d.approvalStatus === "pending_approval")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((doctor) => {
        const profile = mockDb.profiles.find((p) => p.id === doctor.userId);
        return {
          user_id: doctor.userId,
          specialization: doctor.specialization,
          medical_license_number: doctor.medicalLicenseNumber,
          years_experience: doctor.yearsExperience,
          consultation_fee: doctor.consultationFee,
          bio: doctor.bio,
          profile_photo_path: doctor.profilePhotoPath,
          approval_status: doctor.approvalStatus,
          created_at: doctor.createdAt,
          profile: profile ? { id: profile.id, full_name: profile.fullName, phone: profile.phone } : null,
        };
      });
  });

export const reviewDoctor = createServerFn({ method: "POST" })
  .middleware([requireMockAuth])
  .inputValidator((input) => reviewDoctorSchema.parse(input))
  .handler(async ({ data, context }) => {
    requireSuperAdmin(context.userId);

    const doctor = mockDb.doctorProfiles.find(
      (d) => d.userId === data.doctorId && d.approvalStatus === "pending_approval",
    );
    if (!doctor) throw new Error("This application is no longer pending review.");

    doctor.approvalStatus = data.status;
    doctor.reviewNotes = data.reason ?? null;
    doctor.reviewedBy = context.userId;
    doctor.reviewedAt = isoNow();
    doctor.updatedAt = isoNow();

    return { ok: true };
  });
