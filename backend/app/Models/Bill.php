<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bill extends Model
{
    protected $fillable = ['user_id', 'month', 'amount', 'status', 'payment_date'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
