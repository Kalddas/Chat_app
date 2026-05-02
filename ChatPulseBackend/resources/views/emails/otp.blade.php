<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification OTP</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%);
        }
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%);
            padding: 40px 20px;
            text-align: center;
        }
        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 10px;
        }
        .logo-icon {
            width: 48px;
            height: 48px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .logo-icon::before {
            content: "💬";
            font-size: 28px;
        }
        .logo-icon::after {
            content: "";
            position: absolute;
            top: -4px;
            right: -4px;
            width: 12px;
            height: 12px;
            background: #6366F1;
            border-radius: 50%;
            border: 2px solid white;
        }
        .logo-text {
            font-size: 32px;
            font-weight: bold;
            color: white;
        }
        .header-subtitle {
            color: rgba(255, 255, 255, 0.9);
            font-size: 16px;
            margin-top: 8px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 20px;
        }
        .message {
            font-size: 16px;
            color: #6B7280;
            line-height: 1.6;
            margin-bottom: 30px;
        }
        .otp-container {
            background: linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%);
            border-left: 4px solid #6366F1;
            padding: 24px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
        }
        .otp-label {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #6366F1;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .validity {
            font-size: 14px;
            color: #9CA3AF;
            margin-top: 12px;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #6366F1 0%, #A855F7 100%);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s;
        }
        .button:hover {
            transform: translateY(-2px);
        }
        .footer {
            background: #F9FAFB;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #E5E7EB;
        }
        .footer-text {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 10px;
        }
        .footer-link {
            color: #6366F1;
            text-decoration: none;
        }
        .divider {
            height: 1px;
            background: #E5E7EB;
            margin: 30px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">
                <div class="logo-icon"></div>
                <div class="logo-text">Live Flow</div>
            </div>
            <div class="header-subtitle">Build Meaningful Connections</div>
        </div>
        
        <div class="content">
            <div class="greeting">Email Verification</div>
            
            <div class="message">
                Hello,<br><br>
                Thank you for registering with Live Flow! To complete your registration and verify your email address, please use the One-Time Password (OTP) below:
            </div>
            
            <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">{{ $otp }}</div>
                <div class="validity">⏱ Valid for 10 minutes</div>
            </div>
            
            <div class="message">
                Please enter this code in the verification form to confirm your email address and activate your account.
            </div>
            
            <div class="divider"></div>
            
            <div class="message" style="font-size: 14px; color: #9CA3AF;">
                <strong>Security Note:</strong> If you did not request this verification code, please ignore this email. Your account will remain secure.
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                © 2024 Live Flow. All rights reserved.
            </div>
            <div class="footer-text">
                <a href="{{ config('app.url') }}" class="footer-link">Visit Our Website</a>
            </div>
        </div>
    </div>
</body>
</html>
