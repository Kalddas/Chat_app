import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { useResetPasswordMutation } from "../../services/authService";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const [resetPassword, { isLoading }] = useResetPasswordMutation();

    // Check if token and email are present
    useEffect(() => {
        if (!token || !emailParam) {
            setError("Invalid or missing reset token. Please request a new password reset link.");
        }
    }, [token, emailParam]);

    // Calculate password strength
    useEffect(() => {
        if (password.length === 0) {
            setPasswordStrength(0);
            return;
        }

        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        setPasswordStrength(strength);
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!password || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            await resetPassword({
                email: emailParam,
                token,
                password,
                password_confirmation: confirmPassword,
            }).unwrap();
            setIsSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 2000);
        } catch (err) {
            setError(err?.data?.message || "Failed to reset password");
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:bg-background">
                <Card className="max-w-md w-full shadow-xl bg-white dark:bg-card">
                    <CardHeader className="text-center pb-6">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-2xl text-gray-900 dark:text-foreground">Password Reset Successfully!</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-muted-foreground mt-2">
                            Your password has been updated. You will be redirected to the login page shortly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" size="lg" onClick={() => navigate("/login")}>
                            Go to Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-background">
            <div className="w-full max-w-md">
                <Card className="shadow-xl bg-white dark:bg-card">
                    <CardHeader className="text-center pb-6">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-2xl text-gray-900 dark:text-foreground">Reset Your Password</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-muted-foreground">
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-foreground">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-11 dark:bg-input dark:text-foreground dark:border-border"
                                    placeholder="Enter your new password"
                                />
                                {password && (
                                    <div className="space-y-2">
                                        <div className="flex space-x-1">
                                            {[1, 2, 3, 4, 5].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-2 flex-1 rounded-full ${passwordStrength >= level
                                                            ? passwordStrength <= 2
                                                                ? "bg-red-500"
                                                                : passwordStrength <= 3
                                                                    ? "bg-yellow-500"
                                                                    : "bg-green-500"
                                                            : "bg-gray-200"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-muted-foreground">
                                            {passwordStrength <= 2 && "Weak"}
                                            {passwordStrength === 3 && "Medium"}
                                            {passwordStrength >= 4 && "Strong"}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 dark:text-foreground">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="h-11 dark:bg-input dark:text-foreground dark:border-border"
                                    placeholder="Confirm your new password"
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button type="submit" className="w-full h-11" disabled={isLoading || !token || !emailParam}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                        Resetting Password...
                                    </>
                                ) : (
                                    "Reset Password"
                                )}
                            </Button>

                            <div className="text-center">
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    Remember your password?{" "}
                                    <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium hover:underline">
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
