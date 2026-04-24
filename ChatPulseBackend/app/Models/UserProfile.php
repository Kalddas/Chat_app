<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;

class UserProfile extends Model
{
    use HasFactory,Notifiable;

    protected $fillable =[
        'first_name',
        'last_name',
        'user_name',
        'phone',
        'bio',
        'profile_image',
        'status',
        'suspended_until',
        'reports_reset_at',
    ];

    protected $casts = [
        'suspended_until' => 'datetime',
        'reports_reset_at' => 'datetime',
    ];

    public function user(){
        return $this->belongsTo(User::class);
    }

}
