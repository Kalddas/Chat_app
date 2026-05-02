<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Temporary Password</title>
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
            margin-bottom: 20px;
        }
        .password-container {
            background: linear-gradient(135deg, #EEF2FF 0%, #F3E8FF 100%);
            border-left: 4px solid #6366F1;
            padding: 24px;
            border-radius: 8px;
            margin: 30px 0;
            text-align: center;
        }
        .password-label {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .password-code {
            font-size: 28px;
            font-weight: bold;
            color: #6366F1;
            letter-spacing: 4px;
            font-family: 'Courier New', monospace;
            word-break: break-all;
        }
        .alert-box {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .alert-title {
            font-weight: 600;
            color: #92400E;
            margin-bottom: 8px;
        }
        .alert-text {
            font-size: 14px;
            color: #78350F;
        }
        .steps {
            background: #F9FAFB;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .steps-title {
            font-weight: 600;
            color: #1F2937;
            margin-bottom: 12px;
        }
        .steps ol {
            margin: 0;
            padding-left: 20px;
            color: #6B7280;
        }
        .steps li {
            margin-bottom: 8px;
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
            <div class="greeting">🔒 Password Reset Request</div>
            
            <div class="message">
                Hello,<br><br>
                We received a request to reset your password. Your temporary password has been generated:
            </div>
            
            <div class="password-container">
                <div class="password-label">Temporary Password</div>
                <div class="password-code">{{ $temporaryPassword }}</div>
            </div>
            
            <div class="alert-box">
                <div class="alert-title">⚠️ Important Security Notice</div>
                <div class="alert-text">
                    Use this temporary password to login. You will be prompted to change your password immediately after login for security purposes.
                </div>
            </div>
            
            <div class="steps">
                <div class="steps-title">Next Steps:</div>
                <ol>
                    <li>Copy the temporary password above</li>
                    <li>Click the button below to go to the login page</li>
                    <li>Enter your email and the temporary password</li>
                    <li>Set your new secure password when prompted</li>
                </ol>
            </div>
            
            <div style="text-align: center;">
                <a href="{{ $loginUrl }}" class="button">Go to Login Page</a>
            </div>
            
            <div class="divider"></div>
            
            <div class="message" style="font-size: 14px; color: #9CA3AF;">
                <strong>Security Notes:</strong><br>
                • This temporary password will only work once<br>
                • After you change your password, this temporary password becomes invalid<br>
                • This temporary password expires in 24 hours<br>
                • If you did not request this, please ignore this email or contact support
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

