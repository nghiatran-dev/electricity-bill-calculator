<template>
    <div>
      <AppHeader />
        <main class="flex-1 mx-auto w-full max-w-5xl p-4">
            <slot />
        </main>
      <AppFooter />
    </div>
</template>

<script setup lang="ts">
import AppHeader from '~/components/common/AppHeader.vue';
import AppFooter from '~/components/common/AppFooter.vue';
</script>