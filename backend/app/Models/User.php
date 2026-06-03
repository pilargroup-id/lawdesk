<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasApiTokens;

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [
            'sub' => $this->id,
            'username' => $this->username,
            'name' => $this->name,
            'department_id' => $this->department_id,
            'department' => $this->department ? $this->department->name : null,
            'company_id' => 1,
            'company' => 'PilarGroup',
            'job_position' => $this->job_position,
            'apps' => [],
        ];
    }

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'name',
        'username',
        'department_id',
        'email',
        'phone',
        'role',
        'job_position',
        'password',
        'status',
        'remember_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function department()
    {
        return $this->belongsTo(Departments::class);
    }
}
