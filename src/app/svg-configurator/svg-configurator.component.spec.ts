import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SvgConfiguratorComponent } from './svg-configurator.component';

describe('SvgConfiguratorComponent', () => {
  let component: SvgConfiguratorComponent;
  let fixture: ComponentFixture<SvgConfiguratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SvgConfiguratorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SvgConfiguratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
