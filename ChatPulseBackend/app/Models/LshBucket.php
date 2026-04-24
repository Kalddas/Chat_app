<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LshBucket extends Model
{
    use HasFactory;
    protected $fillable = ['bucket_key', 'user_id'];
}
