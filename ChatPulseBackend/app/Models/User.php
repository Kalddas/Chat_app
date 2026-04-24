<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Support\Facades\Storage;


use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Notifications\PasswordResetNotification;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasApiTokens, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'email',
        'password',
        'temporary_password',
        'needs_password_change',
        'role',
        'last_login_at',
        'profile_picture',
        'mood',
        'mood_updated_at',
        'language',
        'read_receipts_enabled',
        'show_online_status',
        'last_seen_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'temporary_password',
        'remember_token',
        'profile_picture', // Hide raw path, use accessor
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['profile_picture_url'];

    /**
     * Get the user's profile picture URL.
     *
     * @return string|null
     */
    public function getProfilePictureUrlAttribute()
    {
        if (!$this->profile_picture) {
            return null;
        }

        $normalizedPath = str_replace('\\', '/', ltrim($this->profile_picture, '/'));
        return url(Storage::url($normalizedPath));
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
            'needs_password_change' => 'boolean',
            'mood_updated_at' => 'datetime',
            'read_receipts_enabled' => 'boolean',
            'show_online_status' => 'boolean',
            'last_seen_at' => 'datetime',
        ];
    }



    public function receivesBroadcastNotificationsOn(){
        return 'users.' . $this->id;
    }

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'conversation_users');
    }

    public function messages()
    {
        return $this->hasMany(Messages::class);
    }

    public function reactions()
    {
        return $this->hasMany(MessageReaction::class);
    }

    public function profile()
    {
        return $this->hasOne(UserProfile::class);
    }

    public function isAdmin(): bool
    {
        return $this->role == 'admin';
    }

    public function isUser(): bool
    {
        return $this->role == 'user';
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function buckets()
    {
        return $this->hasMany(LshBucket::class);
    }

    public function matches()
    {
        return Matches::where(function ($query) {
            $query->where('user1_id', $this->id)
                ->orWhere('user2_id', $this->id);
        });
    }

    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'user_tag')->withPivot('weight');
    }

    /**
     * Users that this user has blocked.
     */
    public function blockedUsers()
    {
        return $this->belongsToMany(User::class, 'user_blocks', 'blocker_id', 'blocked_user_id')
            ->withTimestamps();
    }

    /**
     * Users that have blocked this user.
     */
    public function blockedByUsers()
    {
        return $this->belongsToMany(User::class, 'user_blocks', 'blocked_user_id', 'blocker_id')
            ->withTimestamps();
    }



    public function admin()
    {
        return $this->hasOne(Admin::class);
    }

    public function reportedUsers()
    {
        return $this->hasMany(Report::class, 'reported_user_id');
    }

    public function filedReports()
    {
        return $this->hasMany(Report::class, 'reporter_user_id');
    }


    public function appeals()
    {
        return $this->hasMany(Appeal::class, 'user_id');
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $frontend = env('FRONTEND_URL', 'http://localhost:3000');
        $resetUrl = rtrim($frontend, '/') . "/reset-password?token={$token}&email={$this->email}";

        $this->notify(new PasswordResetNotification($token, $resetUrl));
    }

    /**
     * Check if user is currently online (active in last 5 minutes).
     *
     * @return bool
     */
    public function isOnline(): bool
    {
        // If user has disabled online status visibility, they are not "online"
        if (!$this->show_online_status) {
            return false;
        }

        // If no last_seen_at, user is not online
        if (!$this->last_seen_at) {
            return false;
        }

        // User is online if last seen within 5 minutes
        return $this->last_seen_at->diffInMinutes(now()) < 5;
    }

    /**
     * Get the online status text for display.
     *
     * @return string
     */
    public function getOnlineStatusText(): string
    {
        // If user has hidden their online status
        if (!$this->show_online_status) {
            return 'Hidden';
        }

        // If no last_seen_at
        if (!$this->last_seen_at) {
            return 'Offline';
        }

        // If online (active in last 5 minutes)
        if ($this->isOnline()) {
            return 'Online';
        }

        // Return relative time
        return 'Last seen ' . $this->last_seen_at->diffForHumans();
    }
}


//postgresql://random_chat_db_user:bRyHdRUb72qSJK82S5q7j0LBFWvW2sKr@dpg-d2rjhrvfte5s738bmhc0-a/random_chat_db
