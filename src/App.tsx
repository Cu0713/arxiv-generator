import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { ensureMathJax } from "./function/ensureMathJax";
import type { MathJaxWindow } from "./function/ensureMathJax";

const BASE_URL = "https://arxiv-proxy.cudo-0713.workers.dev";

type ArxivEntry = {
  title: string;
  summary: string;
  id: string;
  author?: { name: string } | { name: string }[];
};
type LoadStatus = "idle" | "loading" | "loaded" | "error";

const App = () => {
	const [papers, setPapers] = useState<ArxivEntry[]>([]);
	const [keyword, setKeyword] = useState("");
	const [quote, setQuote] = useState<ArxivEntry | null>(null);
	const [loadStatus, setLoadStatus] = useState<LoadStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [isCoulombBranch, setIsCoulombBranch] = useState<boolean>(false);
	const [mathJaxReady, setMathJaxReady] = useState<boolean>(false);

	const buildSearchQuery = (keyword: string) => {
		const trimmed = keyword.trim();

		if (!trimmed) {
		return "cat:math.RT";
		}

		const q = trimmed.includes(" ")
		? `"${trimmed}"`
		: trimmed;

		return `cat:math.RT AND all:${q}`;
	}
	
	const fetchArxiv = async (keyword: string) => {
		try{
			setLoadStatus("loading");
			setError(null);
			setQuote(null);
			const params = {
				search_query: buildSearchQuery(keyword),
				start: "0",
				max_results: "300",
				sortBy: "submittedDate",
				sortOrder: "descending",
			};

			const res = await axios.get(BASE_URL, { params });
			const parser = new XMLParser({ ignoreAttributes: false });
			const feed = parser.parse(res.data);
			const entries = feed.feed?.entry;
			const list = entries ? (Array.isArray(entries) ? entries : [entries]) : [];

			if (list.length === 0) {
				setPapers([]);
				setError("条件に合う論文が見つかりませんでした。キーワードを変えて試してください。");
				setLoadStatus("error");
				return;
			}

			setPapers(list);
			setLoadStatus("loaded");
		} catch (e) {
			console.error(e);
			setError("論文データの取得に失敗しました。時間を置いてもう一度試してください。");
			setLoadStatus("error");
		}
	};

	useEffect(() => {
		//fetchArxiv();
		ensureMathJax()
			.then(() => setMathJaxReady(true))
			.catch((e) => {
				console.error(e);
				setError("MathJax の読み込みに失敗しました。");
			});
	}, []);

	useEffect(() => {
		if (!mathJaxReady || !quote) return;
		const mathJax = (window as MathJaxWindow).MathJax;
		if (mathJax?.typesetPromise) {
			mathJax.typesetPromise();
		}
	}, [mathJaxReady, quote]);

	const handleClick = async () => {
		if (papers.length === 0) {
			setError("表示できる論文がありません。先に論文を読み込んでください。");
			setLoadStatus("error");
			return;
		}

		const id = Math.floor(Math.random() * papers.length);
		const quote = papers[id];
		setQuote(quote);
		setIsCoulombBranch(quote.summary.includes("Coulomb branch"));
	};
	const renderAuthors = (author: ArxivEntry["author"]) => {
		if (!author) return "Unknown";
		const authors = Array.isArray(author) ? author : [author];

		return authors.map((a) => a.name).join(", ");
	};
	const loadPapers = async () => {
		await fetchArxiv(keyword);
	};
	const reset = async () => {
		setPapers([]);
		setQuote(null);
		setError(null);
		setKeyword("");
		setIsCoulombBranch(false);
		setLoadStatus("idle");
	}

	return (
		<div className="min-h-screen pt-8 pb-8 space-y-8">
			<div className="text-center space-y-8">
				<h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
					Representation Theory arXiv ジェネレーター
				</h1>
				<b>
					ボタンを押したらランダムで arXiv の math.RT
					に投稿された論文が出てくるよ！
				</b>
			</div>
			{loadStatus === "loading" ? (
				<div className="text-center space-y-8">
					<b>読み込み中</b>
					<div className="flex justify-center items-center h-32">
						<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
					</div>
				</div>
			) : loadStatus === "idle" ? (
				<div className="text-center space-y-8">
					<p>キーワードを入れてね（なければすべてから探索されます）</p>
					<input
						type="text"
						value={keyword}
						onChange={(e) => setKeyword(e.target.value)}
						placeholder="例: Coulomb branch"
						className="border rounded-lg px-4 py-2 w-80"
					/>

					<button
						className="bg-black text-white flex mx-auto rounded-xl py-4 px-8"
						type="button"
						onClick={loadPapers}
					>
						論文を読み込む！
					</button>
					<p>まずは論文のデータを読み込んでね</p>
				</div>
			) : loadStatus === "loaded" ? (
				<div>
					<div className="text-center space-y-8">					
						<button
							className="bg-black text-white flex mx-auto rounded-xl py-4 px-8"
							type="button"
							onClick={handleClick}
						>
							ボタンを押せ！
						</button>
					</div>
					<div className="flex justify-center mt-8">
						<div className="text-center">
							{quote === null ? (
								<b>論文データ取得完了！ どんな論文が出てくるかな～？</b>
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
										by &nbsp;{renderAuthors(quote.author)}
									</p>
									<a
										href={quote?.id}
										target="_blank"
										className="italic underline text-blue-500"
									>
										{quote?.id}
									</a>
									<p className="text-center"></p>
									{isCoulombBranch ? (
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
			) : (
				<div className="text-center space-y-8">
					<p>
						{error ??
							"ごめんね！ うまく論文が読み込めなかったよ！もう一度やってみて！"}
					</p>
					<button
						className="bg-black text-white flex mx-auto rounded-xl py-4 px-8"
						type="button"
						onClick={() => setLoadStatus("idle")}
					>
						キーワードを入れ直す
					</button>
				</div>
			)}
			<div>
				<button
					className="bg-black text-white flex mx-auto rounded-xl py-4 px-8"
					type="button"
					onClick={reset}
				>
					リセット
				</button>	
			</div>
		</div>
	);
};

export default App;
