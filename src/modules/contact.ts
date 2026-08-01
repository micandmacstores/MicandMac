/**
 * contact.ts
 * Contact form enhancements:
 *  - Submit button loading state
 *  - Client-side validation messages
 *  - Character counter on message field
 *  - Custom CSS Select UI dropdown
 */

export class Contact {
  constructor() {
    const form = document.getElementById('ContactForm') as HTMLFormElement | null;
    if (!form) return;

    this._initSubmitState(form);
    this._initCharCounter();
    this._initCustomSelect();
  }

  private _initSubmitState(form: HTMLFormElement): void {
    form.addEventListener('submit', () => {
      const btn = document.getElementById('ContactSubmit') as HTMLButtonElement;
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Sending…';
      }
    });
  }

  private _initCharCounter(): void {
    const textarea = document.getElementById('ContactMessage') as HTMLTextAreaElement;
    if (!textarea) return;

    const MAX = 2000;
    const counter = document.createElement('p');
    counter.className = 'char-counter';
    counter.style.cssText = 'font-size:var(--text-xs);color:var(--color-text-light);text-align:right;margin-top:4px';
    textarea.parentNode?.appendChild(counter);

    const update = () => {
      const remaining = MAX - textarea.value.length;
      counter.textContent = `${remaining} characters remaining`;
      counter.style.color = remaining < 50 ? 'var(--color-burgundy)' : 'var(--color-text-light)';
    };

    textarea.addEventListener('input', update);
    update();
  }

  private _initCustomSelect(): void {
    const wrappers = document.querySelectorAll<HTMLElement>('.custom-select-wrapper');
    wrappers.forEach(wrapper => {
      const nativeSelect = wrapper.querySelector<HTMLSelectElement>('.custom-select__native');
      const trigger = wrapper.querySelector<HTMLButtonElement>('.custom-select__trigger');
      const dropdown = wrapper.querySelector<HTMLElement>('.custom-select__dropdown');
      const valueSpan = wrapper.querySelector<HTMLElement>('.custom-select__value');
      const options = wrapper.querySelectorAll<HTMLElement>('.custom-select__option');

      if (!nativeSelect || !trigger || !dropdown || !valueSpan) return;

      let focusedIndex = -1;

      const toggleDropdown = (open?: boolean) => {
        const isOpen = open !== undefined ? open : !wrapper.classList.contains('is-open');
        if (isOpen) {
          document.querySelectorAll('.custom-select-wrapper.is-open').forEach(w => {
            if (w !== wrapper) {
              w.classList.remove('is-open');
              w.querySelector('.custom-select__trigger')?.setAttribute('aria-expanded', 'false');
            }
          });

          wrapper.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');

          const selectedOption = wrapper.querySelector('.custom-select__option.is-selected');
          if (selectedOption) {
            focusedIndex = Array.from(options).indexOf(selectedOption as HTMLElement);
          } else {
            focusedIndex = 0;
          }
          updateFocus();
        } else {
          wrapper.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
          options.forEach(opt => opt.classList.remove('is-focused'));
        }
      };

      const selectOption = (option: HTMLElement) => {
        const val = option.getAttribute('data-value') || '';
        const text = option.querySelector('.custom-select__option-text')?.textContent || option.textContent || '';

        nativeSelect.value = val;
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));

        valueSpan.textContent = text;
        if (!val) {
          valueSpan.classList.add('placeholder');
        } else {
          valueSpan.classList.remove('placeholder');
        }

        options.forEach(opt => {
          const isCurr = opt === option;
          opt.classList.toggle('is-selected', isCurr);
          opt.setAttribute('aria-selected', isCurr ? 'true' : 'false');
        });

        toggleDropdown(false);
        trigger.focus();
      };

      const updateFocus = () => {
        options.forEach((opt, idx) => {
          if (idx === focusedIndex) {
            opt.classList.add('is-focused');
            opt.scrollIntoView({ block: 'nearest' });
          } else {
            opt.classList.remove('is-focused');
          }
        });
      };

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDropdown();
      });

      options.forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          selectOption(option);
        });
      });

      trigger.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleDropdown(true);
        }
      });

      wrapper.addEventListener('keydown', (e: KeyboardEvent) => {
        if (!wrapper.classList.contains('is-open')) return;

        if (e.key === 'Escape' || e.key === 'Tab') {
          toggleDropdown(false);
          trigger.focus();
          return;
        }

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          focusedIndex = (focusedIndex + 1) % options.length;
          updateFocus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusedIndex = (focusedIndex - 1 + options.length) % options.length;
          updateFocus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (focusedIndex >= 0 && options[focusedIndex]) {
            selectOption(options[focusedIndex]);
          }
        }
      });

      nativeSelect.addEventListener('change', () => {
        const val = nativeSelect.value;
        const matchingOpt = Array.from(options).find(opt => opt.getAttribute('data-value') === val);
        if (matchingOpt) {
          const text = matchingOpt.querySelector('.custom-select__option-text')?.textContent || matchingOpt.textContent || '';
          valueSpan.textContent = text;
          if (!val) valueSpan.classList.add('placeholder');
          else valueSpan.classList.remove('placeholder');

          options.forEach(opt => {
            const isCurr = opt === matchingOpt;
            opt.classList.toggle('is-selected', isCurr);
            opt.setAttribute('aria-selected', isCurr ? 'true' : 'false');
          });
        }
      });
    });

    document.addEventListener('click', (e: MouseEvent) => {
      const target = e.target as Node;
      document.querySelectorAll('.custom-select-wrapper.is-open').forEach(wrapper => {
        if (!wrapper.contains(target)) {
          wrapper.classList.remove('is-open');
          wrapper.querySelector('.custom-select__trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }
}

