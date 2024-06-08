<script lang="ts">
	import '../app.css';

	import { ModeWatcher } from 'mode-watcher';

	import { Toaster } from '$lib/components/ui/sonner';
</script>

<ModeWatcher />

<Toaster expand={true} richColors closeButton />

<slot />
