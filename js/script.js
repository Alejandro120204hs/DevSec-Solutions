(() => {
    'use strict';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---- Reveal-on-scroll (AOS) ---- */
    const initAOS = () => {
        if (window.AOS) {
            AOS.init({
                duration: 700,
                easing: 'ease-out-cubic',
                once: true,
                offset: 80,
                disable: () => prefersReducedMotion,
            });
        }
    };

    /* ---- Hover rápido en tarjetas, solo después de que AOS termine de revelarlas ---- */
    document.querySelectorAll('.process__card[data-aos], .service-card[data-aos]').forEach((card) => {
        if (prefersReducedMotion) {
            card.classList.add('hover-ready');
        } else {
            card.addEventListener('transitionend', () => {
                card.classList.add('hover-ready');
            }, { once: true });
        }
    });

    /* ---- Acordeón de preguntas frecuentes ---- */
    const faqQuestions = document.querySelectorAll('.faq-item__question');
    faqQuestions.forEach((question) => {
        question.addEventListener('click', () => {
            const isOpen = question.getAttribute('aria-expanded') === 'true';
            faqQuestions.forEach((other) => other.setAttribute('aria-expanded', 'false'));
            question.setAttribute('aria-expanded', String(!isOpen));
        });
    });

    /* ---- Formulario de contacto (abre el correo del usuario con los datos) ---- */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const nombre = contactForm.nombre.value.trim();
            const email = contactForm.email.value.trim();
            const mensaje = contactForm.mensaje.value.trim();

            const subject = encodeURIComponent(`Nuevo proyecto — ${nombre}`);
            const body = encodeURIComponent(`Nombre: ${nombre}\nEmail: ${email}\n\n${mensaje}`);
            window.location.href = `mailto:alejandro1202hs@gmail.com?subject=${subject}&body=${body}`;
        });
    }

    /* ---- Preloader ---- */
    const preloader = document.getElementById('preloader');
    const content = document.getElementById('contenido-web');

    if (preloader && content) {
        let revealed = false;

        const revealContent = () => {
            if (revealed) return;
            revealed = true;
            content.style.transition = 'opacity 0.4s ease';
            content.style.opacity = '1';
            if (preloader.isConnected) preloader.remove();
            // AOS recién se inicializa cuando el contenido ya es visible, si no,
            // anima los elementos del hero mientras están tapados por el preloader.
            initAOS();
        };

        const brandText = preloader.querySelector('.loader-brackets__text');

        const startPreloaderAnimation = () => {
            const brandGap = brandText.parentElement;
            const chars = brandText.textContent.split('');
            brandText.textContent = '';
            chars.forEach((char) => {
                const letter = document.createElement('span');
                letter.className = 'loader-brackets__letter';
                letter.textContent = char;
                brandText.appendChild(letter);
            });
            // Se mide después de que la fuente esté lista (ver más abajo); si se mide antes,
            // el navegador usa la fuente de respaldo (más angosta) y el ancho queda corto.
            const fullWidth = brandText.scrollWidth;
            const letters = brandText.querySelectorAll('.loader-brackets__letter');

            anime.timeline()
                .add({
                    // Fase 1: las llaves se abren (espacio vacío, sin texto todavía).
                    targets: brandGap,
                    width: [0, fullWidth],
                    duration: 1100,
                    easing: 'easeOutQuad',
                })
                .add({
                    // Fase 2: cada letra aparece una por una, nunca a medio cortar.
                    targets: letters,
                    opacity: [0, 1],
                    translateY: [6, 0],
                    duration: 300,
                    delay: anime.stagger(90),
                })
                .add({
                    targets: preloader,
                    opacity: [1, 0],
                    duration: 70,
                    delay: 70,
                    complete: revealContent,
                });
        };

        if (prefersReducedMotion || typeof anime === 'undefined' || !brandText) {
            revealContent();
        } else if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(startPreloaderAnimation);
        } else {
            startPreloaderAnimation();
        }

        // Red de seguridad: nunca dejar al usuario atrapado detrás del loader.
        setTimeout(revealContent, 4000);
    } else {
        initAOS();
    }

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

    /* ---- Scroll-spy: resalta en el nav la sección visible ---- */
    if (navMenu && 'IntersectionObserver' in window) {
        const navLinks = navMenu.querySelectorAll('a[href^="#"]');
        const sections = Array.from(navLinks)
            .map((link) => document.getElementById(link.getAttribute('href').slice(1)))
            .filter(Boolean);

        const setActiveLink = (id) => {
            navLinks.forEach((link) => {
                link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
            });
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) setActiveLink(entry.target.id);
            });
        }, { rootMargin: '-40% 0px -55% 0px' });

        sections.forEach((section) => sectionObserver.observe(section));
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
