import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/")({
  component: AdminRedirect,
});

function AdminRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/dashboard", replace: true });
  }, [navigate]);
  return null;
}
