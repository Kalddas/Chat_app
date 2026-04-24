@component('mail::message')
#Email Verification OTP

Hello,

Your One-Time Password (OTP) for email verification is:

@component('mail::panel')
{{$otp}}
@endcomponent

This OTP is valid for 10 minutes. Please enter it in the verification form to confirm your email address.

If you did not request this. please ignore this email.

Thank you,

{{config('app.name')}}
@component('mail::button' , ['url' => config('app.url')])
Visit Our Website
@endcomponent
@endcomponent
