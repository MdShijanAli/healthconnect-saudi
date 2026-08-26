import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Specialization = {
  id: string;
  name: string;
  icon: string;
  description: string;
  display_order: number;
};

export function useSpecializations() {
  return useQuery({
    queryKey: ["specializations"],
    queryFn: async (): Promise<Specialization[]> => {
      const { data, error } = await supabase
        .from("specializations")
        .select("id, name, icon, description, display_order")
        .order("display_order", { ascending: true });
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 60_000,
  });
}
