import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPortalContext } from "@/lib/auth.functions";
import type { PortalContext } from "@/lib/auth-schemas";

export function usePortalContext() {
  const fetchPortal = useServerFn(getPortalContext);
  return useQuery({
    queryKey: ["portal-context"],
    queryFn: () => fetchPortal() as Promise<PortalContext>,
    staleTime: 30_000,
  });
}
