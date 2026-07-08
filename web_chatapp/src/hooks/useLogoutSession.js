import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLogoutMutation } from "@/services/authService";

export function useLogoutSession() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logoutApi, { isLoading }] = useLogoutMutation();

  const performLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch (error) {
      console.error("Logout API failed:", error);
    } finally {
      await logout();
      navigate("/login", { replace: true });
    }
  };

  return { performLogout, isLoggingOut: isLoading };
}
