<?php

namespace App\Http\Requests\Ticket;

use Illuminate\Foundation\Http\FormRequest;

class TicketUpdateByAdminRequest extends FormRequest
{
    public function authorize(): bool
    {
        return \App\Helpers\AuthHelper::isAdmin($this);
    }

    public function rules(): array
    {
        return [
            'support_id'   => 'sometimes|nullable|string|max:36',
            'support_name' => 'sometimes|nullable|string|max:255',
            'assets_id'    => 'sometimes|nullable|exists:assets,id',
            'status'       => 'sometimes|required|string|in:waiting,in_progress,resolved,void,hold',
            'priority'     => 'sometimes|nullable|string|in:low,medium,high',
            'start_date'   => 'sometimes|nullable|date',
            'end_date'     => 'sometimes|nullable|date',
            'time_spent'   => 'sometimes|nullable|integer|min:1',
            'solution'     => 'sometimes|nullable|string|max:1000',
            'notes'        => 'sometimes|nullable|string|max:1000',
            'reason'       => 'sometimes|nullable|string|max:1000',
            'description'  => 'sometimes|nullable|string|max:1000',
            'status_document' => 'sometimes|nullable|string|in:ready,unready',
            'progres_percent' => 'sometimes|nullable|integer|min:0|max:100',
        ];
    }
}