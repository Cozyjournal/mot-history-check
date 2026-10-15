/**
 * MOT History Check — Main JavaScript
 * Lightweight, Vanilla JS (<5KB)
 * Handles: Mobile Navigation, FAQ Accordions, MOT Due Date Calculator, Plate Input Formatter
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Navigation Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('active');
    });

    // Close menu when clicking outside or clicking a nav link
    document.addEventListener('click', (e) => {
      if (!mobileToggle.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 2. FAQ Accordion Interaction
  const accordionHeaders = document.querySelectorAll('.accordion-header');
  accordionHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('open');

      // Close other accordions in the same group if desired
      const siblingItems = item.parentElement.querySelectorAll('.accordion-item');
      siblingItems.forEach((sibling) => {
        if (sibling !== item) {
          sibling.classList.remove('open');
          const btn = sibling.querySelector('.accordion-header');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        item.classList.remove('open');
        header.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // 3. Hero Number Plate Formatter & Redirection
  const plateForm = document.getElementById('plateForm');
  const plateInput = document.getElementById('vrmInput');

  if (plateInput) {
    // Automatically uppercase and clean spaces
    plateInput.addEventListener('input', (e) => {
      let val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, '');
      e.target.value = val;
    });
  }

  if (plateForm) {
    plateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const vrm = plateInput ? plateInput.value.trim().replace(/\s+/g, '') : '';
      if (vrm) {
        window.location.href = `/how-to-check-mot-history/?vrm=${encodeURIComponent(vrm)}`;
      } else {
        window.location.href = `/how-to-check-mot-history/`;
      }
    });
  }

  // Pre-fill VRM on How-to-Check page if passed in query string
  const urlParams = new URLSearchParams(window.location.search);
  const passedVrm = urlParams.get('vrm');
  const vrmDisplayEl = document.getElementById('userVrmDisplay');
  const vrmGovLink = document.getElementById('vrmGovLink');
  if (passedVrm && vrmDisplayEl) {
    vrmDisplayEl.textContent = passedVrm.toUpperCase();
    const banner = document.getElementById('vrmNoticeBanner');
    if (banner) banner.style.display = 'block';
  }

  // 4. MOT Due Date Calculator
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

      // Expiry is 1 year from the test date (exact anniversary)
      const dueDate = new Date(dateObj);
      dueDate.setFullYear(dueDate.getFullYear() + 1);

      // Earliest MOT date to preserve anniversary is 1 month minus a day before expiry
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

      // Calculate days diff
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

  // 5. Interactive Preparation Checklist
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
