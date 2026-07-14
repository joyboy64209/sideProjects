// 1. Tailwind Config Runtime Bridge (so styling classes map correctly inside CDN framework)
if (window.tailwind) {
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          'industrial-dark': '#0a1628',
          'industrial-blue': '#1e3a5f',
          'industrial-yellow': '#f59e0b'
        }
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 2. Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // 3. Dynamic Footer Year Update
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // 4. Mobile Menu Toggle Interaction
  const mobileMenuBtn = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');
  const menuIcon = document.getElementById('menu-icon');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      const isOpen = !mobileMenu.classList.contains('hidden');
      
      // Toggle Menu Icon (Menu vs. Close)
      if (menuIcon && window.lucide) {
        if (isOpen) {
          menuIcon.setAttribute('data-lucide', 'x');
        } else {
          menuIcon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons({
          attrs: { id: 'menu-icon' }
        });
      }
    });

    // Automatically close the mobile nav panel after clicking a navigation anchor link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
        if (menuIcon && window.lucide) {
          menuIcon.setAttribute('data-lucide', 'menu');
          lucide.createIcons({ attrs: { id: 'menu-icon' } });
        }
      });
    });
  }

  // 5. Testimonial Slider Loop logic
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('.dot-btn');
  let currentSlide = 0;
  let slideInterval;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.replace('opacity-0', 'opacity-100');
      } else {
        slide.classList.replace('opacity-100', 'opacity-0');
      }
    });

    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.replace('bg-gray-300', 'bg-industrial-blue');
      } else {
        dot.classList.replace('bg-industrial-blue', 'bg-gray-300');
      }
    });
    currentSlide = index;
  }

  function nextSlide() {
    let next = (currentSlide + 1) % slides.length;
    showSlide(next);
  }

  function startSlideShow() {
    slideInterval = setInterval(nextSlide, 5000); // Transitions every 5 seconds
  }

  function stopSlideShow() {
    clearInterval(slideInterval);
  }

  // Bind clicks manually to dot pagination selectors
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      stopSlideShow();
      showSlide(i);
      startSlideShow();
    });
  });

  if (slides.length > 0) {
    startSlideShow();
  }

  // 6. Contact Form Simulation & Response Screen UI
  const form = document.getElementById('quote-form');
  const successBox = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // Stop raw page refresh
      
      // Capture details (For backend forwarding processing)
      const formData = {
        name: document.getElementById('name').value,
        company: document.getElementById('company').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        service: document.getElementById('service-type').value,
        message: document.getElementById('message').value
      };

      console.log('Brief Submitted Successfully:', formData);

      // Reset fields and toggle confirmation banner
      form.reset();
      form.classList.add('hidden');
      if (successBox) {
        successBox.classList.remove('hidden');
      }
    });
  }

  // 7. Dynamic Element Config SDK Integration
  if (window.ElementSDK) {
    const defaultConfig = {
      company_name: 'PowerGrid',
      hero_headline: 'Industrial Electrical Solutions Built for Reliability',
      hero_subtext: 'Whether minimizing downtime through predictive maintenance or implementing critical machinery hookups, our expert industrial electricians provide robust engineering solutions that keep your plant operations running efficiently.',
      phone_number: '1-800-555-0199',
      email_address: 'projects@powergrid-industrial.com',
      company_address: '100 Enterprise Parkway, Industrial District, Suite 500'
    };

    ElementSDK.setupConfig({
      hooks: {
        onConfigChange: (config) => {
          updateDOMConfig(config || defaultConfig);
        }
      },
      initialConfig: defaultConfig
    });
  }

  function updateDOMConfig(config) {
    const configMap = new Map([
      ['company_name', config.company_name],
      ['hero_headline', config.hero_headline],
      ['hero_subtext', config.hero_subtext],
      ['phone_number', config.phone_number],
      ['email_address', config.email_address],
      ['company_address', config.company_address]
    ]);

    configMap.forEach((val, key) => {
      if (val) {
        document.querySelectorAll(`[data-config-key="${key}"]`).forEach(elem => {
          if (elem.tagName === 'A' && elem.getAttribute('href').startsWith('tel:')) {
            elem.setAttribute('href', `tel:${val}`);
            elem.querySelector('span') ? elem.querySelector('span').textContent = val : elem.textContent = val;
          } else if (elem.tagName === 'A' && elem.getAttribute('href').startsWith('mailto:')) {
            elem.setAttribute('href', `mailto:${val}`);
            elem.textContent = val;
          } else {
            elem.textContent = val;
          }
        });
      }
    });
  }
});