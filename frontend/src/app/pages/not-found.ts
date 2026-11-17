import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../core/i18n.service';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, TranslatePipe],
  template: `
    <section class="empty card">
      <h1>404</h1>
      <p>{{ 'notFound.title' | t }}</p>
      <a class="btn" routerLink="/rooms">{{ 'notFound.back' | t }}</a>
    </section>
  `,
})
export class NotFoundPage {}
