<template>
    <footer class="border-t text-xs text-gray-500 p-4 text-center">
        © {{ year }} Electricity App — Demo
    </footer>
</template>
  
<script setup lang="ts">
    const year = new Date().getFullYear()
</script>