// File: src/pages/Login.jsx
import { useState, useEffect, Suspense } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Eye, EyeOff, Loader2, Sparkles, MessageSquareText, Send } from "lucide-react";
import { useLoginMutation } from "../../services/authService";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "react-toastify";
import ChangePasswordDialog from "../../components/ChangePasswordDialog";
import SuspendedAccountDialog from "../../components/SuspendedAccountDialog";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showSuspendedDialog, setShowSuspendedDialog] = useState(false);
  const [suspendedToken, setSuspendedToken] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loginMutation, { isLoading, data, error: loginError, isSuccess }] = useLoginMutation();

  const { login, user } = useAuth();

  const localUser = localStorage.getItem("user");
  const parsedUser = localUser ? JSON.parse(localUser) : null;
  // console.log("Local User:", parsedUser);


  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  useEffect(() => {
    if (isSuccess && data) {
      login(data);

      // Check if account is suspended - show dialog instead of redirecting
      if (data.account_suspended || data.status === 'Suspended' || data.user?.profile?.status === 'Suspended') {
        setSuspendedToken(data.token);
        setShowSuspendedDialog(true);
        toast.warn('Your account has been suspended. Please send a message for help.', {
          autoClose: 4000,
          position: "top-right",
        });
        return;
      }

      toast.success(`Welcome back!`);

      // Check if user needs to change password
      if (data.needs_password_change) {
        setShowChangePasswordDialog(true);
      } else {
        const from = location.state?.from?.pathname || (data.user.role === "admin" ? "/admin" : "/chat");
        navigate(from, { replace: true });
      }
    }
  }, [isSuccess, data, login, navigate, location]);

  const handlePasswordChanged = () => {
    toast.success("Password changed successfully!");
    setShowChangePasswordDialog(false);
    const from = location.state?.from?.pathname || (user?.role === "admin" ? "/admin" : "/chat");
    navigate(from, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const result = await loginMutation({ email, password }).unwrap();
      
      // Check if suspended user - the message will be shown in useEffect
      if (result.account_suspended || result.status === 'Suspended') {
        // Don't show success toast, useEffect will show warning
        return;
      }
      
      // Normal login success - toast will be shown in useEffect
    } catch (err) {
      const msg = err?.data?.message;
      if (msg === "suth.failed" || msg === "auth.failed") {
        setError("Invalid email or password");
        toast.error("Invalid email or password");
      } else if (msg === "Email not Verified" || msg === "Email not verified") {
        setError("Please verify your email before logging in");
        toast.error("Please verify your email before logging in");
      } else if (msg && msg.includes("banned")) {
        setError("Your account has been banned and cannot be accessed");
        toast.error("Your account has been banned and cannot be accessed");
      } else if (msg === "Account is not active") {
        setError("Your account is not active. Please contact admin.");
        toast.error("Your account is not active. Please contact admin.");
      } else {
        setError(msg || "Login failed");
        toast.error(msg || "Login failed");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 dark:bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-card p-6 rounded-2xl shadow-lg">
        <div className="text-center ">
          <div className="flex items-center justify-center gap-2">
            <div className="relative">
              {/* <MessageCircle /> */}
              <div className="relative">
                <MessageCircle className="h-8 w-8 text-indigo-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full"></div>
              </div>
              {/* <Sparkles className="h-4 w-4 text-indigo-950 absolute -top-1 -right-1" /> */}
            </div>
            <h1 className="text-3xl font-bold text-gradient">
              Live Flow
            </h1>
          </div>
          {/* <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
          <p className="text-muted-foreground mt-2">Sign in to your account to continue</p>
     */}   </div>

        <Card className=" border-0 rounded-2xl overflow-hidden shadow-none">
          {/* <div className="bg-gradient-indigo-purple h-2 w-full"></div> */}
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-card-foreground">Sign In</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="rounded-lg py-5 border-border focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-card-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="rounded-lg py-5 border-border focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              {(error || loginError) && (
                <Alert variant="destructive" className="rounded-lg">
                  <AlertDescription>{error || loginError?.data?.message || "Login failed"}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full py-5 rounded-lg bg-gradient-indigo-purple hover:bg-gradient-indigo-purple-dark text-[#3b82f6] font-medium dark:text-[#3b82f6] shadow-md hover:shadow-lg transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-4 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
              >
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
        onPasswordChanged={handlePasswordChanged}
      />

      <SuspendedAccountDialog
        open={showSuspendedDialog}
        onOpenChange={setShowSuspendedDialog}
        token={suspendedToken}
      />
    </div>
  );

}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}