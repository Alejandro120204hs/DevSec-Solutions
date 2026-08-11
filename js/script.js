(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Mobile nav toggle ---- */
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        const closeMenu = () => {
            navToggle.setAttribute('aria-expanded', 'false');
            navMenu.classList.remove('is-open');
        };

        navToggle.addEventListener('click', () => {
            const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
            navToggle.setAttribute('aria-expanded', String(!isOpen));
            navMenu.classList.toggle('is-open', !isOpen);
        });

        navMenu.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeMenu();
        });
    }

    /* ---- Navbar background on scroll ---- */
    const navbar = document.getElementById('navbar');
    if (navbar) {
        const updateNavbarState = () => {
            navbar.classList.toggle('is-scrolled', window.scrollY > 10);
        };
        updateNavbarState();
        window.addEventListener('scroll', updateNavbarState, { passive: true });
    }

    /* ---- Reveal-on-scroll (AOS) ---- */
    if (window.AOS) {
        AOS.init({
            duration: 700,
            easing: 'ease-out-cubic',
            once: true,
            offset: 80,
            disable: () => prefersReducedMotion,
        });
    }

    /* ---- Count-up numbers (rating, stats, dashboard figures) ---- */
    const countEls = document.querySelectorAll('[data-count-to]');

    const animateCount = (el) => {
        const target = parseFloat(el.dataset.countTo);
        const suffix = el.dataset.suffix || '';
        const decimals = (el.dataset.countTo.split('.')[1] || '').length;
        const duration = 1400;
        let start = null;

        if (prefersReducedMotion) {
            el.textContent = el.dataset.countTo + suffix;
            return;
        }

        const step = (timestamp) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = target * eased;
            el.textContent = (decimals ? value.toFixed(decimals) : Math.round(value)) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
        const countObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    countObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        countEls.forEach((el) => countObserver.observe(el));
    } else {
        countEls.forEach(animateCount);
    }
})();
