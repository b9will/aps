/**
 * APS Accent Colour Picker
 * Drop-in floating UI for live accent colour switching.
 *
 * Usage:
 *   <script src="accent-picker.js"></script>
 *   — or —
 *   <script src="https://your-cdn.com/accent-picker.js"></script>
 *
 * Requires the page to use --gold and --gold-2 CSS custom properties.
 * Reads the initial value from --gold on :root at load time.
 */
(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────── */
  var PRESETS = [
    { name: 'Sage',   color: '#8aA68d' },
    { name: 'Gold',   color: '#c9a84c' },
    { name: 'Copper', color: '#c07d58' },
    { name: 'Steel',  color: '#7fa3b8' }
  ];

  /* ── COLOUR HELPERS ─────────────────────── */
  function hexToHSL(hex) {
    var r = parseInt(hex.slice(1, 3), 16) / 255;
    var g = parseInt(hex.slice(3, 5), 16) / 255;
    var b = parseInt(hex.slice(5, 7), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    function f(n) {
      var k = (n + h / 30) % 12;
      var color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    }
    return '#' + f(0) + f(8) + f(4);
  }

  function darkenColor(hex) {
    var hsl = hexToHSL(hex);
    return hslToHex(hsl.h, Math.min(hsl.s + 5, 100), Math.max(hsl.l - 12, 0));
  }

  /* ── READ INITIAL COLOUR ────────────────── */
  var rootStyle = getComputedStyle(document.documentElement);
  var initialColor = (rootStyle.getPropertyValue('--gold') || '#c07d58').trim();

  /* ── INJECT STYLES ──────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    '.acp-toggle{position:fixed;right:28px;top:50%;transform:translateY(-50%);z-index:10000;width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,0.15);background:var(--gold);cursor:pointer;transition:transform 0.3s,box-shadow 0.3s;box-shadow:0 4px 20px rgba(0,0,0,0.3);}',
    '.acp-toggle:hover{transform:translateY(-50%) scale(1.1);box-shadow:0 6px 28px rgba(0,0,0,0.45);}',
    '.acp-toggle svg{width:20px;height:20px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}',
    '.acp-panel{position:fixed;right:28px;top:50%;transform:translateY(-50%) translateX(20px);z-index:10001;width:260px;background:#141418;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;opacity:0;pointer-events:none;transition:opacity 0.3s,transform 0.3s;box-shadow:0 16px 48px rgba(0,0,0,0.5);}',
    '.acp-panel.open{opacity:1;pointer-events:auto;transform:translateY(-50%) translateX(0);}',
    '.acp-close{position:absolute;top:14px;right:16px;background:none;border:none;color:rgba(255,255,255,0.35);font-size:18px;cursor:pointer;padding:4px;line-height:1;transition:color 0.2s;}',
    '.acp-close:hover{color:#fff;}',
    '.acp-title{font-family:"Barlow Condensed",sans-serif;font-weight:600;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:20px;}',
    '.acp-label{font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:10px;font-weight:500;}',
    '.acp-swatches{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:24px;}',
    '.acp-swatch{width:100%;aspect-ratio:1;border-radius:10px;border:2px solid transparent;cursor:pointer;transition:border-color 0.2s,transform 0.2s;position:relative;}',
    '.acp-swatch:hover{transform:scale(1.1);}',
    '.acp-swatch.active{border-color:#fff;}',
    '.acp-swatch-name{position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);font-size:8px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.35);white-space:nowrap;font-weight:500;}',
    '.acp-wheel-input{-webkit-appearance:none;appearance:none;width:100%;height:40px;border:none;border-radius:8px;cursor:pointer;background:linear-gradient(to right,#ff0000,#ff8800,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000);outline:none;}',
    '.acp-wheel-input::-webkit-color-swatch-wrapper{padding:0;}',
    '.acp-wheel-input::-webkit-color-swatch{border:none;border-radius:8px;}',
    '.acp-wheel-input::-moz-color-swatch{border:none;border-radius:8px;}',
    '.acp-hex{display:flex;align-items:center;gap:8px;margin-top:14px;}',
    '.acp-hex-label{font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.3);font-weight:500;}',
    '.acp-hex-val{font-family:"Barlow Condensed",sans-serif;font-size:14px;color:rgba(255,255,255,0.7);letter-spacing:0.06em;font-weight:400;}',
    '.acp-backdrop{position:fixed;inset:0;z-index:9999;display:none;}',
    '.acp-backdrop.open{display:block;}'
  ].join('\n');
  document.head.appendChild(css);

  /* ── BUILD DOM ──────────────────────────── */
  // Toggle button
  var toggle = document.createElement('button');
  toggle.className = 'acp-toggle';
  toggle.id = 'acpToggle';
  toggle.setAttribute('aria-label', 'Change accent colour');
  toggle.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';

  // Backdrop
  var backdrop = document.createElement('div');
  backdrop.className = 'acp-backdrop';
  backdrop.id = 'acpBackdrop';

  // Panel
  var panel = document.createElement('div');
  panel.className = 'acp-panel';
  panel.id = 'acpPanel';

  // Build swatches HTML
  var swatchesHTML = PRESETS.map(function (p) {
    return '<div class="acp-swatch" data-color="' + p.color + '" style="background:' + p.color + ';" title="' + p.name + '"><span class="acp-swatch-name">' + p.name + '</span></div>';
  }).join('');

  panel.innerHTML = [
    '<button class="acp-close" id="acpClose">&times;</button>',
    '<div class="acp-title">Accent Colour</div>',
    '<div class="acp-label">Recommended</div>',
    '<div class="acp-swatches" id="acpSwatches">' + swatchesHTML + '</div>',
    '<div class="acp-label" style="margin-top:28px;">Custom</div>',
    '<input type="color" class="acp-wheel-input" id="acpWheel" value="' + initialColor + '">',
    '<div class="acp-hex">',
    '  <span class="acp-hex-label">Active</span>',
    '  <span class="acp-hex-val" id="acpHexVal">' + initialColor + '</span>',
    '</div>'
  ].join('');

  document.body.appendChild(toggle);
  document.body.appendChild(backdrop);
  document.body.appendChild(panel);

  /* ── WIRE UP ────────────────────────────── */
  var closeBtn = document.getElementById('acpClose');
  var wheel = document.getElementById('acpWheel');
  var hexVal = document.getElementById('acpHexVal');
  var swatches = document.querySelectorAll('.acp-swatch');

  function openPanel() {
    panel.classList.add('open');
    backdrop.classList.add('open');
    toggle.style.opacity = '0';
    toggle.style.pointerEvents = 'none';
  }
  function closePanel() {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    toggle.style.opacity = '1';
    toggle.style.pointerEvents = 'auto';
  }

  toggle.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);

  function applyColor(hex) {
    document.documentElement.style.setProperty('--gold', hex);
    document.documentElement.style.setProperty('--gold-2', darkenColor(hex));
    toggle.style.background = hex;
    wheel.value = hex;
    hexVal.textContent = hex;
    swatches.forEach(function (s) {
      s.classList.toggle('active', s.dataset.color.toLowerCase() === hex.toLowerCase());
    });
  }

  swatches.forEach(function (s) {
    s.addEventListener('click', function () { applyColor(s.dataset.color); });
  });

  wheel.addEventListener('input', function () { applyColor(wheel.value); });

  // Apply initial colour
  applyColor(initialColor);

})();
