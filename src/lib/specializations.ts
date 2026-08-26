import { createServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { mockDb } from "@/lib/mock-db";

export type Specialization = {
  id: string;
  name: string;
  icon: string;
  description: string;
  display_order: number;
};

export const listSpecializations = createServerFn({ method: "GET" }).handler(
  async (): Promise<Specialization[]> => {
    return [...mockDb.specializations]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        description: s.description,
        display_order: s.displayOrder,
      }));
  },
);

export function useSpecializations() {
  const fetchSpecializations = useServerFn(listSpecializations);
  return useQuery({
    queryKey: ["specializations"],
    queryFn: () => fetchSpecializations(),
    staleTime: 60_000,
  });
}
