# Summary Revisi Perubahan Integrasi Ticket dengan Central Pilargroup

## 1. Project: `pilargroup` / Central

### File: `.env`

**Sebelum**
```env
# belum ada internal secret untuk internal API
```

**Sesudah**
```env
INTERNAL_SYNC_SECRET=ISI_SECRET_YANG_SAMA_DENGAN_PROJECT_TICKET
```

---

### File baru: `app/Http/Middleware/VerifyInternalSyncSecret.php`

**Method / Function:** `handle(Request $request, Closure $next): Response`

**Sebelum**
```txt
File belum ada.
```

**Sesudah**
```php
public function handle(Request $request, Closure $next): Response
{
    $incomingSecret = $request->header('X-Internal-Secret');
    $validSecret = env('INTERNAL_SYNC_SECRET');

    if (!$incomingSecret || !$validSecret || !hash_equals((string) $validSecret, (string) $incomingSecret)) {
        return response()->json([
            'message' => 'Unauthorized internal request',
        ], 401);
    }

    return $next($request);
}
```

**Fungsi perubahan**
- Validasi request internal dari anak project.
- Header wajib: `X-Internal-Secret`.

---

### File: `bootstrap/app.php`

**Bagian:** `$middleware->alias([...])`

**Sebelum**
```php
$middleware->alias([
    'auth.central' => \App\Http\Middleware\AuthMiddleware::class,
    'it.only'      => \App\Http\Middleware\ITOnly::class,
]);
```

**Sesudah**
```php
$middleware->alias([
    'auth.central'  => \App\Http\Middleware\AuthMiddleware::class,
    'it.only'       => \App\Http\Middleware\ITOnly::class,
    'internal.sync' => \App\Http\Middleware\VerifyInternalSyncSecret::class,
]);
```

---

### File baru: `app/Http/Controllers/Internal/DirectoryController.php`

**Method / Function:** `users(Request $request)`

**Sebelum**
```txt
Method belum ada.
```

**Sesudah**
```php
public function users(Request $request)
{
    $department = $request->query('department');
    $departmentId = $request->query('department_id');
    $companyId = $request->query('company_id');
    $active = $request->query('active', 1);
    $search = $request->query('search');

    $query = DB::connection('pilargroup')
        ->table('central_users as cu')
        ->leftJoin('central_user_departments as cud', 'cud.user_id', '=', 'cu.id')
        ->leftJoin('master_departments as md', 'md.id', '=', 'cud.department_id')
        ->select([
            'cu.id',
            'cu.internal_id',
            'cu.username',
            'cu.email',
            'cu.phone',
            'cu.name',
            'cu.job_position',
            'cu.job_level_id',
            'cu.is_active',
            'md.id as department_id',
            'md.name as department_name',
            'md.class as department_class',
            'md.code as department_code',
            'md.company_id',
            'cud.is_primary',
        ]);

    if ($active !== null && $active !== 'all') {
        $query->where('cu.is_active', (int) $active);
    }

    if ($department) {
        $query->where(function ($q) use ($department) {
            $q->where('md.name', $department)
                ->orWhere('md.class', $department)
                ->orWhere('md.code', $department);
        });
    }

    if ($departmentId) {
        $query->where('md.id', (int) $departmentId);
    }

    if ($companyId) {
        $query->where('md.company_id', $companyId);
    }

    if ($search) {
        $query->where(function ($q) use ($search) {
            $q->where('cu.name', 'like', "%{$search}%")
                ->orWhere('cu.username', 'like', "%{$search}%")
                ->orWhere('cu.email', 'like', "%{$search}%");
        });
    }

    return response()->json([
        'message' => 'Users fetched successfully',
        'data' => $query->orderBy('cu.name')->get(),
    ]);
}
```

**Fungsi perubahan**
- Ambil user aktif dari central.
- Support filter `department`, `department_id`, `company_id`, dan `search`.
- Dipakai oleh ticket untuk dropdown `Support` dan `Requestor`.

---

**Method / Function:** `departments(Request $request)`

**Sebelum**
```txt
Method belum ada.
```

**Sesudah**
```php
public function departments(Request $request)
{
    $companyId = $request->query('company_id');
    $active = $request->query('active', 1);

    $query = DB::connection('pilargroup')
        ->table('master_departments')
        ->select([
            'id',
            'name',
            'class',
            'code',
            'company_id',
            'parent_id',
            'is_active',
        ]);

    if ($active !== null && $active !== 'all') {
        $query->where('is_active', (int) $active);
    }

    if ($companyId) {
        $query->where('company_id', $companyId);
    }

    return response()->json([
        'message' => 'Departments fetched successfully',
        'data' => $query->orderBy('name')->get(),
    ]);
}
```

---

### File: `routes/api.php` di project `pilargroup`

**Bagian:** route internal directory

**Sebelum**
```php
// belum ada route internal directory
```

**Sesudah**
```php
use App\Http\Controllers\Internal\DirectoryController;

Route::prefix('internal')
    ->middleware('internal.sync')
    ->group(function () {
        Route::get('/directory/users', [DirectoryController::class, 'users']);
        Route::get('/directory/departments', [DirectoryController::class, 'departments']);
    });
```

---

## 2. Project: `ticket` / Backend Laravel

### File: `.env`

**Sebelum**
```env
SSO_PILARGROUP_URL=https://pilargroup.id
INTERNAL_SYNC_SECRET=ISI_SECRET
```

**Sesudah**
```env
SSO_PILARGROUP_URL=https://pilargroup.id
INTERNAL_SYNC_SECRET=ISI_SECRET_YANG_SAMA_DENGAN_PROJECT_CENTRAL
```

---

### File: `app/Http/Controllers/Api/TicketController.php`

#### Import

**Sebelum**
```php
// belum ada import Http dan Log untuk consume central API
```

**Sesudah**
```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
```

---

#### Method / Function: `supports()`

**Sebelum**
```php
// support masih dari endpoint/user lokal atau belum consume central directory API
```

**Sesudah**
```php
public function supports()
{
    try {
        $centralUrl = rtrim(env('SSO_PILARGROUP_URL'), '/') . '/api/internal/directory/users';

        $response = Http::withHeaders([
            'X-Internal-Secret' => env('INTERNAL_SYNC_SECRET'),
            'Accept' => 'application/json',
        ])->timeout(15)->get($centralUrl, [
            'department_id' => 8,
            'active' => 1,
        ]);

        if (!$response->successful()) {
            Log::error('Failed to fetch supports from central server', [
                'url' => $centralUrl,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch supports from central server',
                'status' => $response->status(),
                'error' => $response->json() ?? $response->body(),
            ], $response->status());
        }

        return response()->json([
            'message' => 'Supports fetched successfully',
            'data' => $response->json('data') ?? [],
        ]);
    } catch (\Throwable $e) {
        Log::error('Support endpoint error', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'message' => 'Support endpoint error',
            'error' => $e->getMessage(),
        ], 500);
    }
}
```

**Fungsi perubahan**
- Ambil list support dari central project.
- Filter support pakai `department_id = 8`.
- Hanya user aktif: `active = 1`.

---

#### Method / Function: `directoryUsers()`

**Sebelum**
```php
// belum ada endpoint proxy untuk ambil semua user aktif central
```

**Sesudah**
```php
public function directoryUsers()
{
    try {
        $centralUrl = rtrim(env('SSO_PILARGROUP_URL'), '/') . '/api/internal/directory/users';

        $response = Http::withHeaders([
            'X-Internal-Secret' => env('INTERNAL_SYNC_SECRET'),
            'Accept' => 'application/json',
        ])->timeout(15)->get($centralUrl, [
            'active' => 1,
        ]);

        if (!$response->successful()) {
            Log::error('Failed to fetch directory users from central server', [
                'url' => $centralUrl,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return response()->json([
                'message' => 'Failed to fetch directory users from central server',
                'status' => $response->status(),
                'error' => $response->json() ?? $response->body(),
            ], $response->status());
        }

        return response()->json([
            'message' => 'Directory users fetched successfully',
            'data' => $response->json('data') ?? [],
        ]);
    } catch (\Throwable $e) {
        Log::error('Directory users endpoint error', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ]);

        return response()->json([
            'message' => 'Directory users endpoint error',
            'error' => $e->getMessage(),
        ], 500);
    }
}
```

**Fungsi perubahan**
- Ambil semua user aktif dari central.
- Dipakai untuk dropdown `Requestor`.

---

#### Method / Function: `buildTicketQuery()`

**Sebelum**
```php
private function buildTicketQuery(Request $request)
{
    $q = Tickets::query()
        ->select([
            'id',
            'ticket_code',
            'user_id',
            'support_id',
            'support_name',
            'category_id',
            'assets_id',
            'nama_pembuat',
            'problem',
            'status',
            'priority',
            'solution',
            'image',
            'notes',
            'request_date',
            'waiting_hour',
            'start_date',
            'end_date',
            'time_spent',
            'is_late',
            'created_at',
            'updated_at',
        ]);
}
```

**Sesudah**
```php
private function buildTicketQuery(Request $request)
{
    $q = Tickets::query()
        ->select([
            'id',
            'ticket_code',
            'user_id',
            'support_id',
            'support_name',
            'dept_id',
            'dept_name',
            'category_id',
            'assets_id',
            'nama_pembuat',
            'problem',
            'status',
            'priority',
            'solution',
            'image',
            'notes',
            'request_date',
            'waiting_hour',
            'start_date',
            'end_date',
            'time_spent',
            'is_late',
            'created_at',
            'updated_at',
        ]);
}
```

**Fungsi perubahan**
- Menampilkan `dept_id` dan `dept_name` saat list ticket diambil.
- Field department tidak hilang dari response ticket.

---

#### Method / Function: `store(Request $request)`

**Sebelum**
```php
// dept_id dan dept_name belum auto-fill dari auth user
```

**Sesudah**
```php
$data['dept_id'] = $request->auth_dept_id;
$data['dept_name'] = $request->auth_dept_name;
```

**Fungsi perubahan**
- `dept_id` dan `dept_name` auto-fill dari auth user login.
- User tidak perlu input department manual.

---

#### Method / Function: `storeByAdmin(Request $request)`

**Sebelum**
```php
if (empty($data['support_name']) && !empty($data['support_id'])) {
    $supportUser = \App\Models\User::find($data['support_id']);
    if ($supportUser) {
        $data['support_name'] = $supportUser->name;
    }
}
```

**Sesudah**
```php
if (empty($data['support_name']) && !empty($data['support_id'])) {
    $supportUser = $this->getCentralUserById($data['support_id']);

    if ($supportUser) {
        $data['support_name'] = $supportUser['name'] ?? null;
    }
}
```

---

#### Method / Function: `updateByAdmin(Request $request, $id)`

**Sebelum**
```php
if (empty($data['support_name']) && !empty($data['support_id'])) {
    $supportUser = \App\Models\User::find($data['support_id']);
    if ($supportUser) {
        $data['support_name'] = $supportUser->name;
    }
}
```

**Sesudah**
```php
if (empty($data['support_name']) && !empty($data['support_id'])) {
    $supportUser = $this->getCentralUserById($data['support_id']);

    if ($supportUser) {
        $data['support_name'] = $supportUser['name'] ?? null;
    }
}
```

---

#### Method / Function baru: `getCentralUserById(?string $userId): ?array`

**Sebelum**
```txt
Method belum ada.
```

**Sesudah**
```php
private function getCentralUserById(?string $userId): ?array
{
    if (!$userId) {
        return null;
    }

    $centralUrl = rtrim(env('SSO_PILARGROUP_URL'), '/') . '/api/internal/directory/users';

    $response = Http::withHeaders([
        'X-Internal-Secret' => env('INTERNAL_SYNC_SECRET'),
        'Accept' => 'application/json',
    ])->timeout(15)->get($centralUrl, [
        'active' => 1,
    ]);

    if (!$response->successful()) {
        return null;
    }

    $users = $response->json('data') ?? [];

    foreach ($users as $user) {
        if (($user['id'] ?? null) === $userId) {
            return $user;
        }
    }

    return null;
}
```

---

### File: `routes/api.php` di project `ticket`

**Sebelum**
```php
Route::get('/support', [UserController::class, 'supports']);
```

**Sesudah**
```php
Route::middleware('auth.jwt')->group(function () {
    Route::get('/support', [TicketController::class, 'supports']);
    Route::get('/directory/users', [TicketController::class, 'directoryUsers']);
});
```

**Fungsi perubahan**
- `/api/support` sekarang ambil support dari central.
- `/api/directory/users` dipakai untuk requestor dari central.
- Route `/support` lama ke `UserController` dihapus/comment supaya tidak bentrok.

---

### File: `app/Models/Tickets.php`

**Property:** `$fillable`

**Sebelum**
```php
protected $fillable = [
    'ticket_code',
    'user_id',
    'support_id',
    'support_name',
    // dept_id dan dept_name belum ada
];
```

**Sesudah**
```php
protected $fillable = [
    'ticket_code',
    'user_id',
    'support_id',
    'support_name',
    'dept_id',
    'dept_name',
    // field lain tetap
];
```

---

### File: `app/Http/Resources/TicketResource.php`

**Method / Function:** `toArray($request)`

**Sebelum**
```php
return [
    'id' => $this->id,
    'ticket_code' => $this->ticket_code,
    'user_id' => $this->user_id,
    'support_id' => $this->support_id,
    'support_name' => $this->support_name,
];
```

**Sesudah**
```php
return [
    'id' => $this->id,
    'ticket_code' => $this->ticket_code,
    'user_id' => $this->user_id,
    'support_id' => $this->support_id,
    'support_name' => $this->support_name,
    'dept_id' => $this->dept_id,
    'dept_name' => $this->dept_name,
];
```

---

### File: `app/Http/Resources/TicketCollection.php`

**Method / Function:** `toArray($request)`

**Sebelum**
```php
return [
    'id' => $ticket->id,
    'ticket_code' => $ticket->ticket_code,
    'user_id' => $ticket->user_id,
    'support_id' => $ticket->support_id,
    'support_name' => $ticket->support_name,
];
```

**Sesudah**
```php
return [
    'id' => $ticket->id,
    'ticket_code' => $ticket->ticket_code,
    'user_id' => $ticket->user_id,
    'support_id' => $ticket->support_id,
    'support_name' => $ticket->support_name,
    'dept_id' => $ticket->dept_id,
    'dept_name' => $ticket->dept_name,
];
```

---

## 3. Project: `ticket` / Frontend React

### File: `frontend/src/components/dialog/DialogExecutionTicket.jsx`

#### Function / Effect: `useEffect(..., [isOpen])` untuk fetch supports

**Sebelum**
```js
useEffect(() => {
  if (!isOpen) return

  async function fetchSupports() {
    setIsLoading(true)
    try {
      const response = await api.get('/user/supports')
      setSupports(response?.data ?? [])
    } catch (err) {
      console.error('Failed to fetch supports:', err)
    } finally {
      setIsLoading(false)
    }
  }

  fetchSupports()
}, [isOpen])
```

**Sesudah**
```js
useEffect(() => {
  if (!isOpen) return

  async function fetchSupports() {
    setIsLoading(true)
    try {
      const response = await api.get('/support')
      setSupports(response?.data ?? [])
    } catch (err) {
      console.error('Failed to fetch supports:', err)
      setSupports([])
    } finally {
      setIsLoading(false)
    }
  }

  fetchSupports()
}, [isOpen])
```

---

#### Function: `handleSubmit(event)`

**Sebelum**
```js
const payload = {
  status: formData.status.toLowerCase().replace(' ', '_'),
  support_id: formData.support_id,
  priority: formData.priority.toLowerCase(),
  start_date: formData.start_date,
}
```

**Sesudah**
```js
const selectedSupport = supports.find((support) => support.id === formData.support_id)

const payload = {
  status: formData.status.toLowerCase().replace(' ', '_'),
  support_id: formData.support_id,
  support_name: selectedSupport?.name || '',
  priority: formData.priority.toLowerCase(),
  start_date: formData.start_date,
}
```

---

### File: `frontend/src/components/dialog/DialogCreateTicketAdmin.jsx`

#### Function / Effect: fetch initial data

**Sebelum**
```js
const [catRes, userRes, supportRes] = await Promise.all([
  api.get('/user/category'),
  api.get('/user'),
  api.get('/support'),
])
```

**Sesudah**
```js
const [catRes, userRes, supportRes] = await Promise.all([
  api.get('/user/category'),
  api.get('/directory/users'),
  api.get('/support'),
])
```

---

### File: `frontend/src/components/dialog/DialogCreateProjects.jsx`

#### Function / Effect: fetch users

**Sebelum**
```js
const response = await api.get('/user')
```

**Sesudah**
```js
const response = await api.get('/directory/users')
```

---

## 4. Command setelah perubahan

### Project `pilargroup`
```bash
php artisan optimize:clear
php artisan config:cache
```

### Project `ticket` backend
```bash
php artisan optimize:clear
php artisan config:cache
```

### Project `ticket` frontend
```bash
npm run build
```

---

## 5. Testing

### Test central API untuk support IT
```bash
curl -i \
  -H "X-Internal-Secret: ISI_INTERNAL_SYNC_SECRET" \
  -H "Accept: application/json" \
  "https://pilargroup.id/api/internal/directory/users?department_id=8&active=1"
```

### Test central API untuk semua user aktif
```bash
curl -i \
  -H "X-Internal-Secret: ISI_INTERNAL_SYNC_SECRET" \
  -H "Accept: application/json" \
  "https://pilargroup.id/api/internal/directory/users?active=1"
```

### Test ticket API support
```bash
curl -i \
  -H "Authorization: Bearer TOKEN_LOGIN_TICKET" \
  -H "Accept: application/json" \
  "https://ticket.pilargroup.id/api/support"
```

### Test ticket API directory users
```bash
curl -i \
  -H "Authorization: Bearer TOKEN_LOGIN_TICKET" \
  -H "Accept: application/json" \
  "https://ticket.pilargroup.id/api/directory/users"
```
