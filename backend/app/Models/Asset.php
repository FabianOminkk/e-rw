<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Asset extends Model
{
    protected $fillable = ['name', 'quantity', 'description'];

    public function bookings(): HasMany
    {
        return $this->hasMany(AssetBooking::class);
    }
}
