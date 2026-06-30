import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class ScrollReveal {
  constructor() {
    this.init();
  }

  private init(): void {
    const targets = document.querySelectorAll<HTMLElement>('[data-scroll-reveal]');
    targets.forEach((target) => {
      // 1. Get configurations from data attributes
      const enableBlur = target.getAttribute('data-scroll-reveal-blur') !== 'false';
      const baseOpacity = parseFloat(target.getAttribute('data-scroll-reveal-opacity') || '0.1');
      const baseRotation = parseFloat(target.getAttribute('data-scroll-reveal-rotation') || '3');
      const blurStrength = parseFloat(target.getAttribute('data-scroll-reveal-blur-strength') || '4');
      const rotationEnd = target.getAttribute('data-scroll-reveal-rotation-end') || 'bottom bottom';
      const wordAnimationEnd = target.getAttribute('data-scroll-reveal-word-end') || 'bottom bottom';

      // 2. Split text content into word spans
      const rawText = target.innerText.trim();
      if (!rawText) return;

      target.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'scroll-reveal-text';

      const words = rawText.split(/(\s+)/);
      words.forEach((word) => {
        if (word.match(/^\s+$/)) {
          p.appendChild(document.createTextNode(word));
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.innerText = word;
          p.appendChild(span);
        }
      });
      target.appendChild(p);

      // Add target class for styling
      target.classList.add('scroll-reveal');

      // 3. Apply GSAP animations
      // Container rotation
      gsap.fromTo(
        target,
        { transformOrigin: '0% 50%', rotate: baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: {
            trigger: target,
            scroller: window,
            start: 'top bottom',
            end: rotationEnd,
            scrub: true,
          },
        }
      );

      const wordElements = target.querySelectorAll('.word');

      // Word opacity
      gsap.fromTo(
        wordElements,
        { opacity: baseOpacity, willChange: 'opacity' },
        {
          ease: 'none',
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: {
            trigger: target,
            scroller: window,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true,
          },
        }
      );

      // Word blur
      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: 'none',
            filter: 'blur(0px)',
            stagger: 0.05,
            scrollTrigger: {
              trigger: target,
              scroller: window,
              start: 'top bottom-=20%',
              end: wordAnimationEnd,
              scrub: true,
            },
          }
        );
      }
    });
  }
}
