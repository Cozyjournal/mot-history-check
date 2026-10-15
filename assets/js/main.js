/**
 * MOT History Check — Main JavaScript
 * Lightweight, Vanilla JS (<6KB)
 * Handles: Mobile Navigation, Animated Count-Up Numbers, Smooth FAQ Accordions, MOT Due Date Calculator, Plate Input Formatter
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Navigation Toggle with Drawer Animation & Body Scroll Lock
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('active');
      document.body.style.overflow = !isExpanded ? 'hidden' : '';
    });

    // Close menu when clicking outside or clicking a nav link
    document.addEventListener('click', (e) => {
      if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    navMenu.querySelectorAll('.nav-link, .nav-cta').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // 2. Animated Count-Up Numbers for Stats Bar
  const statNumbers = document.querySelectorAll('.stat-number');
  if ('IntersectionObserver' in window && statNumbers.length > 0) {
    const statsObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const targetText = el.textContent.trim();
          animateCountUp(el, targetText);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.25 });

    statNumbers.forEach((el) => statsObserver.observe(el));

    function animateCountUp(el, fullText) {
      let endVal = 0;
      let prefix = '';
      let suffix = '';

      if (fullText.startsWith('£')) {
        prefix = '£';
        endVal = parseInt(fullText.replace(/[^0-9]/g, ''), 10);
      } else if (fullText.includes('K')) {
        suffix = 'K+';
        endVal = parseInt(fullText.replace(/[^0-9]/g, ''), 10);
      } else if (fullText.includes('M')) {
        suffix = 'M+';
        endVal = parseInt(fullText.replace(/[^0-9]/g, ''), 10);
      } else if (fullText.includes('%')) {
        suffix = '%';
        endVal = parseInt(fullText.replace(/[^0-9]/g, ''), 10);
      } else {
        return;
      }

      const duration = 1400;
      const startTime = performance.now();

      function frame(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeOut * endVal);

        if (prefix === '£') {
          el.textContent = `${prefix}${currentVal.toLocaleString()}`;
        } else {
          el.textContent = `${currentVal}${suffix}`;
        }

        if (progress < 1) {
          requestAnimationFrame(frame);
        } else {
          el.textContent = fullText;
        }
      }
      requestAnimationFrame(frame);
    }
  }

  // 3. Smooth FAQ Accordion with Dynamic Height Transition
  document.querySelectorAll('.accordion-item.open').forEach((item) => {
    const body = item.querySelector('.accordion-body');
    if (body) {
      body.style.maxHeight = body.scrollHeight + 'px';
    }
  });

  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');

      // Close other accordions in the same group
      const siblingItems = item.parentElement.querySelectorAll('.accordion-item');
      siblingItems.forEach((sibling) => {
        if (sibling !== item && sibling.classList.contains('open')) {
          sibling.classList.remove('open');
          const sBtn = sibling.querySelector('.accordion-header');
          const sBody = sibling.querySelector('.accordion-body');
          if (sBtn) sBtn.setAttribute('aria-expanded', 'false');
          if (sBody) sBody.style.maxHeight = '0px';
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        header.setAttribute('aria-expanded', 'false');
        if (body) body.style.maxHeight = '0px';
      } else {
        item.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
        if (body) body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // 4. Hero Number Plate Formatter & Subpath-Aware Redirection
  const plateForm = document.getElementById('plateForm');
  const plateInput = document.getElementById('vrmInput');

  if (plateInput) {
    plateInput.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
      e.target.value = val;
    });
  }

  if (plateForm) {
    plateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const vrm = plateInput ? plateInput.value.trim().replace(/\s+/g, '') : '';
      const basePath = window.location.pathname.startsWith('/mot-history-check') ? '/mot-history-check' : '';
      if (vrm) {
        window.location.href = `${basePath}/how-to-check-mot-history/?vrm=${encodeURIComponent(vrm)}`;
      } else {
        window.location.href = `${basePath}/how-to-check-mot-history/`;
      }
    });
  }

  // Pre-fill VRM on How-to-Check page if passed in query string
  const urlParams = new URLSearchParams(window.location.search);
  const passedVrm = urlParams.get('vrm');
  const vrmDisplayEl = document.getElementById('userVrmDisplay');
  if (passedVrm && vrmDisplayEl) {
    vrmDisplayEl.textContent = passedVrm.toUpperCase();
    const banner = document.getElementById('vrmNoticeBanner');
    if (banner) banner.style.display = 'block';
  }

  // 5. MOT Due Date Calculator
  const calcForm = document.getElementById('motCalculatorForm');
  if (calcForm) {
    const inputDate = document.getElementById('lastMotDate');
    const resultBox = document.getElementById('calcResult');
    const resultDueDate = document.getElementById('resultDueDate');
    const resultEarlyDate = document.getElementById('resultEarlyDate');
    const resultStatusBadge = document.getElementById('resultStatusBadge');
    const resultDetails = document.getElementById('resultDetails');

    // Quick presets
    const presetButtons = document.querySelectorAll('.preset-pill');
    presetButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const monthsAgo = parseInt(btn.getAttribute('data-months'), 10);
        const d = new Date();
        d.setMonth(d.getMonth() - monthsAgo);
        if (inputDate) {
          inputDate.value = d.toISOString().split('T')[0];
          calculateMotDue(d);
        }
      });
    });

    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!inputDate || !inputDate.value) return;
      const selected = new Date(inputDate.value + 'T00:00:00');
      calculateMotDue(selected);
    });

    function calculateMotDue(dateObj) {
      if (isNaN(dateObj.getTime())) return;

      const dueDate = new Date(dateObj);
      dueDate.setFullYear(dueDate.getFullYear() + 1);

      const earlyDate = new Date(dueDate);
      earlyDate.setMonth(earlyDate.getMonth() - 1);
      earlyDate.setDate(earlyDate.getDate() + 1);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const options = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' };
      const formattedDue = dueDate.toLocaleDateString('en-GB', options);
      const formattedEarly = earlyDate.toLocaleDateString('en-GB', options);

      if (resultDueDate) resultDueDate.textContent = formattedDue;
      if (resultEarlyDate) resultEarlyDate.textContent = formattedEarly;

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (resultStatusBadge && resultDetails) {
        if (diffDays < 0) {
          resultStatusBadge.className = 'badge badge-red';
          resultStatusBadge.textContent = 'EXPIRED / OVERDUE';
          resultDetails.innerHTML = `<strong>Attention:</strong> This vehicle's MOT expired <strong>${Math.abs(diffDays)} days ago</strong>. Driving an untaxed or unroadworthy vehicle without a valid MOT carries a fine of up to <strong>£1,000</strong> unless travelling directly to a pre-booked test.`;
        } else if (diffDays <= 30) {
          resultStatusBadge.className = 'badge badge-amber';
          resultStatusBadge.textContent = 'DUE SOON (' + diffDays + ' DAYS)';
          resultDetails.innerHTML = `<strong>Action recommended:</strong> Your MOT is due in <strong>${diffDays} days</strong>. You are currently inside the official 1-month window where you can test early without losing your existing renewal date!`;
        } else {
          resultStatusBadge.className = 'badge badge-green';
          resultStatusBadge.textContent = 'VALID (' + diffDays + ' DAYS REMAINING)';
          resultDetails.innerHTML = `This vehicle has an active MOT certificate until <strong>${formattedDue}</strong>. You can book an early test starting from <strong>${formattedEarly}</strong> to keep this same expiry date for next year.`;
        }
      }

      if (resultBox) {
        resultBox.classList.add('visible');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  // 6. Interactive Preparation Checklist
  const checkboxes = document.querySelectorAll('.checklist-checkbox');
  const checklistCounter = document.getElementById('checklistCounter');
  if (checkboxes.length > 0 && checklistCounter) {
    function updateCounter() {
      const checked = document.querySelectorAll('.checklist-checkbox:checked').length;
      checklistCounter.textContent = `${checked} of ${checkboxes.length} items verified`;
    }
    checkboxes.forEach((cb) => {
      cb.addEventListener('change', updateCounter);
    });
    updateCounter();
  }
});
