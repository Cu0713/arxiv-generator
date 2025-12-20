import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { ensureMathJax } from "./function/ensureMathJax";

const BASE_URL = "https://arxiv-proxy.cudo-0713.workers.dev";
type ArxivEntry = {
  title: string;
  summary: string;
  id: string;
  author: { name: string } | { name: string }[];
};

const App = () => {
	const [papers, setPapers] = useState<ArxivEntry[]>([]);
	const [quote, setQuote] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<any>(null);
	const [isCoulombBranch, setIsCoulombBranch] = useState<boolean>(false);
	const [mathJaxReady, setMathJaxReady] = useState<boolean>(false);

	const fetchArxiv = async () => {
		try{
			setIsLoading(true);
			const params = {
				search_query: "cat:math.RT",
				start: "0",
				max_results: "500",
				sortBy: "submittedDate",
				sortOrder: "descending",
			};

			const res = await axios.get(BASE_URL, { params });
			const parser = new XMLParser({ ignoreAttributes: false });
			const feed = parser.parse(res.data);
			const entries = feed.feed.entry;
			if (entries.length === 0) {
				setError("No entries found");
			}
			console.log(feed);
			const list = Array.isArray(entries) ? entries : [entries];

			setPapers(list);
		} catch (e) {
			console.error(e);
			setError(e)
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchArxiv();
		ensureMathJax()
			.then(() => setMathJaxReady(true))
			.catch((e) => {
				console.error(e);
				setError(e);
			});
	}, []);

	useEffect(() => {
		if (!mathJaxReady || !quote) return;
		const mathJax = (window as any).MathJax;
		if (mathJax?.typesetPromise) {
			mathJax.typesetPromise();
		}
	}, [mathJaxReady, quote]);

	const handleClick = async () => {
		const id = Math.floor(Math.random() * 500)
		const quote = papers[id];
		setQuote(quote);
		setIsCoulombBranch(quote.summary.includes("Coulomb branch"));
		console.log(papers[id]);
	};

	const sleep = (ms: number) =>
  		new Promise(resolve => setTimeout(resolve, ms));
	const errorHandleClick = async () => {
  		setIsLoading(true);
		try {
			await sleep(3000);
			fetchArxiv();
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen pt-8 pb-8 space-y-8">
			<div className="text-center space-y-8">
				<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
					Representation Theory arXiv ジェネレーター
				</h1>
				<p>
					ボタンを押したらランダムで arXiv の math.RT
					に投稿された論文が出てくるよ！
				</p>

				{error ? (
					<button
						className="bg-black text-white flex mx-auto rounded-xl py-4 px-8"
						type="button"
						onClick={errorHandleClick}
					>
						論文を読み込む！
					</button>
				) : (
					<button
						className="bg-black text-white flex mx-auto rounded-xl py-4 px-8"
						type="button"
						onClick={handleClick}
					>
						ボタンを押せ！
					</button>					
				)
				}

			</div>
			<div className="flex justify-center">
				<div className="text-center">
					{isLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
						</div>
					) : quote === null ? (
						<p>どんな論文が出てくるかな～？</p>
					) : error ? (
						<div className="flex justify-center items-center h-18">
							<div className="text-center font-black">
								<p>
									ごめんね！ うまく論文が読み込めなかったよ！
									もう一度やってみて！
								</p>
							</div>
						</div>
					) : (
						<>
							{isCoulombBranch ? (
								<p className="text-center text-xl text-red-500">
									{quote?.title}
								</p>
							) : (
								<p className="text-center text-xl">{quote?.title}</p>
							)}
							<p className="text-center pt-2">
								by &nbsp;
								{Array.isArray(quote?.author)
									? quote.author.map((a: any, i: number) => (
											<span key={a.name}>
												{a.name}
												{i < quote?.author.length - 1 && ", "}
											</span>
										))
									: quote?.author.name}
							</p>
							<a
								href={quote?.id}
								target="_blank"
								className="italic underline text-blue-500"
							>
								{quote?.id}
							</a>
							<p className="text-center"></p>
							{!isCoulombBranch ? (
								<div className="pt-8">
									<p>
										おめでとうございます！ この論文は Coulomb branch
										に関係があるようです！
									</p>
									<p>Coulomb branch については，Braverman-Finkelberg-中島の</p>
									<p>
										<a
											href={`https://arxiv.org/abs/1601.03586`}
											rel="noopener"
											target="_blank"
											className="italic underline text-blue-500"
										>
											Towards a mathematical definition of Coulomb branches of
											3-dimensional $\mathcal N = 4$ gauge theories, II
										</a>
									</p>
									<p>を読んでみよう！</p>
								</div>
							) : (
								<p className="pt-8">早速読んでみよう！</p>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default App;
