<script lang="ts">
  import '../lib/styles/global.css';
  import BottomNav from '$lib/components/BottomNav.svelte';
  import { restoreSession } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  onMount(() => {
    restoreSession();
  });
</script>

<div class="app-container">
  <slot />
  <BottomNav />
</div>
