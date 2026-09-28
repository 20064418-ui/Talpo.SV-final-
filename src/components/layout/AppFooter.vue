<script setup>
// Footer ORIGINAL de main.html (mismo marcado y CSS), idéntico en todas las páginas.
const year = new Date().getFullYear();
</script>

<template>
  <footer class="talapo-footer">
    <div class="footer-container">
      <div class="footer-col brand-col">
        <h3 class="footer-logo">Talapo.<span>SV</span> <img src="/assets/img/logos/logooriginal.png" alt="Talapo Logo" class="nav-logo-img"></h3>
        <p class="footer-desc">Your travel guide where we explore the wonders of El Salvador.</p>
      </div>
      <div class="footer-col">
        <h4>Explore</h4>
        <ul class="footer-links">
          <li><RouterLink to="/main">Home</RouterLink></li>
          <li><RouterLink to="/stand">Picture Stands</RouterLink></li>
          <li><RouterLink to="/talapo-itinerario">AI Itinerary</RouterLink></li>
          <li><RouterLink to="/tours">Tours</RouterLink></li>
          <li><RouterLink to="/contests">Talapo Contests</RouterLink></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Alliances</h4>
        <ul class="footer-links">
          <li><a href="https://ecotrack-pi-seven.vercel.app/" target="_blank" rel="noopener">EcoTrack 🌱</a></li>
          <li><a href="https://www.mitur.gob.sv/" target="_blank" rel="noopener">Ministerio de Turismo</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Connect</h4>
        <p class="footer-contact-text">Questions or suggestions? Reach out and live the experience.</p>
        <div class="footer-socials">
          <a href="https://www.facebook.com/share/1CtmuBAAG4/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
          <a href="https://www.instagram.com/tqlapo.sv?igsh=eW5sMHJ2anVjcm8w" target="_blank" rel="noopener" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
          <a href="https://www.tiktok.com/@talapo.sv?_r=1&_t=ZS-975JLfsaZyW" target="_blank" rel="noopener" aria-label="TikTok"><i class="fab fa-tiktok"></i></a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; {{ year }} Talapo.sv. All rights reserved. Made with ❤️ for El Salvador.</p>
    </div>
  </footer>
</template>

<style scoped>
/* ===== CSS original (bloque <style> de main.html) ===== */
.talapo-footer { background: #0f172a; color: #cbd5e1; font-family: 'Inter', sans-serif; padding-top: 4rem; margin-top: auto; border-top: 4px solid #0f766e; }
.footer-container { max-width: 1200px; margin: 0 auto; padding: 0 2rem 3rem 2rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2.5rem; }
.footer-col h3.footer-logo { font-family: 'Outfit', sans-serif; font-size: 1.6rem; color: #ffffff; margin: 0 0 1rem; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.footer-col h3.footer-logo span { color: #14b8a6; }
.nav-logo-img { height: 42px; width: auto; object-fit: contain; display: block; }
.footer-col h4 { font-family: 'Outfit', sans-serif; font-size: 1.1rem; color: #ffffff; margin: 0 0 1.2rem; font-weight: 600; position: relative; }
.footer-col h4::after { content: ''; display: block; width: 30px; height: 2px; background: #0f766e; margin-top: 6px; border-radius: 2px; }
.footer-desc, .footer-contact-text { font-size: 0.92rem; line-height: 1.6; color: #94a3b8; margin: 0; }
.footer-links { list-style: none; padding: 0; margin: 0; }
.footer-links li { margin-bottom: 0.7rem; }
.footer-links a { color: #94a3b8; text-decoration: none; font-size: 0.95rem; transition: color 0.2s ease, transform 0.2s ease; display: inline-block; }
.footer-links a:hover { color: #14b8a6; transform: translateX(4px); }
.footer-socials { display: flex; gap: 12px; margin-top: 1rem; }
.footer-socials a { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; background: rgba(255, 255, 255, 0.05); color: #ffffff; border-radius: 50%; text-decoration: none; transition: background 0.3s ease, transform 0.3s ease; }
.footer-socials a:hover { background: #0f766e; transform: translateY(-3px); }
.footer-bottom { background: #090d16; padding: 1.2rem 2rem; text-align: center; font-size: 0.85rem; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.05); }
.footer-bottom p { margin: 0; }
</style>
