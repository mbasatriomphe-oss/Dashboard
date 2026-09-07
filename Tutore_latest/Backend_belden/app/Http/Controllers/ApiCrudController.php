<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use App\Notifications\CrudActionNotification;

abstract class ApiCrudController extends Controller
{
    protected string $modelClass;
    protected int $defaultPerPage = 15;
    protected int $maxPerPage = 100;
    protected string $defaultSort = 'id';
    protected string $defaultSortDirection = 'desc';
    protected array $searchable = [];

    public function index(Request $request): JsonResponse
    {
        $query = $this->indexQuery($request);
        $search = trim((string) $request->query('search', ''));

        if ($search !== '') {
            $this->applySearch($query, $search);
        }

        $sortBy = (string) $request->query('sort_by', $this->defaultSort);
        $sortDirection = strtolower((string) $request->query('sort_direction', $this->defaultSortDirection)) === 'asc'
            ? 'asc'
            : 'desc';

        if ($this->isSortable($sortBy)) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderByDesc($this->defaultSort);
        }

        $perPage = $this->resolvePerPage($request);

        if ($perPage === null) {
            $items = $query->get();

            return response()->json([
                'status' => 'success',
                'data' => $items,
                'meta' => [
                    'total' => $items->count(),
                ],
            ]);
        }

        $paginated = $query->paginate($perPage)->appends($request->query());

        return response()->json([
            'status' => 'success',
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    public function all(Request $request): JsonResponse
    {
        $query = $this->indexQuery($request);
        $search = trim((string) $request->query('search', ''));

        if ($search !== '') {
            $this->applySearch($query, $search);
        }

        $sortBy = (string) $request->query('sort_by', $this->defaultSort);
        $sortDirection = strtolower((string) $request->query('sort_direction', $this->defaultSortDirection)) === 'asc'
            ? 'asc'
            : 'desc';

        if ($this->isSortable($sortBy)) {
            $query->orderBy($sortBy, $sortDirection);
        } else {
            $query->orderByDesc($this->defaultSort);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get(),
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $model = ($this->modelClass)::findOrFail($id);

        return response()->json([
            'status' => 'success',
            'data' => $model,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate($this->storeRules());
        $model = ($this->modelClass)::create($this->prepareStoreData($validated, $request));

        $this->notifyCrudAction($request, 'created', $model, 'Création réussie');

        return response()->json([
            'status' => 'success',
            'data' => $model,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        /** @var Model $model */
        $model = ($this->modelClass)::findOrFail($id);
        $validated = $request->validate($this->updateRules($model));
        $model->update($this->prepareUpdateData($validated, $model, $request));

        $this->notifyCrudAction($request, 'updated', $model->fresh(), 'Modification réussie');

        return response()->json([
            'status' => 'success',
            'data' => $model->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $model = ($this->modelClass)::findOrFail($id);
        $modelSnapshot = $model->replicate();
        $model->delete();

        $this->notifyCrudAction(request(), 'deleted', $modelSnapshot, 'Suppression réussie');

        return response()->json([
            'status' => 'success',
            'message' => 'Suppression effectuee',
        ]);
    }

    protected function indexQuery(Request $request): Builder
    {
        return ($this->modelClass)::query();
    }

    protected function prepareStoreData(array $validated, Request $request): array
    {
        return $validated;
    }

    protected function prepareUpdateData(array $validated, Model $model, Request $request): array
    {
        return $validated;
    }

    protected function searchableFields(): array
    {
        if ($this->searchable !== []) {
            return $this->searchable;
        }

        if (! class_exists($this->modelClass)) {
            return [];
        }

        $model = new $this->modelClass();

        return array_values(array_filter($model->getFillable(), static function (string $field): bool {
            return $field !== 'password';
        }));
    }

    protected function applySearch(Builder $query, string $search): void
    {
        $fields = $this->searchableFields();

        if ($fields === []) {
            return;
        }

        $query->where(function (Builder $builder) use ($fields, $search): void {
            foreach ($fields as $field) {
                $builder->orWhere($field, 'like', '%' . $search . '%');
            }
        });
    }

    protected function resolvePerPage(Request $request): ?int
    {
        $perPage = $request->query('per_page', $this->defaultPerPage);

        if (is_string($perPage) && strtolower($perPage) === 'all') {
            return null;
        }

        $perPage = (int) $perPage;

        if ($perPage <= 0) {
            return $this->defaultPerPage;
        }

        return min($perPage, $this->maxPerPage);
    }

    protected function isSortable(string $sortBy): bool
    {
        $allowed = array_merge([$this->defaultSort, 'created_at', 'updated_at'], $this->searchableFields());

        return in_array($sortBy, $allowed, true);
    }

    protected function generateUniqueCode(string $table, string $column = 'code', string $prefix = 'REF'): string
    {
        do {
            $code = strtoupper($prefix . '-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(4)));
        } while (DB::table($table)->where($column, $code)->exists());

        return $code;
    }

    protected function notifyCrudAction(Request $request, string $action, Model $model, string $title): void
    {
        $recipients = $this->notificationRecipients($request);

        if ($recipients->isEmpty()) {
            return;
        }

        $entityLabel = Str::headline(class_basename($this->modelClass));
        $entityName = $this->resolveNotificationEntityName($model);
        $actor = $request->user();

        Notification::send($recipients, new CrudActionNotification([
            'type' => 'crud_' . $action,
            'title' => $title,
            'message' => sprintf('%s de %s%s', $title, $entityLabel, $entityName ? ' : ' . $entityName : ''),
            'action' => $action,
            'entity' => $entityLabel,
            'entity_id' => $model->getKey(),
            'entity_name' => $entityName,
            'actor_id' => $actor?->getKey(),
            'actor_name' => $this->resolveActorName($actor),
        ]));
    }

    protected function notificationRecipients(Request $request)
    {
        $recipients = collect();
        $actor = $request->user();

        $admins = class_exists(\App\Models\User::class)
            ? \App\Models\User::query()->where('role', 'admin')->get()
            : collect();

        $recipients = $recipients->merge($admins);

        if ($actor && method_exists($actor, 'notify')) {
            $recipients->push($actor);
        }

        return $recipients->filter()->unique(function ($recipient): string {
            return get_class($recipient) . ':' . (string) $recipient->getKey();
        })->values();
    }

    protected function resolveNotificationEntityName(Model $model): ?string
    {
        foreach (['nom', 'code', 'title', 'name'] as $attribute) {
            $value = $model->getAttribute($attribute);

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    protected function resolveActorName(?object $actor): ?string
    {
        if (! $actor) {
            return null;
        }

        foreach (['name', 'nom', 'email'] as $attribute) {
            $value = $actor->{$attribute} ?? null;

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }

    protected function storeRules(): array
    {
        return [];
    }

    protected function updateRules(Model $model): array
    {
        return $this->storeRules();
    }
}