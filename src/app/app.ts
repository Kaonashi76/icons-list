import { Component, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { StIcon } from '@sevtech/icons';

interface IconMeta {
  variants: string[];
  tags: string[];
}

type IconCatalog = Record<string, IconMeta>;

interface IconItem {
  name: string;
  variants: string[];
  tags: string[];
}

interface IconGroup {
  category: string;
  icons: IconItem[];
}

/** Порядок вкладок-вариантов и подписи к ним. */
const VARIANT_ORDER = ['outline', 'fill', 'color', 'twotone'];
const VARIANT_LABELS: Record<string, string> = {
  outline: 'Outline',
  fill: 'Fill',
  color: 'Color',
  twotone: 'Two Tone',
};

@Component({
  selector: 'app-root',
  imports: [StIcon],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly http = inject(HttpClient);

  /** Каталог копируется в корень сборки ассетами (см. angular.json). null = ещё грузится. */
  private readonly catalog = toSignal(
    this.http
      .get<IconCatalog>('icons-catalog.json')
      .pipe(catchError(() => of<IconCatalog>({}))),
    { initialValue: null },
  );

  protected readonly query = signal('');

  /** Размер иконок в пикселях (управляется слайдером). */
  protected readonly size = signal(32);

  /** Выбранная вкладка-вариант; null = взять первую доступную. */
  private readonly selectedVariant = signal<string | null>(null);

  protected readonly loading = computed(() => this.catalog() === null);

  protected readonly icons = computed<IconItem[]>(() => {
    const catalog = this.catalog();
    if (!catalog) {
      return [];
    }
    return Object.entries(catalog)
      .map(([name, meta]) => ({
        name,
        variants: meta.variants ?? [],
        tags: meta.tags ?? [],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  /** Все варианты, встречающиеся в каталоге, в стабильном порядке. */
  protected readonly variants = computed<string[]>(() => {
    const present = new Set<string>();
    for (const icon of this.icons()) {
      for (const variant of icon.variants) {
        present.add(variant);
      }
    }
    return VARIANT_ORDER.filter((variant) => present.has(variant));
  });

  /** Активный вариант: выбранный пользователем либо первый доступный. */
  protected readonly variant = computed<string>(() => {
    const selected = this.selectedVariant();
    const available = this.variants();
    return selected && available.includes(selected) ? selected : available[0] ?? 'outline';
  });

  /** Сколько иконок доступно в активном варианте (для подписи к поиску). */
  protected readonly variantCount = computed(
    () => this.icons().filter((icon) => icon.variants.includes(this.variant())).length,
  );

  /** Иконки активного варианта, отфильтрованные поиском и сгруппированные по категориям. */
  protected readonly groups = computed<IconGroup[]>(() => {
    const variant = this.variant();
    const query = this.query().trim().toLowerCase();
    const byCategory = new Map<string, IconItem[]>();

    for (const icon of this.icons()) {
      if (!icon.variants.includes(variant)) {
        continue;
      }
      if (query && !icon.name.includes(query) && !icon.tags.some((tag) => tag.includes(query))) {
        continue;
      }
      const category = icon.tags[0] ?? 'other';
      const bucket = byCategory.get(category);
      if (bucket) {
        bucket.push(icon);
      } else {
        byCategory.set(category, [icon]);
      }
    }

    return [...byCategory.entries()]
      .map(([category, icons]) => ({ category, icons }))
      .sort((a, b) => a.category.localeCompare(b.category));
  });

  protected selectVariant(variant: string): void {
    this.selectedVariant.set(variant);
  }

  protected variantLabel(variant: string): string {
    return VARIANT_LABELS[variant] ?? variant;
  }

  protected categoryLabel(category: string): string {
    return category.replace(/\b\w/g, (char) => char.toUpperCase());
  }
}