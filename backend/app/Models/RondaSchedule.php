<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RondaSchedule extends Model
{
    protected $fillable = ['day_of_week', 'no_rt', 'warga_names'];
}
