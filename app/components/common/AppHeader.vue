<template>
    <header class="border-b bg-white/70 backdrop-blur">
      <nav class="mx-auto flex max-w-5xl items-center justify-between p-4">
        <NuxtLink to="/" class="text-lg font-bold">Electricity App</NuxtLink>
        <ul class="flex items-center gap-4">
          <li>
            <NuxtLink
              to="/"
              :class="linkClass('/')"
            >Calculator</NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/prices"
              :class="linkClass('/prices')"
            >View Prices</NuxtLink>
          </li>
          <li>
            <NuxtLink
              to="/admin"
              :class="linkClass('/admin')"
            >Admin</NuxtLink>
          </li>
        </ul>
      </nav>
    </header>
</template>
  
<script setup lang="ts">
  const route = useRoute()
  function linkClass(path: string) {
    const active = route.path === path || route.path.startsWith(path + '/')
    return [
      'px-3 py-1 rounded-lg transition',
      active ? 'bg-black text-white' : 'hover:bg-gray-100'
    ]
  }
</script>