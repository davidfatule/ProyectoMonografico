import { useQuery, useMutation } from "@tanstack/react-query";

export function useEvaluations() {
  return useQuery({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const res = await fetch("/api/evaluations");
      return res.json();
    },
  });
}

export function useCreateEvaluation() {
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
  });
}