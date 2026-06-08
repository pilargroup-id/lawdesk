<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\TokenExpiredException;
use Tymon\JWTAuth\Exceptions\TokenInvalidException;
use Tymon\JWTAuth\Exceptions\JWTException;

class JwtAuthMiddleware
/// 
{
    public function handle(Request $request, Closure $next)
    {
        \Log::info('JwtAuthMiddleware hit', ['url' => $request->fullUrl()]);

        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        try {
            $payload = JWTAuth::parseToken()->getPayload();

            $departmentId = (int) $payload->get('department_id');
            $departmentName = strtoupper(trim((string) $payload->get('department')));
            $role = strtolower(trim((string) $payload->get('role')));

            $adminDeptIds = [2, 8];
            $adminDeptNames = ['LEGAL', 'IT', 'INFORMATION TECHNOLOGY'];

            $isAdmin = in_array($departmentId, $adminDeptIds, true)
                || $role === 'admin'
                || in_array($departmentName, $adminDeptNames, true);

            $request->merge([
                'auth_user_id'    => $payload->get('sub'),
                'auth_username'   => $payload->get('username'),
                'auth_name'       => $payload->get('name'),
                'auth_is_admin'   => $isAdmin,
                'auth_role'       => $role,
                'auth_dept_id'    => $departmentId,
                'auth_dept_name'  => $payload->get('department'),
                'auth_company_id' => $payload->get('company_id'),
                'auth_company'    => $payload->get('company'),
                'auth_job'        => $payload->get('job_position'),
                'auth_apps'       => $payload->get('apps') ?? [],
            ]);

            \Log::info('JwtAuthMiddleware success', [
                'user_id'       => $payload->get('sub'),
                'username'      => $payload->get('username'),
                'department_id' => $departmentId,
                'department'    => $payload->get('department'),
                'role'          => $role,
                'is_admin'      => $isAdmin,
            ]);

            return $next($request);

        } catch (TokenExpiredException $e) {
            \Log::warning('JWT token expired');
            return response()->json(['message' => 'Token expired'], 401);
        } catch (TokenInvalidException $e) {
            \Log::warning('JWT token invalid');
            return response()->json(['message' => 'Token invalid'], 401);
        } catch (JWTException $e) {
            \Log::warning('JWT exception', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Unauthorized'], 401);
        } catch (\Exception $e) {
            \Log::error('Unexpected error in JwtAuthMiddleware', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Unauthorized'], 401);
        }
    }
}