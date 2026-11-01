<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiPromptTemplate extends Model
{
    protected $fillable = ['name', 'slug', 'prompt', 'instructions', 'version', 'is_active', 'created_by'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean', 'version' => 'integer'];
    }

    protected static function booted(): void
    {
        static::updating(function (self $template): void {
            if ($template->isDirty(['name', 'slug', 'prompt', 'instructions'])) {
                $template->version = max(1, (int) $template->getOriginal('version')) + 1;
            }
        });

        static::created(function (self $template): void {
            AiAuditEvent::record(null, $template->created_by, 'prompt_template.created', null, null, [
                'template_id' => $template->id,
                'version' => $template->version,
            ]);
        });

        static::updated(function (self $template): void {
            if ($template->wasChanged(['name', 'slug', 'prompt', 'instructions', 'is_active'])) {
                AiAuditEvent::record(null, auth()->id(), 'prompt_template.updated', null, null, [
                    'template_id' => $template->id,
                    'version' => $template->version,
                    'changed_fields' => array_values(array_intersect(
                        array_keys($template->getChanges()),
                        ['name', 'slug', 'prompt', 'instructions', 'is_active', 'version'],
                    )),
                ]);
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
