export const ensureMathJax = async (): Promise<void> => {
	const existingMathJax = (window as any).MathJax;

	// MathJax already loaded and still starting up
	if (existingMathJax?.startup?.promise) {
		await existingMathJax.startup.promise;
		return;
	}
	// MathJax already available
	if (existingMathJax) {
		return;
	}

	let script =
		(document.getElementById("mathjax-script") ||
			document.querySelector('script[src*="mathjax"]')) as
			| HTMLScriptElement
			| null;

	if (!script) {
		script = document.createElement("script");
		script.id = "mathjax-script";
		script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
		script.async = true;
		document.head.appendChild(script);
	}

	await new Promise<void>((resolve, reject) => {
		if (!script) {
			reject(new Error("MathJax script element is missing"));
			return;
		}
		script.addEventListener(
			"load",
			() => {
				const mathJax = (window as any).MathJax;
				if (mathJax?.startup?.promise) {
					mathJax.startup.promise.then(() => resolve());
				} else {
					resolve();
				}
			},
			{ once: true },
		);
		script.addEventListener(
			"error",
			() => reject(new Error("Failed to load MathJax script")),
			{ once: true },
		);
	});
};
