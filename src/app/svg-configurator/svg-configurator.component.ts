import { ChangeDetectorRef, Component, computed, effect, ElementRef, inject, linkedSignal, resource, Signal, signal, viewChild } from '@angular/core';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatIconButton } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOption, MatSelect } from '@angular/material/select';

@Component({
  selector: 'app-svg-configurator',
  imports: [
    MatFormField,
    MatIcon,
    MatPrefix,
    MatInput,
    MatLabel,
    MatIconButton,
    MatSuffix,
    FormsModule,
    ReactiveFormsModule,
    MatSelect,
    MatOption,
  ],
  templateUrl: './svg-configurator.component.html',
  styleUrl: './svg-configurator.component.scss'
})
export class SvgConfiguratorComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly _parser = new DOMParser();
  private readonly _previewRef = viewChild.required<ElementRef<HTMLElement>>("preview");

  protected readonly svgResource = resource({
    loader: () => fetch("/svg/bed.svg")
      .then((r) => r.text())
      .then(text => this._parser.parseFromString(text, "image/svg+xml")),
  });

  protected readonly bedCount = signal(1);

  protected readonly bedStates = linkedSignal<number, Map<number, Signal<string>>>({
    source: this.bedCount,
    computation: (bedCount, previous) => {
      const newState = new Map(Array.from({ length: bedCount }, (_, i) => [i, signal('empty')]));

      // Preserve state after bed count change
      for (const [key, value] of previous?.value?.entries() ?? []) {
        if (!newState.has(key)) continue;
        newState.set(key, signal(value()));
      }

      return newState;
    }
  });

  private readonly _logBedStates = effect(() => console.log(this.bedStates()));

  protected readonly svgElement = computed(() => {
    const svgDocument = this.svgResource.value();
    if (!svgDocument) return undefined;

    const svgElement = svgDocument.documentElement.cloneNode(true) as unknown as SVGElement;


    const bedStates = this.bedStates();
    for (const [bedId, bedState] of bedStates.entries()) {
      const useElement = document.createElementNS("http://www.w3.org/2000/svg", "use");
      useElement.setAttribute("x", String(10 + (bedId % 5) * 110));
      useElement.setAttribute("y", String(10 + (bedId >= 5 ? 270 : 0)));
      useElement.setAttribute("href", "#bed");
      useElement.setAttribute("class", bedState());
      useElement.setAttribute("id", `bed-${bedId}`);

      svgElement.appendChild(useElement);
    }

    this.cdr.detectChanges();
    return svgElement;
  });

  private readonly _previewEffect = effect(() => {
    const svgElement = this.svgElement();
    if (!svgElement) return;

    const previewElement = this._previewRef().nativeElement;
    previewElement.replaceChildren();
    previewElement.appendChild(svgElement);
  });

  protected readonly bedStateSteps: Record<string, string> = ({
    'empty': 'occupied',
    'occupied': 'occupied woman',
    'occupied woman': 'occupied man',
    'occupied man': 'empty',
  });

  protected readonly bedVariants = Object.keys(this.bedStateSteps);

  protected onPreviewClick(event: Readonly<MouseEvent>) {
    const target = event.target;
    if (!(target instanceof SVGUseElement)) return;

    const id = target.id;
    if (!id.startsWith("bed-")) return;

    const bedId = Number(id.substring("bed-".length));
    const currentState = this.bedStates().get(bedId);
    if (!currentState) return;

    const nextState = this.bedStateSteps[currentState()];
    if (!nextState) throw new Error(`No state after ${currentState} was defined!`);

    this.bedStates.update(x => new Map(x).set(bedId, signal(nextState)));
  }

  protected onBedCountDecrease() {
    this.bedCount.update(x => Math.max(x - 1, 0));
  }

  protected onBedCountIncrease() {
    this.bedCount.update(x => Math.min(x + 1, 10));
  }
}
