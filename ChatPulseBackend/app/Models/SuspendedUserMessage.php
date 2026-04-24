<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuspendedUserMessage extends Model
{
    protected $fillable = [
        'user_id',
        'message',
        'is_read',
        'read_by',
        'read_at',
        'admin_response',
        'responded_by',
        'responded_at',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'responded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reader()
    {
        return $this->belongsTo(User::class, 'read_by');
    }

    public function responder()
    {
        return $this->belongsTo(User::class, 'responded_by');
    }
}

