import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Loader2, MessageCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useForgotPasswordMutation } from "../../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const navigate = useNavigate();

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      const response = await forgotPassword(email).unwrap();
      setTemporaryPassword(response?.data?.temporary_password || "");
      setIsSuccess(true);
    } catch (err) {
      // RTK Query error structure: err.data contains the response body
      const errorData = err?.data || {};
      const errorMessage = errorData?.message 
        || errorData?.error 
        || err?.message 
        || (errorData?.errors && typeof errorData.errors === 'object' && errorData.errors.email?.[0])
        || "Failed to send reset link. Please try again or contact support.";
      
      console.error('Forgot password error:', err);
      setError(errorMessage);
    }
  };

  if (isSuccess) {

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-background">
        <Card className="max-w-md w-full shadow-xl bg-white dark:bg-card">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Temporary Password Generated</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Your temporary password has been generated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                <strong>Check your email!</strong> The temporary password has been sent to your email address.
              </AlertDescription>
            </Alert>
            
            {temporaryPassword && (
              <>
                <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800">
                    <strong>Email sending failed.</strong> Use this temporary password below to login.
                  </AlertDescription>
                </Alert>
                
                <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-300">
                  <Label className="text-sm text-gray-600">Your Temporary Password:</Label>
                  <div className="mt-2 flex items-center justify-between bg-white dark:bg-card px-3 py-2 rounded border border-gray-300 dark:border-border">
                    <code className="text-lg font-mono font-semibold text-gray-900 select-all">{temporaryPassword}</code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(temporaryPassword);
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            <div className="text-center text-sm text-gray-500">
              <p>{temporaryPassword ? 'Use this password to login' : 'Check your email for the temporary password to login'}</p>
            </div>
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
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-gray-900">Forgot Password?</CardTitle>
            <CardDescription className="text-gray-600">
              No worries! Enter your email and we'll send you a reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Remember your password?{" "}
                  <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium hover:underline">
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
