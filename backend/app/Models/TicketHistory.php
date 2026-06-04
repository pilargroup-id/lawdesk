<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TicketHistory extends Model
{
    protected $table = 'ticket_histories';

    protected $fillable = [
        'ticket_id',
        'support_id',
        'support_name',
        'status',
        'progres_percent',
        'notes',
        'action_date',
    ];

    protected $casts = [
        'action_date'     => 'datetime',
        'progres_percent' => 'integer',
    ];

    public function ticket()
    {
        return $this->belongsTo(Tickets::class, 'ticket_id');
    }
}
