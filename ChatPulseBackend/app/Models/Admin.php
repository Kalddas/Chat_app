<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Admin extends Model
{
    use HasFactory;
    protected $fillable = ['user_id', 'permission_level'];

    public function user(){
        return $this->belongsTo(User::class);
    }

    public function handleReports(){
        return $this->hasMany(Report::class,'handled_by');
    }

    public function handleAppeals(){
        return $this->hasMany(Appeal::class,'handled_by');
    }


}
