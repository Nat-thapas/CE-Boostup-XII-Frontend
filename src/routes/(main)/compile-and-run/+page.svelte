<script lang="ts">
	import { cpp } from '@codemirror/lang-cpp';
	import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
	import { mode } from 'mode-watcher';
	import CodeMirror from 'svelte-codemirror-editor';

	import type { PageData } from './$types';

	export let data: PageData;

	let value =
		'#include <iostream>\n\nint main() {\n    std::cout << "Hello, world!" << std::endl;\n    return 0;\n}';
</script>

<CodeMirror
	bind:value
	lang={cpp()}
	theme={$mode === 'dark' ? vscodeDark : vscodeLight}
	tabSize={4}
	placeholder="Write code and stuff, idk you have free will."
	styles={{
		'&': {
			width: '80%',
			maxWidth: '100%',
			height: 'calc(100vh - 4rem)'
		}
	}}
/>
