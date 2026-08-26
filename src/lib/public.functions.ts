import { createServerFn } from "@tanstack/react-start";

export const listPublicDoctors = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("list_public_doctors");
  if (error) throw new Error(error.message);

  return Promise.all(
    data.map(async (doctor) => {
      if (!doctor.profile_photo_path) return { ...doctor, photoUrl: null };
      const { data: signed } = await supabaseAdmin.storage
        .from("profile-photos")
        .createSignedUrl(doctor.profile_photo_path, 3600);
      return { ...doctor, photoUrl: signed?.signedUrl ?? null };
    }),
  );
});
