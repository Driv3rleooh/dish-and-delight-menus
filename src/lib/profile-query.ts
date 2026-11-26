import { queryOptions } from "@tanstack/react-query";
import { getProfile } from "@/lib/profile.functions";

export const profileQuery = queryOptions({ queryKey: ["my-profile"], queryFn: () => getProfile(), staleTime: 30_000 });