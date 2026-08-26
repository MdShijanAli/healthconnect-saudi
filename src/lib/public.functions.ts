import { createServerFn } from "@tanstack/react-start";
import { mockDb } from "@/lib/mock-db";

export function listPublicDoctorsData() {
  return mockDb.doctorProfiles
    .filter((d) => d.approvalStatus === "approved" && d.isActive)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((doctor) => {
      const profile = mockDb.profiles.find((p) => p.id === doctor.userId);
      return {
        user_id: doctor.userId,
        full_name: profile?.fullName ?? "Unknown",
        specialization: doctor.specialization,
        years_experience: doctor.yearsExperience,
        consultation_fee: doctor.consultationFee,
        bio: doctor.bio,
        profile_photo_path: doctor.profilePhotoPath,
        photoUrl: doctor.profilePhotoPath,
      };
    });
}

export const listPublicDoctors = createServerFn({ method: "GET" }).handler(async () =>
  listPublicDoctorsData(),
);
