import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogoComponent } from './logo.component';

describe('LogoComponent', () => {
  let component: LogoComponent;
  let fixture: ComponentFixture<LogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LogoComponent ]
    }).compileComponents();

    fixture = TestBed.createComponent(LogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default size of medium', () => {
    expect(component.size).toBe('medium');
  });

  it('should have default variant of color', () => {
    expect(component.variant).toBe('color');
  });

  it('should accept size input', () => {
    component.size = 'large';
    fixture.detectChanges();
    expect(component.size).toBe('large');
  });

  it('should accept variant input', () => {
    component.variant = 'white';
    fixture.detectChanges();
    expect(component.variant).toBe('white');
  });

  it('should render logo element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const logoElement = compiled.querySelector('.logo');
    expect(logoElement).toBeTruthy();
  });
});
