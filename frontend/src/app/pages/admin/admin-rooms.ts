import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { I18nService, TranslatePipe } from '../../core/i18n.service';
import { Room, RoomInput } from '../../core/models';
import { ConfirmService } from '../../shared/confirm.service';
import { ToastService } from '../../shared/toast.service';

/** "Projector, whiteboard ,, TV" -> ["Projector", "whiteboard", "TV"] */
export function parseEquipment(text: string): string[] {
  return text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

@Component({
  selector: 'app-admin-rooms',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <header class="page-head">
      <h1>{{ 'adminRooms.title' | t }}</h1>
      @if (!editing()) {
        <button type="button" class="btn" (click)="startCreate()">
          {{ 'adminRooms.add' | t }}
        </button>
      }
    </header>

    @if (editing()) {
      <form class="card room-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <h2>
          {{
            editingId()
              ? ('adminRooms.edit' | t: { room: form.controls.name.value })
              : ('adminRooms.add' | t)
          }}
        </h2>
        <div class="grid-2">
          <label
            >{{ 'adminRooms.name' | t }}<input formControlName="name" maxlength="30" required
          /></label>
          <label
            >{{ 'adminRooms.capacity' | t
            }}<input type="number" formControlName="capacity" min="1" max="1000" required
          /></label>
          <label
            >{{ 'adminRooms.location' | t }}<input formControlName="location" maxlength="100"
          /></label>
          <label>{{ 'adminRooms.equipment' | t }}<input formControlName="equipment" /></label>
        </div>
        <label class="check"
          ><input type="checkbox" formControlName="active" /> {{ 'adminRooms.active' | t }}</label
        >
        @if (formError()) {
          <p class="alert alert-error" role="alert">{{ formError() }}</p>
        }
        <div class="row-end">
          <button type="button" class="btn-ghost" (click)="editing.set(false)">
            {{ 'adminRooms.cancel' | t }}
          </button>
          <button type="submit" class="btn" [disabled]="saving()">
            {{ 'adminRooms.save' | t }}
          </button>
        </div>
      </form>
    }

    @if (loading()) {
      <p class="muted">{{ 'common.loading' | t }}</p>
    } @else if (rooms().length === 0) {
      <div class="empty card">{{ 'adminRooms.empty' | t }}</div>
    } @else {
      <div class="card table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">{{ 'adminRooms.name' | t }}</th>
              <th scope="col">{{ 'adminRooms.capacity' | t }}</th>
              <th scope="col">{{ 'adminRooms.location' | t }}</th>
              <th scope="col">{{ 'rooms.equipment' | t }}</th>
              <th scope="col">{{ 'table.status' | t }}</th>
              <th scope="col">
                <span class="sr-only">{{ 'table.actions' | t }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (room of rooms(); track room.id) {
              <tr [class.faded]="!room.active">
                <td>
                  <strong>{{ room.name }}</strong>
                </td>
                <td>{{ room.capacity }}</td>
                <td>{{ room.location ?? '—' }}</td>
                <td>{{ room.equipment.join(', ') || '—' }}</td>
                <td>
                  <span
                    class="badge"
                    [class.badge-confirmed]="room.active"
                    [class.badge-cancelled]="!room.active"
                  >
                    {{ (room.active ? 'adminRooms.active' : 'adminRooms.inactive') | t }}
                  </span>
                </td>
                <td class="actions">
                  <button
                    type="button"
                    class="btn-ghost"
                    (click)="startEdit(room)"
                    [attr.data-testid]="'edit-' + room.id"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    class="btn-ghost danger-text"
                    (click)="remove(room)"
                    [attr.aria-label]="'adminRooms.delete' | t"
                  >
                    🗑
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminRoomsPage {
  private readonly api = inject(ApiService);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  protected readonly rooms = signal<Room[]>([]);
  protected readonly loading = signal(true);
  protected readonly editing = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal('');
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(30)]],
    capacity: [10, [Validators.required, Validators.min(1), Validators.max(1000)]],
    location: [''],
    equipment: [''],
    active: [true],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.api.rooms().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.toast.error(this.i18n.error(err));
      },
    });
  }

  startCreate(): void {
    this.form.reset({ name: '', capacity: 10, location: '', equipment: '', active: true });
    this.editingId.set(null);
    this.formError.set('');
    this.editing.set(true);
  }

  startEdit(room: Room): void {
    this.form.reset({
      name: room.name,
      capacity: room.capacity,
      location: room.location ?? '',
      equipment: room.equipment.join(', '),
      active: room.active,
    });
    this.editingId.set(room.id);
    this.formError.set('');
    this.editing.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set(this.i18n.t('common.required'));
      return;
    }
    const value = this.form.getRawValue();
    const body: RoomInput = {
      name: value.name.trim(),
      capacity: value.capacity,
      location: value.location.trim() || null,
      equipment: parseEquipment(value.equipment),
      active: value.active,
    };
    const id = this.editingId();
    this.saving.set(true);
    (id ? this.api.updateRoom(id, body) : this.api.createRoom(body)).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.editing.set(false);
        this.rooms.update((list) =>
          (id ? list.map((r) => (r.id === id ? saved : r)) : [...list, saved]).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
        this.toast.success(this.i18n.t('adminRooms.saved'));
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.formError.set(this.i18n.error(err));
      },
    });
  }

  async remove(room: Room): Promise<void> {
    const ok = await this.confirm.ask(
      this.i18n.t('adminRooms.deleteConfirm', { room: room.name }),
      this.i18n.t('adminRooms.delete'),
    );
    if (!ok) return;
    this.api.deleteRoom(room.id).subscribe({
      next: () => {
        this.rooms.update((list) => list.filter((r) => r.id !== room.id));
        this.toast.success(this.i18n.t('adminRooms.deleted'));
      },
      error: (err: unknown) => this.toast.error(this.i18n.error(err)),
    });
  }
}
