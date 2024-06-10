<script lang="ts">
	import { cpp } from '@codemirror/lang-cpp';
	import CodeMirror from 'svelte-codemirror-editor';

	let value =
		'#include <iostream>\n\nint main() {\n  std::cout << "Hello, world!" << std::endl;\n  return 0;\n}';
</script>

<CodeMirror bind:value lang={cpp()} class="h-screen w-full" />
