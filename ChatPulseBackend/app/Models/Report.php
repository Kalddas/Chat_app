<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Testing\Fluent\Concerns\Has;

class Report extends Model
{
    use HasFactory;
    protected $fillable=[
        'type', 'reason', 'status', 'reported_user_id',
        'reporter_user_id', 'handled_by', 'resolved_at',
        'title', 'message', 'image'
    ];


    protected $casts =[
        'resolved_at' => 'datetime'
    ];

    public function reportedUser(){
        return $this->belongsTo(User::class,'reported_user_id');
    }

    public function reporter(){
        return $this->belongsTo(User::class, 'reporter_user_id');
    }

    public function handleBy(){
        return $this->belongsTo(Admin::class,'handled_by');
    }




}
