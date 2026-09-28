<template>
  <section class="tp wrap section nf">
    <p class="code">404</p>
    <h1>This trail doesn’t exist</h1>
    <p class="muted">The page moved or the link is old. Let’s get you back on the map.</p>
    <div class="row"><RouterLink to="/main" class="btn btn-primary">Go home</RouterLink><RouterLink to="/tours" class="btn btn-ghost">Explore tours</RouterLink></div>
  </section>
</template>
<style scoped>
.nf { text-align: center; display: grid; justify-items: center; }
.code { font-family: var(--font-display); font-size: var(--step-5); font-weight: 800; color: var(--turq-300); margin: 0; }
.row { display: flex; gap: .7rem; }
</style>
